import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Plus,
  ClipboardList,
  CalendarPlus,
  Activity,
  Download,
  Upload,
  Play,
  CheckCircle
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["/api/dashboard/recent-activities"],
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

  const downloadExcelTemplate = () => {
    // Create a sample Excel template
    const template = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        gender: "male",
        dateOfBirth: "15-01-2005",
        fatherName: "Robert Doe",
        motherName: "Jane Doe",
        phoneNumber: "1234567890",
        address: "123 Main St, City, State",
        school: "City High School",
        gradeStudying: "10th Grade",
        attendedCoachingBefore: "false",
        previousCoachClub: "",
        injuryHealthIssues: "",
        medicalConditions: "",
        joiningDate: "15-01-2024"
      },
      {
        name: "Jane Smith",
        email: "",
        gender: "female",
        dateOfBirth: "22-03-2006",
        fatherName: "Mark Smith",
        motherName: "Lisa Smith",
        phoneNumber: "",
        address: "456 Oak Ave, Another City, State",
        school: "Central School",
        gradeStudying: "9th Grade",
        attendedCoachingBefore: "true",
        previousCoachClub: "City Athletics Club",
        injuryHealthIssues: "",
        medicalConditions: "",
        joiningDate: "01-02-2024"
      }
    ];

    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");

    // Download the file
    XLSX.writeFile(wb, "students_import_template.xlsx");

    toast({
      title: "Template Downloaded",
      description: "Excel template has been downloaded successfully.",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import students');
      }

      const result = await response.json();

      toast({
        title: "Import Successful",
        description: `Successfully added ${result.count} new students. Existing students were not affected.`,
      });

      // Invalidate the students query cache to refetch the data
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the page or navigate to students page to see imported data
      setTimeout(() => {
        setLocation("/students");
      }, 1500);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import students. Please check the file format and try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6" data-testid="dashboard-view">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-welcome-message">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! Here's what's happening with your athletes.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card data-testid="card-total-students">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-card-foreground" data-testid="text-total-students">
                  {stats?.totalStudents || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-events-week">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-card-foreground" data-testid="text-total-events">
                  {stats?.totalEvents || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
              <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-attendance">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-card-foreground" data-testid="text-avg-attendance">
                  {stats?.averageAttendance || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Attendance</p>
              </div>
              <div className="h-8 w-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-personal-bests">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-card-foreground" data-testid="text-personal-bests">
                  {stats?.personalBests || 0}
                </p>
                <p className="text-xs text-muted-foreground">Personal Bests</p>
              </div>
              <div className="h-8 w-8 bg-chart-1/10 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6" data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Button 
              className="min-h-[60px] flex items-center justify-center"
              onClick={() => setLocation("/students")}
              data-testid="button-add-student"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Student
            </Button>

            <Button 
              variant="secondary" 
              className="min-h-[60px] flex items-center justify-center"
              onClick={() => setLocation("/events")}
              data-testid="button-create-event"
            >
              <CalendarPlus className="h-5 w-5 mr-2" />
              Create Event
            </Button>

            <Button 
              className="min-h-[60px] flex items-center justify-center bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => setLocation("/attendance")}
              data-testid="button-mark-attendance"
            >
              <ClipboardList className="h-5 w-5 mr-2" />
              Mark Attendance
            </Button>

            <Button 
              variant="outline" 
              className="min-h-[60px] flex items-center justify-center"
              onClick={downloadExcelTemplate}
              data-testid="button-download-template"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Template
            </Button>

            <Button 
              variant="outline" 
              className="min-h-[60px] flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-import-students"
            >
              <Upload className="h-5 w-5 mr-2" />
              Import Students
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            data-testid="file-input-import"
          />
        </CardContent>
      </Card>

      {/* Recent Activity & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="activity-list">
              {!recentActivities || recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Activity will appear here when students are added or events are created.
                  </p>
                </div>
              ) : (
                recentActivities.map((activity: any, index: number) => {
                  const getActivityIcon = () => {
                    switch (activity.icon) {
                      case 'user':
                        return <Users className="h-4 w-4 text-primary" />;
                      case 'calendar':
                        return <Calendar className="h-4 w-4 text-accent" />;
                      case 'play':
                        return <Play className="h-4 w-4 text-chart-1" />;
                      case 'check':
                        return <CheckCircle className="h-4 w-4 text-secondary" />;
                      default:
                        return <Activity className="h-4 w-4 text-muted-foreground" />;
                    }
                  };

                  const getTimeAgo = (timestamp: string) => {
                    const date = new Date(timestamp);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                    return date.toLocaleDateString();
                  };

                  return (
                    <div key={index} className="flex items-start space-x-3 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card data-testid="card-upcoming-events">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Events
            </CardTitle>
            <Button variant="link" className="text-sm" data-testid="button-view-calendar">
              View calendar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="events-list">
              {/* Empty state - no mock data */}
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Upcoming Events</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first event to start tracking athletic performance.
                </p>
                <Button data-testid="button-create-first-event">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}