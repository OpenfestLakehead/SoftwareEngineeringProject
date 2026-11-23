"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getEventByIdAction,
  type EventResponse,
} from "@/lib/api/events";
import {
  formatAgeRestriction,
  formatEventPrice,
} from "@/lib/helpers/events";
import GoogleMapsDirections from "@/app/GoogleMapsDirections";
import RsvpButton from "../RsvpButton";

function EventDetailsContent() {
  const params = useParams();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isSafeInteger(eventId) || eventId <= 0) {
      setError("Invalid event ID.");
      setLoading(false);
      return;
    }

    getEventByIdAction(eventId)
      .then(setEvent)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load event."
        );
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex items-center justify-center p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading event...
        </p>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white max-w-3xl mx-auto py-12 px-4">
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
        >
          {error || "Event not found."}
        </div>
        <div className="mt-4">
          <Link
            href="/events"
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Explore Events
          </Link>
        </div>
      </main>
    );
  }

  const isPublished = event.status === "PUBLISHED";

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/events"
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Explore Events
          </Link>
        </div>

        <article className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                  {formatEventPrice(event.price)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  {formatAgeRestriction(event.ageRestriction)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                  {event.status}
                </span>
              </div>
            </div>

            <GoogleMapsDirections location={event.location} />
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              About This Event
            </h2>
            <p className="mt-2 text-sm text-gray-900 dark:text-white whitespace-pre-line">
              {event.description || "No description provided."}
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
            <div>
              <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Location
              </dt>
              <dd className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                {event.location}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Capacity
              </dt>
              <dd className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                {event.capacity.toLocaleString()} attendees
              </dd>
            </div>
          </dl>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            {isPublished ? (
              <RsvpButton eventId={event.id} price={event.price} />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Registrations are currently closed for this event.
              </p>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}

export default function EventDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex items-center justify-center p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading event...
          </p>
        </main>
      }
    >
      <EventDetailsContent />
    </Suspense>
  );
}
