/**
 * Utility functions for pharmacy-related operations
 */

/**
 * Formats operating hours for display
 * @param {string} hours - The operating hours string
 * @returns {object|null} - Formatted hours object with text and status, or null if invalid
 */
export const formatOperatingHours = (hours) => {
  if (!hours) return null;
  
  // Handle common formats
  if (hours.includes('24/7') || hours.includes('24 hours')) {
    return { text: 'Open 24/7', status: 'open' };
  }
  
  if (hours.includes('Closed') || hours.includes('Temporarily closed')) {
    return { text: hours, status: 'closed' };
  }
  
  // For regular hours, just return as is for now
  return { text: hours, status: 'unknown' };
};

/**
 * Checks if a pharmacy is currently open based on operating hours
 * @param {string} hours - The operating hours string
 * @returns {boolean|null} - True if open, false if closed, null if unknown
 */
export const isPharmacyOpen = (hours) => {
  if (!hours) return null;
  
  const formatted = formatOperatingHours(hours);
  if (formatted?.status === 'open') return true;
  if (formatted?.status === 'closed') return false;
  
  // For regular hours, we'd need to parse the time format
  // This is a placeholder for future implementation
  return null;
};

/**
 * Gets the status color for operating hours
 * @param {string} hours - The operating hours string
 * @returns {string} - CSS color class
 */
export const getOperatingHoursColor = (hours) => {
  const formatted = formatOperatingHours(hours);
  if (!formatted) return 'text-gray-400';
  
  switch (formatted.status) {
    case 'open':
      return 'text-green-500';
    case 'closed':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
};

/**
 * Gets the text color for operating hours
 * @param {string} hours - The operating hours string
 * @returns {string} - CSS color class
 */
export const getOperatingHoursTextColor = (hours) => {
  const formatted = formatOperatingHours(hours);
  if (!formatted) return 'text-gray-500';
  
  switch (formatted.status) {
    case 'open':
      return 'text-green-600 font-medium';
    case 'closed':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}; 