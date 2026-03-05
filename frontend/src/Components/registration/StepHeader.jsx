export default function StepHeader({ Icon, title, description }) {
  return (
    <div className="text-center mb-4">
      <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="text-black text-2xl" />
      </div>
      <h2 className="text-xl font-bold text-yellow-400 mb-1">{title}</h2>
      <p className="text-yellow-200 text-sm">{description}</p>
    </div>
  );
}