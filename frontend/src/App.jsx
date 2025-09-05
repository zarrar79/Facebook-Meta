import { useEffect, useState } from "react";

function App() {
  const [fbUser, setFbUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [images, setImages] = useState([]); // array of files
  const [imagePreviews, setImagePreviews] = useState([]); // array of preview URLs
  const [statusMsg, setStatusMsg] = useState(null);
  const [pages, setPages] = useState([]);

  // Connect Facebook
  const connectFacebook = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/auth/facebook");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setStatusMsg("Failed to get Facebook login URL.");
    } catch (err) {
      console.error(err);
      setStatusMsg("Error requesting Facebook URL.");
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect back
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

  // Fetch pages
  const fetchPages = async (token) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`https://graph.facebook.com/me/accounts?access_token=${token}`);
      const data = await res.json();
      if (res.ok && data.data) setPages(data.data);
      else setStatusMsg(data?.error?.message || "Failed to fetch pages");
    } catch (err) {
      console.error(err);
      setStatusMsg("Error fetching pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("fb_token");
    const storedUser = localStorage.getItem("fb_user");
    if (storedToken && storedUser) {
      setFbUser(JSON.parse(storedUser));
      fetchPages(storedToken);
    }
    handleRedirectBack();
  }, []);

  // Handle multiple files
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  // Publish post
  const publishPost = async (e) => {
    e.preventDefault();
    if (!message.trim()) return setStatusMsg("Please type a message.");
    if (pages.length === 0) return setStatusMsg("No pages available to post.");

    setLoading(true);
    setStatusMsg(null);

    try {
      const firstPage = pages[0];

      const formData = new FormData();
      formData.append("message", message);
      if (link) formData.append("link", link);
      formData.append("page_id", firstPage.id);

      images.forEach((img, idx) => {
        formData.append(`images[${idx}]`, img); // append all images
      });

      const res = await fetch("http://localhost:8000/api/publish", {
        method: "POST",
        headers: {
          "X-FB-Token": firstPage.access_token,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(`Post published to "${firstPage.name}" ✅`);
        setMessage("");
        setLink("");
        setImages([]);
        setImagePreviews([]);
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Meta FB Demo</h1>
          <div>
            {!fbUser ? (
              <button
                onClick={connectFacebook}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Loading..." : "Connect with Facebook"}
              </button>
            ) : (
              <div className="text-right">
                <div className="text-sm text-gray-500">Connected:</div>
                <div className="text-sm font-medium text-gray-800">{fbUser.name}</div>
              </div>
            )}
          </div>
        </header>

        {pages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Pages</h2>
            <ul className="list-disc list-inside">
              {pages.map((page) => (
                <li key={page.id}>
                  {page.name} (ID: {page.id})
                </li>
              ))}
            </ul>
          </div>
        )}

        <main>
          <form onSubmit={publishPost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={4}
                placeholder="Type your message..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Link (optional)</label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Images (optional)</label>
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

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {statusMsg && <span className="text-sm text-red-600">{statusMsg}</span>}
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

export default App;
