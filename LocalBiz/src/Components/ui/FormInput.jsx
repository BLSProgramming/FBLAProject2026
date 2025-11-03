export default function FormInput({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  className = "" 
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-yellow-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${className}`}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}