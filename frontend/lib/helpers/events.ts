import type { AgeRestriction } from "@/lib/api/events";

export const AGE_RESTRICTION_OPTIONS: readonly {
  value: AgeRestriction;
  label: string;
}[] = [
  { value: "ALL_AGES", label: "All Ages" },
  { value: "THIRTEEN_PLUS", label: "13+ Only" },
  { value: "EIGHTEEN_PLUS", label: "18+ Only" },
  { value: "TWENTY_ONE_PLUS", label: "21+ Only" },
];

/**
 * Format an AgeRestriction enum string into a user-facing label.
 */
export function formatAgeRestriction(age: string): string {
  switch (age) {
    case "ALL_AGES":
      return "All Ages";
    case "THIRTEEN_PLUS":
      return "13+";
    case "EIGHTEEN_PLUS":
      return "18+";
    case "TWENTY_ONE_PLUS":
      return "21+";
    default:
      return age;
  }
}

/**
 * Format an event price into "Free RSVP" or "$XX.XX".
 */
export function formatEventPrice(price: number): string {
  return price === 0 ? "Free RSVP" : `$${price.toFixed(2)}`;
}
