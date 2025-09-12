// Complete in-memory storage implementation
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

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private students: Map<string, Student> = new Map();
  private events: Map<string, Event> = new Map();
  private attendance: Map<string, Attendance> = new Map();
  private performances: Map<string, Performance> = new Map();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const existingUser = this.users.get(userData.id!);
    
    const user: User = {
      id: userData.id || this.generateUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || "coach",
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    
    this.users.set(user.id, user);
    return user;
  }

  // Student operations
  async createStudent(student: InsertStudent): Promise<Student> {
    const now = new Date();
    const newStudent: Student = {
      id: this.generateUUID(),
      ...student,
      createdAt: now,
      updatedAt: now,
    };
    
    this.students.set(newStudent.id, newStudent);
    return newStudent;
  }

  async getStudents(coachId: string): Promise<Student[]> {
    return Array.from(this.students.values())
      .filter(student => student.coachId === coachId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async updateStudent(id: string, studentData: Partial<InsertStudent>): Promise<Student> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) {
      throw new Error('Student not found');
    }
    
    const updatedStudent: Student = {
      ...existingStudent,
      ...studentData,
      updatedAt: new Date(),
    };
    
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    this.students.delete(id);
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const now = new Date();
    const newEvent: Event = {
      id: this.generateUUID(),
      ...event,
      createdAt: now,
      updatedAt: now,
    };
    
    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async getEvents(coachId: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.coachId === coachId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) {
      throw new Error('Event not found');
    }
    
    const updatedEvent: Event = {
      ...existingEvent,
      ...eventData,
      updatedAt: new Date(),
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    this.events.delete(id);
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance[]): Promise<Attendance[]> {
    const results = [];
    for (const data of attendanceData) {
      const now = new Date();
      const attendanceId = `${data.studentId}-${data.date}`;
      
      const attendance: Attendance = {
        id: this.generateUUID(),
        ...data,
        createdAt: now,
      };
      
      this.attendance.set(attendanceId, attendance);
      results.push(attendance);
    }
    return results;
  }

  async getAttendance(coachId: string, date?: Date): Promise<Attendance[]> {
    const allAttendance = Array.from(this.attendance.values())
      .filter(record => record.coachId === coachId);
    
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      return allAttendance.filter(record => record.date === dateStr)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return allAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAttendanceByDateRange(coachId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return Array.from(this.attendance.values())
      .filter(record => {
        const recordDate = record.date;
        return record.coachId === coachId && 
               recordDate >= startStr && 
               recordDate <= endStr;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Performance operations
  async recordPerformance(performance: InsertPerformance): Promise<Performance> {
    const now = new Date();
    const newPerformance: Performance = {
      id: this.generateUUID(),
      ...performance,
      createdAt: now,
    };
    
    this.performances.set(newPerformance.id, newPerformance);
    return newPerformance;
  }

  async getStudentPerformances(studentId: string): Promise<Performance[]> {
    return Array.from(this.performances.values())
      .filter(performance => performance.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getEventPerformances(eventId: string): Promise<Performance[]> {
    return Array.from(this.performances.values())
      .filter(performance => performance.eventId === eventId)
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }

  // Dashboard stats
  async getDashboardStats(coachId: string): Promise<{
    totalStudents: number;
    eventsThisWeek: number;
    averageAttendance: number;
    personalBests: number;
  }> {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Count students
    const coachStudents = Array.from(this.students.values())
      .filter(student => student.coachId === coachId);
    const totalStudents = coachStudents.length;

    // Count events this week
    const eventsThisWeek = Array.from(this.events.values())
      .filter(event => {
        const eventDate = new Date(event.date);
        return event.coachId === coachId && 
               eventDate >= weekStart && 
               eventDate <= weekEnd;
      }).length;

    // Count personal bests
    const personalBests = Array.from(this.performances.values())
      .filter(performance => {
        const student = this.students.get(performance.studentId);
        return student?.coachId === coachId && performance.personalBest;
      }).length;

    // Calculate average attendance for current month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const attendanceData = await this.getAttendanceByDateRange(coachId, monthStart, new Date());
    const totalAttendanceRecords = attendanceData.length;
    const presentCount = attendanceData.filter(a => a.present).length;
    const averageAttendance = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

    return {
      totalStudents,
      eventsThisWeek,
      averageAttendance,
      personalBests,
    };
  }
}

export const storage = new MemoryStorage();