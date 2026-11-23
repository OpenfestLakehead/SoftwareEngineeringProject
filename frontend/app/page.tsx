"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((user) => {
        if (active) {
          setUserEmail(user?.email ?? null);
        }
      })
      .catch(() => {
        if (active) {
          setUserEmail(null);
        }
      })
      .finally(() => {
        if (active) {
          setAuthLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
          OpenFest
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Host & Manage Outdoor Events
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Create custom outdoor gatherings, manage capacity and tickets, monitor attendees real-time.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/events"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors"
          >
            Explore Events
          </Link>

          {authLoaded && userEmail ? (
            <>
              <Link
                href="/my-tickets"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
              >
                My Tickets
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
              >
                Creator Dashboard
              </Link>
              <Link
                href="/events/create"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
              >
                Create New Event
              </Link>
            </>
          ) : authLoaded ? (
            <>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
              >
                Create Account
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
