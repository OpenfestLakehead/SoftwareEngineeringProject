"use client";

import { useState } from "react";

type Reservation = {
  rsvpId: number;
  eventId: number;
  eventTitle: string;
  attendeeEmail: string;
  ticketCode?: string | null;
  ticketStatus?: string | null;
  createdAt: string;
};

type Props = {
  eventId: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function EventAttendees({ eventId }: Props) {
  const [attendees, setAttendees] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleViewAttendees() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/events/${eventId}/rsvps`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "Only the event creator can view attendees."
            : "Unable to load attendees."
        );
      }

      const data: Reservation[] = await response.json();
      setAttendees(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleViewAttendees}
        className="rounded-lg border border-blue-200 dark:border-blue-800 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
      >
        {isOpen ? "Hide Attendees" : "View Attendees"}
      </button>

      {isOpen && (
        <div className="mt-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
          {loading && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Loading attendees...
            </p>
          )}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {!loading && !error && attendees.length === 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              No attendees registered yet.
            </p>
          )}

          {!loading && !error && attendees.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Registered Attendees ({attendees.length})
              </p>

              {attendees.map((attendee) => (
                <div
                  key={attendee.rsvpId}
                  className="rounded-md bg-gray-100 p-2.5 dark:bg-gray-800 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="break-all text-xs font-semibold text-gray-900 dark:text-white">
                      {attendee.attendeeEmail}
                    </p>
                    {attendee.ticketStatus && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          attendee.ticketStatus === "CHECKED_IN"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }`}
                      >
                        {attendee.ticketStatus === "CHECKED_IN"
                          ? "Checked-In"
                          : "Active"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                    {attendee.ticketCode ? (
                      <span className="font-mono font-medium">
                        Ticket ID: {attendee.ticketCode}
                      </span>
                    ) : (
                      <span>Registered</span>
                    )}
                    <span>
                      {new Date(attendee.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
