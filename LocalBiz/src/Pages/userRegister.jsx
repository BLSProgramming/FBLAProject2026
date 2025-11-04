import { useState } from 'react';
import { HiSparkles, HiUserCircle } from 'react-icons/hi2';
import RegistrationLayout from '../Components/RegistrationLayout';
import FormInput from '../Components/ui/FormInput';
import TurnstileWidget from '../Components/ui/TurnstileWidget';
import MultiStepProgress from '../Components/MultiStepProgress';
import StepTransition from '../Components/StepTransition';
import StepHeader from '../Components/StepHeader';
import SecurityStep from '../Components/SecurityStep';
import RegistrationButton from '../Components/ui/RegistrationButton';
import MessageDisplay from '../Components/MessageDisplay';
import useMultiStepRegistration from '../hooks/useMultiStepRegistration';

export function UserRegister() {
  const [turnstileToken, setTurnstileToken] = useState('');
  
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
    isStep2Valid
  } = useMultiStepRegistration('user');

  return (
    <RegistrationLayout title="Join The Buzz" subtitle="🐝 Create your account in 2 easy steps">
      <MultiStepProgress 
        currentStep={step}
        totalSteps={2}
        onNext={nextStep}
        onBack={prevStep}
        canProceed={step === 1 ? isStep1Valid : isStep2Valid}
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
              widgetId="turnstile-widget-user"
              turnstileToken={turnstileToken}
              onTokenChange={setTurnstileToken}
            />

            <MessageDisplay error={error} success={success} />

            <RegistrationButton
              onClick={() => handleRegister(turnstileToken)}
              loading={loading}
              disabled={!isStep2Valid || !turnstileToken}
              completedText="Complete Registration"
              loadingText="Creating Account..."
              icon="🎉"
            />
          </div>
        </StepTransition>
      </div>
    </RegistrationLayout>
  );
}
