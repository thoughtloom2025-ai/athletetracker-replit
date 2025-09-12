import {
  users,
  students,
  events,
  attendance,
  performances,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Event,
  type InsertEvent,
  type Attendance,
  type InsertAttendance,
  type Performance,
  type InsertPerformance,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Student operations
  createStudent(student: InsertStudent): Promise<Student>;
  getStudents(coachId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(coachId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Attendance operations
  markAttendance(attendanceData: InsertAttendance[]): Promise<Attendance[]>;
  getAttendance(coachId: string, date?: Date): Promise<Attendance[]>;
  getAttendanceByDateRange(coachId: string, startDate: Date, endDate: Date): Promise<Attendance[]>;
  
  // Performance operations
  recordPerformance(performance: InsertPerformance): Promise<Performance>;
  getStudentPerformances(studentId: string): Promise<Performance[]>;
  getEventPerformances(eventId: string): Promise<Performance[]>;
  
  // Dashboard stats
  getDashboardStats(coachId: string): Promise<{
    totalStudents: number;
    eventsThisWeek: number;
    averageAttendance: number;
    personalBests: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Student operations
  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async getStudents(coachId: string): Promise<Student[]> {
    return db.select().from(students).where(eq(students.coachId, coachId)).orderBy(desc(students.createdAt));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async updateStudent(id: string, studentData: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set({ ...studentData, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEvents(coachId: string): Promise<Event[]> {
    return db.select().from(events).where(eq(events.coachId, coachId)).orderBy(desc(events.date));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance[]): Promise<Attendance[]> {
    const results = [];
    for (const data of attendanceData) {
      const [attendance] = await db
        .insert(attendance)
        .values(data)
        .onConflictDoUpdate({
          target: [attendance.studentId, attendance.date],
          set: {
            present: data.present,
            late: data.late,
          },
        })
        .returning();
      results.push(attendance);
    }
    return results;
  }

  async getAttendance(coachId: string, date?: Date): Promise<Attendance[]> {
    let query = db.select().from(attendance).where(eq(attendance.coachId, coachId));
    
    if (date) {
      query = query.where(eq(attendance.date, date.toISOString().split('T')[0]));
    }
    
    return query.orderBy(desc(attendance.date));
  }

  async getAttendanceByDateRange(coachId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    return db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.coachId, coachId),
          gte(attendance.date, startDate.toISOString().split('T')[0]),
          lte(attendance.date, endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(attendance.date));
  }

  // Performance operations
  async recordPerformance(performance: InsertPerformance): Promise<Performance> {
    const [newPerformance] = await db.insert(performances).values(performance).returning();
    return newPerformance;
  }

  async getStudentPerformances(studentId: string): Promise<Performance[]> {
    return db.select().from(performances).where(eq(performances.studentId, studentId)).orderBy(desc(performances.createdAt));
  }

  async getEventPerformances(eventId: string): Promise<Performance[]> {
    return db.select().from(performances).where(eq(performances.eventId, eventId)).orderBy(performances.rank);
  }

  // Dashboard stats
  async getDashboardStats(coachId: string): Promise<{
    totalStudents: number;
    eventsThisWeek: number;
    averageAttendance: number;
    personalBests: number;
  }> {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const [studentsCount] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.coachId, coachId));

    const [eventsCount] = await db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.coachId, coachId),
          gte(events.date, weekStart),
          lte(events.date, weekEnd)
        )
      );

    const [personalBestsCount] = await db
      .select({ count: count() })
      .from(performances)
      .innerJoin(students, eq(performances.studentId, students.id))
      .where(
        and(
          eq(students.coachId, coachId),
          eq(performances.personalBest, true)
        )
      );

    // Calculate average attendance for current month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const attendanceData = await this.getAttendanceByDateRange(coachId, monthStart, new Date());
    const totalAttendanceRecords = attendanceData.length;
    const presentCount = attendanceData.filter(a => a.present).length;
    const averageAttendance = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

    return {
      totalStudents: studentsCount.count,
      eventsThisWeek: eventsCount.count,
      averageAttendance,
      personalBests: personalBestsCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
