import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Appointment } from "@/types";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const { toast } = useToast();
  
  // Fetch appointments
  const {
    data: appointments = [],
    isLoading,
    isError,
    error
  } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
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
  
  // Filter appointments by status
  const upcomingAppointments = appointments.filter(
    appointment => ['pending', 'confirmed'].includes(appointment.status)
  );
  
  const pastAppointments = appointments.filter(
    appointment => ['completed'].includes(appointment.status)
  );
  
  const cancelledAppointments = appointments.filter(
    appointment => ['cancelled'].includes(appointment.status)
  );
  
  // Handle appointment cancellation
  const handleCancel = (id: number) => {
    if (window.confirm("هل أنت متأكدة من رغبتك في إلغاء هذا الحجز؟")) {
      updateStatusMutation.mutate({ id, status: "cancelled" });
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout title="حجوزاتي">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (isError) {
    return (
      <MainLayout title="حجوزاتي">
        <div className="p-8 text-center">
          <p className="text-error mb-2">حدث خطأ أثناء تحميل الحجوزات</p>
          <p className="text-sm text-neutral-500">{(error as Error).message}</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="حجوزاتي">
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="upcoming">القادمة</TabsTrigger>
            <TabsTrigger value="past">السابقة</TabsTrigger>
            <TabsTrigger value="cancelled">الملغية</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onStatusChange={(id) => handleCancel(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-lg border border-neutral-100">
                <span className="material-icons text-neutral-400 text-4xl mb-2">event_busy</span>
                <p className="text-neutral-500">ليس لديك أي حجوزات قادمة</p>
                <p className="text-xs text-neutral-400 mt-1">يمكنك البحث عن صالون وإجراء حجز جديد</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {pastAppointments.length > 0 ? (
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-lg border border-neutral-100">
                <span className="material-icons text-neutral-400 text-4xl mb-2">history</span>
                <p className="text-neutral-500">ليس لديك أي حجوزات سابقة</p>
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
                <span className="material-icons text-neutral-400 text-4xl mb-2">cancel</span>
                <p className="text-neutral-500">ليس لديك أي حجوزات ملغية</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
