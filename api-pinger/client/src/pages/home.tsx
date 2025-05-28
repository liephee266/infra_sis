import { useState, useEffect } from 'react';
import ServerConfigModal from '../components/ServerConfigModal';
import ConfigManager from '../components/ConfigManager';
import ImportConfigDialog from '../components/ImportConfigDialog';
import { loadConfigStore, getActiveConfig, addConfig, setActiveConfig } from '../lib/configManager';

interface Category {
  name: string;
  description: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);
  const [configTitle, setConfigTitle] = useState<string>('API Documentation');
  
  // États pour la boîte de dialogue d'import
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [suggestedConfigName, setSuggestedConfigName] = useState('');

  const loadConfigFromStore = () => {
    setLoading(true);
    try {
      // Récupérer la configuration active depuis le gestionnaire
      const activeConfig = getActiveConfig();
      
      if (activeConfig) {
        // Si une configuration active existe, utiliser celle-là
        setCategories(activeConfig.config.categories || []);
        setConfigTitle(activeConfig.config.title || 'API Documentation');
      } else {
        // Sinon, charger depuis l'API
        loadConfigFromServer();
        return;
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError("Failed to load API configuration");
      console.error(err);
    }
  };
  
  const loadConfigFromServer = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      
      setCategories(data.categories || []);
      setConfigTitle(data.title || 'API Documentation');
      setLoading(false);
      
      // Si aucune configuration n'existe, ajoutons celle-ci au store
      const store = loadConfigStore();
      if (store.configs.length === 0) {
        addConfig('Default Configuration', data);
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to load API documentation from server");
      console.error(err);
    }
  };

  // Fonction pour gérer le choix d'une configuration importée
  const handleSaveImportedConfig = (name: string, setActive: boolean) => {
    if (!pendingImportData) return;
    
    try {
      // Ajouter la configuration au gestionnaire
      const newConfig = addConfig(name, pendingImportData);
      
      // Définir comme active si demandé
      if (setActive && newConfig) {
        setActiveConfig(newConfig.id);
      }
      
      setMessage({
        type: 'success',
        text: 'API configuration imported successfully'
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      // Recharger les données depuis le store pour afficher la nouvelle configuration si elle est active
      if (setActive) {
        loadConfigFromStore();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save imported configuration'
      });
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } finally {
      // Réinitialiser les états
      setPendingImportData(null);
      setIsImportDialogOpen(false);
    }
  };
  
  // Fonction pour annuler l'import
  const handleCancelImport = () => {
    setPendingImportData(null);
    setIsImportDialogOpen(false);
  };
  
  // Handle file import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Read the file
      const fileContent = await readFileAsText(file);
      
      // Validate JSON format and parse configuration
      let configData;
      try {
        configData = JSON.parse(fileContent);
      } catch (err) {
        throw new Error('Invalid JSON format');
      }
      
      // Upload the configuration to the server as well
      const formData = new FormData();
      formData.append('config', file);
      
      const response = await fetch('/api/config/import', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import configuration on server');
      }
      
      // Créer un nom suggéré basé sur le titre et la date
      const suggestedName = configData.title 
        ? `${configData.title} (${new Date().toLocaleDateString()})`
        : `Configuration importée (${new Date().toLocaleDateString()})`;
      
      // Stocker les données et le nom suggéré
      setPendingImportData(configData);
      setSuggestedConfigName(suggestedName);
      
      // Ouvrir la boîte de dialogue
      setIsImportDialogOpen(true);
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import configuration'
      });
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } finally {
      setIsUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };
  
  // Handle export
  const handleExportConfig = async () => {
    try {
      const response = await fetch('/api/config/export');
      
      if (!response.ok) {
        throw new Error('Failed to export configuration');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'api-config.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({
        type: 'success',
        text: 'API configuration exported successfully'
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to export configuration'
      });
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  };
  
  // Helper function to read a file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  useEffect(() => {
    loadConfigFromStore();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-xl mb-4">Error</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Lumia(Client API)</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <a 
                  href="/" 
                  className="px-3 py-2 text-slate-700 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors"
                >
                  Accueil
                </a>
              </li>
              <li>
                <a 
                  href="/custom-request" 
                  className="px-3 py-2 text-slate-700 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors"
                >
                  API personnalisé (Hors configuration)
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {/* Title and Buttons Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 md:mb-0">API Categories</h2>
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            {/* Import Button */}
            <button 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              onClick={() => document.getElementById('config-file-input')?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="w-5 h-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Import Config</span>
                </>
              )}
            </button>
            
            {/* Hidden file input */}
            <input
              type="file"
              id="config-file-input"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Export Button */}
            <button
              onClick={handleExportConfig}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-md transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export Config</span>
            </button>
            
            {/* Config Manager Button */}
            <button
              onClick={() => setIsConfigManagerOpen(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Manage Configs</span>
            </button>
            
            {/* Server Config Button */}
            <button
              onClick={() => setIsServerConfigOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Server Config</span>
            </button>
          </div>
        </div>
        
        {/* Status message */}
        {message && (
          <div className={`mb-6 px-4 py-2 rounded-md transition-opacity ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">{category.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{category.description}</p>
              <div className="mt-4">
                <a 
                  href={`/category/${category.name.toLowerCase()}`} 
                  className="inline-block text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
                >
                  View Endpoints →
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="container mx-auto text-center text-sm text-slate-500 dark:text-slate-400">
          Lumia(Client API) - Documentation and Testing Tool
        </div>
      </footer>
      
      {/* Server Configuration Modal */}
      <ServerConfigModal 
        isOpen={isServerConfigOpen} 
        onClose={() => setIsServerConfigOpen(false)} 
      />
      
      {/* Configuration Manager Modal */}
      <ConfigManager
        isOpen={isConfigManagerOpen}
        onClose={() => setIsConfigManagerOpen(false)}
        onConfigChange={() => loadConfigFromStore()}
      />
      
      {/* Import Configuration Dialog */}
      <ImportConfigDialog
        isOpen={isImportDialogOpen}
        onClose={handleCancelImport}
        onSave={handleSaveImportedConfig}
        defaultName={suggestedConfigName}
      />
    </div>
  );
}