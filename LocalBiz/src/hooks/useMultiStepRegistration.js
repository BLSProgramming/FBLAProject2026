import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useRegistration from './useRegistration';
import useTurnstile from './useTurnstile';

export default function useMultiStepRegistration(type) {
  const navigate = useNavigate();
  
  // Form data state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    firstName: "",
    lastName: "",
    businessName: ""
  });
  
  // Step management
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('right');

  // Determine widget ID and endpoint based on type
  const widgetId = type === 'business' ? 'turnstile-widget-business' : 'turnstile-widget';
  const endpoint = type === 'business' ? '/api/BusinessRegistration/register' : '/api/UserRegistration/register';
  
  const { turnstileToken, reinitializeWidget } = useTurnstile(widgetId);
  
  const { error, success, loading, handleRegister: registerUser, validateStep1, setError } = useRegistration({
    type,
    endpoint,
    onSuccess: () => {
      // Reset form data
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        firstName: "",
        lastName: "",
        businessName: ""
      });
      
      // Navigate to login page after successful registration
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    }
  });

  // Reinitialize Turnstile widget when step 2 becomes visible
  useEffect(() => {
    if (step === 2) {
      const timeoutId = setTimeout(() => {
        reinitializeWidget();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [step, reinitializeWidget]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    const step1Data = { 
      email: formData.email, 
      password: formData.password, 
      confirmPassword: formData.confirmPassword 
    };
    const validation = validateStep1(step1Data);
    
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    
    setError(null);
    setDirection('right');
    setStep(2);
  };

  const prevStep = () => {
    setDirection('left');
    setStep(1);
    setError(null);
  };

  const handleRegister = async (providedToken = null) => {
    // Use provided token or fallback to hook token
    const tokenToUse = providedToken || turnstileToken;
    
    let payload;
    if (type === 'business') {
      payload = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        businessName: formData.businessName
      };
    } else {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      payload = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        username: formData.username,
        fullName
      };
    }
    
    await registerUser(payload, tokenToUse);
  };

  const isStep1Valid = formData.email && formData.password && formData.confirmPassword;
  
  let isStep2Valid;
  if (type === 'business') {
    isStep2Valid = formData.businessName && turnstileToken;
  } else {
    isStep2Valid = formData.username && formData.firstName && formData.lastName && turnstileToken;
  }

  return {
    step,
    direction,
    formData,
    loading,
    error,
    success,
    nextStep,
    prevStep,
    handleInputChange,
    handleRegister,
    turnstileToken,
    isStep1Valid,
    isStep2Valid
  };
}