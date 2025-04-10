import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Appointment, Salon } from "@/types";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function OwnerAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
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
  
  // Fetch appointments
  const {
    data: appointments = [],
    isLoading: isLoadingAppointments
  } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    enabled: !!selectedSalonId,
  });
  
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
  
  // Filter appointments for current salon
  const salonAppointments = appointments.filter(
    appointment => appointment.salonId === selectedSalonId
  );
  
  // Filter appointments by status
  const pendingAppointments = salonAppointments.filter(
    appointment => appointment.status === 'pending'
  );
  
  const confirmedAppointments = salonAppointments.filter(
    appointment => appointment.status === 'confirmed'
  );
  
  const completedAppointments = salonAppointments.filter(
    appointment => appointment.status === 'completed'
  );
  
  const cancelledAppointments = salonAppointments.filter(
    appointment => appointment.status === 'cancelled'
  );
  
  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  if (isLoadingSalons) {
    return (
      <MainLayout title="إدارة الحجوزات">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // If the user doesn't have any salons, show an empty state with an option to create one
  if (salons.length === 0) {
    return (
      <MainLayout title="إدارة الحجوزات">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-primary text-xl">store</span>
          </div>
          <h2 className="text-lg font-bold mb-2">لم تقم بإضافة أي صالون بعد</h2>
          <p className="text-neutral-500 mb-6">لبدء استقبال الحجوزات، قم بإضافة صالونك الأول</p>
          <a
            href="/owner/profile"
            className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
          >
            إضافة صالون جديد
          </a>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="إدارة الحجوزات">
      <div className="p-4">
        {/* Salon Selector (if user has multiple salons) */}
        {salons.length > 1 && (
          <div className="mb-4">
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
        
        {/* Date Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">تاريخ الحجوزات</label>
          <input 
            type="date" 
            className="w-full p-2 border border-neutral-200 rounded-lg"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="pending" className="text-xs">
              قيد الانتظار
              {pendingAppointments.length > 0 && (
                <span className="bg-warning text-white text-xs px-1.5 py-0.5 rounded-full mr-1">
                  {pendingAppointments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs">مؤكدة</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">مكتملة</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">ملغية</TabsTrigger>
          </TabsList>
          
          {isLoadingAppointments ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="pending">
                {pendingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {pendingAppointments.map((appointment) => (
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
                    <p className="text-neutral-500">لا توجد حجوزات قيد الانتظار</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="confirmed">
                {confirmedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {confirmedAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onStatusChange={(id) => handleStatusChange(id, "completed")}
                        showControls={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-lg border border-neutral-100">
                    <p className="text-neutral-500">لا توجد حجوزات مؤكدة</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {completedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {completedAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-lg border border-neutral-100">
                    <p className="text-neutral-500">لا توجد حجوزات مكتملة</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="cancelled">
                {cancelledAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {cancelledAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-lg border border-neutral-100">
                    <p className="text-neutral-500">لا توجد حجوزات ملغية</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
