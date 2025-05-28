import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';

function Select({id, label, options, value, onChange}) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}:</label>
      <select 
        id={id} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

// Component for displaying response
function ResponseDisplay({ isLoading, response, error, status }) {
  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 102 0V9a1 1 0 10-2 0zm0-4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Request Error</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format JSON for display
  const formatJson = (json) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  return (
    <div>
      {response && status && (
        <div className="bg-slate-800 rounded-md overflow-hidden">
          <pre className="p-4 text-xs leading-relaxed overflow-x-auto">
            <code>{formatJson(response)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function getStatusClass(status) {
  if (!status) return '';
  if (status >= 200 && status < 300) return 'status-success';
  if (status >= 400) return 'status-error';
  return 'status-info';
}

export default function RequestTester({ method, path, params, route }) {
  // Environment state
  const [environments, setEnvironments] = useState([
    { value: 'dev', label: 'Development', baseUrl: import.meta.env.DEV_API_URL || 'https://api-dev.example.com' },
    { value: 'prod', label: 'Production', baseUrl: import.meta.env.PROD_API_URL || 'https://api.example.com' }
  ]);
  const [environment, setEnvironment] = useState('dev');

  // Form state
  const [formValues, setFormValues] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const formRef = useRef(null);

  // Initialize form values from params
  useEffect(() => {
    const initialValues = {};
    if (params && Array.isArray(params)) {
      params.forEach(param => {
        // Set default values based on type
        if (!param.inPath) {
          switch (param.type) {
            case 'string':
              initialValues[param.name] = '';
              break;
            case 'number':
              initialValues[param.name] = '';
              break;
            case 'boolean':
              initialValues[param.name] = false;
              break;
            default:
              initialValues[param.name] = '';
          }
        }
      });
    }
    setFormValues(initialValues);
  }, [params]);

  // Add environment selector to DOM
  useEffect(() => {
    // Create environment selector
    const envContainer = document.getElementById('env-container');
    if (envContainer) {
      envContainer.innerHTML = '';
      const selectWrapper = document.createElement('div');
      selectWrapper.className = 'flex items-center space-x-2';
      
      const label = document.createElement('label');
      label.htmlFor = 'environment';
      label.className = 'text-sm font-medium text-slate-700 dark:text-slate-300';
      label.textContent = 'Environment:';
      
      const select = document.createElement('select');
      select.id = 'environment';
      select.className = 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400';
      
      environments.forEach(env => {
        const option = document.createElement('option');
        option.value = env.value;
        option.textContent = env.label;
        if (env.value === environment) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      
      select.addEventListener('change', (e) => {
        setEnvironment(e.target.value);
      });
      
      selectWrapper.appendChild(label);
      selectWrapper.appendChild(select);
      envContainer.appendChild(selectWrapper);
    }
  }, [environment, environments]);

  // Handle form input changes
  const handleInputChange = (name, value) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Replace path parameters in URL
  const getProcessedPath = () => {
    let processedPath = path;
    const pathParams = params.filter(p => p.inPath);
    
    pathParams.forEach(param => {
      const value = formValues[param.name] || param.name;
      processedPath = processedPath.replace(`{${param.name}}`, value);
    });
    
    return processedPath;
  };

  // Get full URL with query parameters for GET requests
  const getFullUrl = () => {
    const baseUrl = environments.find(e => e.value === environment)?.baseUrl || '';
    const processedPath = getProcessedPath();
    
    if (method.toUpperCase() === 'GET') {
      // Add query parameters
      const queryParams = new URLSearchParams();
      const nonPathParams = params.filter(p => !p.inPath);
      
      nonPathParams.forEach(param => {
        const value = formValues[param.name];
        if (value !== undefined && value !== '') {
          queryParams.append(param.name, value);
        }
      });
      
      const queryString = queryParams.toString();
      return `${baseUrl}${processedPath}${queryString ? `?${queryString}` : ''}`;
    }
    
    return `${baseUrl}${processedPath}`;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStatus(null);
    
    try {
      const url = getFullUrl();
      const options = {
        method: method.toUpperCase(),
        headers: {
          'Accept': 'application/json'
        }
      };
      
      // Add request body for non-GET methods
      if (method.toUpperCase() !== 'GET') {
        const nonPathParams = params.filter(p => !p.inPath);
        const bodyData = {};
        
        nonPathParams.forEach(param => {
          const value = formValues[param.name];
          if (value !== undefined && value !== '') {
            bodyData[param.name] = value;
          }
        });
        
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(bodyData);
      }
      
      // Make the request
      const response = await fetch(url, options);
      const status = response.status;
      setStatus(status);
      
      // Parse the response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      setResponse(data);

      // Save to history
      saveToHistory({
        route,
        params: formValues,
        environment,
        status,
        response: data,
      });
      
    } catch (err) {
      setError(err.message || 'An error occurred while making the request');
    } finally {
      setIsLoading(false);
    }
  };

  // Save request to history in localStorage
  const saveToHistory = (historyItem) => {
    try {
      // Get existing history
      const historyJson = localStorage.getItem('api-tester-history');
      let history = historyJson ? JSON.parse(historyJson) : [];
      
      // Add new item
      const newItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...historyItem
      };
      
      // Add to beginning of array
      history.unshift(newItem);
      
      // Limit to 20 items
      if (history.length > 20) {
        history = history.slice(0, 20);
      }
      
      // Save back to localStorage
      localStorage.setItem('api-tester-history', JSON.stringify(history));
      
      // Dispatch custom event to notify RequestHistory component
      window.dispatchEvent(new CustomEvent('historyUpdated'));
      
    } catch (err) {
      console.error('Error saving to history:', err);
    }
  };

  // Determine input type based on parameter type
  const getInputType = (param) => {
    switch (param.type) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'checkbox';
      case 'password':
        return 'password';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Test Request</h3>
        </div>
        <div className="p-5">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {params && params.filter(p => !p.inPath).map((param) => (
                <div key={param.name}>
                  {param.type === 'boolean' ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`param-${param.name}`}
                        name={param.name}
                        checked={!!formValues[param.name]}
                        onChange={(e) => handleInputChange(param.name, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                      />
                      <label
                        htmlFor={`param-${param.name}`}
                        className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
                      >
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor={`param-${param.name}`}
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={getInputType(param)}
                        id={`param-${param.name}`}
                        name={param.name}
                        value={formValues[param.name] || ''}
                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                        required={param.required}
                        aria-required={param.required}
                        aria-label={param.description}
                        title={param.description}
                      />
                      {param.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {param.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Response</h3>
          {status && (
            <div className="flex items-center">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
                {status} {status >= 200 && status < 300 ? 'OK' : 'Error'}
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <ResponseDisplay
            isLoading={isLoading}
            response={response}
            error={error}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}
