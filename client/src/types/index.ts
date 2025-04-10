// Re-export types from the schema
import {
  User as SchemaUser,
  InsertUser,
  Salon as SchemaSalon,
  InsertSalon,
  ServiceCategory as SchemaServiceCategory,
  InsertServiceCategory,
  Service as SchemaService,
  InsertService,
  SpecialOffer as SchemaSpecialOffer,
  InsertSpecialOffer,
  Appointment as SchemaAppointment,
  InsertAppointment,
  AppointmentService as SchemaAppointmentService,
  InsertAppointmentService,
  Review as SchemaReview,
  InsertReview
} from "@shared/schema";

// Extended User interface with additional client-specific properties
export interface User extends SchemaUser {
  // Add any client-specific properties here
}

// Extended Salon interface with additional client-specific properties
export interface Salon extends SchemaSalon {
  // Add any client-specific properties here
}

// Extended ServiceCategory interface with additional client-specific properties
export interface ServiceCategory extends SchemaServiceCategory {
  // Add any client-specific properties here
  categoryName?: string;
}

// Extended Service interface with additional client-specific properties
export interface Service extends SchemaService {
  categoryName?: string;
  selected?: boolean;
}

// Extended SpecialOffer interface with additional client-specific properties
export interface SpecialOffer extends SchemaSpecialOffer {
  salonName?: string;
}

// Extended Appointment interface with additional client-specific properties
export interface Appointment extends SchemaAppointment {
  salonName?: string;
  userName?: string;
  userPhone?: string;
  services?: {
    id: number;
    name: string;
    price: number;
    durationMinutes: number;
  }[];
}

// Extended AppointmentService interface with additional client-specific properties
export interface AppointmentService extends SchemaAppointmentService {
  serviceName?: string;
}

// Extended Review interface with additional client-specific properties
export interface Review extends SchemaReview {
  userName?: string;
}

// Additional types for client use

export type SelectedService = {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
};

export type DateOption = {
  date: Date;
  day: string;
  dayNumber: number;
  month: string;
  available: boolean;
};

export type TimeOption = {
  time: string;
  available: boolean;
};

export type SalonStats = {
  todayAppointments: number;
  todayRevenue: number;
  rating: number;
};

export type TimeSlot = {
  id: string;
  time: string;
  available: boolean;
};

export type BookingFormData = {
  salonId: number;
  appointmentDate: Date;
  totalPrice: number;
  totalDuration: number;
  requestFemaleStaff: boolean;
  requestPrivateRoom: boolean;
  paymentMethod: string;
  services: number[];
};

// Re-export the insert types
export {
  InsertUser,
  InsertSalon,
  InsertServiceCategory,
  InsertService,
  InsertSpecialOffer,
  InsertAppointment,
  InsertAppointmentService,
  InsertReview
};
