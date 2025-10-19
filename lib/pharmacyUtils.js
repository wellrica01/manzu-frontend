/**
 * Utility functions for pharmacy-related operations (OperatingHour[])
 */

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/**
 * Convert "HH:mm" (24h) or ISO string to "h:mm AM/PM"
 */
const formatTo12Hour = (timeStr) => {
  if (!timeStr) return null;

  // Handle ISO string from DB
  if (timeStr.includes("T")) {
    timeStr = timeStr.slice(11,16); // Extract HH:mm
  }

  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute.toString().padStart(2,"0")} ${ampm}`;
};

/**
 * Formats operating hours into a friendly string
 * @param {Array} hours - Array of { dayOfWeek, openTime, closeTime }
 * @returns {{ text: string, status: string } | null}
 */
export const formatOperatingHours = (hours) => {
  if (!hours || hours.length === 0) return null;

  const now = new Date();
  const jsDay = now.getDay(); // JavaScript: 0 = Sunday, 6 = Saturday
  // Convert to ISO format: 0 = Monday, 6 = Sunday
  const today = jsDay === 0 ? 6 : jsDay - 1;
  const currentTime = now.toTimeString().slice(0,5); // HH:mm (24h)

  const todayHours = hours.find(h => h.dayOfWeek === today);

  // Handle 24/7 case
  if (hours.length === 7 && hours.every(h => h.openTime === "00:00" && h.closeTime === "23:59")) {
    return { text: "Open 24/7", status: "open" };
  }

  if (!todayHours) {
    // Find next opening day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (today + i) % 7;
      const nextHours = hours.find(h => h.dayOfWeek === nextDay);
      if (nextHours) {
        // Convert ISO day to display name
        const displayDay = nextDay === 6 ? 0 : nextDay + 1;
        return {
          text: `Closed today, opens ${days[displayDay]} at ${formatTo12Hour(nextHours.openTime)}`,
          status: "closed"
        };
      }
    }
    return { text: `Closed today`, status: "closed" };
  }

  // Normalize time strings - handle both "HH:mm" and ISO format
  let openTime = todayHours.openTime;
  let closeTime = todayHours.closeTime;
  
  if (openTime && openTime.includes("T")) {
    openTime = openTime.slice(11, 16);
  }
  if (closeTime && closeTime.includes("T")) {
    closeTime = closeTime.slice(11, 16);
  }

  if (currentTime >= openTime && currentTime < closeTime) {
    return { 
      text: `Open now until ${formatTo12Hour(closeTime)}`, 
      status: "open" 
    };
  }

  // Closed now, find next opening
  if (currentTime < openTime) {
    return {
      text: `Closed, opens today at ${formatTo12Hour(openTime)}`,
      status: "closed"
    };
  }

  // Find next opening day
  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7;
    const nextHours = hours.find(h => h.dayOfWeek === nextDay);
    if (nextHours) {
      // Convert ISO day to display name
      const displayDay = nextDay === 6 ? 0 : nextDay + 1;
      return {
        text: `Closed, opens ${days[displayDay]} at ${formatTo12Hour(nextHours.openTime)}`,
        status: "closed"
      };
    }
  }

  return { text: "Closed", status: "closed" };
};

/**
 * Determines text color for operating status
 */
export const getOperatingHoursTextColor = (hours) => {
  const formatted = formatOperatingHours(hours);
  if (!formatted) return "text-gray-500";

  switch (formatted.status) {
    case "open": return "text-green-600 font-medium";
    case "closed": return "text-red-600";
    default: return "text-gray-500";
  }
};


/**
 * Checks if pharmacy is currently open
 * @param {Array} hours - Array of { dayOfWeek, openTime, closeTime }
 * @returns {boolean}
 */
export const isPharmacyOpenNow = (hours) => {
  const formatted = formatOperatingHours(hours);
  return formatted?.status === "open";
};