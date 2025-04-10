import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertSalonSchema,
  insertServiceSchema,
  insertSpecialOfferSchema,
  insertAppointmentSchema,
  insertAppointmentServiceSchema,
  insertReviewSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a test endpoint to verify the API is working
  app.get("/api/test", (req, res) => {
    console.log("Test API endpoint hit");
    res.json({ message: "API is working correctly", timestamp: new Date().toISOString() });
  });
  
  // Setup authentication routes
  setupAuth(app);

  // Salons
  app.get("/api/salons", async (req, res) => {
    try {
      const salons = await storage.getSalons();
      res.json(salons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salons" });
    }
  });

  app.get("/api/salons/:id", async (req, res) => {
    try {
      const salon = await storage.getSalon(Number(req.params.id));
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      res.json(salon);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salon" });
    }
  });

  app.post("/api/salons", async (req, res) => {
    if (!req.isAuthenticated() || req.user.userType !== "salon_owner") {
      return res.status(403).json({ message: "Only salon owners can create salons" });
    }

    try {
      const validatedData = insertSalonSchema.parse({
        ...req.body,
        ownerId: req.user.id,
      });
      const salon = await storage.createSalon(validatedData);
      res.status(201).json(salon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid salon data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create salon" });
    }
  });

  app.patch("/api/salons/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const salon = await storage.getSalon(Number(req.params.id));
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }

      if (salon.ownerId !== req.user.id && req.user.userType !== "admin") {
        return res.status(403).json({ message: "You don't have permission to update this salon" });
      }

      const updatedSalon = await storage.updateSalon(Number(req.params.id), req.body);
      res.json(updatedSalon);
    } catch (error) {
      res.status(500).json({ message: "Failed to update salon" });
    }
  });

  // Service Categories
  app.get("/api/service-categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  // Services
  app.get("/api/salons/:id/services", async (req, res) => {
    try {
      const services = await storage.getServices(Number(req.params.id));
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertServiceSchema.parse(req.body);
      
      // Check if the user owns the salon
      const salon = await storage.getSalon(validatedData.salonId);
      if (!salon || salon.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to add services to this salon" });
      }

      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const service = await storage.getService(Number(req.params.id));
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Check if the user owns the salon that offers this service
      const salon = await storage.getSalon(service.salonId);
      if (!salon || salon.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this service" });
      }

      const updatedService = await storage.updateService(Number(req.params.id), req.body);
      res.json(updatedService);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const service = await storage.getService(Number(req.params.id));
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Check if the user owns the salon that offers this service
      const salon = await storage.getSalon(service.salonId);
      if (!salon || salon.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this service" });
      }

      const success = await storage.deleteService(Number(req.params.id));
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete service" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Special Offers
  app.get("/api/special-offers", async (req, res) => {
    try {
      const offers = await storage.getSpecialOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  app.get("/api/salons/:id/special-offers", async (req, res) => {
    try {
      const offers = await storage.getSpecialOffersBySalon(Number(req.params.id));
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  app.post("/api/special-offers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertSpecialOfferSchema.parse(req.body);
      
      // Check if the user owns the salon
      const salon = await storage.getSalon(validatedData.salonId);
      if (!salon || salon.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to add offers to this salon" });
      }

      const offer = await storage.createSpecialOffer(validatedData);
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid offer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create special offer" });
    }
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      let appointments;
      if (req.user.userType === "customer") {
        appointments = await storage.getAppointments(req.user.id);
      } else if (req.user.userType === "salon_owner") {
        // Get all salons owned by this user
        const salons = await storage.getSalonsByOwner(req.user.id);
        appointments = [];
        
        // Get appointments for each salon
        for (const salon of salons) {
          const salonAppointments = await storage.getSalonAppointments(salon.id);
          appointments.push(...salonAppointments);
        }
      } else {
        return res.status(403).json({ message: "Unauthorized user type" });
      }

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.userType !== "customer") {
      return res.status(403).json({ message: "Only customers can book appointments" });
    }

    try {
      const { appointmentData, services } = req.body;
      
      // Validate appointment data
      const validatedAppointmentData = insertAppointmentSchema.parse({
        ...appointmentData,
        userId: req.user.id,
      });
      
      // Validate services data
      const validatedServices = [];
      for (const service of services) {
        const validatedService = insertAppointmentServiceSchema.parse(service);
        validatedServices.push(validatedService);
      }

      const appointment = await storage.createAppointment(validatedAppointmentData, validatedServices);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { status } = req.body;
      if (!status || !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const appointment = await storage.getAppointment(Number(req.params.id));
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Check authorization
      if (req.user.userType === "customer" && appointment.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this appointment" });
      } else if (req.user.userType === "salon_owner") {
        const salon = await storage.getSalon(appointment.salonId);
        if (!salon || salon.ownerId !== req.user.id) {
          return res.status(403).json({ message: "You don't have permission to update this appointment" });
        }
      }

      const updatedAppointment = await storage.updateAppointmentStatus(Number(req.params.id), status);
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });

  // Reviews
  app.get("/api/salons/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews(Number(req.params.id));
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated() || req.user.userType !== "customer") {
      return res.status(403).json({ message: "Only customers can create reviews" });
    }

    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      // Check if the appointment exists and belongs to this user
      if (validatedData.appointmentId) {
        const appointment = await storage.getAppointment(validatedData.appointmentId);
        if (!appointment || appointment.userId !== req.user.id) {
          return res.status(403).json({ message: "You don't have permission to review this appointment" });
        }
      }

      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
