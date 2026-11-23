"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  getTicketByCode,
  type TicketResponse,
} from "@/lib/api/tickets";
import TicketStatusBadge from "./TicketStatusBadge";

interface TicketQrModalProps {
  ticket: TicketResponse;
  onClose: () => void;
  onTicketUpdated: (updated: TicketResponse) => void;
  onCancelTicket?: (ticketCode: string) => Promise<void>;
}

const POLL_INTERVAL_MS = 4000;

export default function TicketQrModal({
  ticket,
  onClose,
  onTicketUpdated,
  onCancelTicket,
}: TicketQrModalProps) {
  const [copied, setCopied] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const checkTicketStatus = useCallback(async () => {
    if (ticket.status !== "ACTIVE") {
      return;
    }
    try {
      const latest = await getTicketByCode(ticket.ticketCode);
      if (
        latest.status !== ticket.status ||
        latest.eventStatus !== ticket.eventStatus ||
        latest.checkedInAt !== ticket.checkedInAt
      ) {
        if (ticket.status === "ACTIVE" && latest.status === "CHECKED_IN") {
          setJustCheckedIn(true);
        }
        onTicketUpdated(latest);
      }
    } catch {
      // Silently ignore transient polling network errors while modal is open
    }
  }, [ticket, onTicketUpdated]);

  useEffect(() => {
    if (ticket.status !== "ACTIVE") {
      return;
    }

    const intervalId = window.setInterval(checkTicketStatus, POLL_INTERVAL_MS);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkTicketStatus();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [ticket.status, checkTicketStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticketCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API fallback not needed
    }
  };

  const handleConfirmCancel = async () => {
    if (!onCancelTicket || isCancelling) return;
    setIsCancelling(true);
    try {
      await onCancelTicket(ticket.ticketCode);
      setConfirmingCancel(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const formattedEventDate = new Date(
    ticket.eventCreatedAt || ticket.issuedAt
  ).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedCheckedInTime = ticket.checkedInAt
    ? new Date(ticket.checkedInAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isRedeemed = ticket.status === "CHECKED_IN";
  const isCancelled = ticket.status === "CANCELLED";

  const mapsUrl = ticket.eventLocation?.trim()
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ticket.eventLocation)}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Entry Pass
            </span>
            <h2
              id="ticket-modal-title"
              className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white"
            >
              {ticket.eventTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close ticket modal"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Live Scan Confirmation Alert (AC #3) */}
        {isRedeemed && (
          <div className="mt-4 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-sm">
                {justCheckedIn
                  ? "Gate Scan Confirmed — Welcome In"
                  : "Ticket Already Redeemed"}
              </p>
              {formattedCheckedInTime && (
                <p className="mt-0.5">Checked in on {formattedCheckedInTime}</p>
              )}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
            <p className="font-bold text-sm">Ticket Cancelled</p>
            <p className="mt-0.5">
              This ticket is no longer valid for gate admission.
            </p>
          </div>
        )}

        {/* High-Contrast Scannable QR Code Container */}
        <div className="mt-5 flex flex-col items-center">
          <div
            className={`relative bg-white p-5 rounded-2xl border-2 ${
              isRedeemed
                ? "border-blue-500"
                : isCancelled
                  ? "border-red-400 opacity-50"
                  : "border-gray-200"
            } shadow-sm flex items-center justify-center`}
          >
            <QRCodeSVG
              value={ticket.ticketCode}
              size={220}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              includeMargin
            />
          </div>

          <p className="mt-2.5 text-xs text-gray-600 dark:text-gray-400 text-center">
            {ticket.status === "ACTIVE"
              ? "Present this QR code to the Event Guard at the entrance"
              : "Ticket status updates automatically upon gate scan"}
          </p>
        </div>

        {/* Human-Readable Ticket ID */}
        <div className="mt-5 p-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Ticket ID
            </span>
            <span
              data-testid="ticket-code-display"
              className="mt-0.5 block text-base font-mono font-bold tracking-wider text-gray-900 dark:text-white"
            >
              {ticket.ticketCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? "Copied" : "Copy ID"}
          </button>
        </div>

        {/* Essential Event Details */}
        <div className="mt-5 space-y-2.5 text-sm border-t border-gray-200 dark:border-gray-800 pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Status
            </span>
            <TicketStatusBadge
              status={ticket.status}
              eventStatus={ticket.eventStatus}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Location
            </span>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Maps"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-right"
              >
                {ticket.eventLocation}
              </a>
            ) : (
              <span className="font-semibold text-gray-900 dark:text-white text-right">
                {ticket.eventLocation}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Date
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formattedEventDate}
            </span>
          </div>

          {ticket.attendeeEmail && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Attendee
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[220px]">
                {ticket.attendeeEmail}
              </span>
            </div>
          )}
        </div>

        {confirmingCancel && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 space-y-2.5"
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

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          {ticket.status === "ACTIVE" && onCancelTicket && !confirmingCancel ? (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              Cancel Ticket
            </button>
          ) : ticket.status === "ACTIVE" ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Live check-in sync active
            </span>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
