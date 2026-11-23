import Link from "next/link";
import {
  buildPublishedEventsQueryString,
  getPublishedEvents,
  type AgeRestriction,
  type EventResponse,
  type PublishedEventsQuery,
} from "@/lib/api/events";
import EventCard from "./components/EventCard";
import EventDetailModal from "./components/EventDetailModal";
import EventFilterBar from "./components/EventFilterBar";

interface ExploreEventsSearchParams {
  q?: string;
  city?: string;
  freeOnly?: string;
  maxPrice?: string;
  ageRestriction?: string;
  eventId?: string;
}

interface ExploreEventsPageProps {
  searchParams: Promise<ExploreEventsSearchParams>;
}

export default async function ExploreEventsPage({
  searchParams,
}: ExploreEventsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const city = params.city?.trim() ?? "";
  const freeOnly = params.freeOnly === "true";
  const maxPrice = freeOnly ? "" : (params.maxPrice?.trim() ?? "");
  const ageRestriction = (params.ageRestriction?.trim() ?? "") as
    | AgeRestriction
    | "";

  const query: PublishedEventsQuery = {
    q,
    city,
    freeOnly,
    maxPrice,
    ageRestriction,
  };
  const filterQuery = buildPublishedEventsQueryString(query);
  const hasActiveFilters = filterQuery.length > 0;

  let events: EventResponse[] = [];
  let loadError: string | null = null;

  try {
    events = await getPublishedEvents(query);
  } catch (err: unknown) {
    loadError =
      err instanceof Error
        ? err.message
        : "Unable to load published events right now.";
  }

  const parsedId = params.eventId
    ? Number.parseInt(params.eventId, 10)
    : Number.NaN;
  const selectedEvent = Number.isNaN(parsedId)
    ? undefined
    : events.find((evt) => evt.id === parsedId);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="pb-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Explore Events
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Browse upcoming published outdoor events across the community.
          </p>
        </div>

        <EventFilterBar
          key={filterQuery}
          initialQuery={q}
          initialCity={city}
          initialFreeOnly={freeOnly}
          initialMaxPrice={maxPrice}
          initialAgeRestriction={ageRestriction}
        />

        {loadError ? (
          <div className="mt-8 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
            <p className="font-semibold">Unable to load events</p>
            <p className="mt-1">{loadError}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="mt-12 text-center py-16 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {hasActiveFilters ? "No events found" : "No published events yet"}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {hasActiveFilters
                ? "Try adjusting or clearing your search and filter criteria."
                : "Check back soon for upcoming outdoor events."}
            </p>
            {hasActiveFilters && (
              <div className="mt-6">
                <Link
                  href="/events"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Clear All Filters
                </Link>
              </div>
            )}
          </div>
        ) : (
          <section
            className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {events.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                filterQuery={filterQuery || undefined}
              />
            ))}
          </section>
        )}

        {selectedEvent && <EventDetailModal event={selectedEvent} />}
      </div>
    </main>
  );
}
