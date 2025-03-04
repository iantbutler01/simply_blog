import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Nav } from "@/components/ui/nav";
import NotFound from "@/pages/not-found";
import BlogIndex from "@/pages/blog";
import BlogPost from "@/pages/blog/[id]";
import AdminPosts from "@/pages/admin/posts";
import EditPost from "@/pages/admin/edit";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Switch>
          <Route path="/" component={BlogIndex} />
          <Route path="/blog/:id" component={BlogPost} />
          <Route path="/admin/posts" component={AdminPosts} />
          <Route path="/admin/edit" component={EditPost} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;