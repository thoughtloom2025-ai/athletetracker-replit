import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStudentSchema, insertEventSchema, insertAttendanceSchema, insertPerformanceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Health check endpoint for deployment verification
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Basic API status endpoint  
  app.get('/api', (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Student routes
  app.get('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const students = await storage.getStudents(userId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const studentData = insertStudentSchema.parse({ ...req.body, coachId: userId });
      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  app.get('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.put('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      const studentData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, studentData);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  app.delete('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Event routes
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convert date string from frontend to Date object for backend validation
      const requestData = { ...req.body, coachId: userId };
      if (requestData.date && typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      const eventData = insertEventSchema.parse(requestData);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error: unknown) {
      console.error("Error creating event:", error);
      const errorObj = error as { errors?: unknown };
      if (errorObj.errors) {
        console.error("Validation errors:", errorObj.errors);
      }
      res.status(400).json({ message: "Failed to create event" });
    }
  });

  app.get('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Convert date string from frontend to Date object for backend validation
      const requestData = { ...req.body };
      if (requestData.date && typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      const eventData = insertEventSchema.partial().parse(requestData);
      const event = await storage.updateEvent(req.params.id, eventData);
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(400).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Attendance routes
  app.get('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date, startDate, endDate } = req.query;
      
      let attendance;
      if (startDate && endDate) {
        attendance = await storage.getAttendanceByDateRange(
          userId, 
          new Date(startDate as string), 
          new Date(endDate as string)
        );
      } else if (date) {
        attendance = await storage.getAttendance(userId, new Date(date as string));
      } else {
        attendance = await storage.getAttendance(userId);
      }
      
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attendanceData = z.array(insertAttendanceSchema).parse(
        req.body.map((item: any) => ({ ...item, coachId: userId }))
      );
      const attendance = await storage.markAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(400).json({ message: "Failed to mark attendance" });
    }
  });

  // Performance routes
  app.get('/api/performances/student/:studentId', isAuthenticated, async (req: any, res) => {
    try {
      const performances = await storage.getStudentPerformances(req.params.studentId);
      res.json(performances);
    } catch (error) {
      console.error("Error fetching student performances:", error);
      res.status(500).json({ message: "Failed to fetch student performances" });
    }
  });

  app.get('/api/performances/event/:eventId', isAuthenticated, async (req: any, res) => {
    try {
      const performances = await storage.getEventPerformances(req.params.eventId);
      res.json(performances);
    } catch (error) {
      console.error("Error fetching event performances:", error);
      res.status(500).json({ message: "Failed to fetch event performances" });
    }
  });

  app.post('/api/performances', isAuthenticated, async (req: any, res) => {
    try {
      const performanceData = insertPerformanceSchema.parse(req.body);
      const performance = await storage.recordPerformance(performanceData);
      res.json(performance);
    } catch (error) {
      console.error("Error recording performance:", error);
      res.status(400).json({ message: "Failed to record performance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
