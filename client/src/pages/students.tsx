import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Users,
  Eye
} from "lucide-react";
import { StudentForm } from "@/components/StudentForm";
import type { Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Students() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "Student has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    },
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

  // Filter students
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || student.gender === genderFilter;
    
    let matchesAge = true;
    if (ageFilter !== "all") {
      const birthDate = new Date(student.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      
      switch (ageFilter) {
        case "under12":
          matchesAge = age < 12;
          break;
        case "12-15":
          matchesAge = age >= 12 && age <= 15;
          break;
        case "16-18":
          matchesAge = age >= 16 && age <= 18;
          break;
        case "over18":
          matchesAge = age > 18;
          break;
      }
    }
    
    return matchesSearch && matchesGender && matchesAge;
  });

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    
    return age;
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteMutation.mutate(studentId);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleViewStudent = (student: Student) => {
    setViewingStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setViewingStudent(null);
  };

  if (isLoading || studentsLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6" data-testid="students-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-students-title">
            Students
          </h1>
          <p className="text-muted-foreground mt-1">Manage your athlete roster and profiles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 min-h-[44px]" data-testid="button-add-student">
              <Plus className="h-5 w-5 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Edit Student" : "Add New Student"}
              </DialogTitle>
            </DialogHeader>
            <StudentForm 
              student={editingStudent} 
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-6" data-testid="card-filters">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search students by name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-students"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-gender-filter">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageFilter} onValueChange={setAgeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-age-filter">
              <SelectValue placeholder="All Ages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="under12">Under 12</SelectItem>
              <SelectItem value="12-15">12-15</SelectItem>
              <SelectItem value="16-18">16-18</SelectItem>
              <SelectItem value="over18">Over 18</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {students.length === 0 ? "No Students Yet" : "No Students Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {students.length === 0 
                ? "Add your first student to start tracking athletic performance."
                : "Try adjusting your search terms or filters."
              }
            </p>
            {students.length === 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-first-student">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                  </DialogHeader>
                  <StudentForm onClose={handleCloseDialog} />
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card data-testid="students-table">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-medium text-muted-foreground">Student</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Age</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">Gender</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">School</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">Grade</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student: Student) => (
                    <tr 
                      key={student.id} 
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                      data-testid={`row-student-${student.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-card-foreground" data-testid={`text-student-name-${student.id}`}>
                              {student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground hidden lg:table-cell" data-testid={`text-student-email-${student.id}`}>
                        {student.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground hidden lg:table-cell" data-testid={`text-student-phone-${student.id}`}>
                        {student.phoneNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground" data-testid={`text-student-age-${student.id}`}>
                        {calculateAge(student.dateOfBirth)}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground capitalize hidden lg:table-cell" data-testid={`text-student-gender-${student.id}`}>
                        {student.gender}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground hidden lg:table-cell" data-testid={`text-student-school-${student.id}`}>
                        {student.school || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground hidden lg:table-cell" data-testid={`text-student-grade-${student.id}`}>
                        {student.gradeStudying || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-card-foreground hidden lg:table-cell" data-testid={`text-student-joined-${student.id}`}>
                        {new Date(student.joiningDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            data-testid={`button-view-student-${student.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            data-testid={`button-edit-student-${student.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            data-testid={`button-delete-student-${student.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Details View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{viewingStudent.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{viewingStudent.email || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-sm capitalize">{viewingStudent.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-sm">{new Date(viewingStudent.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Age</label>
                    <p className="text-sm">{calculateAge(viewingStudent.dateOfBirth)} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="text-sm">{viewingStudent.phoneNumber || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Family Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Family Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                    <p className="text-sm">{viewingStudent.fatherName || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mother's Name</label>
                    <p className="text-sm">{viewingStudent.motherName || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School</label>
                    <p className="text-sm">{viewingStudent.school || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Grade/Class</label>
                    <p className="text-sm">{viewingStudent.gradeStudying || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Coaching History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Coaching History</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Attended Coaching Before</label>
                    <p className="text-sm">{viewingStudent.attendedCoachingBefore ? "Yes" : "No"}</p>
                  </div>
                  {viewingStudent.attendedCoachingBefore && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Previous Coach/Club Name</label>
                      <p className="text-sm">{viewingStudent.previousCoachClub || "-"}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Joining Date</label>
                    <p className="text-sm">{new Date(viewingStudent.joiningDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Health Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Health Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Injury/Health Issues</label>
                    <p className="text-sm whitespace-pre-wrap">{viewingStudent.injuryHealthIssues || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Medical Conditions</label>
                    <p className="text-sm whitespace-pre-wrap">{viewingStudent.medicalConditions || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm whitespace-pre-wrap">{viewingStudent.address || "-"}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleCloseViewDialog} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
