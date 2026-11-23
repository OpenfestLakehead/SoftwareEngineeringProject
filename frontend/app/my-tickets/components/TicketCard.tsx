"use client";

import { useState } from "react";
import type { TicketResponse } from "@/lib/api/tickets";
import TicketStatusBadge from "./TicketStatusBadge";

interface TicketCardProps {
  ticket: TicketResponse;
  onSelectTicket: (ticket: TicketResponse) => void;
  onCancelTicket: (ticketCode: string) => Promise<void>;
}

export default function TicketCard({
  ticket,
  onSelectTicket,
  onCancelTicket,
}: TicketCardProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const formattedIssuedDate = new Date(ticket.issuedAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const formattedCheckedInDate = ticket.checkedInAt
    ? new Date(ticket.checkedInAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const mapsUrl = ticket.eventLocation?.trim()
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ticket.eventLocation)}`
    : null;

  const canCancel = ticket.status === "ACTIVE";

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancelTicket(ticket.ticketCode);
    } finally {
      setIsCancelling(false);
      setConfirmingCancel(false);
    }
  };

  return (
    <article className="flex flex-col justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="text-lg font-bold text-gray-900 dark:text-white truncate"
              title={ticket.eventTitle}
            >
              {ticket.eventTitle}
            </h3>
            <p className="mt-0.5 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
              Ticket ID: {ticket.ticketCode}
            </p>
          </div>
          <TicketStatusBadge
            status={ticket.status}
            eventStatus={ticket.eventStatus}
          />
        </div>

        {ticket.eventDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {ticket.eventDescription}
          </p>
        )}

        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              Location:
            </span>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Maps"
                className="truncate max-w-[200px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {ticket.eventLocation}
              </a>
            ) : (
              <span
                className="truncate max-w-[200px]"
                title={ticket.eventLocation}
              >
                {ticket.eventLocation}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              Issued Date:
            </span>
            <span>{formattedIssuedDate}</span>
          </div>

          {formattedCheckedInDate && (
            <div className="flex items-center justify-between gap-2 text-blue-600 dark:text-blue-400">
              <span className="font-semibold">Redeemed At:</span>
              <span className="font-medium">{formattedCheckedInDate}</span>
            </div>
          )}
        </div>

        {confirmingCancel && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 space-y-2.5"
          >
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              Are you sure you want to cancel this ticket?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Ticket"}
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setConfirmingCancel(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Keep Ticket
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-100/60 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
        {canCancel ? (
          <button
            type="button"
            disabled={isCancelling || confirmingCancel}
            onClick={() => setConfirmingCancel(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
          >
            Cancel Ticket
          </button>
        ) : (
          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
            {ticket.ticketCode}
          </span>
        )}

        <button
          type="button"
          onClick={() => onSelectTicket(ticket)}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {ticket.status === "CHECKED_IN"
            ? "View Redeemed Ticket"
            : "View QR Ticket"}
        </button>
      </div>
    </article>
  );
}
