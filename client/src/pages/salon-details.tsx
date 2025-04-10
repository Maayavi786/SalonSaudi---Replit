import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Salon, Service } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Star } from "lucide-react";

export default function SalonDetails() {
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = useState("services");
  
  // Fetch salon details
  const { 
    data: salon,
    isLoading: isLoadingSalon
  } = useQuery<Salon>({
    queryKey: [`/api/salons/${id}`],
  });
  
  // Fetch salon services
  const { 
    data: services = [],
    isLoading: isLoadingServices
  } = useQuery<Service[]>({
    queryKey: [`/api/salons/${id}/services`],
    enabled: !!id,
  });
  
  if (isLoadingSalon) {
    return (
      <MainLayout showHeader={false}>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (!salon) {
    return (
      <MainLayout title="صالون غير موجود" showBackButton>
        <div className="p-4 text-center">
          <p>عذراً، لم يتم العثور على هذا الصالون.</p>
          <Link href="/">
            <button className="mt-4 bg-primary text-white px-4 py-2 rounded-lg">
              العودة للرئيسية
            </button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  // Group services by category
  const servicesByCategory: Record<number, Service[]> = {};
  services.forEach(service => {
    if (!servicesByCategory[service.categoryId]) {
      servicesByCategory[service.categoryId] = [];
    }
    servicesByCategory[service.categoryId].push(service);
  });
  
  return (
    <MainLayout showHeader={false} showNavigation>
      {/* Salon Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-3">
          <button 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 text-white"
            onClick={() => window.history.back()}
          >
            <span className="material-icons rtl-flip">arrow_back</span>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 text-white">
            <span className="material-icons">favorite_border</span>
          </button>
        </div>
        <img 
          src={salon.coverImageUrl || "https://images.unsplash.com/photo-1633681926022-84c23e8cb3af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
          className="w-full h-56 object-cover" 
          alt={salon.name} 
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <div className="flex items-center">
            {salon.isFemaleOnly && (
              <span className="bg-accent text-white text-xs py-0.5 px-2 rounded-full ml-2">صالون نسائي</span>
            )}
            <div className="flex items-center text-xs">
              <span className="material-icons text-amber-400 text-xs">star</span>
              <span className="mx-0.5">{salon.rating || "0.0"}</span>
              <span className="opacity-80">({salon.reviewCount || 0} تقييم)</span>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-1 font-almarai">{salon.name}</h1>
          <div className="flex items-center text-xs mt-1">
            <span className="material-icons text-xs">location_on</span>
            <span>{salon.district}, {salon.city}</span>
          </div>
        </div>
      </div>
      
      {/* Salon Info */}
      <div className="p-4">
        <div className="flex gap-4 mb-6">
          <Link href={`/booking/${salon.id}`}>
            <button className="flex-1 bg-primary text-white py-2.5 rounded-lg text-center font-bold text-sm">
              احجزي موعد
            </button>
          </Link>
          <a 
            href={`tel:${salon.phone}`}
            className="w-12 h-12 flex items-center justify-center border border-primary text-primary rounded-lg"
          >
            <span className="material-icons">call</span>
          </a>
        </div>
        
        <div className="bg-neutral-50 p-3 rounded-lg mb-6">
          <h3 className="font-bold mb-2">نبذة عن الصالون</h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {salon.description || "لا يوجد وصف متاح لهذا الصالون."}
          </p>
        </div>
        
        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="services">الخدمات</TabsTrigger>
            <TabsTrigger value="photos">الصور</TabsTrigger>
            <TabsTrigger value="reviews">التقييمات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services">
            {isLoadingServices ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(servicesByCategory).map(([categoryId, services]) => (
                  <div key={categoryId}>
                    <h3 className="font-bold font-almarai text-primary mb-3">
                      {services[0]?.categoryName || "خدمات"}
                    </h3>
                    {services.map(service => (
                      <ServiceCard 
                        key={service.id} 
                        service={service} 
                        onClick={() => console.log("Service selected", service)}
                      />
                    ))}
                  </div>
                ))}
                
                {services.length === 0 && (
                  <div className="text-center p-4">
                    <p className="text-neutral-500">لا توجد خدمات متاحة حالياً</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="photos">
            <div className="text-center p-4">
              <p className="text-neutral-500">لا توجد صور متاحة حالياً</p>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="text-center p-4">
              <p className="text-neutral-500">لا توجد تقييمات متاحة حالياً</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface ServiceCardProps {
  service: Service;
  onClick: () => void;
}

function ServiceCard({ service, onClick }: ServiceCardProps) {
  const { name, description, price, durationMinutes, femaleStaffOnly } = service;
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-neutral-100 mb-3">
      <div className="flex justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm mb-1">{name}</h4>
            {femaleStaffOnly && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                موظفات فقط
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mb-2">{description}</p>
          <div className="flex items-center">
            <span className="text-sm font-bold">{price} ريال</span>
            <span className="mx-2 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
              {durationMinutes} دقيقة
            </span>
          </div>
        </div>
        <button 
          className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center self-center"
          onClick={onClick}
        >
          <span className="material-icons">add</span>
        </button>
      </div>
    </div>
  );
}
