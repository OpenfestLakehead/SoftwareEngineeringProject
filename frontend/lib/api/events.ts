import { getCsrfToken } from "@/lib/api";

export type AgeRestriction =
  | "ALL_AGES"
  | "THIRTEEN_PLUS"
  | "EIGHTEEN_PLUS"
  | "TWENTY_ONE_PLUS";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "SOLD_OUT";

export interface CreateEventPayload {
  title: string;
  description: string | null;
  addressfield1: string;
  city: string;
  capacity: number;
  ageRestriction: AgeRestriction;
  price: number;
  status: EventStatus;
}

export interface UpdateEventPayload {
  title: string;
  description: string | null;
  location: string;
  capacity: number;
  ageRestriction: AgeRestriction;
  price: number;
  status?: EventStatus;
}

export interface EventResponse {
  id: number;
  creatorId: number | null;
  creatorEmail: string | null;
  title: string;
  description: string;
  addressfield1: string;
  city: string;
  location: string;
  capacity: number;
  ageRestriction: AgeRestriction;
  price: number;
  status: EventStatus;
  createdAt: string;
}

export interface PublishedEventsQuery {
  q?: string;
  city?: string;
  freeOnly?: boolean;
  maxPrice?: number | string;
  ageRestriction?: AgeRestriction | "";
}

export function getBackendUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080"
    );
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
}

export async function handleResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  if (!response.ok) {
    let errorMessage = `${fallbackMessage} (${response.status})`;

    try {
      const data = await response.json();

      if (typeof data?.message === "string") {
        errorMessage = data.message;
      }
    } catch {
      // Keep the fallback error message.
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export function buildPublishedEventsQueryString(
  query: PublishedEventsQuery = {},
): string {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }
  if (query.city?.trim()) {
    params.set("city", query.city.trim());
  }
  if (query.freeOnly) {
    params.set("freeOnly", "true");
  }
  if (query.maxPrice !== undefined && String(query.maxPrice).trim() !== "") {
    params.set("maxPrice", String(query.maxPrice).trim());
  }
  if (query.ageRestriction) {
    params.set("ageRestriction", query.ageRestriction);
  }

  return params.toString();
}

/**
 * Fetch public PUBLISHED events from GET /api/events.
 */
export async function getPublishedEvents(
  query: PublishedEventsQuery = {},
): Promise<EventResponse[]> {
  const qs = buildPublishedEventsQueryString(query);
  const url = `${getBackendUrl()}/api/events${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  return handleResponse<EventResponse[]>(
    response,
    "Failed to fetch published events",
  );
}

// Create event
export async function createEventAction(
  payload: CreateEventPayload,
): Promise<EventResponse> {
  const backendUrl = getBackendUrl();
  const csrf = await getCsrfToken();

  const response = await fetch(`${backendUrl}/api/events`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<EventResponse>(response, "Failed to create event");
}

// Get creator's events
export async function getCreatorEventsAction(): Promise<EventResponse[]> {
  const backendUrl = getBackendUrl();

  const response = await fetch(`${backendUrl}/api/events/creator`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return handleResponse<EventResponse[]>(response, "Failed to fetch events");
}

// Update event details
export async function updateEventAction(
  id: number,
  payload: UpdateEventPayload,
): Promise<EventResponse> {
  const backendUrl = getBackendUrl();
  const csrf = await getCsrfToken();

  const response = await fetch(`${backendUrl}/api/events/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<EventResponse>(response, "Failed to update event");
}

// Update event status
export async function updateEventStatusAction(
  id: number,
  status: EventStatus,
): Promise<EventResponse> {
  const backendUrl = getBackendUrl();
  const csrf = await getCsrfToken();

  const response = await fetch(`${backendUrl}/api/events/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token,
    },
    body: JSON.stringify({ status }),
  });

  return handleResponse<EventResponse>(
    response,
    "Failed to update event status",
  );
}
