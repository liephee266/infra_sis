import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import CategoryPage from "./pages/category";
import RouteTestPage from "./pages/route";
import CustomRequestPage from "./pages/custom-request";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home}/>
      <Route path="/category/:name" component={CategoryPage}/>
      <Route path="/route/:id" component={RouteTestPage}/>
      <Route path="/custom-request" component={CustomRequestPage}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
