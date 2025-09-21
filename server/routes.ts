import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStudentSchema, insertEventSchema, insertAttendanceSchema, insertPerformanceSchema, insertParentInviteSchema, students } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

  // Logout is handled by setupAuth in replitAuth.ts

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
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let students;
      if (user.role === 'parent') {
        students = await storage.getStudentsForParent(userId);
      } else {
        // Coach or admin can see all their students
        students = await storage.getStudents(userId);
      }
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only coaches can create students
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot create students" });
      }

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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const student = await storage.getStudent(req.params.id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Authorization check
      if (user?.role === 'parent') {
        const allowedStudents = await storage.getStudentsForParent(userId);
        const hasAccess = allowedStudents.some(s => s.id === student.id);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        // Coaches can only see their own students
        if (student.coachId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.put('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const existingStudent = await storage.getStudent(req.params.id);
      
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Authorization check - only coaches can update students they own
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot update student records" });
      } else if (existingStudent.coachId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const existingStudent = await storage.getStudent(req.params.id);
      
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Authorization check - only coaches can delete students they own
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot delete student records" });
      } else if (existingStudent.coachId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      const user = await storage.getUser(userId);
      
      // Only coaches can create events
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot create events" });
      }
      
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const event = await storage.getEvent(req.params.id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Authorization check - only coaches can access events, and only their own
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot access event details" });
      } else if (event.coachId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const existingEvent = await storage.getEvent(req.params.id);
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Authorization check - only coaches can update events, and only their own
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot update events" });
      } else if (existingEvent.coachId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const existingEvent = await storage.getEvent(req.params.id);
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Authorization check - only coaches can delete events, and only their own
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot delete events" });
      } else if (existingEvent.coachId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      const user = await storage.getUser(userId);
      
      // Only coaches can mark attendance
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot mark attendance" });
      }

      const attendanceData = z.array(insertAttendanceSchema).parse(
        req.body.map((item: any) => ({ ...item, coachId: userId }))
      );

      // Verify all students belong to this coach
      for (const item of attendanceData) {
        const student = await storage.getStudent(item.studentId);
        if (!student || student.coachId !== userId) {
          return res.status(403).json({ 
            message: "Access denied - you can only mark attendance for your own students" 
          });
        }
      }

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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const student = await storage.getStudent(req.params.studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Authorization check - same as student endpoint
      if (user?.role === 'parent') {
        const allowedStudents = await storage.getStudentsForParent(userId);
        const hasAccess = allowedStudents.some(s => s.id === student.id);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        // Coaches can only see performances for their own students
        if (student.coachId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const performances = await storage.getStudentPerformances(req.params.studentId);
      res.json(performances);
    } catch (error) {
      console.error("Error fetching student performances:", error);
      res.status(500).json({ message: "Failed to fetch student performances" });
    }
  });

  app.get('/api/performances/event/:eventId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const event = await storage.getEvent(req.params.eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Authorization check - only coaches can access event performances, and only for their own events
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot access event performance data" });
      } else if (event.coachId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const performances = await storage.getEventPerformances(req.params.eventId);
      res.json(performances);
    } catch (error) {
      console.error("Error fetching event performances:", error);
      res.status(500).json({ message: "Failed to fetch event performances" });
    }
  });

  app.post('/api/performances', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only coaches can create performance records
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot create performance records" });
      }

      const performanceData = insertPerformanceSchema.parse(req.body);
      
      // Verify the coach owns both the student and the event
      const student = await storage.getStudent(performanceData.studentId);
      const event = await storage.getEvent(performanceData.eventId);
      
      if (!student || !event) {
        return res.status(400).json({ message: "Invalid student or event ID" });
      }
      
      if (student.coachId !== userId || event.coachId !== userId) {
        return res.status(403).json({ message: "Access denied - you can only record performances for your own students and events" });
      }

      const performance = await storage.recordPerformance(performanceData);
      res.json(performance);
    } catch (error) {
      console.error("Error recording performance:", error);
      res.status(400).json({ message: "Failed to record performance" });
    }
  });

  // Parent invite routes
  app.get('/api/parent-invites/code', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only coaches can get invite codes
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot generate invite codes" });
      }
      
      const inviteCode = await storage.getCoachInviteCode(userId);
      res.json({ inviteCode });
    } catch (error) {
      console.error("Error getting invite code:", error);
      res.status(500).json({ message: "Failed to get invite code" });
    }
  });

  app.get('/api/parent-invites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parentInvites = await storage.getParentInvites(userId);
      res.json(parentInvites);
    } catch (error) {
      console.error("Error fetching parent invites:", error);
      res.status(500).json({ message: "Failed to fetch parent invites" });
    }
  });

  app.post('/api/parent-invites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only coaches can create parent invites
      if (user?.role === 'parent') {
        return res.status(403).json({ message: "Parents cannot create parent invites" });
      }
      
      // If studentId is provided, verify it belongs to this coach
      if (req.body.studentId) {
        const student = await storage.getStudent(req.body.studentId);
        if (!student || student.coachId !== userId) {
          return res.status(403).json({ 
            message: "Access denied - you can only create invites for your own students" 
          });
        }
      }
      
      const parentInviteData = insertParentInviteSchema.parse({
        ...req.body,
        coachId: userId
      });
      
      const parentInvite = await storage.addParentInvite(parentInviteData);
      res.json(parentInvite);
    } catch (error) {
      console.error("Error creating parent invite:", error);
      res.status(400).json({ message: "Failed to create parent invite" });
    }
  });

  // Complete parent registration after authentication
  app.post('/api/parent-invites/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { inviteCode } = req.body;
      
      // Validate invite code using secure validation
      const inviteValidation = await storage.validateInviteCode(inviteCode);
      if (!inviteValidation) {
        return res.status(400).json({ 
          message: "Invalid, expired, or already used invite code" 
        });
      }

      const { coachId, studentId, inviteId } = inviteValidation;

      // Update user role to parent
      await storage.updateUserRole(userId, 'parent');

      // Claim the invite (this marks it as used and links to the parent)
      const claimedInvite = await storage.claimInvite(inviteId, userId);
      if (!claimedInvite) {
        return res.status(400).json({ 
          message: "Invite has already been claimed by another user" 
        });
      }

      res.json({
        message: "Parent registration completed successfully",
        studentId,
        coachId,
        parentInvite: claimedInvite
      });
    } catch (error) {
      console.error("Error completing parent registration:", error);
      res.status(400).json({ message: "Failed to complete parent registration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
