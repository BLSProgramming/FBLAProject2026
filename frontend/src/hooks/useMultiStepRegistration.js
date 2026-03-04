import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useRegistration from './useRegistration';

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

  // Determine endpoint based on type
  const endpoint = type === 'business' ? '/api/BusinessRegistration/register' : '/api/UserRegistration/register';
  
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

  const handleRegister = async (turnstileToken) => {
    // Token is now passed from the component that manages the Turnstile widget
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
    
    await registerUser(payload, turnstileToken);
  };

  const isStep1Valid = formData.email && formData.password && formData.confirmPassword;
  
  // Step 2 validation now depends on external turnstile token
  const getStep2Validation = (turnstileToken) => {
    if (type === 'business') {
      return formData.businessName && turnstileToken;
    } else {
      return formData.username && formData.firstName && formData.lastName && turnstileToken;
    }
  };

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
    isStep1Valid,
    getStep2Validation
  };
}