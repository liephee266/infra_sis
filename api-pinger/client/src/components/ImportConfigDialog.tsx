import { useState, useEffect } from 'react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, setActive: boolean) => void;
  defaultName: string;
}

export default function ImportConfigDialog({ 
  isOpen, 
  onClose, 
  onSave,
  defaultName 
}: ImportDialogProps) {
  const [configName, setConfigName] = useState(defaultName);
  const [setAsActive, setSetAsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setConfigName(defaultName);
      setSetAsActive(true);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (configName.trim() === '') return;
    onSave(configName.trim(), setAsActive);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Importer une configuration
        </h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="config-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nom de la configuration
            </label>
            <input
              id="config-name"
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800"
              placeholder="Entrez un nom pour cette configuration"
              autoFocus
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="set-active"
              type="checkbox"
              checked={setAsActive}
              onChange={(e) => setSetAsActive(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="set-active" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
              Définir comme configuration active
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-md"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={configName.trim() === ''}
            className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50"
          >
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}