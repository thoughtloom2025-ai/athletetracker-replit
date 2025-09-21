
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useParentRegistration() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasCompletedRegistration, setHasCompletedRegistration] = useState(false);

  const completeMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      return await apiRequest("POST", "/api/auth/complete-parent-registration", { inviteCode });
    },
    onSuccess: () => {
      localStorage.removeItem('parentInviteCode');
      setHasCompletedRegistration(true);
      toast({
        title: "Registration Complete!",
        description: "You've successfully joined the athletics program.",
      });
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Parent registration error:", error);
      const errorMessage = error?.message || "Failed to complete registration. Please try again.";
      toast({
        title: "Registration Error", 
        description: errorMessage,
        variant: "destructive",
      });
      localStorage.removeItem('parentInviteCode');
    },
    onSettled: () => {
      setIsCompleting(false);
    },
  });

  useEffect(() => {
    // Check if there's a pending parent registration after authentication
    if (isAuthenticated && !isLoading && !hasCompletedRegistration) {
      const inviteCode = localStorage.getItem('parentInviteCode');
      
      if (inviteCode && !isCompleting) {
        setIsCompleting(true);
        completeMutation.mutate(inviteCode);
      }
    }
  }, [isAuthenticated, isLoading, hasCompletedRegistration, isCompleting]);

  return {
    isCompleting: isCompleting || completeMutation.isPending,
    hasCompletedRegistration,
    completeMutation,
  };
}
