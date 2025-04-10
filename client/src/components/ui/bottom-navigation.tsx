import { Link, useLocation } from "wouter";

interface BottomNavigationProps {
  userType: string;
}

export function BottomNavigation({ userType }: BottomNavigationProps) {
  const [location] = useLocation();
  
  if (userType === "salon_owner") {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-2 py-1.5 flex justify-around max-w-md mx-auto">
        <NavItem 
          to="/owner/dashboard" 
          icon="dashboard" 
          label="لوحة التحكم"
          active={location === "/owner/dashboard"}
        />
        <NavItem 
          to="/owner/appointments" 
          icon="calendar_month" 
          label="الحجوزات"
          active={location === "/owner/appointments"}
        />
        <NavItem 
          to="/owner/services" 
          icon="spa" 
          label="الخدمات"
          active={location === "/owner/services"}
        />
        <NavItem 
          to="/owner/profile" 
          icon="storefront" 
          label="الصالون"
          active={location === "/owner/profile"}
        />
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-2 py-1.5 flex justify-around max-w-md mx-auto">
      <NavItem 
        to="/" 
        icon="home" 
        label="الرئيسية"
        active={location === "/"}
      />
      <NavItem 
        to="/explore" 
        icon="explore" 
        label="اكتشفي"
        active={location === "/explore"}
      />
      <NavItem 
        to="/appointments" 
        icon="calendar_month" 
        label="حجوزاتي"
        active={location === "/appointments"}
      />
      <NavItem 
        to="/profile" 
        icon="person" 
        label="حسابي"
        active={location === "/profile"}
      />
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  active: boolean;
}

function NavItem({ to, icon, label, active }: NavItemProps) {
  return (
    <Link href={to} className={`flex flex-col items-center py-1 px-3 ${active ? 'text-primary' : 'text-neutral-400'}`}>
      <span className="material-icons text-xl">{icon}</span>
      <span className="text-xs mt-0.5">{label}</span>
    </Link>
  );
}
