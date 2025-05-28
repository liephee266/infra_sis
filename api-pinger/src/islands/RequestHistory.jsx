import { useState, useEffect } from 'react';
import { formatDistanceToNow } from '../utils/formatDate';

export default function RequestHistory() {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    loadHistory();
    
    // Listen for history updates
    window.addEventListener('historyUpdated', loadHistory);
    
    return () => {
      window.removeEventListener('historyUpdated', loadHistory);
    };
  }, []);

  const loadHistory = () => {
    try {
      const historyJson = localStorage.getItem('api-tester-history');
      if (historyJson) {
        const parsedHistory = JSON.parse(historyJson);
        setHistory(parsedHistory);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem('api-tester-history');
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const toggleHistory = () => {
    setIsOpen(!isOpen);
  };

  // Get method class for styling
  const getMethodClass = (method) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': case 'PATCH': return 'method-put';
      case 'DELETE': return 'method-delete';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  // Get status class for styling
  const getStatusClass = (status) => {
    if (!status) return '';
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 400) return 'status-error';
    return 'status-info';
  };

  // Get brief parameter summary for display
  const getParamSummary = (params) => {
    if (!params) return '';
    
    try {
      const entries = Object.entries(params);
      if (entries.length === 0) return '';
      
      // Show first param and ellipsis if more exist
      const [key, value] = entries[0];
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const summary = `${key}: ${valueStr.slice(0, 15)}${valueStr.length > 15 ? '...' : ''}`;
      
      return entries.length > 1 ? `${summary}, ...` : summary;
    } catch (err) {
      return '';
    }
  };

  // Load a history item into the current form
  const loadHistoryItem = (item) => {
    if (!item || !item.route) return;
    
    // Navigate to the route page
    window.location.href = `/?route=${item.route.id}`;
    
    // Close the history panel
    setIsOpen(false);
  };

  return (
    <>
      {/* History button in sidebar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button 
          id="history-toggle"
          onClick={toggleHistory}
          className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Request History
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* History panel */}
      <div id="history-panel" className={`fixed inset-0 z-20 overflow-hidden ${isOpen ? '' : 'hidden'}`} aria-labelledby="history-title" role="dialog" aria-modal="true">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-slate-500 bg-opacity-75 dark:bg-slate-900 dark:bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="relative w-screen max-w-md">
              <div className="h-full flex flex-col bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h2 id="history-title" className="text-lg font-medium text-slate-900 dark:text-slate-100">Request History</h2>
                  <button 
                    type="button" 
                    className="rounded-md text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="sr-only">Close panel</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 py-2 px-4">
                  {history.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No request history yet</p>
                      <p className="text-sm mt-2">Try making some API requests!</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div 
                        key={item.id}
                        className="border-b border-slate-200 dark:border-slate-700 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 -mx-4 px-4"
                        onClick={() => loadHistoryItem(item)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${getMethodClass(item.route.method)} mr-2`}>
                              {item.route.method}
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                              {item.route.path}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDistanceToNow(item.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                          {item.status && (
                            <span className={`${getStatusClass(item.status)} text-xs px-1.5 py-0.5 rounded mr-2`}>
                              {item.status}
                            </span>
                          )}
                          <span className="truncate max-w-[240px]">{getParamSummary(item.params)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                  <button 
                    type="button"
                    onClick={clearHistory}
                    className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
