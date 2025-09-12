import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up database tables...');

  try {
    // Create sessions table (for Replit Auth)
    const { error: sessionsError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS sessions (
          sid varchar PRIMARY KEY,
          sess jsonb NOT NULL,
          expire timestamp NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
      `
    });

    if (sessionsError) {
      console.log('Sessions table may already exist or RPC not available. Trying alternative approach...');
    }

    // Create users table
    const { error: usersError } = await supabase.rpc('execute_sql', {
      query: `
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
      `
    });

    if (usersError) {
      console.log('Users table may already exist or RPC not available. Trying direct table creation...');
    }

    // Create enums first
    await supabase.rpc('execute_sql', {
      query: `
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
      `
    });

    // Create students table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS students (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          name varchar(255) NOT NULL,
          gender gender NOT NULL,
          date_of_birth date NOT NULL,
          joining_date date NOT NULL,
          address text,
          medical_conditions text,
          coach_id varchar NOT NULL,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now(),
          FOREIGN KEY (coach_id) REFERENCES users(id)
        );
      `
    });

    // Create events table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS events (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          name varchar(255) NOT NULL,
          type event_type NOT NULL,
          date timestamp NOT NULL,
          rounds integer DEFAULT 1,
          participants text[],
          results jsonb,
          coach_id varchar NOT NULL,
          status event_status DEFAULT 'planned',
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now(),
          FOREIGN KEY (coach_id) REFERENCES users(id)
        );
      `
    });

    // Create attendance table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS attendance (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id varchar NOT NULL,
          date date NOT NULL,
          present boolean NOT NULL,
          late boolean DEFAULT false,
          coach_id varchar NOT NULL,
          created_at timestamp DEFAULT now(),
          FOREIGN KEY (student_id) REFERENCES students(id),
          FOREIGN KEY (coach_id) REFERENCES users(id)
        );
      `
    });

    // Create performances table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS performances (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id varchar NOT NULL,
          event_id varchar NOT NULL,
          measurement varchar,
          rank integer,
          round integer DEFAULT 1,
          personal_best boolean DEFAULT false,
          created_at timestamp DEFAULT now(),
          FOREIGN KEY (student_id) REFERENCES students(id),
          FOREIGN KEY (event_id) REFERENCES events(id)
        );
      `
    });

    console.log('Database setup completed successfully!');
    return true;

  } catch (error) {
    console.error('Error setting up database:', error);
    console.log('Attempting alternative setup using SQL execution...');
    
    // Alternative: Try direct SQL execution
    try {
      const sql = `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Create sessions table
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
      `;

      console.log('\nSQL Script to run in Supabase Dashboard:');
      console.log('==========================================');
      console.log(sql);
      console.log('==========================================');
      
      return false; // Manual setup required
    } catch (altError) {
      console.error('Alternative setup also failed:', altError);
      return false;
    }
  }
}

// Auto-run setup
setupDatabase().then(success => {
  if (success) {
    console.log('✅ Database setup completed automatically');
    process.exit(0);
  } else {
    console.log('⚠️  Manual setup required - see SQL script above');
    console.log('Copy and paste the SQL script into your Supabase SQL Editor');
    process.exit(1);
  }
});

export { setupDatabase };