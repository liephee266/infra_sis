import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';

interface Route {
  id: string;
  path: string;
  method: string;
  description: string;
  params: any[];
  responseExample?: any;
}

interface Category {
  name: string;
  description: string;
  routes: Route[];
}

interface ApiConfig {
  title: string;
  description: string;
  categories: Category[];
}

export default function CategoryPage() {
  // Get category name from URL
  const [, params] = useRoute('/category/:name');
  const categoryName = params?.name;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  
  useEffect(() => {
    const loadApiConfig = async () => {
      try {
        // In a real implementation, we would fetch this from an API endpoint
        // For now, we'll simulate loading with a timeout
        setLoading(true);
        
        // Simulate API call
        setTimeout(async () => {
          try {
            // Mock API response - in a real implementation, this would come from a fetch call
            const response = await fetch('/api/config');
            const apiConfig: ApiConfig = await response.json();
            
            const foundCategory = apiConfig.categories.find(
              c => c.name.toLowerCase() === categoryName?.toLowerCase()
            );
            
            if (foundCategory) {
              setCategory(foundCategory);
            } else {
              setError(`Category "${categoryName}" not found`);
            }
            
            setLoading(false);
          } catch (err) {
            setError('Failed to load API configuration');
            setLoading(false);
          }
        }, 800);
      } catch (err) {
        setError('Failed to load API configuration');
        setLoading(false);
      }
    };
    
    if (categoryName) {
      loadApiConfig();
    } else {
      setError('No category specified');
      setLoading(false);
    }
  }, [categoryName]);
  
  // Function to get appropriate method class for styling
  const getMethodClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'POST': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'PUT': case 'PATCH': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'DELETE': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
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
          <a href="/" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400">
            Home
          </a>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {category && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{category.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{category.description}</p>
            </div>
            
            <div className="space-y-6">
              {category.routes.map((route) => (
                <div 
                  key={route.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${getMethodClass(route.method)} mr-3`}>
                        {route.method}
                      </span>
                      <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {route.path}
                      </code>
                    </div>
                    <a 
                      href={`/route/${route.id}`}
                      className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
                    >
                      Test Endpoint →
                    </a>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                      {route.description}
                    </p>
                    
                    {route.params.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Parameters</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Required</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {route.params.map((param, index) => (
                                <tr key={index}>
                                  <td className="px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-300 align-top">{param.name}</td>
                                  <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 align-top">{param.type}</td>
                                  <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 align-top">
                                    {param.required ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                        Yes
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">
                                        No
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 align-top">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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