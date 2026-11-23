"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import {
  getMyTickets,
  cancelTicketByCode,
  UnauthorizedTicketAccessError,
  type TicketResponse,
} from "@/lib/api/tickets";
import TicketCard from "./components/TicketCard";
import TicketQrModal from "./components/TicketQrModal";

type FilterTab = "ALL" | "ACTIVE" | "CHECKED_IN" | "CANCELLED";

export default function MyTicketsPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);

  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<FilterTab>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(
    null
  );

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err: unknown) {
      if (err instanceof UnauthorizedTicketAccessError) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to load your tickets.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    async function verifyAndLoad() {
      try {
        const user = await getCurrentUser();
        if (!active) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        setAuthChecked(true);
        await loadTickets();
      } catch {
        if (!active) return;
        router.replace("/login");
      }
    }

    void verifyAndLoad();

    return () => {
      active = false;
    };
  }, [router, loadTickets]);

  const handleTicketUpdated = useCallback((updated: TicketResponse) => {
    setTickets((prev) =>
      prev.map((t) => (t.ticketCode === updated.ticketCode ? updated : t))
    );
    setSelectedTicket((prev) =>
      prev && prev.ticketCode === updated.ticketCode ? updated : prev
    );
  }, []);

  const handleCancelTicket = useCallback(
    async (ticketCode: string) => {
      setErrorMessage(null);
      try {
        const cancelled = await cancelTicketByCode(ticketCode);
        setTickets((prev) =>
          prev.map((t) => (t.ticketCode === cancelled.ticketCode ? cancelled : t))
        );
        setSelectedTicket((prev) =>
          prev && prev.ticketCode === cancelled.ticketCode ? cancelled : prev
        );
        setSuccessMessage(`Ticket ${ticketCode} has been cancelled.`);
        window.setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err: unknown) {
        if (err instanceof UnauthorizedTicketAccessError) {
          router.replace("/login");
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to cancel ticket."
        );
      }
    },
    [router]
  );

  const stats = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter((t) => t.status === "ACTIVE").length;
    const checkedIn = tickets.filter((t) => t.status === "CHECKED_IN").length;
    const cancelled = tickets.filter((t) => t.status === "CANCELLED").length;
    return { total, active, checkedIn, cancelled };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesTab = selectedTab === "ALL" || t.status === selectedTab;
      const matchesSearch =
        !query ||
        t.eventTitle.toLowerCase().includes(query) ||
        t.eventLocation.toLowerCase().includes(query) ||
        t.ticketCode.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [tickets, searchQuery, selectedTab]);

  if (!authChecked) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Checking session...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              My Tickets
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Access your scannable QR entry passes, verify ticket IDs, and
              check gate redemption status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadTickets}
              disabled={isLoading}
              className="px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/events"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              Explore Events
            </Link>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-600 dark:text-red-400 hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Total Passes
            </span>
            <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              All event tickets
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Active & Upcoming
            </span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {stats.active}
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Ready for gate scan
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Checked-In
            </span>
            <div className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.checkedIn}
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Already redeemed
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Cancelled
            </span>
            <div className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">
              {stats.cancelled}
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              No longer valid
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by event title, location, or Ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(
              [
                { id: "ALL", label: "All Tickets" },
                { id: "ACTIVE", label: "Active" },
                { id: "CHECKED_IN", label: "Checked-In" },
                { id: "CANCELLED", label: "Cancelled" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Loading your tickets...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tickets.length === 0
                ? "No tickets in your account yet"
                : "No tickets match your filter"}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {tickets.length === 0
                ? "When you RSVP to free events or purchase event tickets, your scannable QR entry passes will appear right here."
                : "Try clearing your search query or switching to the All Tickets tab."}
            </p>
            <div className="mt-5">
              {tickets.length === 0 ? (
                <Link
                  href="/events"
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Explore Events
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTab("ALL");
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onSelectTicket={setSelectedTicket}
                onCancelTicket={handleCancelTicket}
              />
            ))}
          </div>
        )}

        {/* Scannable QR Ticket Modal */}
        {selectedTicket && (
          <TicketQrModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onTicketUpdated={handleTicketUpdated}
            onCancelTicket={handleCancelTicket}
          />
        )}
      </div>
    </main>
  );
}
