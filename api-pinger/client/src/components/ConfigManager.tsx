import { useState, useEffect } from 'react';
import { 
  loadConfigStore, 
  getActiveConfig, 
  setActiveConfig, 
  renameConfig, 
  deleteConfig, 
  duplicateConfig,
  type StoredConfig 
} from '../lib/configManager';

interface ConfigManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: () => void;
}

export default function ConfigManager({ isOpen, onClose, onConfigChange }: ConfigManagerProps) {
  const [configs, setConfigs] = useState<StoredConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [newConfigName, setNewConfigName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Chargement des configurations
  useEffect(() => {
    if (isOpen) {
      const store = loadConfigStore();
      setConfigs(store.configs);
      setActiveConfigId(store.activeConfigId);
      setEditingConfigId(null);
      setConfirmDelete(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Activer une configuration
  const handleActivateConfig = (id: string) => {
    if (setActiveConfig(id)) {
      setActiveConfigId(id);
      onConfigChange();
    }
  };

  // Début de l'édition du nom
  const handleStartRename = (id: string, currentName: string) => {
    setEditingConfigId(id);
    setNewConfigName(currentName);
  };

  // Enregistrer le nouveau nom
  const handleSaveRename = (id: string) => {
    if (newConfigName.trim() !== '') {
      if (renameConfig(id, newConfigName.trim())) {
        const store = loadConfigStore();
        setConfigs(store.configs);
      }
    }
    setEditingConfigId(null);
  };

  // Dupliquer une configuration
  const handleDuplicate = (id: string) => {
    const result = duplicateConfig(id);
    if (result) {
      const store = loadConfigStore();
      setConfigs(store.configs);
    }
  };

  // Confirmer la suppression
  const handleConfirmDelete = (id: string) => {
    setConfirmDelete(id);
  };

  // Annuler la suppression
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  // Supprimer une configuration
  const handleDelete = (id: string) => {
    if (deleteConfig(id)) {
      const store = loadConfigStore();
      setConfigs(store.configs);
      setActiveConfigId(store.activeConfigId);
      
      if (id === activeConfigId) {
        onConfigChange();
      }
    }
    setConfirmDelete(null);
  };

  // Formater la date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Gérer les configurations API
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>Aucune configuration disponible.</p>
            <p className="mt-2">Utilisez le bouton "Import Config" pour ajouter une configuration.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                  <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Nom</th>
                  <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Dernière modification</th>
                  <th className="px-4 py-2 text-right text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => (
                  <tr
                    key={config.id}
                    className={`border-b border-slate-200 dark:border-slate-700 ${
                      config.id === activeConfigId
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {editingConfigId === config.id ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                          value={newConfigName}
                          onChange={(e) => setNewConfigName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(config.id);
                            if (e.key === 'Escape') setEditingConfigId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center">
                          {config.id === activeConfigId && (
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          )}
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {config.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                      {formatDate(config.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmDelete === config.id ? (
                        <div className="flex justify-end items-center space-x-2">
                          <span className="text-sm text-red-600 dark:text-red-400">Confirmer?</span>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            Oui
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded"
                          >
                            Non
                          </button>
                        </div>
                      ) : editingConfigId === config.id ? (
                        <button
                          onClick={() => handleSaveRename(config.id)}
                          className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          Enregistrer
                        </button>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          {config.id !== activeConfigId ? (
                            <button
                              onClick={() => handleActivateConfig(config.id)}
                              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1"
                              title="Activer cette configuration"
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3" 
                                fill="none" 
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Activer</span>
                            </button>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md flex items-center gap-1">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3" 
                                fill="none" 
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Active</span>
                            </span>
                          )}
                          <button
                            onClick={() => handleStartRename(config.id, config.name)}
                            className="p-1 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                            title="Renommer"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              fill="none" 
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDuplicate(config.id)}
                            className="p-1 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                            title="Dupliquer"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              fill="none" 
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(config.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Supprimer"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              fill="none" 
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}