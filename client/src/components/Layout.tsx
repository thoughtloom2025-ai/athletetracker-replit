import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "./Navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, Zap } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="h-full flex flex-col" data-testid="layout">
      {/* Mobile Header */}
      <header className="bg-card border-b border-border lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-card-foreground">AthleteTracker</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-theme-toggle-mobile"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-profile-mobile"
            >
              <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </span>
              </div>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r border-border" data-testid="desktop-sidebar">
          <div className="flex items-center px-6 py-4 border-b border-border">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-card-foreground">AthleteTracker</h1>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="ml-auto"
              data-testid="button-theme-toggle-desktop"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <Navigation />

          <div className="mt-auto p-4 border-t border-border">
            <div className="flex items-center px-3 py-2">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-medium text-primary-foreground">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate" data-testid="text-user-name">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">Coach</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto" data-testid="main-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <Navigation />
      </div>
    </div>
  );
}
