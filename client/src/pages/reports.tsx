import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Download, 
  FileText, 
  Share,
  TrendingUp,
  Users,
  Trophy,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("performance");
  const [timeframe, setTimeframe] = useState("month");

  // Calculate date range based on selected timeframe
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (timeframe) {
      case "week":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Generate PDF Report
  const generatePDFReport = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Athletics Performance Report", pageWidth / 2, 20, { align: "center" });
      
      // Add report metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1).replace(/([A-Z])/g, ' $1')}`, 14, 35);
      doc.text(`Time Period: ${timeframe === "week" ? "This Week" : timeframe === "month" ? "This Month" : timeframe === "quarter" ? "This Quarter" : "This Year"}`, 14, 42);
      doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 14, 49);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 56);
      
      let yPosition = 65;
      
      // Add summary statistics
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary Statistics", 14, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const stats = [
        ["Total Students", `${dashboardStats?.totalStudents || 0}`],
        [`Events (${timeframe})`, `${eventsCountData?.count ?? 0}`],
        ["Average Attendance", `${dashboardStats?.averageAttendance || 0}%`],
        ["Personal Bests", `${dashboardStats?.personalBests || 0}`]
      ];
      
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: stats,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      // Add report-specific content
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      
      if (reportType === "performance") {
        doc.text("Performance Analysis", 14, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Detailed breakdown of athletic performance across all events and students.", 14, yPosition);
        yPosition += 8;
        doc.text("• Performance trends across different athletic events", 14, yPosition);
        yPosition += 6;
        doc.text("• Individual student progress tracking", 14, yPosition);
        yPosition += 6;
        doc.text("• Comparative analysis of results", 14, yPosition);
      } else if (reportType === "attendance") {
        doc.text("Attendance Summary", 14, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Comprehensive attendance tracking with patterns and insights.", 14, yPosition);
        yPosition += 8;
        doc.text("• Attendance patterns and correlations", 14, yPosition);
        yPosition += 6;
        doc.text("• Student participation rates", 14, yPosition);
        yPosition += 6;
        doc.text("• Trend analysis over time", 14, yPosition);
      } else if (reportType === "events") {
        doc.text("Events Overview", 14, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Summary of all events conducted with participation statistics.", 14, yPosition);
        yPosition += 8;
        doc.text("• Event completion rates", 14, yPosition);
        yPosition += 6;
        doc.text("• Participation statistics", 14, yPosition);
        yPosition += 6;
        doc.text("• Event type distribution", 14, yPosition);
      } else if (reportType === "students") {
        doc.text("Student Progress", 14, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Individual student development and improvement tracking.", 14, yPosition);
        yPosition += 8;
        doc.text("• Individual student development", 14, yPosition);
        yPosition += 6;
        doc.text("• Improvement tracking", 14, yPosition);
        yPosition += 6;
        doc.text("• Progress milestones", 14, yPosition);
      }
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
      
      // Save the PDF
      const fileName = `${reportType}_report_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Report Generated",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: eventsCountData } = useQuery({
    queryKey: ["/api/events/count", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/events/count?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch events count");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6" data-testid="reports-view">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-reports-title">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Generate insights and export performance data</p>
      </div>

      {/* Available Reports */}
      <Card data-testid="card-available-reports">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium text-card-foreground mb-2">Performance Analysis</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Detailed breakdown of athletic performance across all events and students.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-view-performance-report">
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-download-performance-report">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium text-card-foreground mb-2">Attendance Summary</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Comprehensive attendance tracking with patterns and insights.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-view-attendance-report">
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-download-attendance-report">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium text-card-foreground mb-2">Student Progress</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Individual student development and improvement tracking.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-view-progress-report">
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-download-progress-report">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium text-card-foreground mb-2">Events Overview</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Summary of all events conducted with participation statistics.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-view-events-report">
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button variant="outline" size="sm" className="flex-1" data-testid="button-download-events-report">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
