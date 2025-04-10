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
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize the database with default service categories
    this.initializeServiceCategories();
  }
  
  private async initializeServiceCategories() {
    const categories = await this.getServiceCategories();
    if (categories.length === 0) {
      await this.createServiceCategory({
        name: "قص الشعر",
        nameEn: "Haircut",
        icon: "content_cut"
      });
      
      await this.createServiceCategory({
        name: "العناية بالبشرة",
        nameEn: "Skincare",
        icon: "spa"
      });
      
      await this.createServiceCategory({
        name: "مكياج",
        nameEn: "Makeup",
        icon: "brush"
      });
      
      await this.createServiceCategory({
        name: "حناء",
        nameEn: "Henna",
        icon: "palette"
      });
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getSalons(): Promise<Salon[]> {
    return await db.select().from(salons);
  }
  
  async getSalon(id: number): Promise<Salon | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.id, id));
    return salon;
  }
  
  async getSalonsByOwner(ownerId: number): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.ownerId, ownerId));
  }
  
  async createSalon(salonData: InsertSalon): Promise<Salon> {
    const [salon] = await db.insert(salons).values(salonData).returning();
    return salon;
  }
  
  async updateSalon(id: number, data: Partial<InsertSalon>): Promise<Salon | undefined> {
    const [updatedSalon] = await db
      .update(salons)
      .set(data)
      .where(eq(salons.id, id))
      .returning();
    return updatedSalon;
  }
  
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(serviceCategories);
  }
  
  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const [category] = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, id));
    return category;
  }
  
  async createServiceCategory(categoryData: InsertServiceCategory): Promise<ServiceCategory> {
    const [category] = await db
      .insert(serviceCategories)
      .values(categoryData)
      .returning();
    return category;
  }
  
  async getServices(salonId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.salonId, salonId));
  }
  
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service;
  }
  
  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }
  
  async updateService(id: number, data: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(data)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }
  
  async deleteService(id: number): Promise<boolean> {
    const result = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning();
    return result.length > 0;
  }
  
  async getSpecialOffers(): Promise<SpecialOffer[]> {
    return await db.select().from(specialOffers);
  }
  
  async getSpecialOffersBySalon(salonId: number): Promise<SpecialOffer[]> {
    return await db
      .select()
      .from(specialOffers)
      .where(and(
        eq(specialOffers.salonId, salonId),
        eq(specialOffers.isActive, true)
      ));
  }
  
  async createSpecialOffer(offerData: InsertSpecialOffer): Promise<SpecialOffer> {
    const [offer] = await db
      .insert(specialOffers)
      .values(offerData)
      .returning();
    return offer;
  }
  
  async updateSpecialOffer(id: number, data: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined> {
    const [updatedOffer] = await db
      .update(specialOffers)
      .set(data)
      .where(eq(specialOffers.id, id))
      .returning();
    return updatedOffer;
  }
  
  async getAppointments(userId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.appointmentDate));
  }
  
  async getSalonAppointments(salonId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.salonId, salonId))
      .orderBy(desc(appointments.appointmentDate));
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return appointment;
  }
  
  async createAppointment(appointmentData: InsertAppointment, appointmentServicesData: InsertAppointmentService[]): Promise<Appointment> {
    // Start a transaction
    const [appointment] = await db.transaction(async (tx) => {
      // Create the appointment
      const [newAppointment] = await tx
        .insert(appointments)
        .values(appointmentData)
        .returning();
      
      // Add the appointment ID to each service data
      const servicesWithAppointmentId = appointmentServicesData.map(service => ({
        ...service,
        appointmentId: newAppointment.id
      }));
      
      // Insert all appointment services
      await tx
        .insert(appointmentServices)
        .values(servicesWithAppointmentId);
      
      return [newAppointment];
    });
    
    return appointment;
  }
  
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }
  
  async getReviews(salonId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.salonId, salonId))
      .orderBy(desc(reviews.createdAt));
  }
  
  async createReview(reviewData: InsertReview): Promise<Review> {
    // Start a transaction
    const [review] = await db.transaction(async (tx) => {
      // Create the review
      const [newReview] = await tx
        .insert(reviews)
        .values(reviewData)
        .returning();
      
      // Get all reviews for the salon
      const salonReviews = await tx
        .select()
        .from(reviews)
        .where(eq(reviews.salonId, reviewData.salonId));
      
      // Calculate new rating
      const totalRating = salonReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = Math.round(totalRating / salonReviews.length);
      
      // Update salon rating
      await tx
        .update(salons)
        .set({
          rating: averageRating,
          reviewCount: salonReviews.length
        })
        .where(eq(salons.id, reviewData.salonId));
      
      return [newReview];
    });
    
    return review;
  }
}

// MemStorage implementation kept for reference and fallback
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

// Use the database storage
export const storage = new DatabaseStorage();
