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
  location: string;
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
  maxPrice?: number;
  ageRestriction?: AgeRestriction;
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

/**
 * Fetch public PUBLISHED events from GET /api/events.
 */
export async function getPublishedEvents(
  query: PublishedEventsQuery = {},
): Promise<EventResponse[]> {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }
  if (query.city?.trim()) {
    params.set("city", query.city.trim());
  }
  if (query.freeOnly !== undefined) {
    params.set("freeOnly", String(query.freeOnly));
  }
  if (query.maxPrice !== undefined) {
    params.set("maxPrice", String(query.maxPrice));
  }
  if (query.ageRestriction) {
    params.set("ageRestriction", query.ageRestriction);
  }

  const qs = params.toString();
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
