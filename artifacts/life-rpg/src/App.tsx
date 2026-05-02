import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Shell from "@/components/layout/Shell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Quests from "@/pages/Quests";
import Health from "@/pages/Health";
import Finances from "@/pages/Finances";
import Shop from "@/pages/Shop";
import Inventory from "@/pages/Inventory";
import GroupQuests from "@/pages/GroupQuests";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Entering the Kingdom...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/quests" component={Quests} />
        <Route path="/health" component={Health} />
        <Route path="/finances" component={Finances} />
        <Route path="/shop" component={Shop} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/group-quests" component={GroupQuests} />
        <Route path="/profile" component={Profile} />
        {user.role === "admin" && <Route path="/admin" component={Admin} />}
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
