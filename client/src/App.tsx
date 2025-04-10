import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import SalonDetails from "@/pages/salon-details";
import BookingPage from "@/pages/booking-page";
import AppointmentsPage from "@/pages/appointments-page";
import ProfilePage from "@/pages/profile-page";
import OwnerDashboard from "@/pages/owner/dashboard";
import OwnerServices from "@/pages/owner/services";
import OwnerAppointments from "@/pages/owner/appointments";
import OwnerSalonProfile from "@/pages/owner/salon-profile";
import { ProtectedRoute } from "./lib/protected-route";

function App() {
  return (
    <>
      {/* Auth page is a special case - always accessible but with internal redirect logic */}
      <Route path="/auth" component={AuthPage} />
      
      <Switch>
        {/* Customer Routes */}
        <ProtectedRoute 
          path="/" 
          component={HomePage}
          role="customer"
        />
        <ProtectedRoute 
          path="/salon/:id" 
          component={SalonDetails}
          role="customer"
        />
        <ProtectedRoute 
          path="/booking/:salonId" 
          component={BookingPage}
          role="customer"
        />
        <ProtectedRoute 
          path="/appointments" 
          component={AppointmentsPage}
          role="customer"
        />
        <ProtectedRoute 
          path="/profile" 
          component={ProfilePage}
          role="customer"
        />
        
        {/* Salon Owner Routes */}
        <ProtectedRoute 
          path="/owner/dashboard" 
          component={OwnerDashboard}
          role="salon_owner"
        />
        <ProtectedRoute 
          path="/owner/services" 
          component={OwnerServices}
          role="salon_owner"
        />
        <ProtectedRoute 
          path="/owner/appointments" 
          component={OwnerAppointments}
          role="salon_owner"
        />
        <ProtectedRoute 
          path="/owner/profile" 
          component={OwnerSalonProfile}
          role="salon_owner"
        />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
