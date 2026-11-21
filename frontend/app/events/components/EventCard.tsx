import Link from "next/link";
import type { EventResponse } from "@/lib/api/events";
import { formatAgeRestriction, formatEventPrice } from "@/lib/helpers/events";

interface EventCardProps {
  event: EventResponse;
}

export default function EventCard({ event }: EventCardProps) {
  const isFree = event.price === 0;

  return (
    <article className="flex flex-col justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2
            className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1"
            title={event.title}
          >
            {event.title}
          </h2>

          <span
            className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isFree
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
            }`}
          >
            {formatEventPrice(event.price)}
          </span>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Location:
            </span>
            <span className="truncate max-w-[200px]" title={event.location}>
              {event.location}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Capacity:
            </span>
            <span>{event.capacity.toLocaleString()} attendees</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Age Restriction:
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium">
              {formatAgeRestriction(event.ageRestriction)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end">
        <Link
          href={`/events?eventId=${event.id}`}
          scroll={false}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
