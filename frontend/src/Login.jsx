import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (token != null) navigate("/post");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("app_user_id", String(data.user.id));
        navigate("/post");
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-lg font-medium">Meta App</div>

          {error && (
            <div className="bg-red-100 text-red-600 p-2 rounded">{error}</div>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
          />
          <button
            type="submit"
            className="w-full bg-[#1877f2] text-white py-3 rounded-md font-semibold hover:bg-[#166fe5] transition"
          >
            Log In
          </button>
        </form>

        <div className="text-center my-4">
          <a href="#" className="text-[#1877f2] text-sm hover:underline">
            Forgotten password?
          </a>
        </div>

        <hr className="my-4" />

        <div className="text-center">
          <button className="bg-[#42b72a] text-white py-3 px-4 rounded-md font-semibold hover:bg-[#36a420] transition">
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}
