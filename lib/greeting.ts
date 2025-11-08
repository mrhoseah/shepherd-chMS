import moment from "moment";

/**
 * Get a time-based greeting based on the current time of day
 * @param name - The name to include in the greeting
 * @returns A personalized greeting string
 */
export function getGreeting(name?: string): string {
  const hour = moment().hour();
  const firstName = name?.split(" ")[0] || "User";

  let greeting: string;

  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  return `${greeting}, ${firstName}! 👋`;
}

