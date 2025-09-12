import { createClient } from '@supabase/supabase-js';
import {
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
import { IStorage } from "./memory-storage";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class SupabaseStorage implements IStorage {
  // Helper function to generate UUID
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      console.error('Error getting user:', error);
      return undefined;
    }
    
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async upsertUser(userData: UpsertUser & { id?: string }): Promise<User> {
    const now = new Date().toISOString();
    const userId = userData.id || this.generateUUID();
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userData.email || null,
        first_name: userData.firstName || null,
        last_name: userData.lastName || null,
        profile_image_url: userData.profileImageUrl || null,
        role: userData.role || 'coach',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      throw new Error('Failed to upsert user');
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Student operations
  async createStudent(student: InsertStudent): Promise<Student> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('students')
      .insert({
        id: this.generateUUID(),
        name: student.name,
        gender: student.gender,
        date_of_birth: student.dateOfBirth,
        joining_date: student.joiningDate,
        address: student.address,
        medical_conditions: student.medicalConditions,
        coach_id: student.coachId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating student:', error);
      throw new Error('Failed to create student');
    }

    return {
      id: data.id,
      name: data.name,
      gender: data.gender,
      dateOfBirth: data.date_of_birth,
      joiningDate: data.joining_date,
      address: data.address,
      medicalConditions: data.medical_conditions,
      coachId: data.coach_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async getStudents(coachId: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting students:', error);
      return [];
    }

    return data.map(student => ({
      id: student.id,
      name: student.name,
      gender: student.gender,
      dateOfBirth: student.date_of_birth,
      joiningDate: student.joining_date,
      address: student.address,
      medicalConditions: student.medical_conditions,
      coachId: student.coach_id,
      createdAt: new Date(student.created_at),
      updatedAt: new Date(student.updated_at),
    }));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Error getting student:', error);
      return undefined;
    }
    
    return {
      id: data.id,
      name: data.name,
      gender: data.gender,
      dateOfBirth: data.date_of_birth,
      joiningDate: data.joining_date,
      address: data.address,
      medicalConditions: data.medical_conditions,
      coachId: data.coach_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateStudent(id: string, studentData: Partial<InsertStudent>): Promise<Student> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (studentData.name !== undefined) updateData.name = studentData.name;
    if (studentData.gender !== undefined) updateData.gender = studentData.gender;
    if (studentData.dateOfBirth !== undefined) updateData.date_of_birth = studentData.dateOfBirth;
    if (studentData.joiningDate !== undefined) updateData.joining_date = studentData.joiningDate;
    if (studentData.address !== undefined) updateData.address = studentData.address;
    if (studentData.medicalConditions !== undefined) updateData.medical_conditions = studentData.medicalConditions;

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating student:', error);
      throw new Error('Failed to update student');
    }

    return {
      id: data.id,
      name: data.name,
      gender: data.gender,
      dateOfBirth: data.date_of_birth,
      joiningDate: data.joining_date,
      address: data.address,
      medicalConditions: data.medical_conditions,
      coachId: data.coach_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting student:', error);
      throw new Error('Failed to delete student');
    }
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        id: this.generateUUID(),
        name: event.name,
        type: event.type,
        date: event.date,
        rounds: event.rounds || 1,
        participants: event.participants || [],
        results: event.results || null,
        coach_id: event.coachId,
        status: event.status || 'planned',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      date: new Date(data.date),
      rounds: data.rounds,
      participants: data.participants,
      results: data.results,
      coachId: data.coach_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async getEvents(coachId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('coach_id', coachId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error getting events:', error);
      return [];
    }

    return data.map(event => ({
      id: event.id,
      name: event.name,
      type: event.type,
      date: new Date(event.date),
      rounds: event.rounds,
      participants: event.participants,
      results: event.results,
      coachId: event.coach_id,
      status: event.status,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
    }));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Error getting event:', error);
      return undefined;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      date: new Date(data.date),
      rounds: data.rounds,
      participants: data.participants,
      results: data.results,
      coachId: data.coach_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (eventData.name !== undefined) updateData.name = eventData.name;
    if (eventData.type !== undefined) updateData.type = eventData.type;
    if (eventData.date !== undefined) updateData.date = eventData.date;
    if (eventData.rounds !== undefined) updateData.rounds = eventData.rounds;
    if (eventData.participants !== undefined) updateData.participants = eventData.participants;
    if (eventData.results !== undefined) updateData.results = eventData.results;
    if (eventData.status !== undefined) updateData.status = eventData.status;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      date: new Date(data.date),
      rounds: data.rounds,
      participants: data.participants,
      results: data.results,
      coachId: data.coach_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance[]): Promise<Attendance[]> {
    const results = [];
    
    for (const data of attendanceData) {
      // First, try to find existing attendance record
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', data.studentId)
        .eq('date', data.date)
        .single();

      let result;
      let error;

      if (existing) {
        // Update existing record
        const { data: updated, error: updateError } = await supabase
          .from('attendance')
          .update({
            present: data.present,
            late: data.late || false,
            coach_id: data.coachId,
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        result = updated;
        error = updateError;
      } else {
        // Insert new record
        const { data: inserted, error: insertError } = await supabase
          .from('attendance')
          .insert({
            id: this.generateUUID(),
            student_id: data.studentId,
            date: data.date,
            present: data.present,
            late: data.late || false,
            coach_id: data.coachId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        result = inserted;
        error = insertError;
      }

      if (error) {
        console.error('Error marking attendance:', error);
        continue;
      }

      results.push({
        id: result.id,
        studentId: result.student_id,
        date: result.date,
        present: result.present,
        late: result.late,
        coachId: result.coach_id,
        createdAt: new Date(result.created_at),
      });
    }
    
    return results;
  }

  async getAttendance(coachId: string, date?: Date): Promise<Attendance[]> {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('coach_id', coachId);

    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      query = query.eq('date', dateStr);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error getting attendance:', error);
      return [];
    }

    return data.map(record => ({
      id: record.id,
      studentId: record.student_id,
      date: record.date,
      present: record.present,
      late: record.late,
      coachId: record.coach_id,
      createdAt: new Date(record.created_at),
    }));
  }

  async getAttendanceByDateRange(coachId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('coach_id', coachId)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error getting attendance by date range:', error);
      return [];
    }

    return data.map(record => ({
      id: record.id,
      studentId: record.student_id,
      date: record.date,
      present: record.present,
      late: record.late,
      coachId: record.coach_id,
      createdAt: new Date(record.created_at),
    }));
  }

  // Performance operations
  async recordPerformance(performance: InsertPerformance): Promise<Performance> {
    const { data, error } = await supabase
      .from('performances')
      .insert({
        id: this.generateUUID(),
        student_id: performance.studentId,
        event_id: performance.eventId,
        measurement: performance.measurement,
        rank: performance.rank,
        round: performance.round || 1,
        personal_best: performance.personalBest || false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording performance:', error);
      throw new Error('Failed to record performance');
    }

    return {
      id: data.id,
      studentId: data.student_id,
      eventId: data.event_id,
      measurement: data.measurement,
      rank: data.rank,
      round: data.round,
      personalBest: data.personal_best,
      createdAt: new Date(data.created_at),
    };
  }

  async getStudentPerformances(studentId: string): Promise<Performance[]> {
    const { data, error } = await supabase
      .from('performances')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting student performances:', error);
      return [];
    }

    return data.map(performance => ({
      id: performance.id,
      studentId: performance.student_id,
      eventId: performance.event_id,
      measurement: performance.measurement,
      rank: performance.rank,
      round: performance.round,
      personalBest: performance.personal_best,
      createdAt: new Date(performance.created_at),
    }));
  }

  async getEventPerformances(eventId: string): Promise<Performance[]> {
    const { data, error } = await supabase
      .from('performances')
      .select('*')
      .eq('event_id', eventId)
      .order('rank', { ascending: true });

    if (error) {
      console.error('Error getting event performances:', error);
      return [];
    }

    return data.map(performance => ({
      id: performance.id,
      studentId: performance.student_id,
      eventId: performance.event_id,
      measurement: performance.measurement,
      rank: performance.rank,
      round: performance.round,
      personalBest: performance.personal_best,
      createdAt: new Date(performance.created_at),
    }));
  }

  // Database health check
  async checkDatabaseHealth(): Promise<{
    isHealthy: boolean;
    connection: boolean;
    tables: { [key: string]: boolean };
    errors: string[];
  }> {
    const healthStatus = {
      isHealthy: true,
      connection: false,
      tables: {
        users: false,
        students: false,
        events: false,
        attendance: false,
        performances: false,
      },
      errors: [] as string[],
    };

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        healthStatus.errors.push(`Connection test failed: ${error.message}`);
        healthStatus.isHealthy = false;
      } else {
        healthStatus.connection = true;
      }

      // Test each table exists and is accessible
      const tables = ['users', 'students', 'events', 'attendance', 'performances'];
      
      for (const table of tables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true })
            .limit(1);
          
          if (tableError) {
            healthStatus.errors.push(`Table ${table} access failed: ${tableError.message}`);
            healthStatus.isHealthy = false;
          } else {
            healthStatus.tables[table] = true;
          }
        } catch (err) {
          healthStatus.errors.push(`Table ${table} check failed: ${err}`);
          healthStatus.isHealthy = false;
        }
      }

    } catch (err) {
      healthStatus.errors.push(`General health check failed: ${err}`);
      healthStatus.isHealthy = false;
    }

    return healthStatus;
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

    // Get total students
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId);

    // Get events this week
    const { count: eventsThisWeek } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .gte('date', weekStart.toISOString())
      .lte('date', weekEnd.toISOString());

    // Get personal bests count
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('coach_id', coachId);

    const studentIds = students?.map(s => s.id) || [];
    
    let personalBests = 0;
    if (studentIds.length > 0) {
      const { count } = await supabase
        .from('performances')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .eq('personal_best', true);
      personalBests = count || 0;
    }

    // Calculate average attendance for current month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const attendanceData = await this.getAttendanceByDateRange(coachId, monthStart, new Date());
    const totalAttendanceRecords = attendanceData.length;
    const presentCount = attendanceData.filter(a => a.present).length;
    const averageAttendance = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

    return {
      totalStudents: totalStudents || 0,
      eventsThisWeek: eventsThisWeek || 0,
      averageAttendance,
      personalBests,
    };
  }
}

export const supabaseStorage = new SupabaseStorage();