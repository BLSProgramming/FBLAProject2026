import { useState } from 'react';
import { FaForumbee } from 'react-icons/fa';
import { HiSparkles, HiUserCircle } from 'react-icons/hi2';
import RegistrationLayout from '../Components/RegistrationLayout';
import FormInput from '../Components/ui/FormInput';
import TurnstileWidget from '../Components/ui/TurnstileWidget';
import MultiStepProgress from '../Components/registration/MultiStepProgress';
import StepTransition from '../Components/registration/StepTransition';
import StepHeader from '../Components/registration/StepHeader';
import SecurityStep from '../Components/registration/SecurityStep';
import RegistrationButton from '../Components/ui/RegistrationButton';
import MessageDisplay from '../Components/registration/MessageDisplay';
import useMultiStepRegistration from '../hooks/useMultiStepRegistration';

export function UserRegister() {
  const [turnstileToken, setTurnstileToken] = useState('');
  const [widgetId] = useState(() => `turnstile-user-${Date.now()}`);
  
  const {
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
  } = useMultiStepRegistration('user');

  // Helper function to get appropriate isStep2Valid
  const userStep2Valid = getStep2Validation(turnstileToken);

  return (
    <RegistrationLayout title="Join The Buzz" subtitleIcon={<FaForumbee className="w-4 h-4 inline-block" />} subtitle="Create your account in 2 easy steps">
      <MultiStepProgress 
        currentStep={step}
        totalSteps={2}
        onNext={nextStep}
        onBack={prevStep}
        canProceed={step === 1 ? isStep1Valid : userStep2Valid}
      />

      <div className="relative overflow-hidden">
        {/* Step 1: Account Security */}
        <StepTransition isVisible={step === 1} direction={direction}>
          <div className="space-y-2">
            <StepHeader
              Icon={HiSparkles}
              title="Secure Your Account"
              description="Let's start with your email and a strong password"
            />

            <SecurityStep
              email={formData.email}
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              onEmailChange={(e) => handleInputChange('email', e.target.value)}
              onPasswordChange={(e) => handleInputChange('password', e.target.value)}
              onConfirmPasswordChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            />

            <MessageDisplay error={error} />
          </div>
        </StepTransition>

        {/* Step 2: Personal Information */}
        <StepTransition isVisible={step === 2} direction={direction}>
          <div className="space-y-2">
            <StepHeader
              Icon={HiUserCircle}
              title="Personal Details"
              description="Help others recognize and connect with you"
            />

            <FormInput
              label="Username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Choose a unique username (6-14 characters)"
              className="mb-2"
              required
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <FormInput
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                required
              />
              
              <FormInput
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                required
              />
            </div>

            <TurnstileWidget 
              widgetId={widgetId}
              turnstileToken={turnstileToken}
              onTokenChange={setTurnstileToken}
            />

            <MessageDisplay error={error} success={success} />

            <RegistrationButton
              onClick={() => handleRegister(turnstileToken)}
              loading={loading}
              disabled={!userStep2Valid}
              completedText="Complete Registration"
              loadingText="Creating Account..."
              icon={<HiSparkles className="w-5 h-5" />}
            />
          </div>
        </StepTransition>
      </div>
    </RegistrationLayout>
  );
}
