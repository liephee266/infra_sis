import { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/apiServerConfig';

interface RequestHistory {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  statusCode?: number;
}

interface RequestTab {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  contentType: string;
  requestBody: string;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const CONTENT_TYPES = [
  { value: 'application/json', label: 'JSON (application/json)' },
  { value: 'application/x-www-form-urlencoded', label: 'Form URL Encoded (application/x-www-form-urlencoded)' },
  { value: 'multipart/form-data', label: 'Form Data (multipart/form-data)' },
  { value: 'text/plain', label: 'Plain Text (text/plain)' }
];

export default function CustomRequestPage() {
  // État des onglets
  const [tabs, setTabs] = useState<RequestTab[]>([{
    id: '1',
    name: 'Requête 1',
    url: '',
    method: 'GET',
    headers: [{ key: '', value: '' }],
    contentType: 'application/json',
    requestBody: ''
  }]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  
  // Charger les onglets sauvegardés au démarrage
  useEffect(() => {
    const savedTabs = localStorage.getItem('api-tester-tabs');
    const savedActiveTabId = localStorage.getItem('api-tester-active-tab');
    
    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs);
        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
          setTabs(parsedTabs);
          
          if (savedActiveTabId && parsedTabs.some(tab => tab.id === savedActiveTabId)) {
            setActiveTabId(savedActiveTabId);
          } else {
            setActiveTabId(parsedTabs[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved tabs', e);
      }
    }
  }, []);
  
  // Sauvegarder les onglets à chaque changement
  useEffect(() => {
    localStorage.setItem('api-tester-tabs', JSON.stringify(tabs));
    localStorage.setItem('api-tester-active-tab', activeTabId);
  }, [tabs, activeTabId]);
  
  // État de la requête active
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<number | null>(null);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  // Trouver l'onglet actif
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  
  // Raccourcis pour les valeurs de l'onglet actif
  const url = activeTab.url;
  const method = activeTab.method;
  const headers = activeTab.headers;
  const contentType = activeTab.contentType;
  const requestBody = activeTab.requestBody;

  // Charger l'historique des requêtes au démarrage
  useEffect(() => {
    const savedHistory = localStorage.getItem('api-tester-request-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse request history', e);
      }
    }
  }, []);

  // Sauvegarder l'historique des requêtes
  const saveHistory = (newHistory: RequestHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem('api-tester-request-history', JSON.stringify(newHistory));
  };

  // Ajouter une requête à l'historique
  const addToHistory = (url: string, method: string, statusCode?: number) => {
    const newItem: RequestHistory = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      method,
      timestamp: Date.now(),
      statusCode,
    };

    const newHistory = [newItem, ...history].slice(0, 20); // Garder les 20 dernières requêtes
    saveHistory(newHistory);
  };

  // Formater la date relative (par ex. "il y a 3 minutes")
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffSeconds < 60) return 'à l\'instant';
    if (diffSeconds < 3600) return `il y a ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `il y a ${Math.floor(diffSeconds / 3600)} h`;
    return `il y a ${Math.floor(diffSeconds / 86400)} j`;
  };

  // Formater la taille en KB, MB, etc.
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Fonctions de gestion des onglets
  const updateTabValue = (tabId: string, field: keyof RequestTab, value: any) => {
    setTabs(tabs.map(tab => {
      if (tab.id === tabId) {
        return { ...tab, [field]: value };
      }
      return tab;
    }));
  };

  // Créer un nouvel onglet
  const addNewTab = () => {
    const newTabId = Date.now().toString();
    const newTabName = `Requête ${tabs.length + 1}`;
    
    setTabs([...tabs, {
      id: newTabId,
      name: newTabName,
      url: '',
      method: 'GET',
      headers: [{ key: '', value: '' }],
      contentType: 'application/json',
      requestBody: ''
    }]);
    
    setActiveTabId(newTabId);
  };

  // Supprimer un onglet
  const removeTab = (tabId: string) => {
    if (tabs.length <= 1) return; // Garder au moins un onglet
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // Si on supprime l'onglet actif, activer le premier onglet restant
    if (tabId === activeTabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  // Renommer un onglet
  const renameTab = (tabId: string, newName: string) => {
    setTabs(tabs.map(tab => {
      if (tab.id === tabId) {
        return { ...tab, name: newName };
      }
      return tab;
    }));
  };

  // Ajouter ou supprimer un champ d'en-tête
  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    updateTabValue(activeTabId, 'headers', newHeaders);
  };

  const addHeader = () => {
    updateTabValue(activeTabId, 'headers', [...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    if (headers.length > 1) {
      const newHeaders = headers.filter((_, i) => i !== index);
      updateTabValue(activeTabId, 'headers', newHeaders);
    }
  };

  // Charger une requête depuis l'historique
  const loadFromHistory = (item: RequestHistory) => {
    updateTabValue(activeTabId, 'url', item.url);
    updateTabValue(activeTabId, 'method', item.method);
    setShowHistory(false);
  };

  // Effacer l'historique
  const clearHistory = () => {
    saveHistory([]);
    setShowHistory(false);
  };

  // Formater le corps de la requête en JSON
  const formatBody = (body: string): string => {
    if (!body) return '';
    
    if (contentType === 'application/json') {
      try {
        const obj = JSON.parse(body);
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return body;
      }
    }
    
    return body;
  };

  // Envoyer la requête
  const sendRequest = async () => {
    if (!url) {
      setError('Veuillez entrer une URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
    setResponseSize(null);

    const startTime = performance.now();
    
    try {
      // Construire les en-têtes de la requête
      const requestHeaders: Record<string, string> = {};
      headers.forEach(({ key, value }) => {
        if (key && value) {
          requestHeaders[key] = value;
        }
      });

      // Ajouter le Content-Type si nécessaire
      if (['POST', 'PUT', 'PATCH'].includes(method) && contentType) {
        requestHeaders['Content-Type'] = contentType;
      }

      // Préparer le corps de la requête
      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
        if (contentType === 'application/json') {
          try {
            body = JSON.parse(requestBody);
            body = JSON.stringify(body);
          } catch (e) {
            body = requestBody;
          }
        } else {
          body = requestBody;
        }
      }

      // Déterminer l'URL complète en utilisant la configuration du serveur
      const fullUrl = url.startsWith('http') ? url : getApiUrl(url);

      // Envoyer la requête
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body,
        // credentials: 'include',
      });

      const endTime = performance.now();
      setResponseTime(endTime - startTime);

      // Récupérer la réponse
      let responseData;
      const responseContentType = response.headers.get('content-type');
      
      if (responseContentType && responseContentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      setStatusCode(response.status);
      setResponse(responseData);

      // Estimer la taille de la réponse
      const responseText = JSON.stringify(responseData);
      setResponseSize(new Blob([responseText]).size);

      // Ajouter à l'historique
      addToHistory(url, method, response.status);

    } catch (error) {
      console.error('Request error:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la requête');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm dark:from-primary/5 dark:to-secondary/5 border-b border-slate-200/80 dark:border-slate-700/80 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            <a href="/">Lumia(Client API)</a>
          </h1>
          <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            API personnalisé (Hors configuration)
          </span>
        </div>
      </header>
      
      {/* Barre d'onglets */}
      <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <div 
                key={tab.id} 
                className={`group flex items-center px-4 py-3 border-b-2 cursor-pointer ${activeTabId === tab.id 
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 font-medium' 
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                {editingTabName === tab.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim()) {
                        renameTab(tab.id, editingName.trim());
                      }
                      setEditingTabName(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (editingName.trim()) {
                          renameTab(tab.id, editingName.trim());
                        }
                        setEditingTabName(null);
                      }
                    }}
                    className="bg-transparent border border-slate-300 dark:border-slate-600 rounded px-1 py-0 w-32 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="truncate max-w-xs">{tab.name}</span>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingTabName(tab.id);
                        setEditingName(tab.name);
                      }}
                      className="ml-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hidden group-hover:block"
                    >
                      ✎
                    </button>
                  </>
                )}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                    className="ml-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hidden group-hover:block"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addNewTab}
              className="flex items-center justify-center min-w-[2.5rem] px-3 py-3 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
              <span className="text-xl font-medium">+</span>
            </button>
          </div>
        </div>
      </div>
      
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requête */}
          <div className="glass-card rounded-lg shadow-md p-5 hover-lift">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Requête</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm px-3 py-1 bg-gradient-to-r from-secondary/70 to-secondary/90 hover:from-secondary/90 hover:to-secondary text-white dark:text-white rounded-md shadow-sm hover:shadow transition-all"
                >
                  Historique {history.length > 0 && `(${history.length})`}
                </button>
              </div>
            </div>
            
            {/* Historique des requêtes */}
            {showHistory && (
              <div className="mb-4 bg-slate-50 dark:bg-slate-900 rounded-md p-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium bg-gradient-to-r from-secondary/90 to-accent/80 bg-clip-text text-transparent">Requêtes récentes</h3>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs px-2 py-1 bg-gradient-to-r from-red-500/70 to-red-500/80 hover:from-red-500/80 hover:to-red-500/90 text-white dark:text-white rounded shadow-sm hover:shadow transition-all"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aucune requête dans l'historique</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="flex items-center p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <span className={`px-2 py-0.5 rounded text-xs font-mono mr-2 ${
                          item.method === 'GET' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          item.method === 'POST' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                          item.method === 'PUT' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          item.method === 'DELETE' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                        }`}>
                          {item.method}
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 truncate flex-1">
                          {item.url}
                        </span>
                        {item.statusCode && (
                          <span className={`px-2 py-0.5 ml-2 rounded text-xs ${
                            item.statusCode >= 200 && item.statusCode < 300 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {item.statusCode}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* URL & Méthode */}
            <div className="mb-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold mb-1 bg-gradient-to-r from-secondary/80 to-accent/80 bg-clip-text text-transparent">
                    Méthode
                  </label>
                  <select
                    value={method}
                    onChange={(e) => updateTabValue(activeTabId, 'method', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {HTTP_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-semibold mb-1 bg-gradient-to-r from-secondary/80 to-accent/80 bg-clip-text text-transparent">
                    URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateTabValue(activeTabId, 'url', e.target.value)}
                    placeholder="https://api.example.com/endpoint ou /api/endpoint"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Vous pouvez utiliser une URL absolue ou un chemin relatif (utilisant la configuration du serveur)
                  </p>
                </div>
              </div>
            </div>
            
            {/* En-têtes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold bg-gradient-to-r from-secondary/80 to-accent/80 bg-clip-text text-transparent">
                  En-têtes (Headers)
                </label>
                <button
                  onClick={addHeader}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-accent/80 to-accent/90 hover:from-accent/90 hover:to-accent text-white dark:text-white rounded shadow-sm hover:shadow transition-all"
                >
                  + Ajouter
                </button>
              </div>
              
              {headers.map((header, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    placeholder="Nom"
                    className="w-1/3 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    placeholder="Valeur"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                  <button
                    onClick={() => removeHeader(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {/* Corps de la requête */}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold bg-gradient-to-r from-secondary/80 to-accent/80 bg-clip-text text-transparent">
                    Corps de la requête
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => updateTabValue(activeTabId, 'contentType', e.target.value)}
                    className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {CONTENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="relative">
                  <textarea
                    value={requestBody}
                    onChange={(e) => updateTabValue(activeTabId, 'requestBody', e.target.value)}
                    onBlur={() => updateTabValue(activeTabId, 'requestBody', formatBody(requestBody))}
                    placeholder={contentType === 'application/json' ? '{\n  "key": "value"\n}' : 'Corps de la requête...'}
                    className="w-full h-40 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm"
                  />
                  
                  {/* Bouton de formatage du JSON */}
                  {contentType === 'application/json' && requestBody && (
                    <button
                      onClick={() => updateTabValue(activeTabId, 'requestBody', formatBody(requestBody))}
                      className="absolute top-2 right-2 px-2 py-1 text-xs bg-gradient-to-r from-accent/70 to-accent/80 hover:from-accent/80 hover:to-accent text-white dark:text-white rounded-md shadow-sm hover:shadow transition-all"
                    >
                      Format
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Bouton d'envoi */}
            <div className="flex justify-end">
              <button
                onClick={sendRequest}
                disabled={isLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer la requête'
                )}
              </button>
            </div>
          </div>
          
          {/* Réponse */}
          <div className="glass-card rounded-lg shadow-md p-5 hover-lift">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">Réponse</h2>
            
            {/* Message d'erreur */}
            {error && (
              <div className="mb-4 p-3 bg-gradient-to-r from-red-100/90 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-800 dark:text-red-300 rounded-md shadow-sm border border-red-200/50 dark:border-red-800/30">
                <div className="font-medium">Erreur</div>
                <div className="text-sm">{error}</div>
              </div>
            )}
            
            {/* Infos de la réponse */}
            {statusCode !== null && (
              <div className="mb-4 flex flex-wrap gap-2">
                <div className={`px-3 py-1.5 rounded-md flex items-center text-sm shadow-sm ${
                  statusCode >= 200 && statusCode < 300 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : statusCode >= 400 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  <span className="font-mono font-bold">Status: {statusCode}</span>
                </div>
                
                {responseTime !== null && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100/80 to-slate-100 dark:from-slate-700/80 dark:to-slate-700 text-slate-800 dark:text-slate-300 rounded-md text-sm shadow-sm">
                    Temps: {Math.round(responseTime)}ms
                  </div>
                )}
                
                {responseSize !== null && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100/80 to-slate-100 dark:from-slate-700/80 dark:to-slate-700 text-slate-800 dark:text-slate-300 rounded-md text-sm shadow-sm">
                    Taille: {formatSize(responseSize)}
                  </div>
                )}
              </div>
            )}
            
            {/* Corps de la réponse */}
            {response !== null && (
              <div>
                <div className="mb-2 font-medium bg-gradient-to-r from-accent/90 to-accent/70 bg-clip-text text-transparent">Corps de la réponse</div>
                <div className="overflow-auto p-3 bg-slate-50/90 dark:bg-slate-900/90 rounded-md border border-slate-200/70 dark:border-slate-700/70 shadow-inner max-h-[500px]">
                  <pre className="text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {typeof response === 'object' 
                      ? JSON.stringify(response, null, 2)
                      : response}
                  </pre>
                </div>
              </div>
            )}
            
            {/* État initial */}
            {!error && statusCode === null && !isLoading && (
              <div className="text-center p-8 rounded-lg bg-gradient-to-b from-slate-50/50 to-white/30 dark:from-slate-900/50 dark:to-slate-800/30 shadow-inner border border-slate-200/20 dark:border-slate-700/20">
                <div className="text-6xl mb-5 opacity-80 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">✉️</div>
                <div className="text-xl font-semibold mb-3 bg-gradient-to-r from-primary/90 to-secondary/90 bg-clip-text text-transparent">Envoyez une requête pour voir les résultats</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Utilisez le formulaire à gauche pour configurer et envoyer une requête API et visualiser la réponse ici
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-gradient-to-t from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border-t border-slate-200/30 dark:border-slate-700/30 p-6">
        <div className="container mx-auto text-center">
          <div className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Lumia(Client API)</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Documentation and Testing Tool for Modern APIs
          </div>
        </div>
      </footer>
    </div>
  );
}