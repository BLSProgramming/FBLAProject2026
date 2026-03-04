import { useState, useMemo } from 'react';
import { HiEye, HiEyeSlash, HiCheck, HiXMark } from 'react-icons/hi2';

export default function PasswordInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  className = "",
  showStrength = false 
}) {
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!showStrength || !value) return { score: 0, requirements: [] };

    const requirements = [
      { test: /.{8,}/, label: "At least 8 characters", met: false },
      { test: /[A-Z]/, label: "One uppercase letter", met: false },
      { test: /[a-z]/, label: "One lowercase letter", met: false },
      { test: /\d/, label: "One number", met: false },
      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/, label: "One special character", met: false }
    ];

    let score = 0;
    requirements.forEach(req => {
      req.met = req.test.test(value);
      if (req.met) score++;
    });

    return { score, requirements };
  }, [value, showStrength]);

  const getStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-gray-200';
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    if (passwordStrength.score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength.score === 0) return 'Enter a password';
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-yellow-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={`w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${className}`}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          {showPassword ? <HiEyeSlash size={20} /> : <HiEye size={20} />}
        </button>
      </div>

      {showStrength && value && (
        <div className="mt-3 space-y-2">
          {/* Strength Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-yellow-200">Password strength</span>
              <span className={`font-medium ${
                passwordStrength.score <= 2 ? 'text-red-400' :
                passwordStrength.score <= 3 ? 'text-yellow-400' :
                passwordStrength.score <= 4 ? 'text-blue-400' : 'text-green-400'
              }`}>
                {getStrengthText()}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="text-xs space-y-1">
            {passwordStrength.requirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-2">
                {req.met ? (
                  <HiCheck className="h-3 w-3 text-green-400" />
                ) : (
                  <HiXMark className="h-3 w-3 text-gray-500" />
                )}
                <span className={req.met ? 'text-green-300' : 'text-gray-400'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}