import { useState, useEffect } from 'react';
import { loadApiServerConfig, saveApiServerConfig } from '../lib/apiServerConfig';
import type { ApiServerConfig } from '../lib/apiServerConfig';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerConfigModal({ isOpen, onClose }: ServerConfigModalProps) {
  const [config, setConfig] = useState<ApiServerConfig>(loadApiServerConfig());
  const [testStatus, setTestStatus] = useState<{success: boolean; message: string} | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reload config when modal opens
      setConfig(loadApiServerConfig());
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiServerConfig(config);
    onClose();

    // Force page reload to apply new configuration
    window.location.reload();
  };

  const handleTestConnection = async () => {
    if (!config.serverUrl) {
      setTestStatus({ success: false, message: 'Please enter a server URL' });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);

    try {
      // Format the URL correctly
      let url = config.serverUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }
      
      // Add a test endpoint - assuming /api/config is available on the target server
      const normalizeUrl = (url: string) => url.replace(/\/+$/, '') + '/';
      url = normalizeUrl(url);
      console.log('Testing connection to:', url);
      const response = await fetch(url, { 
        method: 'GET',
        // Set a short timeout to avoid long waits on unreachable servers
        // signal: AbortSignal.timeout(5000) 
        // console.log('Testing connection to:', url);
      });
      console.log('Response:', response);
      if (response.ok) {
        setTestStatus({ success: true, message: 'Connection successful! Server is reachable.' });
      } else {
        setTestStatus({ 
          success: false, 
          message: `Server responded with error: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      setTestStatus({ 
        success: false, 
        message: error instanceof Error 
          ? `Connection failed: ${error.message}` 
          : 'Connection failed: Unknown error' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          API Server Configuration
        </h2>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              id="use-custom-server"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              checked={config.useCustomServer}
              onChange={e => setConfig({ ...config, useCustomServer: e.target.checked })}
            />
            <label htmlFor="use-custom-server" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
              Use custom API server
            </label>
          </div>
          
          {config.useCustomServer && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Server URL or IP Address
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="https://api.example.com or 192.168.1.100:8080"
                  value={config.serverUrl}
                  onChange={e => setConfig({ ...config, serverUrl: e.target.value })}
                />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter the full domain or IP address (including http:// or https://)
                </p>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.serverUrl}
                  className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md disabled:opacity-50"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                
                {testStatus && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    testStatus.success 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {testStatus.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}