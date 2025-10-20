import { useState } from "react";
import { Link } from "react-router-dom";
import honeycomb from "../Assets/honeycomb.png";




export function BusinessRegister() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);


    const businessNameVal = businessName.trim();
    const emailVal = email.trim().toLowerCase();
  const passwordVal = password;
  const confirmPasswordVal = confirmPassword;
  

    if (businessNameVal.length < 6 || businessNameVal.length > 40) {
      setError('Business Name must be between 6 and 40 characters.');
      setLoading(false);
      return;
    }

    const businessNameRegex = /^[_A-Za-z0-9 ]+$/;
    if (!businessNameRegex.test(businessNameVal)) {
      setError('Business Name may only contain letters, numbers, underscores and spaces.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (passwordVal !== confirmPasswordVal) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5236/api/BusinessRegistration/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName: businessNameVal, password: passwordVal, email: emailVal }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
  setBusinessName("");
  setEmail("");
  setPassword("");
  setConfirmPassword("");
  setError(null);
  setSuccess(data.message || "Business registered successfully.");
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <img
  src={honeycomb}
  alt="Honeycomb"
  className="fixed inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0"
      />

      
      <div className="relative z-10 w-full max-w-md bg-black rounded-2xl shadow-xl p-10 border-4 border-yellow-400">
        
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-3 py-1 border border-yellow-400 text-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-400 hover:text-black transition"
          >
            🔙 Back to Login
          </Link>
        </div>

        
        <h1 className="text-4xl font-extrabold text-center text-yellow-400 mb-2 drop-shadow-lg">
          Business Registration
        </h1>
        <p className="text-center text-yellow-200 mb-6 text-sm">
          Join the Buzz!
        </p>

        
        <form onSubmit={handleRegister} className="space-y-3">

        <div>
          <label className="block text-sm font-semibold text-yellow-300 mb-1">
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter your email"
            required
          />

        <div>
          <label className="block text-sm font-semibold text-yellow-300 mb-1">
            Business Name:
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter your business name"
            required
          />
        </div>

        </div>

        <div>
          <label className="block text-sm font-semibold text-yellow-300 mb-1">
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter your password"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-yellow-300 mb-1">
            Confirm Password:
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Re-enter your password"
            required
          />
        </div>

        

  {error && <p className="text-red-400 text-sm">{error}</p>}
  {success && <p className="text-green-400 text-sm">{success}</p>}

        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 text-black py-2  rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-50 shadow-md mb-3"
        >
          {loading ? "Registering..." : "🐝 Register"}
        </button>
      </form>
      </div>
    </div>
  );
}
