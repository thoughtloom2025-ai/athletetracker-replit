import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ParentJoin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Get invite code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      setInviteCode(code);
      // Store invite code in localStorage for use after authentication
      localStorage.setItem('parentInviteCode', code);
      setIsValidCode(true);
    } else {
      toast({
        title: "Error",
        description: "Invalid invite link. Please use the link provided by your coach.",
        variant: "destructive",
      });
    }
    setIsValidating(false);
  }, [toast]);

  const handleGoogleSignIn = () => {
    // Redirect to Google authentication
    window.location.href = "/api/login";
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
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Validating Invite...</h2>
            <p className="text-muted-foreground">
              Please wait while we validate your invite link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Invalid Invite Link
            </h2>
            <p className="text-muted-foreground mb-6">
              This invite link is not valid. Please contact your coach for a new invite link.
            </p>
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full">
              Go to Home
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
            Sign in with Google to connect with your child's coach and stay updated on their athletic progress.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded text-sm text-center">
            <p className="text-muted-foreground mb-1">Invite Code:</p>
            <div className="font-mono text-sm">{inviteCode}</div>
          </div>

          <Button 
            onClick={handleGoogleSignIn}
            className="w-full"
            data-testid="button-signin-google"
          >
            <Users className="h-4 w-4 mr-2" />
            Sign In with Google
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By signing in, you'll be connected to your child's athletics program and can view their progress updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}