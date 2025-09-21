import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
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
  Activity
} from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
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
              {/* Empty state - no mock data */}
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Recent Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Activity will appear here when students achieve milestones or events are completed.
                </p>
              </div>
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
