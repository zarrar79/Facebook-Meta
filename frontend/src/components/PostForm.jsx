import React from "react";

function PostForm({
  message,
  setMessage,
  images,
  setImages,
  imagePreviews,
  setImagePreviews,
  statusMsg,
  fbUser,
  onPublish,
  onDisconnect,
}) {
  // ✅ Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Max size check (1MB)
    const validFiles = files.filter((file) => file.size <= 1024 * 1024);

    if (validFiles.length < files.length) {
      alert("Some images were too large and were skipped (max 1MB each).");
    }

    setImages(validFiles);
    setImagePreviews(validFiles.map((f) => URL.createObjectURL(f)));
  };

  return (
    <form onSubmit={onPublish} className="space-y-4">
      {/* Message */}
      <div>
        <label className="block text-md font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 block text-sm w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          rows={4}
          placeholder="What's in your mind..."
          disabled={!fbUser}
        />
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Images (max 1MB each)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={!fbUser}
            className="mt-1 block w-full text-sm text-gray-700"
          />

          {imagePreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="max-h-48 object-contain rounded-md border"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {statusMsg && (
            <span className="text-sm text-red-600">{statusMsg}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            disabled={!fbUser}
          >
            Publish to Facebook
          </button>

          <button
            type="button"
            onClick={onDisconnect}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
    </form>
  );
}

export default PostForm;
