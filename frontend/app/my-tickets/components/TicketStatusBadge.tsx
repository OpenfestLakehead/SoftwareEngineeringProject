import type { EventStatus, TicketStatus } from "@/lib/api/tickets";

interface TicketStatusBadgeProps {
  status: TicketStatus;
  eventStatus?: EventStatus;
}

export default function TicketStatusBadge({
  status,
  eventStatus,
}: TicketStatusBadgeProps) {
  if (status === "CHECKED_IN") {
    return (
      <span
        data-testid="ticket-status-badge"
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
      >
        Checked-In
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span
        data-testid="ticket-status-badge"
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
      >
        Cancelled
      </span>
    );
  }

  // Active Ticket is Green (emerald) so it clearly signals "valid/ready to use"
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        data-testid="ticket-status-badge"
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
      >
        Active Ticket
      </span>
      {eventStatus === "CLOSED" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
          Sign-ups Closed
        </span>
      )}
    </div>
  );
}
