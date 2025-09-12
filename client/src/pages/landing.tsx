import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Zap } from "lucide-react";

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
            <form 
              className="space-y-6" 
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  type="email" 
                  id="email"
                  data-testid="input-email"
                  placeholder="coach@school.edu"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  type="password" 
                  id="password"
                  data-testid="input-password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" data-testid="checkbox-remember" />
                  <Label htmlFor="remember" className="text-sm">Remember me</Label>
                </div>
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-sm"
                  data-testid="button-forgot-password"
                >
                  Forgot password?
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[44px]"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">New coach? </span>
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-sm font-medium p-0"
                  data-testid="button-create-account"
                  onClick={handleLogin}
                >
                  Create account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
