import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Post() {
  // -----------------------------
  // 🔹 State Management
  // -----------------------------
  const [fbUser, setFbUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  const [images, setImages] = useState([]); // array of files
  const [imagePreviews, setImagePreviews] = useState([]); // preview URLs

  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
 const navigate = useNavigate();

  // -----------------------------
  // 🔹 Facebook Connect
  // -----------------------------
  const connectFacebook = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/auth/facebook");
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatusMsg("Failed to get Facebook login URL.");
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Error requesting Facebook URL.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 🔹 Handle Redirect Back (after Facebook login)
  // -----------------------------
  const handleRedirectBack = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");

    if (token) {
      localStorage.setItem("fb_token", token);

      if (name) {
        const user = { name };
        localStorage.setItem("fb_user", JSON.stringify(user));
        setFbUser(user);
      }

      setStatusMsg("Facebook connected ✅");
      window.history.replaceState({}, document.title, window.location.pathname);

      fetchPages(token);
    }
  };

  // -----------------------------
  // 🔹 Fetch Pages
  // -----------------------------
  const fetchPages = async (token) => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${token}`
      );
      const data = await res.json();

      if (res.ok && data.data) {
        setPages(data.data);
      } else {
        setStatusMsg(data?.error?.message || "Failed to fetch pages");
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Error fetching pages");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 🔹 Logout
  // -----------------------------
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      setLoading(true);

      const res = await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      // Clear local storage regardless of API response
      localStorage.removeItem("auth_token");
      localStorage.removeItem("fb_token");
      localStorage.removeItem("fb_user");

      // Reset state
      setFbUser(null);
      setPages([]);
      setSelectedPageId("");
      setMessage("");
      setLink("");
      setImages([]);
      setImagePreviews([]);

      if (res.ok) {
        setStatusMsg("Logged out successfully ✅");
        navigate('/login')
      } else {
        setStatusMsg(
          "Logged out locally (API error: " +
            (data?.message || "Unknown error") +
            ")"
        );
      }
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.clear();
      setFbUser(null);
      setPages([]);
      setSelectedPageId("");
      setMessage("");
      setLink("");
      setImages([]);
      setImagePreviews([]);
      setStatusMsg("Logged out locally (Network error)");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 🔹 Handle File Uploads
  // -----------------------------
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 1 * 1024 * 1024; // 1MB

    const hasLargeFile = files.some((file) => file.size > maxSize);

    if (hasLargeFile) {
      setStatusMsg("❌ Images should each be less than 1 MB.");
      setMessage(" ");
      setImages([]);
      setImagePreviews([]);
      return;
    }

    setStatusMsg(null);
    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // -----------------------------
  // 🔹 Publish Post
  // -----------------------------
  const publishPost = async (e) => {
    e.preventDefault();

    // Require either message OR at least 1 image
    if (!message.trim() && images.length === 0) {
      return setStatusMsg(
        "From Image or Description, at least one is required!"
      );
    }

    if (!selectedPageId) {
      return setStatusMsg("Please select a page.");
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const selectedPage = pages.find((p) => p.id === selectedPageId);
      const token = localStorage.getItem("auth_token");

      const formData = new FormData();
      if (message.trim()) formData.append("message", message);
      if (link) formData.append("link", link);
      formData.append("page_id", selectedPage.id);

      images.forEach((img, idx) => {
        formData.append(`images[${idx}]`, img);
      });

      const res = await fetch("http://localhost:8000/api/publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-FB-Token": selectedPage.access_token,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg(`Post published to "${selectedPage.name}" ✅`);
        setMessage("");
        setLink("");
        setImages([]);
        setImagePreviews([]);
        setSelectedPageId("");
      } else {
        setStatusMsg(data?.message || "Publish failed");
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Network error publishing post");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 🔹 Lifecycle: Initial Load
  // -----------------------------
  useEffect(() => {
    const storedToken = localStorage.getItem("fb_token");
    const storedUser = localStorage.getItem("fb_user");

    if (storedToken && storedUser) {
      setFbUser(JSON.parse(storedUser));
      fetchPages(storedToken);
    }

    handleRedirectBack();
  }, []);

  // -----------------------------
  // 🔹 UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-[#2e4f76] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#e6f1f5] rounded-2xl shadow-md p-6">
        <button
        onClick={handleLogout}
        className="absolute top-4 right-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        disabled={loading}
      >
        {loading ? "Logging out..." : "Logout"}
      </button>

        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Meta Facebook
          </h1>

          <div className="flex items-center gap-3">
            {!fbUser ? (
              <button
                onClick={connectFacebook}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Loading..." : "Connect with Facebook"}
              </button>
            ) : (
              <>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Connected:</div>
                  <div className="text-sm font-medium text-gray-800">
                    {fbUser.name}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  disabled={loading}
                >
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Page Selection */}
        {pages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Select a Page
            </h2>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="border-none rounded-md px-3 py-2 bg-[#a7abb0]"
            >
              <option value="">Select Page</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Post Form */}
        <main>
          <form onSubmit={publishPost} className="space-y-4">
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  disabled={loading || !fbUser}
                >
                  {loading ? "Publishing..." : "Publish to Facebook"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("fb_token");
                    localStorage.removeItem("fb_user");
                    setFbUser(null);
                    setPages([]);
                    setStatusMsg("Disconnected");
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default Post;
