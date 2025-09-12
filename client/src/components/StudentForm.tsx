import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertStudentSchema, type Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertStudentSchema.extend({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
}).omit({ coachId: true });

interface StudentFormProps {
  student?: Student | null;
  onClose: () => void;
}

export function StudentForm({ student, onClose }: StudentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student?.name || "",
      gender: student?.gender || "male",
      dateOfBirth: student?.dateOfBirth || "",
      joiningDate: student?.joiningDate || new Date().toISOString().split('T')[0],
      address: student?.address || "",
      medicalConditions: student?.medicalConditions || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await apiRequest("POST", "/api/students", data);
    },
    onSuccess: () => {
      toast({
        title: "Student created",
        description: "Student has been successfully added to your roster.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
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
        description: "Failed to create student. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await apiRequest("PUT", `/api/students/${student!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Student updated",
        description: "Student information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
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
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (student) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div data-testid="student-form">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter student's full name" {...field} data-testid="input-student-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-student-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-student-dob" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="joiningDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joining Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-student-joining" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter student's address"
                    className="resize-none" 
                    {...field} 
                    data-testid="textarea-student-address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medicalConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medical Conditions</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any medical conditions or notes"
                    className="resize-none" 
                    {...field} 
                    data-testid="textarea-student-medical"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-student"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              data-testid="button-save-student"
            >
              {isLoading ? "Saving..." : student ? "Update Student" : "Add Student"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
