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
