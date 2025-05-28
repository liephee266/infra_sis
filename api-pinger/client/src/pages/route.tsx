import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import apiConfig from '../config/api.json';
// import 'dotenv/config';



interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  inPath?: boolean;
}

interface Route {
  id: string;
  path: string;
  method: string;
  description: string;
  params: Param[];
  responseExample?: any;
}

interface ApiConfig {
  title: string;
  description: string;
  categories: {
    name: string;
    description: string;
    routes: Route[];
  }[];
}

export default function RouteTestPage() {
  // Get route ID from URL
  const [, params] = useRoute('/route/:id');
  const routeId = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  
  // Get the method class for styling
  const getMethodClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'POST': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'PUT': case 'PATCH': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'DELETE': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };
  
  // Load route data
  useEffect(() => {
    const loadRouteData = async () => {
      try {
        setLoading(true);
        
        // Fetch API config
        const response = await fetch('/api/config');
        const apiConfig: ApiConfig = await response.json();
        
        // Find route by ID
        let foundRoute: Route | null = null;
        
        for (const category of apiConfig.categories) {
          const routeMatch = category.routes.find(r => r.id === routeId);
          if (routeMatch) {
            foundRoute = routeMatch;
            break;
          }
        }
        
        if (foundRoute) {
          setRoute(foundRoute);
          
          // Initialize form values
          const initialValues: Record<string, string> = {};
          foundRoute.params.forEach(param => {
            initialValues[param.name] = '';
          });
          setFormValues(initialValues);
        } else {
          setError(`Endpoint with ID "${routeId}" not found`);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load API configuration');
        setLoading(false);
      }
    };
    
    if (routeId) {
      loadRouteData();
    } else {
      setError('No endpoint ID specified');
      setLoading(false);
    }
  }, [routeId]);
  
  // Handle input change
  const handleInputChange = (paramName: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };
  
  // État pour stocker l'URL complète de l'API
  const [fullApiUrl, setFullApiUrl] = useState<string>('');
  
  // Base URL de l'API importée depuis le fichier de configuration
  const API_BASE_URL = apiConfig.API_BASE_URL;
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!route) return;
    
    try {
      setRequestStatus('loading');
      setApiResponse(null);
      
      // Prepare the path with path parameters replaced
      let finalPath = route.path;
      const pathParams = route.params.filter(p => p.inPath);
      
      // Replace path parameters in the URL
      pathParams.forEach(param => {
        finalPath = finalPath.replace(`{${param.name}}`, formValues[param.name]);
      });
      
      // Mettre à jour l'URL complète
      setFullApiUrl(API_BASE_URL + finalPath);
      
      // Get body parameters (non-path params)
      const bodyParams = route.params.filter(p => !p.inPath);
      const bodyData: Record<string, any> = {};
      
      bodyParams.forEach(param => {
        // Skip empty optional parameters
        if (formValues[param.name] || param.required) {
          // Convert to appropriate type
          switch (param.type) {
            case 'number':
              bodyData[param.name] = Number(formValues[param.name]);
              break;
            case 'boolean':
              bodyData[param.name] = formValues[param.name] === 'true';
              break;
            default:
              bodyData[param.name] = formValues[param.name];
          }
        }
      });
      
      // Determine whether to include a body based on the HTTP method
      const hasRequestBody = route.method !== 'GET' && route.method !== 'DELETE';
      
      // Make the API request
      const response = await fetch(API_BASE_URL + finalPath, {
        method: route.method,
        headers: hasRequestBody ? { 'Content-Type': 'application/json' } : undefined,
        body: hasRequestBody ? JSON.stringify(bodyData) : undefined,
      });
      
      const responseData = await response.text();
      let formattedResponse;
      
      try {
        // Try to parse as JSON for pretty formatting
        const jsonData = JSON.parse(responseData);
        formattedResponse = JSON.stringify(jsonData, null, 2);
      } catch {
        // If not JSON, use as-is
        formattedResponse = responseData;
      }
      
      setApiResponse(formattedResponse);
      setRequestStatus(response.ok ? 'success' : 'error');
    } catch (err) {
      setRequestStatus('error');
      setApiResponse(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
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
        <a href="/" className="mt-4 text-primary-600 dark:text-primary-400 hover:underline">
          Return to Home
        </a>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Lumia(Client API)</h1>
          <div className="space-x-4">
            <a href="/" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400">
              Acceuil
            </a>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {route && (
          <>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${getMethodClass(route.method)} mr-3`}>
                  {route.method}
                </span>
                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  {route.path}
                </code>
              </div>
              <div className="mt-2 mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL complète de l'API:</label>
                <div className="flex">
                  <input 
                    type="text" 
                    value={fullApiUrl || (API_BASE_URL + route.path)}
                    onChange={(e) => setFullApiUrl(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm font-mono text-sm"
                  />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                {route.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">Request Parameters</h3>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      {route.params.map((param) => (
                        <div key={param.name} className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              {param.name} 
                              {param.inPath && <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">path</span>}
                            </span>
                            {param.required && (
                              <span className="text-xs text-red-500">Required</span>
                            )}
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {param.description} ({param.type})
                          </p>
                          {param.type === 'boolean' ? (
                            <select
                              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              value={formValues[param.name]}
                              onChange={(e) => handleInputChange(param.name, e.target.value)}
                              required={param.required}
                            >
                              <option value="">Select</option>
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <input
                              type={param.type === 'number' ? 'number' : 'text'}
                              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              value={formValues[param.name]}
                              onChange={(e) => handleInputChange(param.name, e.target.value)}
                              placeholder={`Enter ${param.name}`}
                              required={param.required}
                            />
                          )}
                        </div>
                      ))}
                      
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
                          disabled={requestStatus === 'loading'}
                        >
                          {requestStatus === 'loading' ? 'Sending Request...' : 'Send Request'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                
                {route.responseExample && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">Example Response</h3>
                    <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-md text-sm overflow-x-auto font-mono">
                      {JSON.stringify(route.responseExample, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">Response</h3>
                
                {apiResponse ? (
                  <div>
                    <div className={`mb-3 px-3 py-2 rounded-md text-sm ${
                      requestStatus === 'success' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {requestStatus === 'success' ? 'Request successful' : 'Request failed'}
                    </div>
                    <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-md text-sm overflow-x-auto font-mono">
                      {apiResponse}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    {requestStatus === 'loading' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                      </div>
                    ) : (
                      <p>Submit the request to see the response here</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="container mx-auto text-center text-sm text-slate-500 dark:text-slate-400">
          Lumia(Client API) - Documentation and Testing Tool
        </div>
      </footer>
    </div>
  );
}