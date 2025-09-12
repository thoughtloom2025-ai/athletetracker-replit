import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Trophy
} from "lucide-react";
import { EventForm } from "@/components/EventForm";
import type { Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Events() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
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
                        className={getEventTypeColor(event.type)}
                        data-testid={`badge-event-type-${event.id}`}
                      >
                        {event.type.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={getStatusBadgeVariant(event.status)}
                        data-testid={`badge-event-status-${event.id}`}
                      >
                        {event.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`text-event-date-${event.id}`}>
                          {new Date(event.date).toLocaleString()}
                        </span>
                      </div>
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
                    
                    {event.status === "completed" ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-view-results-${event.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-share-results-${event.id}`}
                        >
                          <Share className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </>
                    ) : event.status === "in_progress" ? (
                      <Button 
                        size="sm"
                        data-testid={`button-continue-event-${event.id}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Continue
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
                {event.status === "completed" && event.results && (
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
