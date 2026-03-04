import FormInput from './ui/FormInput';
import PasswordInput from './ui/PasswordInput';

export default function SecurityStep({ 
  email, 
  password, 
  confirmPassword,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  emailPlaceholder = "your@email.com"
}) {
  return (
    <>
      <FormInput
        label="Email Address"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder={emailPlaceholder}
        className="mb-2"
        required
      />

      <PasswordInput
        label="Password"
        value={password}
        onChange={onPasswordChange}
        placeholder="Create a strong password"
        className="mb-2"
        showStrength={true}
        required
      />

      <PasswordInput
        label="Confirm Password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Confirm your password"
        className="mb-2"
        required
      />
    </>
  );
}