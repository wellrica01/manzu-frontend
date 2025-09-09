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
  const today = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.toTimeString().slice(0,5); // HH:mm (24h)

  const todayHours = hours.find(h => h.dayOfWeek === today);

  // Handle 24/7 case
  if (hours.length === 7 && hours.every(h => h.openTime === "00:00" && h.closeTime === "23:59")) {
    return { text: "Open 24/7", status: "open" };
  }

  if (!todayHours) {
    return { text: `Closed today`, status: "closed" };
  }

  if (currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime) {
    return { 
      text: `Open now until ${formatTo12Hour(todayHours.closeTime)}`, 
      status: "open" 
    };
  }

  // Find next opening day
  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7;
    const nextHours = hours.find(h => h.dayOfWeek === nextDay);
    if (nextHours) {
      return {
        text: `Closed, opens ${days[nextDay]} at ${formatTo12Hour(nextHours.openTime)}`,
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

