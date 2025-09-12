import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertEventSchema, type Event, type Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertEventSchema.extend({
  name: z.string().min(1, "Event name is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Event date is required and must be in YYYY-MM-DD format"),
  participants: z.array(z.string()).optional(),
}).omit({ coachId: true });

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
}

export function EventForm({ event, onClose }: EventFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    event?.participants || []
  );

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: event?.name || "",
      type: event?.type || "running",
      date: event?.date ? new Date(event.date).toISOString().slice(0, 10) : "",
      rounds: event?.rounds || 1,
      participants: event?.participants || [],
      status: event?.status || "planned",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const eventData = {
        ...data,
        date: new Date(data.date + 'T00:00:00').toISOString(),
        participants: selectedParticipants,
      };
      await apiRequest("POST", "/api/events", eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Event has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
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
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const eventData = {
        ...data,
        date: new Date(data.date + 'T00:00:00').toISOString(),
        participants: selectedParticipants,
      };
      await apiRequest("PUT", `/api/events/${event!.id}`, eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "Event has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onClose();
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
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (event) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleParticipantToggle = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedParticipants(prev => [...prev, studentId]);
    } else {
      setSelectedParticipants(prev => prev.filter(id => id !== studentId));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div data-testid="event-form">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event name" {...field} data-testid="input-event-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-event-type">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="long_jump">Long Jump</SelectItem>
                    <SelectItem value="high_jump">High Jump</SelectItem>
                    <SelectItem value="shot_put">Shot Put</SelectItem>
                    <SelectItem value="javelin">Javelin</SelectItem>
                    <SelectItem value="discus">Discus</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-event-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rounds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Rounds</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    data-testid="input-event-rounds"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {event && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-event-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="space-y-3">
            <Label>Participants</Label>
            <div className="border border-border rounded-md p-4 max-h-40 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students available. Add students first.</p>
              ) : (
                <div className="space-y-2">
                  {students.map((student: Student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`participant-${student.id}`}
                        checked={selectedParticipants.includes(student.id)}
                        onCheckedChange={(checked) => 
                          handleParticipantToggle(student.id, checked as boolean)
                        }
                        data-testid={`checkbox-participant-${student.id}`}
                      />
                      <Label 
                        htmlFor={`participant-${student.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {student.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {selectedParticipants.length} student{selectedParticipants.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-event"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              data-testid="button-save-event"
            >
              {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
