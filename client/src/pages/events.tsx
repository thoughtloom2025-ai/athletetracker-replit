import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar, 
  Users, 
  RotateCcw, 
  Play, 
  Edit, 
  Share,
  Eye,
  Clock,
  Trophy,
  FileText,
  Trash2
} from "lucide-react";
import { EventForm } from "@/components/EventForm";
import type { Event, Student, Performance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Events() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedEventResults, setSelectedEventResults] = useState<{
    event: Event;
    rankings: Array<{
      student: Student;
      bestPerformance: string;
      rank: number;
    }>;
  } | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const startEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("PUT", `/api/events/${eventId}`, { status: "in_progress" });
    },
    onSuccess: () => {
      toast({
        title: "Event started",
        description: "Event has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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
        description: "Failed to start event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "Event has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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
        description: "Failed to delete event. Please try again.",
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

  // Filter events
  const filteredEvents = events.filter((event: Event) => {
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      matchesDate = eventDate === dateFilter;
    }
    
    return matchesType && matchesStatus && matchesDate;
  });

  // Find live events
  const liveEvents = events.filter((event: Event) => event.status === "in_progress");

  const handleStartEvent = (eventId: string) => {
    if (window.confirm("Are you sure you want to start this event?")) {
      startEventMutation.mutate(eventId);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleRecordEvent = (eventId: string) => {
    setLocation(`/events/${eventId}/record`);
  };

  const handleDeleteEvent = (eventId: string, eventName: string) => {
    if (window.confirm(`Are you sure you want to delete the event "${eventName}"? This action cannot be undone.`)) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const calculateRankings = (event: Event, performances: Performance[], students: Student[]) => {
    // Group performances by student and get their best performance
    const studentPerformances = new Map<string, Performance[]>();
    
    // Filter out performances with null or empty measurements
    const validPerformances = performances.filter(p => p.measurement && p.measurement.trim());
    
    validPerformances.forEach(performance => {
      if (!studentPerformances.has(performance.studentId)) {
        studentPerformances.set(performance.studentId, []);
      }
      studentPerformances.get(performance.studentId)!.push(performance);
    });

    const rankings: Array<{
      student: Student;
      bestPerformance: string;
      numericValue: number;
    }> = [];
    
    // Use forEach instead of for...of to avoid MapIterator ES target error
    studentPerformances.forEach((studentPerfs: Performance[], studentId: string) => {
      const student = students.find(s => s.id === studentId);
      if (!student || studentPerfs.length === 0) return;
      
      // Get best performance based on event type
      let bestPerformance: Performance;
      
      if (event.type === "running") {
        // For running, lower time is better
        bestPerformance = studentPerfs.reduce<Performance>((best: Performance, current: Performance) => {
          const bestMeasurement = best.measurement || "999999";
          const currentMeasurement = current.measurement || "999999";
          const bestTime = parseFloat(bestMeasurement.replace(/[^0-9.]/g, ''));
          const currentTime = parseFloat(currentMeasurement.replace(/[^0-9.]/g, ''));
          return currentTime < bestTime ? current : best;
        }, studentPerfs[0]);
      } else {
        // For jumps and throws, higher distance is better
        bestPerformance = studentPerfs.reduce<Performance>((best: Performance, current: Performance) => {
          const bestMeasurement = best.measurement || "0";
          const currentMeasurement = current.measurement || "0";
          const bestDistance = parseFloat(bestMeasurement.replace(/[^0-9.]/g, ''));
          const currentDistance = parseFloat(currentMeasurement.replace(/[^0-9.]/g, ''));
          return currentDistance > bestDistance ? current : best;
        }, studentPerfs[0]);
      }
      
      // Ensure bestPerformance.measurement is not null
      const measurementValue = bestPerformance.measurement || "0";
      
      rankings.push({
        student,
        bestPerformance: measurementValue,
        numericValue: parseFloat(measurementValue.replace(/[^0-9.]/g, '')),
      });
    });
    
    // Sort rankings based on event type
    if (event.type === "running") {
      rankings.sort((a, b) => a.numericValue - b.numericValue); // Lower is better for running
    } else {
      rankings.sort((a, b) => b.numericValue - a.numericValue); // Higher is better for distance/height
    }
    
    // Add rank numbers
    return rankings.map((ranking, index) => ({
      ...ranking,
      rank: index + 1,
    }));
  };

  const handleViewResults = async (event: Event) => {
    try {
      // Fetch performances for this event
      const performances = await queryClient.fetchQuery<Performance[]>({
        queryKey: ["/api/performances/event", event.id],
      });
      
      const rankings = calculateRankings(event, performances, students);
      
      setSelectedEventResults({
        event,
        rankings,
      });
      setResultsDialogOpen(true);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to load event results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareResults = async (event: Event, rankings: Array<{ student: Student; bestPerformance: string; rank: number }>) => {
    const resultText = `${event.name} Results\n\n` +
      rankings.map(r => `${r.rank}. ${r.student.name} - ${r.bestPerformance}`).join('\n') +
      `\n\nEvent: ${(event.type || "").replace('_', ' ')}\n` +
      `Date: ${new Date(event.date).toLocaleDateString()}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.name} - Results`,
          text: resultText,
        });
      } catch (error: unknown) {
        // User cancelled the share
        const errorObj = error as { name?: string };
        if (errorObj.name !== 'AbortError') {
          toast({
            title: "Share failed",
            description: "Failed to share results. Please try again.",
            variant: "destructive",
          });
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(resultText);
        toast({
          title: "Results copied",
          description: "Results have been copied to your clipboard.",
        });
      } catch (error: unknown) {
        toast({
          title: "Copy failed",
          description: "Failed to copy results to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "planned":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "running":
        return "bg-primary/10 text-primary";
      case "long_jump":
        return "bg-secondary/10 text-secondary";
      case "high_jump":
        return "bg-chart-3/10 text-chart-3";
      case "shot_put":
        return "bg-chart-4/10 text-chart-4";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading || eventsLoading) {
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

  return (
    <div className="p-4 lg:p-6" data-testid="events-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-events-title">
            Events
          </h1>
          <p className="text-muted-foreground mt-1">Manage athletic events and track live performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 min-h-[44px]" data-testid="button-create-event">
              <Plus className="h-5 w-5 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>
            <EventForm 
              event={editingEvent} 
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>

        {/* Results Dialog */}
        <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEventResults?.event.name} - Results
              </DialogTitle>
            </DialogHeader>
            
            {selectedEventResults && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-primary/10 text-primary">
                      {(selectedEventResults.event.type || "").replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedEventResults.event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <Button 
                    onClick={() => handleShareResults(selectedEventResults.event, selectedEventResults.rankings)}
                    data-testid="button-share-results-modal"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share Results
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Best Performance</TableHead>
                      <TableHead className="w-16">
                        <Trophy className="h-4 w-4" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEventResults.rankings.map((ranking) => (
                      <TableRow key={ranking.student.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {ranking.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            {ranking.rank === 2 && <div className="w-4 h-4 rounded-full bg-gray-400"></div>}
                            {ranking.rank === 3 && <div className="w-4 h-4 rounded-full bg-amber-600"></div>}
                            <span>{ranking.rank}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {ranking.student.name}
                        </TableCell>
                        <TableCell className="font-mono">
                          {ranking.bestPerformance}
                        </TableCell>
                        <TableCell>
                          {ranking.rank <= 3 && (
                            <Badge variant={ranking.rank === 1 ? "default" : "secondary"}>
                              {ranking.rank === 1 ? "1st" : ranking.rank === 2 ? "2nd" : "3rd"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {selectedEventResults.rankings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No performance data available for this event.
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Filters */}
      <Card className="p-4 mb-6" data-testid="card-filters">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-type-filter">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="long_jump">Long Jump</SelectItem>
              <SelectItem value="high_jump">High Jump</SelectItem>
              <SelectItem value="shot_put">Shot Put</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-[180px]"
            data-testid="input-date-filter"
          />
        </div>
      </Card>

      

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {events.length === 0 ? "No Events Yet" : "No Events Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {events.length === 0 
                ? "Create your first event to start tracking athletic performance."
                : "Try adjusting your filters to find events."
              }
            </p>
            {events.length === 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-first-event">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <EventForm onClose={handleCloseDialog} />
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="events-list">
          {filteredEvents.map((event: Event) => (
            <Card key={event.id} data-testid={`card-event-${event.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-card-foreground" data-testid={`text-event-name-${event.id}`}>
                        {event.name}
                      </h3>
                      <Badge 
                        className={getEventTypeColor(event.type || "")}
                        data-testid={`badge-event-type-${event.id}`}
                      >
                        {(event.type || "").replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={getStatusBadgeVariant(event.status || "")}
                        data-testid={`badge-event-status-${event.id}`}
                      >
                        {(event.status || "").replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`text-event-date-${event.id}`}>
                          {new Date(event.date).toLocaleString()}
                        </span>
                      </div>
                      {event.distance && (
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4" />
                          <span data-testid={`text-event-distance-${event.id}`}>
                            {event.distance}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span data-testid={`text-event-participants-${event.id}`}>
                          {event.participants?.length || 0} participants
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RotateCcw className="h-4 w-4" />
                        <span data-testid={`text-event-rounds-${event.id}`}>
                          {event.rounds} rounds
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                      data-testid={`button-edit-event-${event.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      disabled={deleteEventMutation.isPending}
                      data-testid={`button-delete-event-${event.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    
                    {event.status === "completed" ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewResults(event)}
                          data-testid={`button-view-results-${event.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                      </>
                    ) : event.status === "in_progress" ? (
                      <Button 
                        size="sm"
                        onClick={() => handleRecordEvent(event.id)}
                        data-testid={`button-record-event-${event.id}`}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Record
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleStartEvent(event.id)}
                        disabled={startEventMutation.isPending}
                        data-testid={`button-start-event-${event.id}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Event
                      </Button>
                    )}
                  </div>
                </div>

                {/* Additional event info for completed events */}
                {event.status === "completed" && event.results !== null && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-2 text-sm text-secondary">
                      <Trophy className="h-4 w-4" />
                      <span>Event completed successfully</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
