import { Suspense } from "react";
import Link from "next/link";
import { getPublishedEvents, type EventResponse } from "@/lib/api/events";
import EventCard from "./components/EventCard";
import EventDetailModal from "./components/EventDetailModal";
import EventsLoading from "./loading";

interface ExploreEventsPageProps {
  searchParams: Promise<{ eventId?: string }>;
}

async function ExploreEventsContent({
  searchParams,
}: ExploreEventsPageProps) {
  const { eventId } = await searchParams;
  let events: EventResponse[] = [];
  let loadError: string | null = null;

  try {
    events = await getPublishedEvents();
  } catch (err: unknown) {
    loadError =
      err instanceof Error
        ? err.message
        : "Unable to load published events right now.";
  }

  const parsedId = eventId ? Number.parseInt(eventId, 10) : Number.NaN;
  const selectedEvent = Number.isNaN(parsedId)
    ? undefined
    : events.find((evt) => evt.id === parsedId);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Explore Events
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Browse upcoming published outdoor events across the community.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Creator Dashboard
            </Link>
          </div>
        </header>

        {loadError ? (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400"
          >
            <p className="font-semibold">Unable to load events</p>
            <p className="mt-1">{loadError}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="mt-12 text-center py-16 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              No published events yet
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Check back soon for upcoming outdoor events.
            </p>
          </div>
        ) : (
          <section
            aria-label="Published events"
            className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </section>
        )}

        {selectedEvent && <EventDetailModal event={selectedEvent} />}
      </div>
    </main>
  );
}

export default function ExploreEventsPage({
  searchParams,
}: ExploreEventsPageProps) {
  return (
    <Suspense fallback={<EventsLoading />}>
      <ExploreEventsContent searchParams={searchParams} />
    </Suspense>
  );
}
