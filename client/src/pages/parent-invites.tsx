
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Share2, 
  Users, 
  Mail,
  Phone,
  Calendar,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ParentInvite } from "@shared/schema";

export default function ParentInvites() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState("");

  const { data: inviteCode } = useQuery<{ inviteCode: string }>({
    queryKey: ["/api/parent-invites/code"],
    enabled: isAuthenticated,
  });

  const { data: parentInvites = [], isLoading: parentInvitesLoading } = useQuery<ParentInvite[]>({
    queryKey: ["/api/parent-invites"],
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

  // Generate invite link when code is available
  useEffect(() => {
    if (inviteCode?.inviteCode) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/parent-join?code=${inviteCode.inviteCode}`);
    }
  }, [inviteCode]);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invite link.",
        variant: "destructive",
      });
    }
  };

  const shareInviteLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my athletics coaching program",
          text: "Click this link to connect as a parent and stay updated with your child's athletics progress.",
          url: inviteLink,
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || parentInvitesLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6" data-testid="parent-invites-view">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-parent-invites-title">
          Parent Invites
        </h1>
        <p className="text-muted-foreground mt-1">
          Share your invite link with parents to connect them to your coaching program.
        </p>
      </div>

      {/* Invite Link Section */}
      <Card className="mb-6" data-testid="card-invite-link">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Your Invite Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={inviteLink}
              readOnly
              className="font-mono text-sm"
              data-testid="input-invite-link"
            />
            <Button onClick={copyInviteLink} variant="outline" data-testid="button-copy-link">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={shareInviteLink} data-testid="button-share-link">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            This is your permanent coach invite link. All parents will use this same link to join 
            your coaching program and connect to their children.
          </div>
        </CardContent>
      </Card>

      {/* Connected Parents */}
      <Card data-testid="card-connected-parents">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Connected Parents ({parentInvites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parentInvites.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-parents-state">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Parents Connected Yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your invite link with parents to start building your community.
              </p>
              <Button onClick={shareInviteLink} data-testid="button-share-first-invite">
                <Share2 className="h-4 w-4 mr-2" />
                Share Invite Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4" data-testid="parents-list">
              {parentInvites.map((parent: ParentInvite) => (
                <div 
                  key={parent.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  data-testid={`parent-item-${parent.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-card-foreground" data-testid={`parent-name-${parent.id}`}>
                          {parent.parentName}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          Parent
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Child: {parent.studentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{parent.parentEmail}</span>
                        </div>
                        {parent.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{parent.phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {parent.claimed 
                              ? `Joined: ${formatDate(parent.claimedAt?.toString() || '')}` 
                              : 'Invitation pending'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
