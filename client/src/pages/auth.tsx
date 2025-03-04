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
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-8 max-w-md">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in with your Replit account to access the admin dashboard.
        </p>
        <Button onClick={handleLogin} size="lg" className="w-full">
          Sign in with Replit
        </Button>
      </div>
    </div>
  );
}
