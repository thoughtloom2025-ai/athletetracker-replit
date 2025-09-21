import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useParentRegistration() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  const completeMutation = useMutation({
    mutationFn: async (parentData: any) => {
      await apiRequest("POST", "/api/parent-invites/complete", parentData);
    },
    onSuccess: () => {
      localStorage.removeItem('parentJoinData');
      toast({
        title: "Registration Complete!",
        description: "You've successfully joined the athletics program.",
      });
      // Redirect to home or appropriate page
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Registration Error",
        description: "Failed to complete registration. Please try again.",
        variant: "destructive",
      });
      localStorage.removeItem('parentJoinData');
    },
    onSettled: () => {
      setIsCompleting(false);
    },
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading && !isCompleting) {
      const parentData = localStorage.getItem('parentJoinData');
      if (parentData) {
        try {
          const data = JSON.parse(parentData);
          setIsCompleting(true);
          completeMutation.mutate(data);
        } catch (error) {
          console.error('Failed to parse parent join data:', error);
          localStorage.removeItem('parentJoinData');
        }
      }
    }
  }, [isAuthenticated, isLoading, isCompleting]);

  return {
    isCompleting: isCompleting || completeMutation.isPending,
  };
}