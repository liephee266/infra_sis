/**
 * Utility functions for working with localStorage
 */

// Save environment settings
export function saveEnvironments(environments) {
  try {
    localStorage.setItem('api-tester-environments', JSON.stringify(environments));
    return true;
  } catch (err) {
    console.error('Error saving environments:', err);
    return false;
  }
}

// Load environment settings
export function loadEnvironments() {
  try {
    const data = localStorage.getItem('api-tester-environments');
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading environments:', err);
    return null;
  }
}

// Save current environment
export function saveCurrentEnvironment(environment) {
  try {
    localStorage.setItem('api-tester-current-environment', environment);
    return true;
  } catch (err) {
    console.error('Error saving current environment:', err);
    return false;
  }
}

// Load current environment
export function loadCurrentEnvironment() {
  try {
    return localStorage.getItem('api-tester-current-environment') || 'dev';
  } catch (err) {
    console.error('Error loading current environment:', err);
    return 'dev';
  }
}

// Save request history
export function saveRequestHistory(history) {
  try {
    localStorage.setItem('api-tester-history', JSON.stringify(history));
    return true;
  } catch (err) {
    console.error('Error saving request history:', err);
    return false;
  }
}

// Load request history
export function loadRequestHistory() {
  try {
    const data = localStorage.getItem('api-tester-history');
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading request history:', err);
    return [];
  }
}

// Add item to request history (keeping only the latest 20)
export function addToRequestHistory(item) {
  try {
    const history = loadRequestHistory();
    
    // Add new item at the beginning
    history.unshift({
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...item
    });
    
    // Limit to 20 items
    if (history.length > 20) {
      history.length = 20;
    }
    
    saveRequestHistory(history);
    return true;
  } catch (err) {
    console.error('Error adding to request history:', err);
    return false;
  }
}

// Clear request history
export function clearRequestHistory() {
  try {
    localStorage.removeItem('api-tester-history');
    return true;
  } catch (err) {
    console.error('Error clearing request history:', err);
    return false;
  }
}
