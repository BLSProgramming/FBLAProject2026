import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import honeycomb from '../Assets/honeycomb.png';

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5236/api/Login/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!res.ok) {
        
        let errText = 'Invalid username or password';
        try {
          const errJson = await res.json();
          errText = errJson?.message || errText;
        } catch {}
        throw new Error(errText);
      }

  const data = await res.json();
  
  if (data?.userType) localStorage.setItem("userType", data.userType);
  if (data?.id) localStorage.setItem("userId", data.id);
  if (data?.token) localStorage.setItem("token", data.token);

  
  navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
  <img src={honeycomb} alt="Honeycomb" className="absolute inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />
  <div className="relative z-10 w-full max-w-md bg-black rounded-2xl shadow-lg p-8 border-4 border-yellow-400">
        <h1 className="text-4xl font-extrabold text-center text-yellow-400 mb-6 drop-shadow-lg">
         🐝 Biz-Buzz
        </h1>

        <p className="text-center text-yellow-200 mb-6 text-sm">
        Explore the Buzz in Local Biz-nesses!
       </p>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-yellow-300 mb-1">
              Email:
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-yellow-300 mb-1">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black py-2 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-50 shadow-md"
          >
            {loading ? "Buzzing in..." : <>Login <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg></>}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-yellow-700" />
          <span className="px-3 text-yellow-300 text-sm">OR</span>
          <hr className="flex-grow border-yellow-700" />
        </div>

        <div className="space-y-3">
          <Link
            to="/userRegister"
            className="block w-full text-center border border-yellow-400 text-yellow-400 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition"
          >
            🐝 User Registration
          </Link>

          <Link
            to="/businessRegister"
            className="block w-full text-center border border-yellow-400 text-yellow-400 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition"
          >
            🏭 Business Registration
          </Link>
        </div>
      </div>
    </div>
  );
}
