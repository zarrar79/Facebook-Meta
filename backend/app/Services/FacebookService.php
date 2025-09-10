<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class FacebookService
{
    public function getPages(string $accessToken): array
    {
        $response = Http::get('https://graph.facebook.com/me/accounts', [
            'access_token' => $accessToken,
        ]);

        return $response->json()['data'] ?? [];
    }

    public function createDraftPost(?string $message, array $images): Post
    {
        return Post::create([
            'description' => $message,
            'status'      => Post::STATUS_DRAFT,
            'imageUrls'   => $images,
        ]);
    }

    public function uploadImagesToFacebook(Request $request, string $pageId, string $pageToken): array
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

    public function publishToFacebook(string $pageId, string $pageToken, ?string $message, ?string $link, array $photoIds)
    {
        $params = [
            'message'      => $message,
            'access_token' => $pageToken,
        ];

        if ($link) {
            $params['link'] = $link;
        }

        if (!empty($photoIds)) {
            $params['attached_media'] = json_encode(
                array_map(fn($id) => ['media_fbid' => $id], $photoIds)
            );
        }

        return Http::asForm()->post("https://graph.facebook.com/{$pageId}/feed", $params);
    }
}
