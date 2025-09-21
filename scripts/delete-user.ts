
import { db } from "../server/db";
import { users, students, events, attendance, performances, parentInvites } from "../shared/schema";
import { eq } from "drizzle-orm";

async function deleteUserData(email: string) {
  console.log(`Starting deletion process for user: ${email}`);
  
  try {
    // First, find the user
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    const userId = user[0].id;
    console.log(`Found user ID: ${userId}`);
    
    // Get all students belonging to this user (if they're a coach)
    const userStudents = await db.select().from(students).where(eq(students.coachId, userId));
    const studentIds = userStudents.map(s => s.id);
    
    console.log(`Found ${userStudents.length} students belonging to this user`);
    
    // Get all events belonging to this user (if they're a coach)
    const userEvents = await db.select().from(events).where(eq(events.coachId, userId));
    const eventIds = userEvents.map(e => e.id);
    
    console.log(`Found ${userEvents.length} events belonging to this user`);
    
    // Delete in the correct order to maintain referential integrity
    
    // 1. Delete performances for all students and events owned by this user
    if (studentIds.length > 0) {
      for (const studentId of studentIds) {
        const deletedPerformances = await db.delete(performances).where(eq(performances.studentId, studentId));
        console.log(`Deleted performances for student ${studentId}`);
      }
    }
    
    if (eventIds.length > 0) {
      for (const eventId of eventIds) {
        const deletedEventPerformances = await db.delete(performances).where(eq(performances.eventId, eventId));
        console.log(`Deleted performances for event ${eventId}`);
      }
    }
    
    // 2. Delete attendance records for all students owned by this user
    if (studentIds.length > 0) {
      for (const studentId of studentIds) {
        const deletedAttendance = await db.delete(attendance).where(eq(attendance.studentId, studentId));
        console.log(`Deleted attendance for student ${studentId}`);
      }
    }
    
    // Also delete attendance records where this user is the coach
    const deletedCoachAttendance = await db.delete(attendance).where(eq(attendance.coachId, userId));
    console.log(`Deleted attendance records where user was coach`);
    
    // 3. Delete parent invites
    const deletedParentInvites = await db.delete(parentInvites).where(eq(parentInvites.coachId, userId));
    console.log(`Deleted parent invites created by this user`);
    
    const deletedParentClaims = await db.delete(parentInvites).where(eq(parentInvites.parentUserId, userId));
    console.log(`Deleted parent invite claims by this user`);
    
    // 4. Delete events
    if (eventIds.length > 0) {
      const deletedEvents = await db.delete(events).where(eq(events.coachId, userId));
      console.log(`Deleted ${eventIds.length} events`);
    }
    
    // 5. Delete students
    if (studentIds.length > 0) {
      const deletedStudents = await db.delete(students).where(eq(students.coachId, userId));
      console.log(`Deleted ${studentIds.length} students`);
    }
    
    // 6. Finally, delete the user
    const deletedUser = await db.delete(users).where(eq(users.id, userId));
    console.log(`Deleted user: ${email}`);
    
    console.log(`Successfully deleted all data for user: ${email}`);
    
  } catch (error) {
    console.error(`Error deleting user data:`, error);
    throw error;
  }
}

// Run the deletion
const emailToDelete = "rakeshece@gmail.com";
deleteUserData(emailToDelete)
  .then(() => {
    console.log("Deletion completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deletion failed:", error);
    process.exit(1);
  });
