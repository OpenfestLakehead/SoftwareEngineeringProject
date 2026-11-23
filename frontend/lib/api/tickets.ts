import { getCsrfToken } from "../api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

export type TicketStatus = "ACTIVE" | "CHECKED_IN" | "CANCELLED";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "SOLD_OUT";

export interface TicketResponse {
  id: number;
  ticketCode: string;
  status: TicketStatus;
  issuedAt: string;
  checkedInAt: string | null;
  attendeeEmail: string | null;
  eventId: number;
  eventTitle: string;
  eventDescription: string | null;
  eventLocation: string;
  eventStatus: EventStatus;
  eventCreatedAt: string;
}

export class UnauthorizedTicketAccessError extends Error {
  constructor(message = "Authentication required to access tickets") {
    super(message);
    this.name = "UnauthorizedTicketAccessError";
  }
}

export async function getMyTickets(): Promise<TicketResponse[]> {
  const response = await fetch(`${API_URL}/api/tickets/my-tickets`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new UnauthorizedTicketAccessError();
  }

  if (!response.ok) {
    let errorMessage = `Failed to load tickets (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) {
        errorMessage = data.message;
      }
    } catch {
      // Fallback to status message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getTicketByCode(ticketCode: string): Promise<TicketResponse> {
  const encodedCode = encodeURIComponent(ticketCode.trim());
  const response = await fetch(`${API_URL}/api/tickets/${encodedCode}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new UnauthorizedTicketAccessError();
  }

  if (!response.ok) {
    let errorMessage = `Failed to load ticket (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) {
        errorMessage = data.message;
      }
    } catch {
      // Fallback to status message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function issueTicketForEvent(eventId: number): Promise<TicketResponse> {
  const csrf = await getCsrfToken();

  const response = await fetch(`${API_URL}/api/tickets/issue/${eventId}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token,
    },
  });

  if (response.status === 401) {
    throw new UnauthorizedTicketAccessError();
  }

  if (!response.ok) {
    let errorMessage = `Failed to issue ticket (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) {
        errorMessage = data.message;
      }
    } catch {
      // Fallback to status message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function cancelTicketByCode(ticketCode: string): Promise<TicketResponse> {
  const csrf = await getCsrfToken();
  const encodedCode = encodeURIComponent(ticketCode.trim());

  const response = await fetch(`${API_URL}/api/tickets/${encodedCode}/cancel`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token,
    },
  });

  if (response.status === 401) {
    throw new UnauthorizedTicketAccessError();
  }

  if (!response.ok) {
    let errorMessage = `Failed to cancel ticket (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) {
        errorMessage = data.message;
      }
    } catch {
      // Fallback to status message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
