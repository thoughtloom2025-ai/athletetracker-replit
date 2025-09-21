import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Trophy, 
  Timer,
  Target,
  Users,
  CheckCircle
} from "lucide-react";
import type { Event, Student, Performance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface RecordPerformanceProps {
  eventId: string;
}

export default function RecordPerformance({ eventId }: RecordPerformanceProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentRound, setCurrentRound] = useState(1);
  const [performances, setPerformances] = useState<Record<string, string>>({});

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: isAuthenticated && !!eventId,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const { data: existingPerformances = [], isLoading: performancesLoading } = useQuery<Performance[]>({
    queryKey: ["/api/performances/event", eventId],
    enabled: isAuthenticated && !!eventId,
  });

  const savePerformanceMutation = useMutation({
    mutationFn: async (data: { studentId: string; measurement: string; round: number }) => {
      await apiRequest("POST", "/api/performances", {
        studentId: data.studentId,
        eventId,
        measurement: data.measurement,
        round: data.round,
      });
    },
    onSuccess: () => {
      toast({
        title: "Performance saved",
        description: "Student performance has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/performances/event", eventId] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to save performance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const finishEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/events/${eventId}`, { status: "completed" });
    },
    onSuccess: () => {
      toast({
        title: "Event finished",
        description: "Event has been marked as completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setLocation("/events");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to finish event. Please try again.",
        variant: "destructive",
      });
    },
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

  // Filter students participating in this event
  const participatingStudents = students.filter(student => 
    event?.participants?.includes(student.id)
  );

  // Get existing performance for a student in current round
  const getExistingPerformance = (studentId: string, round: number) => {
    return existingPerformances.find(p => 
      p.studentId === studentId && p.eventId === eventId && p.round === round
    );
  };

  const handlePerformanceChange = (studentId: string, value: string) => {
    setPerformances(prev => ({
      ...prev,
      [`${studentId}-${currentRound}`]: value
    }));
  };

  const handleSavePerformance = (studentId: string) => {
    const performanceKey = `${studentId}-${currentRound}`;
    const measurement = performances[performanceKey];
    
    if (!measurement || measurement.trim() === "") {
      toast({
        title: "Invalid measurement",
        description: "Please enter a valid measurement before saving.",
        variant: "destructive",
      });
      return;
    }

    savePerformanceMutation.mutate({
      studentId,
      measurement: measurement.trim(),
      round: currentRound,
    });
  };

  const handleFinishEvent = () => {
    // Check if there are any performance records for this event
    const hasPerformances = existingPerformances.length > 0;
    
    if (!hasPerformances) {
      toast({
        title: "No performances recorded",
        description: "Please record at least one student's performance before finishing the event.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm("Are you sure you want to finish this event? This will mark it as completed and calculate final rankings.")) {
      finishEventMutation.mutate();
    }
  };

  const getEventTypeUnit = (eventType: string) => {
    switch (eventType) {
      case "running":
        return "seconds (e.g., 12.5s)";
      case "long_jump":
      case "high_jump":
        return "meters (e.g., 5.2m)";
      case "shot_put":
      case "javelin":
      case "discus":
        return "meters (e.g., 15.3m)";
      default:
        return "measurement";
    }
  };

  if (isLoading || eventLoading || studentsLoading || performancesLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Event Not Found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              The event you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/events")} data-testid="button-back-to-events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6" data-testid="record-performance-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/events")}
              data-testid="button-back-to-events"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-record-title">
              Record Performance
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-muted-foreground" data-testid="text-event-name">
              {event.name}
            </h2>
            <Badge className="bg-primary/10 text-primary" data-testid="badge-event-type">
              {(event.type || "").replace('_', ' ')}
            </Badge>
            <Badge variant="default" data-testid="badge-event-status">
              {event.status === 'planned' ? 'Planned' : event.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground" data-testid="text-participants-count">
              {participatingStudents.length} participants
            </span>
          </div>
          
          {event?.status === "in_progress" && (
            <Button 
              onClick={handleFinishEvent}
              disabled={finishEventMutation.isPending}
              data-testid="button-finish-event"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finish Event
            </Button>
          )}
        </div>
      </div>

      {/* Round Selection */}
      <Card className="mb-6" data-testid="card-round-selection">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Round Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="round-select">Current Round:</Label>
            <Select 
              value={currentRound.toString()} 
              onValueChange={(value) => setCurrentRound(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]" data-testid="select-round">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: event.rounds || 1 }, (_, i) => i + 1).map((round) => (
                  <SelectItem key={round} value={round.toString()}>
                    Round {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              Expected format: {getEventTypeUnit(event.type || "")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recording */}
      {participatingStudents.length === 0 ? (
        <Card data-testid="card-no-participants">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Participants
            </h3>
            <p className="text-sm text-muted-foreground">
              This event has no participants assigned. Add students to the event to start recording performances.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="students-performance-list">
          {participatingStudents.map((student) => {
            const existingPerformance = getExistingPerformance(student.id, currentRound);
            const performanceKey = `${student.id}-${currentRound}`;
            const currentValue = performances[performanceKey] || existingPerformance?.measurement || "";

            return (
              <Card key={student.id} data-testid={`card-student-performance-${student.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground" data-testid={`text-student-name-${student.id}`}>
                          {student.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {student.gender} • Age: {new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`performance-${student.id}`} className="text-sm whitespace-nowrap">
                          Round {currentRound} Performance:
                        </Label>
                        <Input
                          id={`performance-${student.id}`}
                          value={currentValue || ""}
                          onChange={(e) => handlePerformanceChange(student.id, e.target.value)}
                          placeholder={getEventTypeUnit(event.type || "")}
                          className="w-32"
                          data-testid={`input-performance-${student.id}`}
                        />
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSavePerformance(student.id)}
                        disabled={savePerformanceMutation.isPending || !currentValue.trim()}
                        data-testid={`button-save-performance-${student.id}`}
                        className="w-fit"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Show existing performance if any */}
                  {existingPerformance && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        <span>Current record for Round {currentRound}: </span>
                        <span className="font-medium text-foreground" data-testid={`text-existing-performance-${student.id}`}>
                          {existingPerformance.measurement}
                        </span>
                        {existingPerformance.personalBest && (
                          <Badge variant="secondary" className="text-xs">
                            Personal Best
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}