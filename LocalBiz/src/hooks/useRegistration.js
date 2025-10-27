import { useState } from 'react';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:5236';

export default function useRegistration(config) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validatePasswordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };

  const validateUsername = (username) => {
    return username.length >= 6 && username.length <= 14;
  };

  const validateBusinessName = (businessName) => {
    if (businessName.length < 6 || businessName.length > 40) {
      return { isValid: false, message: 'Business Name must be between 6 and 40 characters.' };
    }
    const businessNameRegex = /^[_A-Za-z0-9 ]+$/;
    if (!businessNameRegex.test(businessName)) {
      return { isValid: false, message: 'Business Name may only contain letters, numbers, underscores and spaces.' };
    }
    return { isValid: true };
  };

  const validateStep1 = (formData) => {
    const emailVal = formData.email.trim().toLowerCase();
    const passwordVal = formData.password;
    const confirmPasswordVal = formData.confirmPassword;

    if (!validateEmail(emailVal)) {
      return { isValid: false, message: 'Please enter a valid email address.' };
    }

    if (!validatePassword(passwordVal)) {
      return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }

    if (!validatePasswordsMatch(passwordVal, confirmPasswordVal)) {
      return { isValid: false, message: 'Passwords do not match.' };
    }

    return { isValid: true };
  };

  const validateStep2 = (formData) => {
    if (config.type === 'user') {
      const usernameVal = formData.username?.trim() || '';
      const fullNameVal = formData.fullName?.trim() || '';
      
      if (!validateUsername(usernameVal)) {
        return { isValid: false, message: 'Username must be between 6 and 14 characters.' };
      }
      
      if (fullNameVal.length < 2) {
        return { isValid: false, message: 'Full name must be at least 2 characters.' };
      }
    } else if (config.type === 'business') {
      const businessNameVal = formData.businessName?.trim() || '';
      const validation = validateBusinessName(businessNameVal);
      if (!validation.isValid) {
        return validation;
      }
    }

    return { isValid: true };
  };

  const handleRegister = async (formData, turnstileToken) => {
    setError(null);
    setLoading(true);

    try {
      // Validate all data
      const step1Validation = validateStep1(formData);
      if (!step1Validation.isValid) {
        setError(step1Validation.message);
        setLoading(false);
        return;
      }

      const step2Validation = validateStep2(formData);
      if (!step2Validation.isValid) {
        setError(step2Validation.message);
        setLoading(false);
        return;
      }

      // Prepare payload based on type
      let payload;
      const emailVal = formData.email.trim().toLowerCase();
      const passwordVal = formData.password;

      if (config.type === 'user') {
        payload = {
          Username: formData.username.trim(),
          FullName: formData.fullName.trim(),
          Password: passwordVal,
          Email: emailVal
        };
      } else if (config.type === 'business') {
        payload = {
          BusinessName: formData.businessName.trim(),
          Password: passwordVal,
          Email: emailVal
        };
      }

      // Add turnstile token if available
      if (turnstileToken) {
        payload.TurnstileToken = turnstileToken;
      }

      // Make API call
      const response = await fetch(`${API_BASE}${config.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      
      // Clear form fields via callback
      if (config.onSuccess) {
        config.onSuccess();
      }
      
      setError(null);
      setSuccess(data.message || "Registration successful.");
      
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    success,
    loading,
    handleRegister,
    validateStep1,
    validateStep2,
    setError,
    setSuccess
  };
}