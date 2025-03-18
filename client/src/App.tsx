import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Nav } from "@/components/ui/nav";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme-provider";
import NotFound from "@/pages/not-found";
import BlogIndex from "@/pages/blog";
import BlogPost from "@/pages/blog/[id]";
import AdminManage from "@/pages/admin/manage";
import AdminComments from "@/pages/admin/comments";
import EditPost from "@/pages/admin/edit";
import AuthPage from "@/pages/auth";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Redirect to="/auth" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Switch>
          <Route path="/" component={BlogIndex} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/blog/id/:id" component={BlogPost} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/admin/manage">
            <ProtectedRoute component={AdminManage} />
          </Route>
          <Route path="/admin/comments">
            <ProtectedRoute component={AdminComments} />
          </Route>
          <Route path="/admin/edit">
            <ProtectedRoute component={EditPost} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;