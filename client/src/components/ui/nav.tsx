import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export function Nav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {settings?.blogName || "My Blog"}
              </span>
            </Link>
          </div>
          <div className="flex gap-6">
            <Link href="/">
              <span className={`hover:text-primary transition-colors ${
                location === "/" ? "text-primary font-medium" : "text-muted-foreground"
              }`}>
                Blog
              </span>
            </Link>
            <Link href="/admin/manage">
              <span className={`hover:text-primary transition-colors ${
                location.startsWith("/admin") ? "text-primary font-medium" : "text-muted-foreground"
              }`}>
                Admin
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}