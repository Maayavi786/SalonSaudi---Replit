import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  userType: text("user_type").notNull().default("customer"), // customer or salon_owner
  imageUrl: text("image_url"),
  isPrivacyFocused: boolean("is_privacy_focused").default(false),
  prefersFemaleStaff: boolean("prefers_female_staff").default(false),
  preferredLanguage: text("preferred_language").default("ar"),
  createdAt: timestamp("created_at").defaultNow(),
  loyaltyPoints: integer("loyalty_points").default(0),
});

// Salon model
export const salons = pgTable("salons", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  phone: text("phone").notNull(),
  imageUrl: text("image_url"),
  coverImageUrl: text("cover_image_url"),
  isFemaleOnly: boolean("is_female_only").default(false),
  hasPrivateRooms: boolean("has_private_rooms").default(false),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  openingHours: json("opening_hours").$type<Record<string, string>>(),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service Category model
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  icon: text("icon"),
});

// Service model
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  femaleStaffOnly: boolean("female_staff_only").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Special Offer model
export const specialOffers = pgTable("special_offers", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  originalPrice: integer("original_price").notNull(),
  discountedPrice: integer("discounted_price").notNull(),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointment model
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  salonId: integer("salon_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status").default("pending"), // pending, confirmed, cancelled, completed
  totalPrice: integer("total_price").notNull(),
  totalDuration: integer("total_duration").notNull(),
  requestFemaleStaff: boolean("request_female_staff").default(false),
  requestPrivateRoom: boolean("request_private_room").default(false),
  paymentMethod: text("payment_method"), // mada, credit_card, cash
  paymentStatus: text("payment_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointment Service model (junction table)
export const appointmentServices = pgTable("appointment_services", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull(),
  serviceId: integer("service_id").notNull(),
  price: integer("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
});

// Review model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  salonId: integer("salon_id").notNull(),
  appointmentId: integer("appointment_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, loyaltyPoints: true });
export const insertSalonSchema = createInsertSchema(salons).omit({ id: true, createdAt: true, rating: true, reviewCount: true });
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertSpecialOfferSchema = createInsertSchema(specialOffers).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertAppointmentServiceSchema = createInsertSchema(appointmentServices).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Salon = typeof salons.$inferSelect;
export type InsertSalon = z.infer<typeof insertSalonSchema>;

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type SpecialOffer = typeof specialOffers.$inferSelect;
export type InsertSpecialOffer = z.infer<typeof insertSpecialOfferSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type AppointmentService = typeof appointmentServices.$inferSelect;
export type InsertAppointmentService = z.infer<typeof insertAppointmentServiceSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
