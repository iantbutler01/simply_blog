import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/admin/posts");
    }
  }, [user, isLoading, navigate]);

  const handleLogin = () => {
    // Replit's auth needs a full page reload
    window.location.href = "/__repl_auth/login";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in with your Replit account to access the admin dashboard.
          </p>
        </div>

        <Button 
          onClick={handleLogin} 
          size="lg" 
          className="w-full py-6 text-lg"
        >
          Sign in with Replit
        </Button>
      </div>
    </div>
  );
}