import { 
  users, type User, type InsertUser,
  salons, type Salon, type InsertSalon,
  serviceCategories, type ServiceCategory, type InsertServiceCategory,
  services, type Service, type InsertService,
  specialOffers, type SpecialOffer, type InsertSpecialOffer,
  appointments, type Appointment, type InsertAppointment,
  appointmentServices, type AppointmentService, type InsertAppointmentService,
  reviews, type Review, type InsertReview
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Salon operations
  getSalons(): Promise<Salon[]>;
  getSalon(id: number): Promise<Salon | undefined>;
  getSalonsByOwner(ownerId: number): Promise<Salon[]>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: number, data: Partial<InsertSalon>): Promise<Salon | undefined>;
  
  // Service Category operations
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  
  // Service operations
  getServices(salonId: number): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Special Offer operations
  getSpecialOffers(): Promise<SpecialOffer[]>;
  getSpecialOffersBySalon(salonId: number): Promise<SpecialOffer[]>;
  createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer>;
  updateSpecialOffer(id: number, data: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined>;
  
  // Appointment operations
  getAppointments(userId: number): Promise<Appointment[]>;
  getSalonAppointments(salonId: number): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment, services: InsertAppointmentService[]): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  
  // Review operations
  getReviews(salonId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private salons: Map<number, Salon>;
  private serviceCategories: Map<number, ServiceCategory>;
  private services: Map<number, Service>;
  private specialOffers: Map<number, SpecialOffer>;
  private appointments: Map<number, Appointment>;
  private appointmentServices: Map<number, AppointmentService>;
  private reviews: Map<number, Review>;
  
  // ID counters
  private userIdCounter: number;
  private salonIdCounter: number;
  private serviceCategoryIdCounter: number;
  private serviceIdCounter: number;
  private specialOfferIdCounter: number;
  private appointmentIdCounter: number;
  private appointmentServiceIdCounter: number;
  private reviewIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map<number, User>();
    this.salons = new Map<number, Salon>();
    this.serviceCategories = new Map<number, ServiceCategory>();
    this.services = new Map<number, Service>();
    this.specialOffers = new Map<number, SpecialOffer>();
    this.appointments = new Map<number, Appointment>();
    this.appointmentServices = new Map<number, AppointmentService>();
    this.reviews = new Map<number, Review>();
    
    this.userIdCounter = 1;
    this.salonIdCounter = 1;
    this.serviceCategoryIdCounter = 1;
    this.serviceIdCounter = 1;
    this.specialOfferIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.appointmentServiceIdCounter = 1;
    this.reviewIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Initialize with default service categories
    this.createServiceCategory({
      name: "قص الشعر",
      nameEn: "Haircut",
      icon: "content_cut"
    });
    
    this.createServiceCategory({
      name: "العناية بالبشرة",
      nameEn: "Skincare",
      icon: "spa"
    });
    
    this.createServiceCategory({
      name: "مكياج",
      nameEn: "Makeup",
      icon: "brush"
    });
    
    this.createServiceCategory({
      name: "حناء",
      nameEn: "Henna",
      icon: "palette"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...userData, id, createdAt: now, loyaltyPoints: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Salon operations
  async getSalons(): Promise<Salon[]> {
    return Array.from(this.salons.values());
  }

  async getSalon(id: number): Promise<Salon | undefined> {
    return this.salons.get(id);
  }

  async getSalonsByOwner(ownerId: number): Promise<Salon[]> {
    return Array.from(this.salons.values()).filter(
      (salon) => salon.ownerId === ownerId
    );
  }

  async createSalon(salonData: InsertSalon): Promise<Salon> {
    const id = this.salonIdCounter++;
    const now = new Date();
    const salon: Salon = { 
      ...salonData, 
      id, 
      createdAt: now,
      rating: 0,
      reviewCount: 0
    };
    this.salons.set(id, salon);
    return salon;
  }

  async updateSalon(id: number, data: Partial<InsertSalon>): Promise<Salon | undefined> {
    const salon = this.salons.get(id);
    if (!salon) return undefined;
    
    const updatedSalon = { ...salon, ...data };
    this.salons.set(id, updatedSalon);
    return updatedSalon;
  }

  // Service Category operations
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return Array.from(this.serviceCategories.values());
  }

  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    return this.serviceCategories.get(id);
  }

  async createServiceCategory(categoryData: InsertServiceCategory): Promise<ServiceCategory> {
    const id = this.serviceCategoryIdCounter++;
    const category: ServiceCategory = { ...categoryData, id };
    this.serviceCategories.set(id, category);
    return category;
  }

  // Service operations
  async getServices(salonId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.salonId === salonId
    );
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const now = new Date();
    const service: Service = { ...serviceData, id, createdAt: now };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, data: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...data };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Special Offer operations
  async getSpecialOffers(): Promise<SpecialOffer[]> {
    return Array.from(this.specialOffers.values());
  }

  async getSpecialOffersBySalon(salonId: number): Promise<SpecialOffer[]> {
    return Array.from(this.specialOffers.values()).filter(
      (offer) => offer.salonId === salonId && offer.isActive
    );
  }

  async createSpecialOffer(offerData: InsertSpecialOffer): Promise<SpecialOffer> {
    const id = this.specialOfferIdCounter++;
    const now = new Date();
    const offer: SpecialOffer = { ...offerData, id, createdAt: now };
    this.specialOffers.set(id, offer);
    return offer;
  }

  async updateSpecialOffer(id: number, data: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined> {
    const offer = this.specialOffers.get(id);
    if (!offer) return undefined;
    
    const updatedOffer = { ...offer, ...data };
    this.specialOffers.set(id, updatedOffer);
    return updatedOffer;
  }

  // Appointment operations
  async getAppointments(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.userId === userId
    );
  }

  async getSalonAppointments(salonId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.salonId === salonId
    );
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointmentData: InsertAppointment, appointmentServicesData: InsertAppointmentService[]): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const now = new Date();
    const appointment: Appointment = { ...appointmentData, id, createdAt: now };
    this.appointments.set(id, appointment);
    
    // Create associated appointment services
    for (const serviceData of appointmentServicesData) {
      const serviceId = this.appointmentServiceIdCounter++;
      const appointmentService: AppointmentService = { 
        ...serviceData, 
        id: serviceId,
        appointmentId: id
      };
      this.appointmentServices.set(serviceId, appointmentService);
    }
    
    return appointment;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, status };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  // Review operations
  async getReviews(salonId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.salonId === salonId
    );
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    const review: Review = { ...reviewData, id, createdAt: now };
    this.reviews.set(id, review);
    
    // Update salon rating
    const salon = this.salons.get(reviewData.salonId);
    if (salon) {
      const allReviews = await this.getReviews(reviewData.salonId);
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = Math.round(totalRating / allReviews.length);
      
      const updatedSalon = { 
        ...salon, 
        rating: averageRating,
        reviewCount: allReviews.length
      };
      this.salons.set(salon.id, updatedSalon);
    }
    
    return review;
  }
}

export const storage = new MemStorage();
