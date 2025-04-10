import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  role
}: {
  path: string;
  component: () => React.JSX.Element;
  role?: "customer" | "salon_owner";
}) {
  const ProtectedContent = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return <Redirect to="/auth" />;
    }

    if (role && user.userType !== role) {
      // If user is a customer trying to access salon owner routes
      if (user.userType === "customer" && role === "salon_owner") {
        return <Redirect to="/" />;
      }
      
      // If user is a salon owner trying to access customer routes
      if (user.userType === "salon_owner" && role === "customer") {
        return <Redirect to="/owner/dashboard" />;
      }
    }

    return <Component />;
  };

  return <Route path={path} component={ProtectedContent} />;
}
