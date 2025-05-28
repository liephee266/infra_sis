/**
 * Utility for managing API server configuration
 * This allows storing and retrieving the API server address from localStorage
 */

// Default config - empty string means use the current host
const DEFAULT_CONFIG = {
  serverUrl: '',
  useCustomServer: false,
};

// LocalStorage key
const STORAGE_KEY = 'api-tester-server-config';

export interface ApiServerConfig {
  serverUrl: string;
  useCustomServer: boolean;
}

/**
 * Save API server configuration to localStorage
 */
export function saveApiServerConfig(config: ApiServerConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Load API server configuration from localStorage
 * Returns default config if none is found
 */
export function loadApiServerConfig(): ApiServerConfig {
  try {
    const storedConfig = localStorage.getItem(STORAGE_KEY);
    if (!storedConfig) return DEFAULT_CONFIG;
    
    return JSON.parse(storedConfig) as ApiServerConfig;
  } catch (error) {
    console.error('Failed to load API server config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Reset API server configuration to default
 */
export function resetApiServerConfig(): void {
  saveApiServerConfig(DEFAULT_CONFIG);
}

/**
 * Get the fully qualified URL for an API endpoint
 * @param endpoint The API endpoint path (e.g., "/api/users")
 * @returns The complete URL including the server address if custom server is enabled
 */
export function getApiUrl(endpoint: string): string {
  const config = loadApiServerConfig();
  
  if (!config.useCustomServer || !config.serverUrl) {
    return endpoint; // Use relative URL
  }
  
  // Ensure the serverUrl doesn't end with a slash and the endpoint starts with one
  const baseUrl = config.serverUrl.endsWith('/') 
    ? config.serverUrl.slice(0, -1) 
    : config.serverUrl;
    
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${path}`;
}