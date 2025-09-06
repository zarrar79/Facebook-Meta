<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id('id'); // Primary key named postId
            $table->text('description')->nullable(); // Description field
            $table->enum('status', ['draft', 'published'])->default('draft'); // Default draft
            $table->string('link')->nullable(); // Optional link
            $table->json('imageUrls')->nullable(); // Store multiple image URLs
            $table->string('facebook_post_id')->nullable(); // Store FB post id after publishing
            $table->timestamps(); // created_at & updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
