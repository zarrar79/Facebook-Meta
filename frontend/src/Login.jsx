import { useState } from "react";
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user.id));
        navigate('/post');
        
      } else {
        console.log("Login failed:", data);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center">
      {/* Centered Login Card */}
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <div className="space-y-4">
          <div className="text-lg font-medium">Meta App</div>
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
            onClick={handleSubmit}
            className="w-full bg-[#1877f2] text-white py-3 rounded-md font-semibold hover:bg-[#166fe5] transition"
          >
            Log In
          </button>
        </div>

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