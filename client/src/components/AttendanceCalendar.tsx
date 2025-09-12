import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Attendance } from "@shared/schema";

interface AttendanceCalendarProps {
  attendanceData: Attendance[];
  currentMonth: Date;
}

export function AttendanceCalendar({ attendanceData, currentMonth }: AttendanceCalendarProps) {
  const today = new Date();
  const currentDate = new Date(currentMonth);
  
  // Get first day of month and calculate calendar layout
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Create calendar days array
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getDayAttendanceData = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    
    const dayAttendance = attendanceData.filter(record => record.date === dateStr);
    
    if (dayAttendance.length === 0) return null;
    
    const present = dayAttendance.filter(record => record.present).length;
    const total = dayAttendance.length;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    
    return { present, total, percentage };
  };

  const getAttendanceIndicator = (day: number) => {
    const data = getDayAttendanceData(day);
    if (!data) return null;
    
    if (data.percentage >= 80) {
      return "bg-secondary"; // High attendance - green
    } else if (data.percentage >= 50) {
      return "bg-accent"; // Medium attendance - yellow
    } else {
      return "bg-destructive"; // Low attendance - red
    }
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div data-testid="attendance-calendar">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-3" />;
          }

          const attendanceData = getDayAttendanceData(day);
          const indicator = getAttendanceIndicator(day);
          const todayClass = isToday(day);
          
          return (
            <Button
              key={day}
              variant="ghost"
              className={cn(
                "relative p-3 text-center text-sm h-auto hover:bg-muted transition-colors",
                todayClass ? "bg-primary text-primary-foreground font-medium" : "text-card-foreground"
              )}
              data-testid={`calendar-day-${day}`}
            >
              {day}
              {indicator && (
                <div 
                  className={cn(
                    "absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full",
                    indicator
                  )}
                  data-testid={`attendance-indicator-${day}`}
                />
              )}
            </Button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-secondary rounded-full" />
          <span className="text-muted-foreground">High Attendance (80%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-accent rounded-full" />
          <span className="text-muted-foreground">Medium Attendance (50-79%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-destructive rounded-full" />
          <span className="text-muted-foreground">Low Attendance (&lt;50%)</span>
        </div>
      </div>
    </div>
  );
}
