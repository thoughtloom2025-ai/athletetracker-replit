# AthleteTracker Pro - Student Athletics Performance Management

## Overview

AthleteTracker Pro is a comprehensive web application designed for tracking student athletic performance. Built as a mobile-first application, it serves coaches and administrators with secure authentication and comprehensive data management capabilities. The system allows coaches to manage student profiles, organize athletic events, track attendance, record performance metrics, and generate reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming, supporting both light and dark modes
- **State Management**: TanStack React Query for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Mobile-First Design**: Responsive layout with touch-optimized components (44px minimum touch targets)

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Database**: In-memory storage for data persistence (production-ready PostgreSQL integration available)
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with in-memory session store (MemoryStore)
- **API Design**: RESTful API endpoints with role-based access control
- **File Processing**: ESBuild for server-side bundling and Vite for development

### Data Storage Solutions
- **Current Storage**: In-memory storage using Map-based data structures for immediate functionality
- **ORM Ready**: Drizzle ORM with schema-first approach configured for PostgreSQL migration
- **Migration Path**: Ready to migrate to PostgreSQL with proper DATABASE_URL configuration
- **Session Storage**: In-memory session storage using MemoryStore package

### Database Schema Design
- **Users Table**: Stores coach and admin profiles with role-based access
- **Students Table**: Complete student profiles with personal and medical information
- **Events Table**: Athletic events with type classification and status tracking
- **Attendance Table**: Date-based attendance tracking linked to students and events
- **Performances Table**: Detailed performance metrics with measurements and timestamps
- **Sessions Table**: Secure session management for authentication

### Authentication and Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **Role-Based Access**: Coach and Admin roles with appropriate permissions
- **Security**: CSRF protection, rate limiting, and secure token handling

### Build and Development
- **Development**: Vite with Hot Module Replacement for fast development
- **Production Build**: Vite for client-side bundling, ESBuild for server bundling
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **Code Splitting**: Lazy loading and dynamic imports for performance optimization

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Connection**: @neondatabase/serverless for database connectivity

### Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Session Management**: connect-pg-simple for PostgreSQL session storage

### UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Inter font family via Google Fonts

### Development Tools
- **Build Tools**: Vite, ESBuild, TypeScript compiler
- **Validation**: Zod for runtime type validation
- **Form Management**: React Hook Form with @hookform/resolvers
- **State Management**: TanStack React Query for server state

### Security and Utilities
- **Password Hashing**: bcryptjs for secure password handling
- **Date Management**: date-fns for date manipulation and formatting
- **Utility Libraries**: clsx and tailwind-merge for conditional styling

## Current Status (December 2024)

### ✅ Completed Features
- **Authentication System**: Fully functional Replit Auth with session management
- **Core Application**: React frontend with mobile-first responsive design
- **Data Storage**: Complete in-memory storage system with all CRUD operations
- **UI Components**: Full shadcn/ui component library with light/dark theme support
- **API Endpoints**: All REST endpoints implemented and tested
- **Application Pages**: Dashboard, Students, Events, Attendance, and Reports pages
- **Form Management**: Student and Event forms with validation

### 🔧 Current Configuration
- **Session Storage**: MemoryStore (in-memory sessions)
- **Data Persistence**: Memory-based storage for all application data
- **Authentication**: Working Replit Auth integration
- **Database**: PostgreSQL database provisioned but not yet connected

### 🚀 Next Steps for Production
1. **Database Migration**: Update DATABASE_URL to point to the Neon PostgreSQL instance
2. **Schema Migration**: Run `npm run db:push` to create tables in PostgreSQL
3. **Storage Migration**: Switch from MemoryStorage to DatabaseStorage in `server/storage.ts`
4. **Session Storage**: Optionally migrate sessions to PostgreSQL for persistence across restarts
5. **Data Migration**: Consider seeding initial data or providing import functionality

### 📝 Development Notes
- All database schemas are defined in `shared/schema.ts` using Drizzle ORM
- Storage interface is consistent between memory and database implementations
- Application is fully functional with current in-memory storage
- Authentication and session management working correctly