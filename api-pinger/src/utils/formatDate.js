/**
 * Simplified version of date-fns formatDistanceToNow
 * Returns a string representing the distance from now
 * 
 * @param {number} timestamp - The timestamp to format
 * @returns {string} A string representing the distance from now (e.g. "2 min ago")
 */
export function formatDistanceToNow(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Convert to days
  const days = Math.floor(hours / 24);
  
  if (days < 30) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Convert to months
  const months = Math.floor(days / 30);
  
  if (months < 12) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  // Convert to years
  const years = Math.floor(months / 12);
  
  return `${years} year${years > 1 ? 's' : ''} ago`;
}
