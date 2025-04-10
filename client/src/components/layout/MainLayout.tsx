import React from "react";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showBackButton?: boolean;
  showNavigation?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  headerClassName?: string;
}

export function MainLayout({
  children,
  title,
  showHeader = true,
  showBackButton = false,
  showNavigation = true,
  onBack,
  headerRight,
  headerClassName = "bg-primary",
}: MainLayoutProps) {
  const { user } = useAuth();
  const isCustomer = user?.userType === "customer";
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {showHeader && (
        <header className={`py-4 px-4 flex items-center ${headerClassName}`}>
          {showBackButton && (
            <button 
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white ml-2"
            >
              <span className="material-icons rtl-flip">arrow_back</span>
            </button>
          )}
          
          {title && (
            <h1 className="font-almarai font-bold text-lg text-white flex-1">
              {title}
            </h1>
          )}
          
          {headerRight || (
            <div className="flex gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white">
                <span className="material-icons text-sm">notifications</span>
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white">
                <span className="material-icons text-sm">language</span>
              </button>
            </div>
          )}
        </header>
      )}
      
      <main className="pb-16">
        {children}
      </main>
      
      {showNavigation && (
        <BottomNavigation
          userType={user?.userType || "customer"}
        />
      )}
    </div>
  );
}
