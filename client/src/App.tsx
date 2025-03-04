import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Nav } from "@/components/ui/nav";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import BlogIndex from "@/pages/blog";
import BlogPost from "@/pages/blog/[id]";
import AdminPosts from "@/pages/admin/posts";
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
          <Route path="/blog/:id" component={BlogPost} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/admin/posts">
            <ProtectedRoute component={AdminPosts} />
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;