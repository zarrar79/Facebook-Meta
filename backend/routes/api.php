<?php
use App\Http\Controllers\FacebookController;
use App\Http\Controllers\Auth\LoginController;


Route::post('/login', [LoginController::class, 'login']);
Route::get('auth/facebook', [FacebookController::class, 'redirectToFacebook']);
Route::get('auth/facebook/callback', [FacebookController::class, 'handleFacebookCallback']);

Route::middleware('auth:sanctum')->group(function () {
Route::post('/publish', [FacebookController::class, 'publishPost']);
Route::get('/facebook/pages', [FacebookController::class, 'getPages']);

Route::post('/logout', [LoginController::class, 'logout']);

});


