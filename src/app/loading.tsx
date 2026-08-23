export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full" />
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    </div>
  );
}
