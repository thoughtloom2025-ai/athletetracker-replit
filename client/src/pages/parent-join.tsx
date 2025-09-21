
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Users, CheckCircle } from "lucide-react";

const parentJoinSchema = z.object({
  parentName: z.string().min(1, "Parent name is required"),
  parentEmail: z.string().email("Please enter a valid email"),
  studentName: z.string().min(1, "Student name is required"),
  phoneNumber: z.string().optional(),
});

export default function ParentJoin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof parentJoinSchema>>({
    resolver: zodResolver(parentJoinSchema),
    defaultValues: {
      parentName: "",
      parentEmail: "",
      studentName: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    // Get invite code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setInviteCode(code);
    }
  }, []);

  const joinMutation = useMutation({
    mutationFn: async (data: z.infer<typeof parentJoinSchema>) => {
      await apiRequest("POST", "/api/parent-invites", {
        ...data,
        inviteCode,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Successfully Joined!",
        description: "You've been connected to the coaching program.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to join using the invite code. Please check the code and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof parentJoinSchema>) => {
    if (!inviteCode) {
      toast({
        title: "Error",
        description: "Invalid invite code. Please use the link provided by your coach.",
        variant: "destructive",
      });
      return;
    }
    joinMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              Welcome to the Program!
            </h2>
            <p className="text-muted-foreground mb-6">
              You've successfully joined the athletics coaching program. The coach will be able to share updates about your child's progress.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join Athletics Program</CardTitle>
          <p className="text-muted-foreground">
            Connect with your child's coach to stay updated on their athletic progress.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Child's Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your child's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {inviteCode && (
                <div className="bg-muted p-3 rounded text-sm">
                  <Label className="text-muted-foreground">Invite Code:</Label>
                  <div className="font-mono">{inviteCode}</div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={joinMutation.isPending || !inviteCode}
              >
                {joinMutation.isPending ? "Joining..." : "Join Program"}
              </Button>

              {!inviteCode && (
                <p className="text-sm text-destructive text-center">
                  Invalid invite link. Please use the link provided by your coach.
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
