<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
class FacebookController extends Controller
{
    // Step 1: Get Facebook login URL
    public function redirectToFacebook(): JsonResponse
{
    $user = auth('sanctum')->user();
    $encryptedState = Crypt::encryptString($user->id);

    $url = Socialite::driver('facebook')->scopes([
        'pages_manage_posts',
        'pages_read_engagement',
        'public_profile'
    ])->with(['state' => $encryptedState])->stateless()->redirect()->getTargetUrl();

    return response()->json(['url' => $url]);
}

    // Step 2: Handle callback from Facebook
public function handleFacebookCallback(): RedirectResponse
{
    try {
        $facebookUser = Socialite::driver('facebook')->stateless()->user();
        $encryptedState = request('state');
        $userId = Crypt::decryptString($encryptedState);

        // Store token for the authenticated user
        User::find($userId)->update([
            'facebook_access_token' => $facebookUser->token
        ]);

        $name = urlencode($facebookUser->getName());
        return redirect("http://localhost:5173/post?token={$facebookUser->token}&name={$name}");
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Facebook connection failed',
            'error'   => $e->getMessage(),
        ], 500);
    }
}

/**
     * Publish a post to Facebook using the user's access token.
     */
public function publishPost(Request $request): JsonResponse
    {
        $request->validate([
            'message'   => 'nullable|string|max:5000',
            'link'      => 'nullable|url',
            'images.*'  => 'nullable|image|max:10240',
            'page_id'   => 'required|string',
        ]);

        $pageId    = $request->page_id;
        $pageToken = $request->header('X-FB-Token');

        if (!$pageToken) {
            return response()->json(['success' => false, 'message' => 'Page token missing'], 400);
        }

        try {
            $storedImageUrls = $this->storeImagesLocally($request);
            $post            = $this->createDraftPost($request->message, $storedImageUrls);

            $photoIds = $this->uploadImagesToFacebook($request, $pageId, $pageToken);
            $response = $this->publishToFacebook($pageId, $pageToken, $request->message, $request->link, $photoIds);

            if ($response->successful() && isset($response['id'])) {
                $post->update(['status' => Post::STATUS_PUBLISHED]); // use constant
                return response()->json(['success' => true, 'message' => 'Post published', 'post' => $post]);
            }

            return response()->json(['success' => false, 'message' => 'Failed to publish', 'error' => $response->json()], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error publishing post', 'error' => $e->getMessage()], 500);
        }
    }

public function getPages(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->facebook_access_token) {
        return response()->json(['message' => 'Facebook token not found'], 400);
    }

    $response = Http::get('https://graph.facebook.com/me/accounts', [
        'access_token' => $user->facebook_access_token,
    ]);

    return response()->json(['pages' => $response->json()['data'] ?? []]);
}

private function storeImagesLocally(Request $request): array
    {
        $urls = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('posts', 'public');
                $urls[] = Storage::url($path);
            }
        }
        return $urls;
    }

    private function createDraftPost(?string $message, array $images): Post
    {
        return Post::create([
            'description' => $message,
            'status'      => Post::STATUS_DRAFT,
            'imageUrls'   => $images,
        ]);
    }

    private function uploadImagesToFacebook(Request $request, string $pageId, string $pageToken): array
    {
        $ids = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $response = Http::asMultipart()->post("https://graph.facebook.com/{$pageId}/photos", [
                    'source'       => fopen($image->getRealPath(), 'r'),
                    'published'    => false,
                    'access_token' => $pageToken,
                ]);
                if ($response->successful() && isset($response['id'])) {
                    $ids[] = $response['id'];
                }
            }
        }
        return $ids;
    }

    private function publishToFacebook(string $pageId, string $pageToken, ?string $message, ?string $link, array $photoIds)
    {
        $params = [
            'message'      => $message,
            'access_token' => $pageToken,
        ];
        if ($link) $params['link'] = $link;
        if (!empty($photoIds)) {
            $params['attached_media'] = json_encode(array_map(fn($id) => ['media_fbid' => $id], $photoIds));
        }
        return Http::asForm()->post("https://graph.facebook.com/{$pageId}/feed", $params);
    }

}
