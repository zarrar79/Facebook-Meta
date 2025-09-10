<?php

use Illuminate\Http\Request;

if (! function_exists('validatePostRequest')) {
    function validatePostRequest(Request $request)
    {
        return $request->validate([
            'message'   => 'nullable|string|max:5000',
            'link'      => 'nullable|url',
            'images.*'  => 'nullable|image|max:10240',
            'page_id'   => 'required|string',
        ]);
    }
    if(! function_exists('storeImageLocally')){
        function storeImagesLocally(Request $request): array
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
    }
}
