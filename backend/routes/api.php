<?php

use App\Http\Controllers\FacebookController;

Route::get('auth/facebook', [FacebookController::class, 'redirectToFacebook']);
Route::get('auth/facebook/callback', [FacebookController::class, 'handleFacebookCallback']);
Route::post('/publish', [FacebookController::class, 'publishPost']);

