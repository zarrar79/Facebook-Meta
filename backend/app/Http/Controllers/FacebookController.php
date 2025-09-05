<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Post;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\JsonResponse;
class FacebookController extends Controller
{
    // Step 1: Get Facebook login URL
    public function redirectToFacebook(): JsonResponse
    {
        $url = Socialite::driver('facebook')->scopes([
            'pages_manage_posts',
            'pages_read_engagement',
            'public_profile'
        ])->stateless()->redirect()->getTargetUrl();

        return response()->json([
            'url' => $url,
        ]);
    }

    // Step 2: Handle callback from Facebook

public function handleFacebookCallback(): RedirectResponse
{
    try {
        $facebookUser = Socialite::driver('facebook')->stateless()->user();
        $name = urlencode($facebookUser->getName());
        return redirect("http://localhost:5173?token={$facebookUser->token}&name={$name}");
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
        'images.*'  => 'nullable|image|max:10240', // 10MB max per image
        'page_id'   => 'required|string',
    ]);

    $pageId = $request->page_id;
    $pageToken = $request->header('X-FB-Token');

    if (!$pageToken) {
        return response()->json([
            'success' => false,
            'message' => 'Page token missing',
        ], 400);
    }

    try {
        // 1️⃣ Save the post in DB first (default = draft)
        $post = Post::create([
            'description' => $request->message,
            'status'      => 'draft',
            'pageId'      => $pageId,   // <-- make sure you added this column in migration
        ]);

        $photoIds = [];

        // 2️⃣ Upload images to Facebook (unpublished)
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $response = Http::asMultipart()->post("https://graph.facebook.com/{$pageId}/photos", [
                    'source'       => fopen($image->getRealPath(), 'r'),
                    'published'    => false,
                    'access_token' => $pageToken,
                ]);

                $data = $response->json();

                if ($response->successful() && isset($data['id'])) {
                    $photoIds[] = $data['id'];
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload image',
                        'error'   => $data,
                    ], 400);
                }
            }
        }

        // 3️⃣ Prepare the feed post params
        $params = [
            'message'       => $request->message,
            'access_token'  => $pageToken,
        ];

        if ($request->link) {
            $params['link'] = $request->link;
        }

        if (!empty($photoIds)) {
            $attached_media = [];
            foreach ($photoIds as $id) {
                $attached_media[] = ['media_fbid' => $id];
            }
            $params['attached_media'] = json_encode($attached_media);
        }

        // 4️⃣ Publish to Facebook
        $response = Http::asForm()->post("https://graph.facebook.com/{$pageId}/feed", $params);
        $data = $response->json();

        if ($response->successful() && isset($data['id'])) {
            // 5️⃣ Update the DB post status to published
            $post->update([
                'status'     => 'published',
            ]);

            return response()->json([
                'success'   => true,
                'message'   => 'Post published successfully',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to publish post',
            'error'   => $data,
        ], 400);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error publishing post',
            'error'   => $e->getMessage(),
        ], 500);
    }
}



}
