export default function EventsLoading() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-600"
          role="status"
          aria-label="Loading published events"
        />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Loading upcoming events...
        </p>
      </div>
    </main>
  );
}
