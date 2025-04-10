import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Appointment, Salon, SalonStats } from "@/types";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null);
  
  // Fetch salons owned by the user
  const {
    data: salons = [],
    isLoading: isLoadingSalons
  } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    select: (data) => data.filter(salon => salon.ownerId === user?.id)
  });
  
  // Set selected salon when salons are loaded
  useEffect(() => {
    if (salons.length > 0 && !selectedSalonId) {
      setSelectedSalonId(salons[0].id);
    }
  }, [salons, selectedSalonId]);
  
  // Fetch appointments for selected salon
  const {
    data: appointments = [],
    isLoading: isLoadingAppointments
  } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    enabled: !!selectedSalonId,
  });
  
  // Filter today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate.getTime() === today.getTime() && 
           appointment.status !== 'cancelled' &&
           (appointment.salonId === selectedSalonId);
  });
  
  // Calculate salon stats
  const stats: SalonStats = {
    todayAppointments: todayAppointments.length,
    todayRevenue: todayAppointments.reduce((sum, appointment) => {
      return appointment.status === 'completed' ? sum + appointment.totalPrice : sum;
    }, 0),
    rating: salons.find(salon => salon.id === selectedSalonId)?.rating || 0
  };
  
  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "تم تحديث حالة الحجز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في تحديث حالة الحجز",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle appointment status change
  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  if (isLoadingSalons) {
    return (
      <MainLayout title="لوحة التحكم">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // If the user doesn't have any salons, show an empty state with an option to create one
  if (salons.length === 0) {
    return (
      <MainLayout title="لوحة التحكم">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-primary text-xl">store</span>
          </div>
          <h2 className="text-lg font-bold mb-2">لم تقم بإضافة أي صالون بعد</h2>
          <p className="text-neutral-500 mb-6">لبدء استقبال الحجوزات، قم بإضافة صالونك الأول</p>
          <Link href="/owner/profile">
            <button className="bg-primary text-white py-2 px-4 rounded-lg">
              إضافة صالون جديد
            </button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="لوحة التحكم">
      <div className="p-4">
        {/* Salon Selector (if user has multiple salons) */}
        {salons.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">اختر الصالون</label>
            <select 
              className="w-full p-2 border border-neutral-200 rounded-lg"
              value={selectedSalonId || ''}
              onChange={(e) => setSelectedSalonId(Number(e.target.value))}
            >
              {salons.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center justify-center">
              <span className="material-icons text-primary ml-1">calendar_today</span>
              <span className="text-sm font-bold">{stats.todayAppointments}</span>
            </div>
            <p className="text-center text-xs mt-1">حجوزات اليوم</p>
          </div>
          <div className="bg-success/10 p-3 rounded-lg">
            <div className="flex items-center justify-center">
              <span className="material-icons text-success ml-1">payments</span>
              <span className="text-sm font-bold">{stats.todayRevenue}</span>
            </div>
            <p className="text-center text-xs mt-1">إيرادات اليوم</p>
          </div>
          <div className="bg-accent/10 p-3 rounded-lg">
            <div className="flex items-center justify-center">
              <span className="material-icons text-accent ml-1">star</span>
              <span className="text-sm font-bold">{stats.rating}</span>
            </div>
            <p className="text-center text-xs mt-1">التقييم</p>
          </div>
        </div>
        
        {/* Today's Appointments */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-almarai font-bold text-lg">حجوزات اليوم</h2>
            <Link href="/owner/appointments" className="text-primary text-sm">عرض الكل</Link>
          </div>
          
          {isLoadingAppointments ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onStatusChange={handleStatusChange}
                  showControls={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg border border-neutral-100">
              <span className="material-icons text-neutral-400 text-4xl mb-2">event_busy</span>
              <p className="text-neutral-500">لا توجد حجوزات لهذا اليوم</p>
            </div>
          )}
        </section>
        
        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="font-almarai font-bold text-lg mb-3">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/owner/services">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
                <span className="material-icons text-primary text-3xl mb-2">spa</span>
                <span className="font-medium">إدارة الخدمات</span>
              </div>
            </Link>
            <Link href="/owner/appointments">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
                <span className="material-icons text-primary text-3xl mb-2">event_note</span>
                <span className="font-medium">إدارة الحجوزات</span>
              </div>
            </Link>
            <Link href="/owner/profile">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
                <span className="material-icons text-primary text-3xl mb-2">storefront</span>
                <span className="font-medium">تعديل معلومات الصالون</span>
              </div>
            </Link>
            <Link href="/owner/dashboard?tab=offers">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
                <span className="material-icons text-primary text-3xl mb-2">local_offer</span>
                <span className="font-medium">العروض الخاصة</span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
