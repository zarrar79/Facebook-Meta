<?php

namespace App\Http\Controllers;
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

}
