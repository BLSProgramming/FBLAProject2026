import { HiSparkles, HiUserCircle } from 'react-icons/hi2';
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

export function UserRegister() {
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
              widgetId="turnstile-widget"
              turnstileToken={turnstileToken}
            />

            <MessageDisplay error={error} success={success} />

            <RegistrationButton
              onClick={handleRegister}
              loading={loading}
              disabled={!isStep2Valid}
              text="🎉 Complete Registration"
              loadingText="Creating Account..."
            />
          </div>
        </StepTransition>
      </div>
    </RegistrationLayout>
  );
}
