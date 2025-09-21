// PostgreSQL storage implementation using Drizzle ORM
import { eq, and, desc, asc, gte, lte, count, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  students,
  events,
  attendance,
  performances,
  parentInvites,
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
  type InsertParentInvite,
  type ParentInvite,
} from "@shared/schema";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;

  // Student operations
  createStudent(student: InsertStudent): Promise<Student>;
  getStudents(coachId: string): Promise<Student[]>;
  getStudentsForParent(parentUserId: string): Promise<Student[]>;
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

  // Parent invite operations
  getCoachInviteCode(coachId: string): Promise<string>;
  addParentInvite(parentInvite: InsertParentInvite): Promise<ParentInvite>;
  getParentInvites(coachId: string): Promise<ParentInvite[]>;
  validateInviteCode(inviteCode: string): Promise<{ coachId: string; studentId: string; inviteId: string } | null>;
  claimInvite(inviteId: string, parentUserId: string): Promise<ParentInvite | null>;

  // Dashboard stats
  getDashboardStats(coachId: string): Promise<{
    totalStudents: number;
    eventsThisWeek: number;
    totalEvents: number;
    averageAttendance: number;
    personalBests: number;
  }>;
}

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      let existingUser: User | undefined;

      // First try to find by ID if provided (Replit Auth provides sub as ID)
      if (userData.id) {
        const result = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);
        existingUser = result[0];
      }

      // Fallback to email lookup if no ID match and email is provided
      if (!existingUser && userData.email) {
        const result = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
        existingUser = result[0];
      }

      if (existingUser) {
        // Update existing user - exclude ID to prevent primary key mutation
        const { id, ...updateData } = userData;
        const [updatedUser] = await db
          .update(users)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return updatedUser;
      } else {
        // Create new user - include ID if provided
        const [newUser] = await db
          .insert(users)
          .values({
            ...userData,
          })
          .returning();
        return newUser;
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  // Student operations
  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async getStudents(coachId: string): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.coachId, coachId))
      .orderBy(desc(students.createdAt));
  }

  async getStudentsForParent(parentUserId: string): Promise<Student[]> {
    // Get parent invite records linked to this authenticated user
    const parentInviteRecords = await db
      .select()
      .from(parentInvites)
      .where(eq(parentInvites.parentUserId, parentUserId));

    if (parentInviteRecords.length === 0) {
      return [];
    }

    // Get students by their IDs, ensuring we only return students linked to this parent
    const studentIds = parentInviteRecords
      .map(invite => invite.studentId)
      .filter(id => id); // Filter out null/undefined studentIds

    if (studentIds.length === 0) {
      return [];
    }

    const studentRecords = await db
      .select()
      .from(students)
      .where(inArray(students.id, studentIds));

    return studentRecords;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }

  async updateStudent(id: string, studentData: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set({
        ...studentData,
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))
      .returning();

    if (!updatedStudent) {
      throw new Error('Student not found');
    }
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
    return await db
      .select()
      .from(events)
      .where(eq(events.coachId, coachId))
      .orderBy(desc(events.date));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    if (!updatedEvent) {
      throw new Error('Event not found');
    }
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    // First delete all performances associated with this event
    await db.delete(performances).where(eq(performances.eventId, id));

    // Then delete the event itself
    await db.delete(events).where(eq(events.id, id));
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance[]): Promise<Attendance[]> {
    const results = [];

    // Process each attendance record with atomic upsert using ON CONFLICT
    for (const data of attendanceData) {
      const [result] = await db
        .insert(attendance)
        .values(data)
        .onConflictDoUpdate({
          target: [attendance.studentId, attendance.date],
          set: {
            present: data.present,
            late: data.late,
            coachId: data.coachId,
          },
        })
        .returning();

      results.push(result);
    }
    return results;
  }

  async getAttendance(coachId: string, date?: Date): Promise<Attendance[]> {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      return await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.coachId, coachId),
            eq(attendance.date, dateStr)
          )
        )
        .orderBy(desc(attendance.date));
    }

    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.coachId, coachId))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceByDateRange(coachId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.coachId, coachId),
          gte(attendance.date, startStr),
          lte(attendance.date, endStr)
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
    return await db
      .select()
      .from(performances)
      .where(eq(performances.studentId, studentId))
      .orderBy(desc(performances.createdAt));
  }

  async getEventPerformances(eventId: string): Promise<Performance[]> {
    return await db
      .select()
      .from(performances)
      .where(eq(performances.eventId, eventId))
      .orderBy(asc(performances.rank));
  }

  // Parent invite operations
  async getCoachInviteCode(coachId: string): Promise<string> {
    // Check if coach already has an invite code
    const existingInvite = await db
      .select({ inviteCode: parentInvites.inviteCode })
      .from(parentInvites)
      .where(eq(parentInvites.coachId, coachId))
      .limit(1);

    if (existingInvite.length > 0) {
      return existingInvite[0].inviteCode;
    }

    // Generate a unique invite code for the coach
    const inviteCode = `COACH-${coachId.substring(0, 8)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return inviteCode;
  }

  async addParentInvite(parentInvite: InsertParentInvite): Promise<ParentInvite> {
    const [newParentInvite] = await db.insert(parentInvites).values(parentInvite).returning();
    return newParentInvite;
  }

  async getParentInvites(coachId: string): Promise<ParentInvite[]> {
    console.log("Getting parent invites for coach:", coachId);

    try {
      const result = await db
        .select()
        .from(parentInvites)
        .where(eq(parentInvites.coachId, coachId))
        .orderBy(desc(parentInvites.createdAt));

      console.log("Parent invites result:", result);
      return result;
    } catch (error) {
      console.error("Error fetching parent invites:", error);
      throw error;
    }
  }

  async validateInviteCode(inviteCode: string): Promise<{ coachId: string; studentId: string; inviteId: string } | null> {
    const result = await db
      .select({ 
        coachId: parentInvites.coachId,
        studentId: parentInvites.studentId,
        inviteId: parentInvites.id,
        claimed: parentInvites.claimed,
        expiresAt: parentInvites.expiresAt
      })
      .from(parentInvites)
      .where(eq(parentInvites.inviteCode, inviteCode))
      .limit(1);

    if (result.length === 0) {
      return null; // Invite code not found
    }

    const invite = result[0];

    // Check if invite is already claimed
    if (invite.claimed) {
      return null; // Invite already used
    }

    // Check if invite is expired (if expiration is set)
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return null; // Invite expired
    }

    return {
      coachId: invite.coachId,
      studentId: invite.studentId!,
      inviteId: invite.inviteId
    };
  }

  async claimInvite(inviteId: string, parentUserId: string): Promise<ParentInvite | null> {
    const result = await db
      .update(parentInvites)
      .set({ 
        claimed: true, 
        claimedAt: new Date(),
        parentUserId 
      })
      .where(and(
        eq(parentInvites.id, inviteId),
        eq(parentInvites.claimed, false) // Ensure it hasn't been claimed by someone else
      ))
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  // Dashboard stats
  async getDashboardStats(coachId: string): Promise<{
    totalStudents: number;
    eventsThisWeek: number;
    totalEvents: number;
    averageAttendance: number;
    personalBests: number;
  }> {
    // Calculate week boundaries
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Total students count
    const [{ totalStudents }] = await db
      .select({ totalStudents: count() })
      .from(students)
      .where(eq(students.coachId, coachId));

    // Events this week count
    const [{ eventsThisWeek }] = await db
      .select({ eventsThisWeek: count() })
      .from(events)
      .where(
        and(
          eq(events.coachId, coachId),
          gte(events.date, weekStart),
          lte(events.date, weekEnd)
        )
      );

    // Total events count
    const [{ totalEvents }] = await db
      .select({ totalEvents: count() })
      .from(events)
      .where(eq(events.coachId, coachId));

    // Personal bests count
    const [{ personalBests }] = await db
      .select({ personalBests: count() })
      .from(performances)
      .innerJoin(students, eq(performances.studentId, students.id))
      .where(
        and(
          eq(students.coachId, coachId),
          eq(performances.personalBest, true)
        )
      );

    // Calculate average attendance for current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];

    const attendanceRecords = await db
      .select({
        present: attendance.present,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.coachId, coachId),
          gte(attendance.date, monthStartStr),
          lte(attendance.date, nowStr)
        )
      );

    const totalAttendanceRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.present).length;
    const averageAttendance = totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    return {
      totalStudents: totalStudents || 0,
      eventsThisWeek: eventsThisWeek || 0,
      totalEvents: totalEvents || 0,
      averageAttendance: Math.round(averageAttendance || 0),
      personalBests: personalBests || 0,
    };
  }
}

export const storage = new PostgresStorage();