import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Download,
  FileText,
  BarChart3,
  Users,
  TrendingUp
} from "lucide-react";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { useToast } from "@/hooks/use-toast";

export default function Attendance() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: attendanceData = [] } = useQuery({
    queryKey: ["/api/attendance"],
    enabled: isAuthenticated,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  // Handle unauthorized access
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Calculate today's attendance stats
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceData.filter((record: any) => 
    record.date === today
  );
  const presentToday = todayAttendance.filter((record: any) => record.present).length;
  const totalStudents = students.length;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;
  const absentStudents = todayAttendance.filter((record: any) => !record.present);
  const lateStudents = todayAttendance.filter((record: any) => record.late);

  // Calculate monthly stats
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const monthlyAttendance = attendanceData.filter((record: any) => {
    const recordDate = new Date(record.date);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });
  const monthlyPresent = monthlyAttendance.filter((record: any) => record.present).length;
  const monthlyTotal = monthlyAttendance.length;
  const monthlyPercentage = monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0;

  // Count training days this month
  const trainingDays = new Set(monthlyAttendance.map((record: any) => record.date)).size;

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6" data-testid="attendance-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-attendance-title">
            Attendance
          </h1>
          <p className="text-muted-foreground mt-1">Track daily attendance and view patterns</p>
        </div>
        <Button className="mt-4 sm:mt-0 min-h-[44px]" data-testid="button-mark-attendance">
          <ClipboardList className="h-5 w-5 mr-2" />
          Mark Today's Attendance
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card data-testid="card-calendar">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AttendanceCalendar 
                attendanceData={attendanceData}
                currentMonth={currentMonth}
              />
            </CardContent>
          </Card>
        </div>

        {/* Attendance Summary */}
        <div className="space-y-6">
          
          {/* Today's Attendance */}
          <Card data-testid="card-today-attendance">
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-secondary" data-testid="text-today-present">
                  {presentToday}/{totalStudents}
                </p>
                <p className="text-sm text-muted-foreground">Students Present</p>
                <p className="text-lg font-semibold text-secondary" data-testid="text-today-percentage">
                  {attendancePercentage}%
                </p>
              </div>

              {(absentStudents.length > 0 || lateStudents.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-card-foreground">Issues Today</h4>
                  <div className="space-y-1">
                    {absentStudents.map((record: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Student {index + 1}</span>
                        <Badge variant="destructive" className="text-xs">Absent</Badge>
                      </div>
                    ))}
                    {lateStudents.map((record: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Student {index + 1}</span>
                        <Badge variant="secondary" className="text-xs">Late</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-4 min-h-[44px]" 
                variant="outline"
                data-testid="button-edit-today-attendance"
              >
                Edit Today's Attendance
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Stats */}
          <Card data-testid="card-monthly-stats">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Attendance</span>
                  <span className="text-sm font-semibold text-secondary" data-testid="text-monthly-percentage">
                    {monthlyPercentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Training Days</span>
                  <span className="text-sm font-semibold text-card-foreground" data-testid="text-training-days">
                    {trainingDays}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Records</span>
                  <span className="text-sm font-semibold text-card-foreground" data-testid="text-total-records">
                    {monthlyTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Present Records</span>
                  <span className="text-sm font-semibold text-chart-1" data-testid="text-present-records">
                    {monthlyPresent}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card data-testid="card-export">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px]"
                  data-testid="button-export-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Monthly Report (PDF)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px]"
                  data-testid="button-export-excel"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Raw Data (Excel)
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
