<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    protected $user;

    /**
     * Find a user by ID
     */
    public function findUser($id)
    {
        return User::find($id); // return directly
    }

    /**
     * Update a user's Facebook access token
     */
    public function updateUserToken($userId, $facebookToken)
    {
        $user = User::find($userId);

        if ($user) {
            $user->update([
                'facebook_access_token' => $facebookToken
            ]);

            return $user; // return updated user
        }

        return null; // if user not found
    }
}
