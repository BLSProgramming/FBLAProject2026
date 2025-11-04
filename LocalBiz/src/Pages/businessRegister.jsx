import { useState } from 'react';
import { HiSparkles, HiBuildingOffice2 } from 'react-icons/hi2';
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


export function BusinessRegister() {
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
  } = useMultiStepRegistration('business');

  // Helper function to get appropriate isStep2Valid
  const businessStep2Valid = formData.businessName && turnstileToken;

  return (
    <RegistrationLayout title="Join The Buzz" subtitle="🏢 Create your business account in 2 easy steps">
      <MultiStepProgress 
        currentStep={step}
        totalSteps={2}
        onNext={nextStep}
        onBack={prevStep}
        canProceed={step === 1 ? isStep1Valid : businessStep2Valid}
      />

      <div className="relative overflow-hidden">
        {/* Step 1: Account Security */}
        <StepTransition isVisible={step === 1} direction={direction}>
          <div className="space-y-2">
            <StepHeader
              Icon={HiSparkles}
              title="Secure Your Business Account"
              description="Let's start with your email and a strong password"
            />

            <SecurityStep
              email={formData.email}
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              onEmailChange={(e) => handleInputChange('email', e.target.value)}
              onPasswordChange={(e) => handleInputChange('password', e.target.value)}
              onConfirmPasswordChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              emailPlaceholder="your.business@email.com"
            />

            <MessageDisplay error={error} />
          </div>
        </StepTransition>

        {/* Step 2: Business Information */}
        <StepTransition isVisible={step === 2} direction={direction}>
          <div className="space-y-2">
            <StepHeader
              Icon={HiBuildingOffice2}
              title="Business Details"
              description="Tell us about your business"
            />

            <FormInput
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Your Business Name"
              className="mb-2"
              required
            />

            <TurnstileWidget 
              widgetId="turnstile-widget-business"
              turnstileToken={turnstileToken}
              onTokenChange={setTurnstileToken}
            />

            <MessageDisplay error={error} success={success} />

            <RegistrationButton
              onClick={() => handleRegister(turnstileToken)}
              loading={loading}
              disabled={!businessStep2Valid}
              completedText="Complete Business Registration"
              loadingText="Creating Business Account..."
              icon="🏢"
            />
          </div>
        </StepTransition>
      </div>
    </RegistrationLayout>
  );
}

