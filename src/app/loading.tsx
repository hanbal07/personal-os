export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-line border-t-accent rounded-full" />
        <p className="text-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}
