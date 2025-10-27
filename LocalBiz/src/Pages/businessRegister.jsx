import { HiSparkles, HiBuildingOffice2 } from 'react-icons/hi2';
import RegistrationLayout from '../Components/sub-components/RegistrationLayout';
import FormInput from '../Components/sub-components/FormInput';
import TurnstileWidget from '../Components/sub-components/TurnstileWidget';
import MultiStepProgress from '../Components/sub-components/MultiStepProgress';
import StepTransition from '../Components/sub-components/StepTransition';
import StepHeader from '../Components/sub-components/StepHeader';
import SecurityStep from '../Components/sub-components/SecurityStep';
import RegistrationButton from '../Components/sub-components/RegistrationButton';
import MessageDisplay from '../Components/sub-components/MessageDisplay';
import useMultiStepRegistration from '../hooks/useMultiStepRegistration';


export function BusinessRegister() {
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
    turnstileToken,
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
            />

            <MessageDisplay error={error} success={success} />

            <RegistrationButton
              onClick={handleRegister}
              loading={loading}
              disabled={!businessStep2Valid}
              text="🏢 Complete Business Registration"
              loadingText="Creating Business Account..."
            />
          </div>
        </StepTransition>
      </div>
    </RegistrationLayout>
  );
}

