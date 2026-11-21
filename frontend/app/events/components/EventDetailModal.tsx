"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EventResponse } from "@/lib/api/events";
import { formatAgeRestriction, formatEventPrice } from "@/lib/helpers/events";

interface EventDetailModalProps {
  event: EventResponse;
}

export default function EventDetailModal({ event }: EventDetailModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.replace("/events", { scroll: false });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.replace("/events", { scroll: false });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const isFree = event.price === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-modal-title"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2
              id="event-detail-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {event.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isFree
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {formatEventPrice(event.price)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                {formatAgeRestriction(event.ageRestriction)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close event details"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-semibold leading-none p-1"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">
              {event.description || "No description provided."}
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
            <div>
              <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Location
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                {event.location}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Capacity
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                {event.capacity.toLocaleString()} attendees
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Published
              </dt>
              <dd className="mt-0.5 text-gray-900 dark:text-white">
                {new Date(event.createdAt).toLocaleDateString()}
              </dd>
            </div>

            {event.creatorEmail && (
              <div>
                <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Organizer
                </dt>
                <dd className="mt-0.5 text-gray-900 dark:text-white truncate">
                  {event.creatorEmail}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
