import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  date,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("coach"), // coach, admin, parent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const eventTypeEnum = pgEnum("event_type", ["running", "long_jump", "high_jump", "shot_put", "javelin", "discus"]);
export const eventStatusEnum = pgEnum("event_status", ["planned", "in_progress", "completed"]);

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  gender: genderEnum("gender").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  fatherName: varchar("father_name", { length: 255 }),
  motherName: varchar("mother_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  address: text("address"),
  school: varchar("school", { length: 255 }),
  gradeStudying: varchar("grade_studying", { length: 100 }),
  attendedCoachingBefore: boolean("attended_coaching_before").default(false),
  previousCoachClub: varchar("previous_coach_club", { length: 255 }),
  injuryHealthIssues: text("injury_health_issues"),
  joiningDate: date("joining_date").notNull(),
  medicalConditions: text("medical_conditions"),
  coachId: varchar("coach_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: eventTypeEnum("type").notNull(),
  date: timestamp("date").notNull(),
  distance: varchar("distance", { length: 100 }), // e.g., "100m", "5km", "High Jump"
  rounds: integer("rounds").default(1),
  participants: text("participants").array(), // Array of student IDs
  results: jsonb("results"), // Store performance results
  coachId: varchar("coach_id").notNull().references(() => users.id),
  status: eventStatusEnum("status").default("planned"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  date: date("date").notNull(),
  present: boolean("present").notNull(),
  late: boolean("late").default(false),
  coachId: varchar("coach_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint to prevent duplicate attendance records for same student on same date
  uniqueIndex("attendance_student_date_unique").on(table.studentId, table.date),
]);

// Performance records table
export const performances = pgTable("performances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  eventId: varchar("event_id").notNull().references(() => events.id),
  measurement: varchar("measurement"), // e.g., "12.5s", "5.2m", "1.65m"
  rank: integer("rank"),
  round: integer("round").default(1),
  personalBest: boolean("personal_best").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Parent invites table
export const parentInvites = pgTable("parent_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().references(() => users.id),
  inviteCode: varchar("invite_code", { length: 50 }).notNull().unique(),
  parentName: varchar("parent_name", { length: 255 }).notNull(),
  parentEmail: varchar("parent_email", { length: 255 }).notNull(),
  studentName: varchar("student_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = insertUserSchema.extend({
  id: z.string().optional(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceSchema = createInsertSchema(performances).omit({
  id: true,
  createdAt: true,
});

export const insertParentInviteSchema = createInsertSchema(parentInvites).omit({
  id: true,
  createdAt: true,
  joinedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type Performance = typeof performances.$inferSelect;
export type InsertParentInvite = z.infer<typeof insertParentInviteSchema>;
export type ParentInvite = typeof parentInvites.$inferSelect;