import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Salon, Service, SelectedService, DateOption, TimeOption, BookingFormData } from "@/types";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { ar } from "date-fns/locale";

export default function BookingPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [requestFemaleStaff, setRequestFemaleStaff] = useState(true);
  const [requestPrivateRoom, setRequestPrivateRoom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("mada");
  
  // Fetch salon details
  const { 
    data: salon,
    isLoading: isLoadingSalon
  } = useQuery<Salon>({
    queryKey: [`/api/salons/${salonId}`],
  });
  
  // Fetch salon services
  const { 
    data: services = [],
    isLoading: isLoadingServices
  } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salonId}/services`],
    enabled: !!salonId,
  });
  
  // Calculate total price and duration
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
  
  // Generate available dates (next 7 days)
  const dateOptions: DateOption[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      day: format(date, 'EEEE', { locale: ar }),
      dayNumber: parseInt(format(date, 'd')),
      month: format(date, 'MMMM', { locale: ar }),
      available: true
    };
  });
  
  // Generate time slots
  const timeOptions: TimeOption[] = [
    { time: "9:00 ص", available: true },
    { time: "10:30 ص", available: true },
    { time: "12:00 م", available: true },
    { time: "1:30 م", available: true },
    { time: "3:00 م", available: true },
    { time: "4:30 م", available: true },
    { time: "6:00 م", available: true },
    { time: "7:30 م", available: true },
  ];
  
  // Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const appointmentServices = data.services.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        return {
          serviceId,
          price: service?.price || 0,
          durationMinutes: service?.durationMinutes || 0
        };
      });
      
      const res = await apiRequest("POST", "/api/appointments", {
        appointmentData: {
          salonId: parseInt(salonId),
          appointmentDate: data.appointmentDate,
          totalPrice: data.totalPrice,
          totalDuration: data.totalDuration,
          requestFemaleStaff: data.requestFemaleStaff,
          requestPrivateRoom: data.requestPrivateRoom,
          paymentMethod: data.paymentMethod,
          paymentStatus: "pending",
          status: "pending"
        },
        services: appointmentServices
      });
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "تم الحجز بنجاح",
        description: "سيتم إشعارك عند تأكيد الحجز من قبل الصالون",
      });
      navigate("/appointments");
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في الحجز",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Remove a service from selected services
  const removeService = (serviceId: number) => {
    setSelectedServices(prev => prev.filter(service => service.id !== serviceId));
  };
  
  // Handle booking submission
  const handleBooking = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "يرجى اختيار التاريخ والوقت",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedServices.length === 0) {
      toast({
        title: "يرجى اختيار خدمة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time
    const [hours, minutes] = selectedTime.split(':');
    const isPM = selectedTime.includes('م');
    
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(
      isPM ? (parseInt(hours) === 12 ? 12 : parseInt(hours) + 12) : (parseInt(hours) === 12 ? 0 : parseInt(hours)),
      parseInt(minutes || '0'),
      0,
      0
    );
    
    const bookingData: BookingFormData = {
      salonId: parseInt(salonId),
      appointmentDate,
      totalPrice,
      totalDuration,
      requestFemaleStaff,
      requestPrivateRoom,
      paymentMethod,
      services: selectedServices.map(service => service.id)
    };
    
    bookingMutation.mutate(bookingData);
  };
  
  if (isLoadingSalon || isLoadingServices) {
    return (
      <MainLayout title="حجز موعد" showBackButton>
        <div className="flex items-center justify-center h-64">
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
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="حجز موعد" showBackButton>
      {/* Salon Info */}
      <div className="p-4 bg-white border-b border-neutral-200">
        <div className="flex items-center">
          <img 
            src={salon.imageUrl || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
            className="w-14 h-14 rounded-lg object-cover" 
            alt={salon.name} 
          />
          <div className="mr-3">
            <h2 className="font-bold">{salon.name}</h2>
            <div className="flex items-center text-xs text-neutral-500">
              <span className="material-icons text-amber-400 text-xs">star</span>
              <span className="mx-0.5">{salon.rating || "0.0"}</span>
              <span className="opacity-80">({salon.reviewCount || 0} تقييم)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected Services */}
      <div className="p-4 bg-neutral-50 border-b border-neutral-200">
        <h3 className="font-bold mb-3">الخدمات المختارة</h3>
        {selectedServices.length > 0 ? (
          <div className="space-y-2">
            {selectedServices.map((service) => (
              <div key={service.id} className="bg-white p-3 rounded-lg border border-neutral-100 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium">{service.name}</h4>
                  <div className="flex items-center mt-1">
                    <span className="text-sm font-bold">{service.price} ريال</span>
                    <span className="text-xs text-neutral-500 mr-2">{service.durationMinutes} دقيقة</span>
                  </div>
                </div>
                <button 
                  className="text-error"
                  onClick={() => removeService(service.id)}
                >
                  <span className="material-icons">delete_outline</span>
                </button>
              </div>
            ))}
            
            <div className="mt-3 p-3 bg-primary/5 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="text-sm">المجموع</span>
                <span className="font-bold">{totalPrice} ريال</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">المدة التقديرية</span>
                <span className="font-medium">
                  {Math.floor(totalDuration / 60) > 0 ? `${Math.floor(totalDuration / 60)} ساعة ` : ""}
                  {totalDuration % 60 > 0 ? `${totalDuration % 60} دقيقة` : ""}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center bg-white p-4 rounded-lg border border-neutral-100">
            <div className="flex flex-col items-center justify-center">
              <span className="material-icons text-neutral-400 text-3xl mb-2">shopping_cart</span>
              <p className="text-neutral-500">لم تقم باختيار أي خدمات بعد</p>
              <p className="text-xs text-neutral-400 mt-1">قم باختيار الخدمات التي ترغبين بها من صفحة الصالون</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Date Selection */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-bold mb-3">اختاري التاريخ</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {dateOptions.map((dateOption, index) => (
            <div 
              key={index} 
              className={`min-w-[70px] p-3 rounded-lg ${
                selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(dateOption.date, 'yyyy-MM-dd')
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-neutral-200'
              } flex flex-col items-center cursor-pointer`}
              onClick={() => setSelectedDate(dateOption.date)}
            >
              <span className={`text-xs ${selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(dateOption.date, 'yyyy-MM-dd') ? 'opacity-80' : 'text-neutral-500'}`}>
                {dateOption.day}
              </span>
              <span className="text-lg font-bold">{dateOption.dayNumber}</span>
              <span className="text-xs">{dateOption.month}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Time Selection */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-bold mb-3">اختاري الوقت</h3>
        <div className="grid grid-cols-3 gap-2">
          {timeOptions.map((timeOption, index) => (
            <button 
              key={index} 
              className={`p-3 rounded-lg ${
                selectedTime === timeOption.time
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-neutral-200'
              } text-center`}
              onClick={() => setSelectedTime(timeOption.time)}
            >
              <span className="text-sm">{timeOption.time}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Privacy Options */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-bold mb-3">خيارات الخصوصية</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
            <div className="flex items-center">
              <span className="material-icons text-primary ml-2">female</span>
              <span className="text-sm">خدمة من قبل موظفات فقط</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={requestFemaleStaff}
                onChange={(e) => setRequestFemaleStaff(e.target.checked)}
              />
              <div className="w-9 h-5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-1.25rem] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
            <div className="flex items-center">
              <span className="material-icons text-primary ml-2">meeting_room</span>
              <span className="text-sm">غرفة خاصة (تكلفة إضافية)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={requestPrivateRoom}
                onChange={(e) => setRequestPrivateRoom(e.target.checked)}
              />
              <div className="w-9 h-5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-1.25rem] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Payment Method */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-bold mb-3">طريقة الدفع</h3>
        <div className="space-y-3">
          <div 
            className={`flex items-center justify-between p-3 bg-white rounded-lg border ${paymentMethod === 'mada' ? 'border-primary' : 'border-neutral-200'} cursor-pointer`}
            onClick={() => setPaymentMethod('mada')}
          >
            <div className="flex items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/ar/f/f5/Mada_Logo.png" 
                alt="مدى" 
                className="h-6 w-auto ml-3" 
              />
              <span className="text-sm">بطاقة مدى</span>
            </div>
            <span className={`material-icons ${paymentMethod === 'mada' ? 'text-primary' : 'text-neutral-300'}`}>
              {paymentMethod === 'mada' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>
          <div 
            className={`flex items-center justify-between p-3 bg-white rounded-lg border ${paymentMethod === 'credit_card' ? 'border-primary' : 'border-neutral-200'} cursor-pointer`}
            onClick={() => setPaymentMethod('credit_card')}
          >
            <div className="flex items-center">
              <span className="material-icons text-neutral-500 ml-3">credit_card</span>
              <span className="text-sm">بطاقة ائتمان</span>
            </div>
            <span className={`material-icons ${paymentMethod === 'credit_card' ? 'text-primary' : 'text-neutral-300'}`}>
              {paymentMethod === 'credit_card' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>
          <div 
            className={`flex items-center justify-between p-3 bg-white rounded-lg border ${paymentMethod === 'cash' ? 'border-primary' : 'border-neutral-200'} cursor-pointer`}
            onClick={() => setPaymentMethod('cash')}
          >
            <div className="flex items-center">
              <span className="material-icons text-neutral-500 ml-3">payments</span>
              <span className="text-sm">الدفع عند الحضور</span>
            </div>
            <span className={`material-icons ${paymentMethod === 'cash' ? 'text-primary' : 'text-neutral-300'}`}>
              {paymentMethod === 'cash' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Confirm Button */}
      <div className="p-4">
        <button 
          className="w-full bg-primary text-white py-3 rounded-lg font-bold text-center disabled:bg-neutral-300 disabled:cursor-not-allowed"
          onClick={handleBooking}
          disabled={
            selectedServices.length === 0 || 
            !selectedDate || 
            !selectedTime || 
            bookingMutation.isPending
          }
        >
          {bookingMutation.isPending ? "جاري التأكيد..." : "تأكيد الحجز"}
        </button>
      </div>
    </MainLayout>
  );
}
