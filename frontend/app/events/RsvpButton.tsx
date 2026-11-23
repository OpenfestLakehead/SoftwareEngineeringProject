"use client";

import { useState } from "react";
import Link from "next/link";
import { getCsrfToken } from "@/lib/api";
import {
  issueTicketForEvent,
  UnauthorizedTicketAccessError,
} from "@/lib/api/tickets";

type RsvpButtonProps = {
  eventId: number;
  price?: number;
};

export default function RsvpButton({ eventId, price = 0 }: RsvpButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const isFree = Number(price) === 0;

  async function handleReserveOrPurchase() {
    setLoading(true);
    setError("");
    setNeedsLogin(false);

    try {
      if (isFree) {
        const csrfToken = await getCsrfToken();
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const response = await fetch(
          `${backendUrl}/api/events/${eventId}/rsvp`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              [csrfToken.headerName]: csrfToken.token,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setNeedsLogin(true);
            throw new Error("Please sign in to RSVP and get your event ticket.");
          }

          if (response.status === 409) {
            throw new Error(
              "You have already RSVP'd to this event, or the event is full."
            );
          }

          throw new Error("Unable to RSVP. Please try again.");
        }
      }

      const issuedTicket = await issueTicketForEvent(eventId);
      setTicketCode(issuedTicket.ticketCode);
      setSuccess(true);
    } catch (err) {
      if (err instanceof UnauthorizedTicketAccessError) {
        setNeedsLogin(true);
        setError("Please sign in to get your event ticket.");
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleReserveOrPurchase}
          disabled={loading || success}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : success
              ? "Ticket Issued"
              : isFree
                ? "RSVP & Get Free Ticket"
                : `Get Ticket ($${Number(price).toFixed(2)})`}
        </button>

        {success && (
          <Link
            href="/my-tickets"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            View Ticket
          </Link>
        )}
      </div>

      {success && (
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Your reservation and scannable QR ticket are ready in My Tickets.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          {needsLogin && (
            <Link
              href="/login"
              className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
