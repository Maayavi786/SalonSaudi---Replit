import { Appointment } from "@/types";
import { formatDate } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: number, status: string) => void;
  showControls?: boolean;
}

export function AppointmentCard({ 
  appointment, 
  onStatusChange,
  showControls = false
}: AppointmentCardProps) {
  const { 
    id, 
    appointmentDate, 
    status, 
    totalPrice, 
    totalDuration,
    userName,
    userPhone,
    salonName,
    services = []
  } = appointment;
  
  const date = new Date(appointmentDate);
  const formattedDate = formatDate(date, "ar");
  const formattedTime = date.toLocaleTimeString('ar-SA', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
  
  const statusClasses = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive"
  };
  
  const statusText = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    completed: "مكتمل",
    cancelled: "ملغي"
  };
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-neutral-100">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
            <span className="material-icons text-neutral-400">
              {userName ? "person" : "store"}
            </span>
          </div>
          <div className="mr-2">
            <h4 className="font-bold text-sm">{userName || salonName}</h4>
            <div className="flex items-center text-xs text-neutral-500">
              <span className="material-icons text-xs">
                {userName ? "phone" : "location_on"}
              </span>
              <span className="mr-1">{userPhone || "العنوان"}</span>
            </div>
          </div>
        </div>
        <div className={`${statusClasses[status as keyof typeof statusClasses]} text-xs px-2 py-1 rounded-full h-fit`}>
          <div className="flex items-center">
            <span>{formattedTime}</span>
            <span className="mx-1">•</span>
            <span>{statusText[status as keyof typeof statusText]}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-neutral-100 pt-2">
        <div className="flex justify-between mb-2">
          <div className="text-xs text-neutral-500">{formattedDate}</div>
          <div className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
            {Math.floor(totalDuration / 60)} ساعة {totalDuration % 60 > 0 ? `${totalDuration % 60} دقيقة` : ""}
          </div>
        </div>
        
        <p className="text-xs font-medium mb-1">الخدمات:</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {services.map((service, idx) => (
            <span key={idx} className="bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">
              {service.name}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs">
            <span className="font-medium">المجموع:</span>
            <span className="font-bold mr-1">{totalPrice} ريال</span>
          </p>
          
          {showControls && status === "pending" && (
            <div className="flex gap-2">
              <button 
                className="bg-success text-white text-xs rounded-full px-3 py-1"
                onClick={() => onStatusChange?.(id, "confirmed")}
              >
                قبول
              </button>
              <button 
                className="bg-error text-white text-xs rounded-full px-3 py-1"
                onClick={() => onStatusChange?.(id, "cancelled")}
              >
                رفض
              </button>
            </div>
          )}
          
          {!showControls && status === "pending" && (
            <button 
              className="bg-error text-white text-xs rounded-full px-3 py-1"
              onClick={() => onStatusChange?.(id, "cancelled")}
            >
              إلغاء
            </button>
          )}
          
          {status === "confirmed" && !showControls && (
            <div className="text-xs text-success font-medium">
              <span className="material-icons text-xs align-middle">check_circle</span>
              <span className="mr-1">تم التأكيد</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
