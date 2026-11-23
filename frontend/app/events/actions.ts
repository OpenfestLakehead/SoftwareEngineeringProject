// DO NOT USE -- Legacy -- deleted after confirmed unuse
// Use lib/api/events instead
import { getCsrfToken } from "@/lib/api";
import {
  getBackendUrl,
  handleResponse,
  type AgeRestriction,
  type CreateEventPayload,
  type EventResponse,
  type EventStatus,
  type UpdateEventPayload,
} from "@/lib/api/events";

export type {
  AgeRestriction,
  CreateEventPayload,
  EventResponse,
  EventStatus,
  UpdateEventPayload,
};

// Create event
export async function createEventAction(
  payload: CreateEventPayload
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

  return handleResponse<EventResponse>(
    response,
    "Failed to create event"
  );
}

// Get creator's events
export async function getCreatorEventsAction():
  Promise<EventResponse[]> {
  const backendUrl = getBackendUrl();

  const response = await fetch(
    `${backendUrl}/api/events/creator`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  return handleResponse<EventResponse[]>(
    response,
    "Failed to fetch events"
  );
}

// Update event details
export async function updateEventAction(
  id: number,
  payload: UpdateEventPayload
): Promise<EventResponse> {
  const backendUrl = getBackendUrl();

  const csrf = await getCsrfToken();

  const response = await fetch(
    `${backendUrl}/api/events/${id}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse<EventResponse>(
    response,
    "Failed to update event"
  );
}

// Update event status
export async function updateEventStatusAction(
  id: number,
  status: EventStatus
): Promise<EventResponse> {
  const backendUrl = getBackendUrl();

  const csrf = await getCsrfToken();

  const response = await fetch(
    `${backendUrl}/api/events/${id}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify({ status }),
    }
  );

  return handleResponse<EventResponse>(
    response,
    "Failed to update event status"
  );
}


 // Get a single event by ID
 export async function getEventByIdAction(
  id: number
): Promise<EventResponse> {
  const backendUrl = getBackendUrl();

  const response = await fetch(
    `${backendUrl}/api/events/${id}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  return handleResponse<EventResponse>(
    response,
    "Failed to fetch event details"
  );
}

