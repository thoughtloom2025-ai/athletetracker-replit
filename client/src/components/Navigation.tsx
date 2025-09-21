import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  ClipboardList,
  FileBarChart,
  UserPlus
} from "lucide-react";

const getAllNavItems = () => [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3, testId: "nav-dashboard", roles: ["coach", "parent"] },
  { path: "/students", label: "Students", icon: Users, testId: "nav-students", roles: ["coach", "parent"] },
  { path: "/events", label: "Events", icon: Calendar, testId: "nav-events", roles: ["coach"] },
  { path: "/attendance", label: "Attendance", icon: ClipboardList, testId: "nav-attendance", roles: ["coach"] },
  { path: "/reports", label: "Reports", icon: FileBarChart, testId: "nav-reports", roles: ["coach"] },
  { path: "/parent-invites", label: "Parent Invites", icon: UserPlus, testId: "nav-parent-invites", roles: ["coach"] },
];

export function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Don't render navigation until user is loaded
  if (!user) {
    return null;
  }
  
  const navItems = getAllNavItems().filter(item => 
    item.roles.includes((user as any)?.role)
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:block flex-1 px-4 py-6" data-testid="desktop-navigation">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path === "/dashboard" && location === "/");

            return (
              <Link key={item.path} href={item.path}>
                <a className={cn(
                  "flex items-center px-3 py-2 rounded-md font-medium transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )} data-testid={item.testId}>
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border" data-testid="mobile-navigation">
        <div className="grid grid-cols-5 h-16">
          {navItems.filter(item => item.path !== "/parent-invites").map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path === "/dashboard" && location === "/");

            return (
              <Link key={item.path} href={item.path}>
                <a className={cn(
                  "flex flex-col items-center justify-center space-y-1 min-h-[44px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )} data-testid={`${item.testId}-mobile`}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}