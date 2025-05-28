/**
 * Gestionnaire de configurations multiples pour l'application Lumia(Client API)
 * Permet de sauvegarder, charger et basculer entre différentes configurations API
 */

// Types
export interface ApiConfig {
  title: string;
  description: string;
  categories: {
    name: string;
    description: string;
    routes: Array<{
      id: string;
      path: string;
      method: string;
      description: string;
      params: any[];
      responseExample?: any;
    }>;
  }[];
}

export interface StoredConfig {
  id: string;
  name: string;
  config: ApiConfig;
  createdAt: number;
  updatedAt: number;
}

export interface ConfigStore {
  configs: StoredConfig[];
  activeConfigId: string | null;
}

// Constantes
const STORAGE_KEY = 'api-tester-config-store';
const DEFAULT_STORE: ConfigStore = {
  configs: [],
  activeConfigId: null
};

/**
 * Génère un ID unique
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Charge le store de configurations depuis localStorage
 */
export function loadConfigStore(): ConfigStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STORE;
    
    return JSON.parse(stored) as ConfigStore;
  } catch (error) {
    console.error('Failed to load configuration store:', error);
    return DEFAULT_STORE;
  }
}

/**
 * Sauvegarde le store de configurations dans localStorage
 */
export function saveConfigStore(store: ConfigStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Récupère la configuration active
 */
export function getActiveConfig(): StoredConfig | null {
  const store = loadConfigStore();
  
  if (!store.activeConfigId || store.configs.length === 0) {
    return null;
  }
  
  return store.configs.find(c => c.id === store.activeConfigId) || null;
}

/**
 * Ajoute une nouvelle configuration au store
 */
export function addConfig(name: string, config: ApiConfig): StoredConfig {
  const store = loadConfigStore();
  const now = Date.now();
  
  const newConfig: StoredConfig = {
    id: generateId(),
    name,
    config,
    createdAt: now,
    updatedAt: now
  };
  
  store.configs.push(newConfig);
  
  // Si c'est la première configuration, on la définit comme active
  if (!store.activeConfigId) {
    store.activeConfigId = newConfig.id;
  }
  
  saveConfigStore(store);
  
  return newConfig;
}

/**
 * Met à jour une configuration existante
 */
export function updateConfig(id: string, updates: Partial<StoredConfig>): StoredConfig | null {
  const store = loadConfigStore();
  const configIndex = store.configs.findIndex(c => c.id === id);
  
  if (configIndex === -1) {
    return null;
  }
  
  const updatedConfig = {
    ...store.configs[configIndex],
    ...updates,
    updatedAt: Date.now()
  };
  
  store.configs[configIndex] = updatedConfig;
  saveConfigStore(store);
  
  return updatedConfig;
}

/**
 * Définit une configuration comme active
 */
export function setActiveConfig(id: string): boolean {
  const store = loadConfigStore();
  
  if (!store.configs.some(c => c.id === id)) {
    return false;
  }
  
  store.activeConfigId = id;
  saveConfigStore(store);
  
  return true;
}

/**
 * Supprime une configuration
 */
export function deleteConfig(id: string): boolean {
  const store = loadConfigStore();
  const configIndex = store.configs.findIndex(c => c.id === id);
  
  if (configIndex === -1) {
    return false;
  }
  
  store.configs.splice(configIndex, 1);
  
  // Si la configuration supprimée était active, on sélectionne la première disponible
  if (store.activeConfigId === id) {
    store.activeConfigId = store.configs.length > 0 ? store.configs[0].id : null;
  }
  
  saveConfigStore(store);
  
  return true;
}

/**
 * Renomme une configuration
 */
export function renameConfig(id: string, newName: string): boolean {
  const store = loadConfigStore();
  const configIndex = store.configs.findIndex(c => c.id === id);
  
  if (configIndex === -1) {
    return false;
  }
  
  store.configs[configIndex].name = newName;
  store.configs[configIndex].updatedAt = Date.now();
  
  saveConfigStore(store);
  
  return true;
}

/**
 * Duplique une configuration
 */
export function duplicateConfig(id: string, newName?: string): StoredConfig | null {
  const store = loadConfigStore();
  const sourceConfig = store.configs.find(c => c.id === id);
  
  if (!sourceConfig) {
    return null;
  }
  
  const name = newName || `${sourceConfig.name} (Copy)`;
  const now = Date.now();
  
  const newConfig: StoredConfig = {
    id: generateId(),
    name,
    config: JSON.parse(JSON.stringify(sourceConfig.config)),
    createdAt: now,
    updatedAt: now
  };
  
  store.configs.push(newConfig);
  saveConfigStore(store);
  
  return newConfig;
}