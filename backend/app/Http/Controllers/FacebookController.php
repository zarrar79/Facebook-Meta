<?php
namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\FacebookService;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class FacebookController extends Controller
{
    protected $facebook;
    protected $userRepository;

    public function __construct(FacebookService $facebookService, UserRepository $userRepository)
    {
        $this->facebook = $facebookService;
        $this->userRepository = $userRepository;
    }

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

    public function handleFacebookCallback(): RedirectResponse
    {
        try {
            $facebookUser = Socialite::driver('facebook')->stateless()->user();
            $encryptedState = request('state');
            $userId = Crypt::decryptString($encryptedState);

            $this->userRepository->updateUserToken($userId, $facebookUser->token);

            $name = urlencode($facebookUser->getName());
            $frontendUrl = config('services.frontend.url');

            return redirect("{$frontendUrl}/post?token={$facebookUser->token}&name={$name}");
        } catch (\Exception $e) {
            return redirect("{$frontendUrl}/post");
        }
    }

    public function publishPost(Request $request): JsonResponse
    {
        validatePostRequest($request);

        $pageId = $request->page_id;
        $pageToken = $request->header('X-FB-Token');

        if (!$pageToken) {
            return response()->json(['success' => false, 'message' => 'Page token missing'], 400);
        }

        try {
            $storedImageUrls = storeImagesLocally($request);
            $post = $this->facebook->createDraftPost($request->message, $storedImageUrls);

            $photoIds = $this->facebook->uploadImagesToFacebook($request, $pageId, $pageToken);
            $response = $this->facebook->publishToFacebook($pageId, $pageToken, $request->message, $request->link, $photoIds);

            if ($response->successful() && isset($response['id'])) {
                $post->update(['status' => Post::STATUS_PUBLISHED]);
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

        $pages = $this->facebook->getPages($user->facebook_access_token);
        return response()->json(['pages' => $pages]);
    }
}
