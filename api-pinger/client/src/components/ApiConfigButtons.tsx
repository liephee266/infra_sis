import { useState } from 'react';

interface ApiConfigButtonsProps {
  onImportSuccess: () => void;
}

export default function ApiConfigButtons({ onImportSuccess }: ApiConfigButtonsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Read the file
      const fileContent = await readFileAsText(file);
      
      // Validate JSON format
      try {
        JSON.parse(fileContent);
      } catch (err) {
        throw new Error('Invalid JSON format');
      }
      
      // Upload the configuration
      const formData = new FormData();
      formData.append('config', file);
      
      const response = await fetch('/api/config/import', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import configuration');
      }
      
      setMessage({
        type: 'success',
        text: 'API configuration imported successfully'
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      onImportSuccess();
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
  
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex justify-center gap-4">
        <div className="relative">
          <input
            type="file"
            id="config-file-input"
            accept=".json"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <label
            htmlFor="config-file-input"
            className="cursor-pointer flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
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
          </label>
        </div>
        
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
      </div>
      
      {/* Message component */}
      {message && (
        <div className={`mt-2 px-4 py-2 rounded-md transition-opacity ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}