export default function RegistrationButton({ 
  onClick,
  disabled,
  loading,
  loadingText,
  completedText,
  icon = "🎉"
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-500 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          {loadingText}
        </span>
      ) : (
        `${icon} ${completedText}`
      )}
    </button>
  );
}