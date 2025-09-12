-- Student Athletics Performance Tracking Database Schema
-- Run this SQL script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table (for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE,
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  role varchar DEFAULT 'coach',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
    CREATE TYPE gender AS ENUM ('male', 'female', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('running', 'long_jump', 'high_jump', 'shot_put', 'javelin', 'discus');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('planned', 'in_progress', 'completed');
  END IF;
END
$$;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  gender gender NOT NULL,
  date_of_birth date NOT NULL,
  joining_date date NOT NULL,
  address text,
  medical_conditions text,
  coach_id varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create events table  
CREATE TABLE IF NOT EXISTS events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  type event_type NOT NULL,
  date timestamp NOT NULL,
  rounds integer DEFAULT 1,
  participants text[],
  results jsonb,
  coach_id varchar NOT NULL REFERENCES users(id),
  status event_status DEFAULT 'planned',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id varchar NOT NULL REFERENCES students(id),
  date date NOT NULL,
  present boolean NOT NULL,
  late boolean DEFAULT false,
  coach_id varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now()
);

-- Create performances table
CREATE TABLE IF NOT EXISTS performances (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id varchar NOT NULL REFERENCES students(id),
  event_id varchar NOT NULL REFERENCES events(id),
  measurement varchar,
  rank integer,
  round integer DEFAULT 1,
  personal_best boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_coach_id ON students(coach_id);
CREATE INDEX IF NOT EXISTS idx_events_coach_id ON events(coach_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_attendance_coach_id ON attendance(coach_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_performances_student_id ON performances(student_id);
CREATE INDEX IF NOT EXISTS idx_performances_event_id ON performances(event_id);

-- Insert sample data (optional - for testing)
-- Uncomment the following lines if you want sample data

/*
-- Sample coach user
INSERT INTO users (id, email, first_name, last_name, role) VALUES 
('coach-1', 'coach@example.com', 'John', 'Coach', 'coach');

-- Sample students
INSERT INTO students (name, gender, date_of_birth, joining_date, coach_id) VALUES 
('Alice Johnson', 'female', '2008-03-15', '2023-01-15', 'coach-1'),
('Bob Smith', 'male', '2007-08-22', '2023-01-15', 'coach-1'),
('Charlie Brown', 'male', '2008-11-10', '2023-02-01', 'coach-1');

-- Sample event
INSERT INTO events (name, type, date, coach_id) VALUES 
('Spring Track Meet', 'running', '2024-04-15 10:00:00', 'coach-1');
*/