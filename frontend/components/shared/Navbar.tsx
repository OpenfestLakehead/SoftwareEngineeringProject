"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pacifico } from "next/font/google";
import { getCurrentUser, logout } from "@/lib/api";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface NavLinkItem {
  href: string;
  label: string;
}

const PUBLIC_NAV_LINKS: readonly NavLinkItem[] = [
  { href: "/events", label: "Explore Events" },
];

const AUTH_NAV_LINKS: readonly NavLinkItem[] = [
  { href: "/events", label: "Explore Events" },
  { href: "/my-tickets", label: "My Tickets" },
  { href: "/dashboard", label: "Creator Dashboard" },
  { href: "/events/create", label: "Create Event" },
];

function NavbarContent() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const user = await getCurrentUser();
        if (active) {
          setUserEmail(user?.email ?? null);
        }
      } catch {
        if (active) {
          setUserEmail(null);
        }
      } finally {
        if (active) {
          setAuthLoaded(true);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logout();
      setUserEmail(null);
      router.replace("/login");
      router.refresh();
    } catch {
      // Ignore logout failure in navbar
    } finally {
      setIsLoggingOut(false);
    }
  }

  function isLinkActive(href: string): boolean {
    if (href === "/events") {
      return (
        pathname === "/events" ||
        (pathname.startsWith("/events/") &&
          !pathname.startsWith("/events/create"))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const visibleLinks = userEmail ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
      {/* Left: Brand Logo + Primary Navigation */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        <Link
          href="/"
          className={`${pacifico.className} text-2xl sm:text-3xl text-gray-900 dark:text-white hover:opacity-90 transition-opacity select-none`}
        >
          OpenFest
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-1 sm:gap-2"
        >
          {visibleLinks.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Authentication Controls */}
      <div className="flex items-center gap-3">
        {!authLoaded ? null : userEmail ? (
          <>
            <span className="hidden md:inline-block text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? "Signing out..." : "Logout"}
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors ${
                pathname === "/login"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function NavbarFallback() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        <Link
          href="/"
          className={`${pacifico.className} text-2xl sm:text-3xl text-gray-900 dark:text-white select-none`}
        >
          OpenFest
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-1 sm:gap-2"
        >
          {PUBLIC_NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<NavbarFallback />}>
          <NavbarContent />
        </Suspense>
      </div>
    </header>
  );
}
