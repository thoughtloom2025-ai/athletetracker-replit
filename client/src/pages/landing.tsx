import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Zap } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">AthleteTracker Pro</h1>
          <p className="text-muted-foreground mt-2">Track student athletics performance with ease</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Button 
                onClick={handleLogin}
                className="w-full min-h-[44px] flex items-center justify-center gap-3"
                disabled={isLoading}
                data-testid="button-google-signin"
              >
                <SiGoogle className="h-5 w-5" />
                {isLoading ? "Connecting..." : "Sign in with Google"}
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                New to AthleteTracker Pro? Your account will be created automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
