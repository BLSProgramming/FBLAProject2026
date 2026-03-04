export default function MessageDisplay({ error, success }) {
  return (
    <>
      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          {success}
        </p>
      )}
    </>
  );
}