
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useParentRegistration } from "@/hooks/useParentRegistration";
import { Layout } from "@/components/Layout";

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Events from "@/pages/events";
import RecordPerformance from "@/pages/record-performance";
import Attendance from "@/pages/attendance";
import Reports from "@/pages/reports";
import ParentInvites from "@/pages/parent-invites";
import ParentJoin from "@/pages/parent-join";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isCompleting } = useParentRegistration();

  if (isLoading || isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 bg-primary rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isCompleting ? "Completing registration..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/students" component={Students} />
              <Route path="/events" component={Events} />
              <Route path="/events/:eventId/record">
                {(params) => <RecordPerformance eventId={params.eventId} />}
              </Route>
              <Route path="/attendance" component={Attendance} />
              <Route path="/reports" component={Reports} />
              <Route path="/parent-invites" component={ParentInvites} />
            </Switch>
          </Layout>
        </>
      )}
      
      {/* Public routes (no layout) */}
      <Route path="/parent-join" component={ParentJoin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
