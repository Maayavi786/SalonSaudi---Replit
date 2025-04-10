import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SalonCard } from "@/components/ui/salon-card";
import { ServiceCategoriesGrid } from "@/components/ui/service-category";
import { OfferCard } from "@/components/ui/offer-card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ServiceCategory, Salon, SpecialOffer, Appointment } from "@/types";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch service categories
  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });
  
  // Fetch salons
  const { data: salons = [] } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
  });
  
  // Fetch special offers
  const { data: specialOffers = [] } = useQuery<SpecialOffer[]>({
    queryKey: ['/api/special-offers'],
  });
  
  // Fetch user appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    enabled: !!user,
  });
  
  // Filter upcoming appointments
  const upcomingAppointments = appointments.filter(
    appointment => ['pending', 'confirmed'].includes(appointment.status)
  );
  
  return (
    <MainLayout
      showHeader
      showNavigation
    >
      {/* Home Header */}
      <div className="bg-primary py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-icons text-white">person</span>
          </div>
          <div>
            <p className="text-white text-sm opacity-80">مرحباً بك</p>
            <h3 className="text-white font-bold">{user?.fullName}</h3>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-3 bg-primary-light shadow-md">
        <div className="relative">
          <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
          <input 
            type="text" 
            placeholder="ابحثي عن صالون أو خدمة..." 
            className="w-full py-2 pr-10 pl-4 rounded-full bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Featured Salons */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-almarai font-bold text-lg">صالونات مميزة</h2>
            <Link href="/explore" className="text-primary text-sm">عرض الكل</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {salons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} type="featured" />
            ))}
          </div>
        </section>
        
        {/* Service Categories */}
        <section className="mb-8">
          <h2 className="font-almarai font-bold text-lg mb-3">تصفحي حسب الخدمة</h2>
          <ServiceCategoriesGrid 
            categories={categories}
            onCategoryClick={(category) => {
              console.log("Category clicked:", category);
              // TODO: Navigate to category filter page
            }}
          />
        </section>
        
        {/* Special Offers */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-almarai font-bold text-lg">عروض خاصة</h2>
            <a href="#" className="text-primary text-sm">عرض الكل</a>
          </div>
          
          <div className="space-y-3">
            {specialOffers.map((offer) => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                onClick={() => {
                  console.log("Offer clicked:", offer);
                  // TODO: Navigate to salon with this offer
                }}
              />
            ))}
          </div>
        </section>
        
        {/* Upcoming Appointments */}
        <section className="mb-6">
          <h2 className="font-almarai font-bold text-lg mb-3">حجوزاتك القادمة</h2>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {/* Show first upcoming appointment */}
                {/* TODO: Implement appointment card */}
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons text-primary">calendar_today</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">لا توجد حجوزات قادمة</h3>
                    <p className="text-xs text-neutral-500">ابحثي عن خدمة واحجزي الآن</p>
                  </div>
                </div>
                <Link href="/explore">
                  <button className="bg-primary text-white text-xs rounded-full px-3 py-1.5">
                    احجزي الآن
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
