import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_district");
      localStorage.removeItem("center_id");
      localStorage.removeItem("center_name");
      localStorage.removeItem("user_first_name");
      localStorage.removeItem("user_last_name");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ========== AUTH API ========== */
export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/api/token/", { email, password });

  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);

  const payload = JSON.parse(atob(res.data.access.split(".")[1]));
  localStorage.setItem("user_role", payload.role);
  localStorage.setItem("user_district", payload.district || "");
  localStorage.setItem("center_id", payload.center_id || "");
  localStorage.setItem("center_name", payload.center_name || "");

  const me = await api.get("/api/users/me/");
  localStorage.setItem("user_first_name", me.data.first_name || "");
  localStorage.setItem("user_last_name", me.data.last_name || "");

  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_district");
  localStorage.removeItem("center_id");
  localStorage.removeItem("center_name");
  localStorage.removeItem("user_first_name");
  localStorage.removeItem("user_last_name");
};

export const getCurrentUser = async (): Promise<UserType> => {
  const res = await api.get("/api/users/me/");
  return res.data;
};

export const refreshToken = async (): Promise<{ access: string }> => {
  const refresh = localStorage.getItem("refresh_token");
  const res = await api.post("/api/token/refresh/", { refresh });
  localStorage.setItem("access_token", res.data.access);
  return res.data;
};

// Add to User API section
export const toggleInstructorStatus = async (id: number): Promise<{
  detail: string;
  is_active: boolean;
  instructor: UserType
}> => {
  const res = await api.post(`/api/users/${id}/toggle-status/`);
  return res.data;
};

export const checkAccountStatus = async (): Promise<{
  is_active: boolean;
  email: string;
  role: string;
  message: string
}> => {
  const res = await api.get("/api/account/status/");
  return res.data;
};

/* ========== UTILITY FUNCTIONS ========== */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("access_token");
};

export const getUserRole = (): string => {
  return localStorage.getItem("user_role") || "";
};

export const getUserDistrict = (): string => {
  return localStorage.getItem("user_district") || "";
};

export const getUserName = (): string => {
  const firstName = localStorage.getItem("user_first_name") || "";
  const lastName = localStorage.getItem("user_last_name") || "";
  return `${firstName} ${lastName}`.trim();
};

export const getCenterId = (): string => {
  return localStorage.getItem("center_id") || "";
};

export const getCenterName = (): string => {
  return localStorage.getItem("center_name") || "";
};

// Check if user can access head office reports
export const canAccessHeadOfficeReports = (): boolean => {
  const role = getUserRole();
  return role === 'admin'; // Only admin can access head office reports
};

/* ========== USER API ========== */
export interface UserType {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  center: { id: number; name: string; district: string | null } | null;
  district: string | null;
  epf_no: string | null;
  phone_number: string | null;
  is_active: boolean;
  is_staff: boolean;
  last_login: string | null;
}

export const fetchUsers = async (): Promise<UserType[]> => {
  const res = await api.get("/api/users/");
  return res.data;
};

export const createUser = async (data: any): Promise<UserType> => {
  const res = await api.post("/api/users/", data);
  return res.data;
};

export const updateUser = async (id: number, data: any): Promise<UserType> => {
  const res = await api.patch(`/api/users/${id}/`, data);
  return res.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/api/users/${id}/`);
};

export const changePassword = async (id: number, new_password: string): Promise<void> => {
  await api.post(`/api/users/${id}/change-password/`, { new_password });
};

export const fetchInstructors = async (): Promise<UserType[]> => {
  const res = await api.get("/api/instructors/");
  // Handle both paginated and non-paginated responses
  if (res.data && res.data.results && Array.isArray(res.data.results)) {
    return res.data.results;
  }
  return Array.isArray(res.data) ? res.data : [];
};

export const fetchUsersByRole = async (role?: string): Promise<UserType[]> => {
  const params = role ? { role } : {};
  const res = await api.get("/api/users/", { params });
  return res.data;
};

/* ========== CENTER API ========== */
export interface Center {
  id: number;
  name: string;
  location: string | null;
  district: string | null;
  manager?: string | null;
  phone?: string | null;
  student_count?: number | null;
  instructor_count?: number | null;
  status?: string;
  performance?: string | null;
  enrolled_students_count?: number;
}

export const fetchCenters = async (): Promise<Center[]> => {
  const res = await api.get("/api/centers/");
  return res.data;
};

export const createCenter = async (data: {
  name: string;
  location?: string | null;
  district?: string | null;
  manager?: string | null;
  phone?: string | null;
  student_count?: number | null;
  instructor_count?: number | null;
  status?: string;
  performance?: string | null;
}): Promise<Center> => {
  const res = await api.post("/api/centers/create/", data);
  return res.data;
};

export const updateCenter = async (
  id: number,
  data: Partial<{
    name: string;
    location: string | null;
    district: string | null;
    manager: string | null;
    phone: string | null;
    student_count: number | null;
    instructor_count: number | null;
    status: string;
    performance: string | null;
  }>
): Promise<Center> => {
  const res = await api.patch(`/api/centers/${id}/update/`, data);
  return res.data;
};

export const deleteCenter = async (id: number): Promise<void> => {
  await api.delete(`/api/centers/${id}/delete/`);
};

export const fetchCentersForStudent = async (): Promise<Center[]> => {
  const res = await api.get("/api/centers/for-student/");
  return res.data;
};

/* ========== COURSE API ========== */
export interface CourseType {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  category?: string | null;
  duration?: string | null;
  schedule?: string | null;
  students: number;
  progress: number;
  next_session?: string | null;
  instructor: number | null;
  instructor_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  district: string;
  center: number | null;
  center_details?: Center | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Inactive';
  priority: string;
  created_at: string;
  updated_at: string;
}

export const fetchCourses = async (params?: {
  district?: string;
  status?: string;
  category?: string;
  center?: number;
}): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/", { params });
  return res.data;
};

export const fetchMyCourses = async (): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/my/");
  return res.data;
};

export const fetchAvailableCourses = async (): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/available/");
  return res.data;
};

export const fetchPendingCourses = async (): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/pending/");
  return res.data;
};

export const fetchCourseById = async (id: number): Promise<CourseType> => {
  const res = await api.get(`/api/courses/${id}/`);
  return res.data;
};

export const fetchCourseCategories = async (): Promise<string[]> => {
  const res = await api.get("/api/courses/categories/");
  return res.data;
};

export const fetchCourseDurations = async (): Promise<string[]> => {
  const res = await api.get("/api/courses/durations/");
  return res.data;
};

export const createCourse = async (data: Partial<CourseType>): Promise<CourseType> => {
  const res = await api.post("/api/courses/", data);
  return res.data;
};

export const updateCourse = async (id: number, data: Partial<CourseType>): Promise<CourseType> => {
  const res = await api.patch(`/api/courses/${id}/`, data);
  return res.data;
};

export const deleteCourse = async (id: number): Promise<void> => {
  await api.delete(`/api/courses/${id}/`);
};

export const assignInstructor = async (id: number, instructorId: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/assign_instructor/`, { instructor_id: instructorId });
  return res.data;
};

export const assignCourseToMe = async (id: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/assign_to_me/`);
  return res.data;
};

// NEW: Request course assignment for pending courses
export const requestCourseAssignment = async (courseId: number): Promise<any> => {
  const res = await api.post(`/api/courses/${courseId}/request-assignment/`);
  return res.data;
};

/* ========== COURSE APPROVAL ACTIONS ========== */
export const approveCourse = async (courseId: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${courseId}/approve/`);
  return res.data;
};

export const rejectCourse = async (courseId: number, comments?: string): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${courseId}/reject/`, { comments });
  return res.data;
};

export const updateCourseStatus = async (id: number, status: string): Promise<CourseType> => {
  const res = await api.patch(`/api/courses/${id}/`, { status });
  return res.data;
};

export const submitCourseForApproval = async (id: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/submit_for_approval/`);
  return res.data;
};

export const duplicateCourse = async (id: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/duplicate/`);
  return res.data;
};

export const archiveCourse = async (id: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/archive/`);
  return res.data;
};

export const restoreCourse = async (id: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/restore/`);
  return res.data;
};

export const fetchCoursesForStudent = async (centerId?: number): Promise<CourseType[]> => {
  const params = centerId ? { center: centerId } : {};
  const res = await api.get("/api/courses/for-student/", { params });
  return res.data;
};

/* ========== COURSE APPROVAL API ========== */
export interface CourseApprovalType {
  id: number;
  course: number;
  course_details: CourseType;
  requested_by: number;
  requested_by_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  approval_status: string;
  comments?: string | null;
  approved_by?: number | null;
  approved_by_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  approved_at?: string | null;
  created_at: string;
}

export const fetchCourseApprovals = async (): Promise<CourseApprovalType[]> => {
  const res = await api.get("/api/course-approvals/");
  return res.data;
};

export const fetchMyCourseApprovals = async (): Promise<CourseApprovalType[]> => {
  const res = await api.get("/api/course-approvals/my/");
  return res.data;
};

export const createCourseApproval = async (data: {
  course: number;
  comments?: string;
}): Promise<CourseApprovalType> => {
  const res = await api.post("/api/course-approvals/", data);
  return res.data;
};

export const approveCourseApproval = async (id: number): Promise<CourseApprovalType> => {
  const res = await api.post(`/api/course-approvals/${id}/approve/`);
  return res.data;
};

export const rejectCourseApproval = async (id: number): Promise<CourseApprovalType> => {
  const res = await api.post(`/api/course-approvals/${id}/reject/`);
  return res.data;
};

export const requestCourseChanges = async (id: number, comments: string): Promise<CourseApprovalType> => {
  const res = await api.post(`/api/course-approvals/${id}/request_changes/`, { comments });
  return res.data;
};

/* ========== STUDENT API ========== */
export interface EducationalQualificationType {
  id?: number;
  subject: string;
  grade: string;
  year: number;
  type: 'OL' | 'AL';
}

// UPDATED StudentType interface with all missing properties
export interface StudentType {
  id?: number;
  registration_no: string;
  district_code?: string;
  course_code?: string;
  batch?: number | null;
  batch_display?: string;
  batch_code?: string;
  profile_photo?: File | string | null;
  profile_photo_url?: string;
  batch_year?: string;
  student_number?: number;
  registration_year?: string;
  full_name_english: string;
  full_name_sinhala: string;
  name_with_initials: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  nic_id: string;
  address_line: string;
  district: string;
  divisional_secretariat: string;
  grama_niladhari_division: string;
  village: string;
  marital_status: string;
  mobile_no: string;
  email: string;
  ol_results: EducationalQualificationType[];
  al_results: EducationalQualificationType[];
  training_received: boolean;
  training_provider: string;
  course_vocation_name: string;
  training_duration: string;
  training_nature: 'Initial' | 'Further' | 'Re-training';
  training_establishment: string;
  training_placement_preference: '1st' | '2nd' | '3rd';
  center?: number | null;
  center_name?: string;
  course?: number | null;
  course_name?: string;
  course_code_display?: string;
  enrollment_date?: string;
  enrollment_status?: 'Pending' | 'Enrolled' | 'Completed' | 'Dropped';
  date_of_application: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentStatsType {
  total_students: number;
  trained_students: number;
  enrolled_students: number;
  completed_students: number;
  pending_students: number;
  with_ol_results: number;
  with_al_results: number;
  recent_students: number;
  center_distribution: Record<string, number>;
}

// Add to api.ts - Student QR Code & ID Card API

export interface QRCodeData {
  student_id: number;
  registration_no: string;
  full_name: string;
  nic_id: string;
  course_name: string;
  center_name: string;
  enrollment_status: string;
}

export interface StudentIDCardData {
  id: number;
  student: StudentType;
  qr_code_data: QRCodeData;
  generated_at: string;
  is_active: boolean;
}

// Generate QR code data for a student
export const generateQRCodeData = async (studentId: number): Promise<QRCodeData> => {
  const res = await api.get(`/api/students/${studentId}/qrcode/`);
  return res.data;
};

// Generate student ID card
export const generateStudentIDCard = async (studentId: number): Promise<Blob> => {
  const res = await api.get(`/api/students/${studentId}/id-card/`, {
    responseType: 'blob'
  });
  return res.data;
};

// Bulk generate student ID cards
export const bulkGenerateIDCards = async (studentIds: number[]): Promise<Blob> => {
  const res = await api.post(`/api/students/bulk-id-cards/`,
    { student_ids: studentIds },
    { responseType: 'blob' }
  );
  return res.data;
};


export const fetchStudents = async (search?: string, filters?: {
  district?: string;
  center?: number;
  course?: number;
  enrollment_status?: string;
  training_received?: boolean;
}): Promise<StudentType[]> => {
  const params = { search, ...filters };
  const res = await api.get("/api/students/", { params });
  return res.data;
};

export const fetchStudentById = async (id: number): Promise<StudentType> => {
  const res = await api.get(`/api/students/${id}/`);
  return res.data;
};

export const createStudent = async (data: Partial<StudentType>): Promise<StudentType> => {
  const res = await api.post("/api/students/", data);
  return res.data;
};

export const updateStudent = async (id: number, data: Partial<StudentType>): Promise<StudentType> => {
  const res = await api.patch(`/api/students/${id}/`, data);
  return res.data;
};

export const deleteStudent = async (id: number): Promise<void> => {
  await api.delete(`/api/students/${id}/`);
};

export const fetchStudentStats = async (): Promise<StudentStatsType> => {
  const res = await api.get("/api/students/stats/");
  return res.data;
};

export const exportStudents = async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
  const res = await api.get("/api/students/export/", {
    params: { format },
    responseType: 'blob'
  });
  return res.data;
};

export const importStudents = async (file: File): Promise<{ message: string; imported: number; errors: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post("/api/students/import/", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

/* ========== APPROVALS API ========== */
export interface ApprovalType {
  id: number;
  type: string;
  center: string;
  requested_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  description: string;
  date_requested: string;
  priority: string;
  status: string;
}

export const fetchGeneralApprovals = async (): Promise<ApprovalType[]> => {
  const res = await api.get("/api/approvals/");
  return res.data;
};

export const createApproval = async (data: {
  type: string;
  center: string;
  description: string;
  priority: string;
}): Promise<ApprovalType> => {
  const res = await api.post("/api/approvals/", data);
  return res.data;
};

export const fetchMyApprovals = async (): Promise<ApprovalType[]> => {
  const res = await api.get("/api/approvals/my/");
  return res.data;
};

export const updateApprovalStatus = async (id: number, action: 'approve' | 'reject'): Promise<ApprovalType> => {
  const res = await api.put(`/api/approvals/${id}/${action}/`);
  return res.data;
};

/* ========== DASHBOARD & OVERVIEW API ========== */
export interface OverviewDataType {
  total_centers: number;
  active_students: number;
  total_instructors: number;
  completion_rate: number;
  enrollment_data: Array<{ month: string; students: number }>;
  center_performance_data: Array<{ name: string; value: number; color: string }>;
  recent_activities: Array<{
    id: string;
    activity: string;
    time: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }>;
  trends: {
    centers: { value: number; isPositive: boolean };
    students: { value: number; isPositive: boolean };
    instructors: { value: number; isPositive: boolean };
    completion: { value: number; isPositive: boolean };
  };
  district_summary?: {
    total_districts: number;
    active_districts: number;
    new_districts_week: number;
  };
  training_summary?: {
    active_courses: number;
    completed_month: number;
    upcoming: number;
  };
  system_stats?: {
    active_users: number;
    api_status: string;
    database_status: string;
  };
  user_district?: string;
}

export interface DashboardStatsType {
  total_students: number;
  total_centers: number;
  total_courses: number;
  active_courses: number;
  pending_approvals: number;
  recent_activity: {
    new_students: number;
    new_courses: number;
    completed_courses: number;
  };
  enrollment_stats: {
    enrolled: number;
    completed: number;
    pending: number;
    dropped: number;
  };
  training_stats: {
    trained: number;
    not_trained: number;
  };
}

export const fetchOverview = async (): Promise<OverviewDataType> => {
  const res = await api.get("/api/overview/overview/");
  return res.data;
};

export const fetchDashboardStats = async (): Promise<DashboardStatsType> => {
  const res = await api.get("/api/overview/dashboard/stats/");
  return res.data;
};

export const fetchSystemReports = async (period: string, center: string) => {
  const res = await api.get(`/api/reports/?period=${period}&center=${center}`);
  return res.data;
};

/* ========== INSTRUCTOR OVERVIEW API ========== */
export interface InstructorStats {
  weeklyHours: number;
  totalStudents: number;
  completedCourses: number;
  upcomingClasses: number;
  performance: number;
  attendanceRate: number;
}

export interface UpcomingClass {
  id: string;
  course: string;
  date: string;
  time: string;
  students: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  course: string;
  time: string;
}

export interface InstructorOverviewData {
  stats: InstructorStats;
  upcomingClasses: UpcomingClass[];
  recentActivity: RecentActivity[];
}

// Get real instructor overview data
export const fetchInstructorOverview = async (): Promise<InstructorOverviewData> => {
  const res = await api.get("/api/overview/instructor/overview/");
  return res.data;
};

// Get instructor courses with real data
export const fetchInstructorCourses = async (): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/my/");
  return res.data;
};

/* ========== COURSE CONTENT API ========== */
export interface CourseContentType {
  id: number;
  course: number;
  title: string;
  content_type: 'document' | 'video' | 'quiz' | 'assignment' | 'link';
  file?: string | null;
  external_url?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseProgressType {
  id: number;
  course: number;
  student: number;
  student_details?: UserType;
  content: number | null;
  content_details?: CourseContentType;
  completed: boolean;
  progress_percentage: number;
  last_accessed: string;
  time_spent: number;
}

export interface CourseReportType {
  id: number;
  course: number;
  course_details?: CourseType;
  instructor: number;
  instructor_details?: UserType;
  report_type: string;
  period_start: string;
  period_end: string;
  total_students: number;
  active_students: number;
  avg_progress: number;
  completion_rate: number;
  generated_at: string;
}

export interface CourseAnalyticsType {
  total_students: number;
  active_students: number;
  avg_progress: number;
  completion_rate: number;
  contents_count: number;
}

export const fetchCourseContents = async (courseId: number): Promise<CourseContentType[]> => {
  const res = await api.get(`/api/course-contents/?course=${courseId}`);
  return res.data;
};

export const createCourseContent = async (data: Partial<CourseContentType>): Promise<CourseContentType> => {
  const res = await api.post('/api/course-contents/', data);
  return res.data;
};

export const updateCourseContent = async (id: number, data: Partial<CourseContentType>): Promise<CourseContentType> => {
  const res = await api.patch(`/api/course-contents/${id}/`, data);
  return res.data;
};

export const deleteCourseContent = async (id: number): Promise<void> => {
  await api.delete(`/api/course-contents/${id}/`);
};

export const fetchCourseProgress = async (courseId: number): Promise<CourseProgressType[]> => {
  const res = await api.get(`/api/course-progress/?course=${courseId}`);
  return res.data;
};

export const fetchCourseReports = async (courseId: number): Promise<CourseReportType[]> => {
  const res = await api.get(`/api/course-reports/?course=${courseId}`);
  return res.data;
};

export const createCourseReport = async (data: Partial<CourseReportType>): Promise<CourseReportType> => {
  const res = await api.post('/api/course-reports/', data);
  return res.data;
};

export const fetchCourseAnalytics = async (courseId: number): Promise<CourseAnalyticsType> => {
  const res = await api.get(`/api/courses/${courseId}/analytics/`);
  return res.data;
};

export const fetchStudentProgress = async (courseId: number): Promise<CourseProgressType[]> => {
  const res = await api.get(`/api/courses/${courseId}/student-progress/`);
  return res.data;
};

export const exportCourseReport = async (courseId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
  const res = await api.get(`/api/courses/${courseId}/export/`, {
    params: { format },
    responseType: 'blob'
  });
  return res.data;
};

export const exportCourseAnalytics = async (courseId: number): Promise<Blob> => {
  const res = await api.get(`/api/courses/${courseId}/export-analytics/`, {
    responseType: 'blob'
  });
  return res.data;
};

/* ========== ENROLLMENT API ========== */
export interface EnrollmentType {
  id: number;
  course: number;
  student: number;
  enrolled_at: string;
  status: string;
  student_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const fetchCourseEnrollments = async (courseId: number): Promise<EnrollmentType[]> => {
  const res = await api.get(`/api/courses/${courseId}/enrollments/`);
  return res.data;
};

export const fetchMyEnrollments = async (): Promise<EnrollmentType[]> => {
  const res = await api.get("/api/enrollments/my/");
  return res.data;
};

export const enrollInCourse = async (courseId: number): Promise<EnrollmentType> => {
  const res = await api.post(`/api/courses/${courseId}/enroll/`);
  return res.data;
};

export const unenrollFromCourse = async (courseId: number): Promise<void> => {
  await api.post(`/api/courses/${courseId}/unenroll/`);
};

export const updateEnrollmentStatus = async (enrollmentId: number, status: string): Promise<EnrollmentType> => {
  const res = await api.post(`/api/enrollments/${enrollmentId}/update_status/`, { status });
  return res.data;
};

/* ========== FILTERING API ========== */
export interface FilterOptionsType {
  districts: string[];
  centers: Center[];
  courses: CourseType[];
  enrollment_statuses: string[];
}

export const fetchFilterOptions = async (): Promise<FilterOptionsType> => {
  const res = await api.get("/api/filter-options/");
  return res.data;
};

/* ========== EXPORT/IMPORT API ========== */
export interface ImportResultType {
  message: string;
  imported: number;
  errors: string[];
  warnings: string[];
}

export const exportData = async (type: 'students' | 'courses' | 'centers', format: 'csv' | 'excel' = 'csv', filters?: any): Promise<Blob> => {
  const res = await api.get(`/api/${type}/export/`, {
    params: { format, ...filters },
    responseType: 'blob'
  });
  return res.data;
};

export const importData = async (type: 'students' | 'courses' | 'centers', file: File): Promise<ImportResultType> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post(`/api/${type}/import/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

/* ========== NOTIFICATION API ========== */
export interface NotificationType {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export const fetchNotifications = async (): Promise<NotificationType[]> => {
  const res = await api.get("/api/notifications/");
  return res.data;
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await api.patch(`/api/notifications/${id}/mark-read/`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.post("/api/notifications/mark-all-read/");
};

/* ========== SEARCH API ========== */
export interface SearchResultType {
  students: StudentType[];
  courses: CourseType[];
  centers: Center[];
  users: UserType[];
}

export const globalSearch = async (query: string): Promise<SearchResultType> => {
  const res = await api.get("/api/search/", { params: { q: query } });
  return res.data;
};

/* ========== GEOGRAPHICAL API ========== */
export interface DistrictType {
  name: string;
  divisions: string[];
}

export const fetchDistricts = async (): Promise<DistrictType[]> => {
  const res = await api.get("/api/geo/districts/");
  return res.data;
};

export const fetchDivisions = async (district: string): Promise<string[]> => {
  const res = await api.get("/api/geo/divisions/", { params: { district } });
  return res.data;
};

export const fetchGNDivisions = async (district: string, division: string): Promise<string[]> => {
  const res = await api.get("/api/geo/gn-divisions/", { params: { district, division } });
  return res.data;
};

/* ========== VALIDATION API ========== */
export const validateNIC = async (nic: string, studentId?: number): Promise<{ valid: boolean; message?: string }> => {
  const res = await api.get("/api/validate/nic/", { params: { nic, student_id: studentId } });
  return res.data;
};

export const validateEmail = async (email: string, studentId?: number): Promise<{ valid: boolean; message?: string }> => {
  const res = await api.get("/api/validate/email/", { params: { email, student_id: studentId } });
  return res.data;
};

export const validateMobile = async (mobile: string, studentId?: number): Promise<{ valid: boolean; message?: string }> => {
  const res = await api.get("/api/validate/mobile/", { params: { mobile, student_id: studentId } });
  return res.data;
};

/* ========== BULK OPERATIONS API ========== */
export const bulkUpdateStudents = async (studentIds: number[], data: Partial<StudentType>): Promise<{ updated: number; errors: string[] }> => {
  const res = await api.post("/api/students/bulk-update/", { student_ids: studentIds, data });
  return res.data;
};

export const bulkDeleteStudents = async (studentIds: number[]): Promise<{ deleted: number; errors: string[] }> => {
  const res = await api.post("/api/students/bulk-delete/", { student_ids: studentIds });
  return res.data;
};

export const bulkEnrollStudents = async (studentIds: number[], courseId: number): Promise<{ enrolled: number; errors: string[] }> => {
  const res = await api.post("/api/students/bulk-enroll/", { student_ids: studentIds, course_id: courseId });
  return res.data;
};

/* ========== REPORTS API ========== */
export interface ReportType {
  id: number;
  name: string;
  type: string;
  generated_at: string;
  download_url: string;
  status: 'pending' | 'completed' | 'failed';
}

export const fetchAllReports = async (): Promise<ReportType[]> => {
  const res = await api.get("/api/reports/");
  return res.data;
};

export const generateReport = async (type: string, params: any): Promise<{ report_id: number; status: string }> => {
  const res = await api.post("/api/reports/generate/", { type, params });
  return res.data;
};

export const downloadReport = async (reportId: number): Promise<Blob> => {
  const res = await api.get(`/api/reports/${reportId}/download/`, {
    responseType: 'blob'
  });
  return res.data;
};

/* ========== SYSTEM INFO API ========== */
export interface SystemInfoType {
  version: string;
  last_backup: string | null;
  total_users: number;
  total_students: number;
  total_courses: number;
  total_centers: number;
  disk_usage: {
    total: number;
    used: number;
    free: number;
  };
  system_health: 'healthy' | 'warning' | 'error';
}

export const fetchSystemInfo = async (): Promise<SystemInfoType> => {
  const res = await api.get("/api/system/info/");
  return res.data;
};

/* ========== AUDIT LOG API ========== */
export interface AuditLogType {
  id: number;
  user: UserType;
  action: string;
  resource_type: string;
  resource_id: number;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const fetchAuditLogs = async (params?: {
  user?: number;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
}): Promise<AuditLogType[]> => {
  const res = await api.get("/api/audit-logs/", { params });
  return res.data;
};

/* ========== BACKUP & RESTORE API ========== */
export const createBackup = async (): Promise<Blob> => {
  const res = await api.get("/api/backup/", {
    responseType: 'blob'
  });
  return res.data;
};

export const restoreBackup = async (file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('backup_file', file);

  const res = await api.post("/api/restore/", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

/* ========== ATTENDANCE API ========== */
export interface AttendanceRecord {
  id: number;
  student: number;
  student_details?: StudentType;
  course: number;
  course_details?: CourseType;
  date: string;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string | null;
  remarks?: string | null;
  recorded_by: number;
  recorded_by_details?: UserType;
  recorded_at: string;
}

export interface StudentAttendance {
  id: number;
  name: string;
  email: string;
  phone: string;
  nic: string;
  attendance_status: 'present' | 'absent' | 'late' | null;
  check_in_time: string | null;
  remarks: string | null;

}

export interface AttendanceSummary {
  id: number;
  course: number;
  course_details?: CourseType;
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number;
}

export interface StudentAttendanceStats {
  id: number;
  name: string;
  email: string;
  phone: string;
  nic: string;
  attendance_percentage: number;
  total_classes: number;
  present_classes: number;
  late_classes: number;
  absent_classes: number;
  status: 'active' | 'at-risk' | 'inactive';
  last_active: string;
  enrollment_status: string;
  profile_photo_url?: string;
  full_name_english?: string;
  name_with_initials?: string;
  gender?: string;
}

export const fetchAttendance = async (params?: {
  course?: number;
  date?: string;
  status?: string;
}): Promise<AttendanceRecord[]> => {
  const res = await api.get("/api/attendance/", { params });
  return res.data;
};

// In api.ts
// Scan QR code for attendance
export const scanQRCodeForAttendance = async (qrData: string, courseId: number): Promise<any> => {
  const res = await api.post(`/api/attendance/scan-qr/`, {
    qr_data: qrData,
    course_id: courseId
  });
  return res.data;
};

// Get student by QR code data
export const getStudentByQRCode = async (qrData: string): Promise<StudentType> => {
  const res = await api.post(`/api/students/qr-lookup/`, { qr_data: qrData });
  return res.data;
};

export const fetchCourseStudents = async (courseId: number): Promise<StudentAttendance[]> => {
  const res = await api.get(`/api/attendance/course/${courseId}/students/`);
  return res.data;
};

export const updateAttendance = async (data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
  const res = await api.post("/api/attendance/", data);
  return res.data;
};

export const bulkUpdateAttendance = async (courseId: number, data: {
  date: string;
  attendance: Array<{
    student_id: number;
    status: 'present' | 'absent' | 'late';
    check_in_time?: string | null;
    remarks?: string | null;
  }>;
}): Promise<{ message: string; updated: number; errors: string[] }> => {
  const res = await api.post(`/api/attendance/course/${courseId}/bulk/`, data);
  return res.data;
};

export const fetchAttendanceSummary = async (courseId: number, date?: string): Promise<AttendanceSummary> => {
  const params = date ? { date } : {};
  const res = await api.get(`/api/attendance/summary/${courseId}/`, { params });
  return res.data;
};

export const fetchStudentAttendanceStats = async (courseId: number): Promise<StudentAttendanceStats[]> => {
  const res = await api.get(`/api/attendance/course/${courseId}/student-stats/`);
  return res.data;
};

/* ========== ATTENDANCE REPORT API ========== */
export interface ReportRequest {
  course_id: number;
  period: string; // 'daily' | 'weekly' | 'monthly' | 'custom'
  format: 'excel' | 'pdf';
  start_date?: string;
  end_date?: string;
}

export interface ReportResponse {
  success: boolean;
  file_url: string;
  file_name: string;
  message: string;
  report_id?: number;
}

export interface AttendanceReportType {
  id: number;
  course: number;
  course_details?: CourseType;
  period: string;
  format: string;
  start_date: string;
  end_date: string;
  file_url: string;
  file_name: string;
  generated_by: number;
  generated_at: string;
  status: 'processing' | 'completed' | 'failed';
}

// Generate attendance report - FIXED SIMPLIFIED VERSION
export const generateAttendanceReport = async (reportData: ReportRequest): Promise<ReportResponse> => {
  const res = await api.post("/api/attendance/reports/generate/", reportData, {
    responseType: 'blob',
    timeout: 60000
  });

  // Extract filename from headers
  const contentDisposition = res.headers['content-disposition'];
  let fileName = `attendance_report_${Date.now()}.${reportData.format}`;

  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename=\"(.+)\"/);
    if (fileNameMatch) {
      fileName = fileNameMatch[1];
    }
  }

  // Create blob and download
  const blob = new Blob([res.data], {
    type: reportData.format === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf'
  });
  const url = window.URL.createObjectURL(blob);

  // Trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return {
    success: true,
    file_url: url,
    file_name: fileName,
    message: 'Report downloaded successfully'
  };
};

// Download report file by URL
export const downloadReportFile = async (fileUrl: string, fileName: string): Promise<void> => {
  const res = await api.get(fileUrl, {
    responseType: 'blob'
  });

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Download report by ID
export const downloadAttendanceReport = async (reportId: number): Promise<Blob> => {
  const res = await api.get(`/api/attendance/reports/${reportId}/download/`, {
    responseType: 'blob'
  });
  return res.data;
};

// Get report status
export const getReportStatus = async (reportId: number): Promise<AttendanceReportType> => {
  const res = await api.get(`/api/attendance/reports/${reportId}/status/`);
  return res.data;
};

// Get user's generated reports
export const fetchMyAttendanceReports = async (): Promise<AttendanceReportType[]> => {
  const res = await api.get("/api/attendance/reports/my/");
  return res.data;
};

// Delete report
export const deleteAttendanceReport = async (reportId: number): Promise<void> => {
  await api.delete(`/api/attendance/reports/${reportId}/`);
};

/* ========== TRAINING OFFICER REPORTS API ========== */
export interface TrainingOfficerReportType {
  overall_stats: {
    total_students: number;
    total_centers: number;
    total_instructors: number;
    total_courses: number;
    active_courses: number;
    completion_rate: number;
  };
  training_programs: {
    total_programs: number;
    active_programs: number;
    pending_approval: number;
    approved_programs: number;
    completed_programs: number;
    inactive_programs: number;
  };
  training_progress: {
    total_trained: number;
    in_training: number;
    completed_training: number;
    awaiting_training: number;
    dropped_training: number;
  };
  center_performance: Array<{
    center_name: string;
    total_students: number;
    total_courses: number;
    completion_rate: number;
    attendance_rate: number;
    performance: string;
  }>;
  instructor_metrics: Array<{
    instructor_name: string;
    email: string;
    total_courses: number;
    total_students: number;
    completed_students: number;
    completion_rate: number;
    attendance_rate: number;
    performance: string;
  }>;
  course_effectiveness: Array<{
    course_name: string;
    course_code: string;
    category: string;
    instructor: string;
    status: string;
    total_enrolled: number;
    completion_rate: number;
    attendance_rate: number;
    duration: string;
    schedule: string;
  }>;
  training_trends: Array<{
    month: string;
    new_students: number;
    completed_training: number;
    new_courses: number;
  }>;
  pending_approvals: {
    course_approvals: number;
    general_approvals: number;
  };
  user_district: string;
  period: string;
  report_generated_at: string;
  generated_by: string;
}

export const fetchTrainingOfficerReports = async (period?: string): Promise<TrainingOfficerReportType> => {
  const params = period ? { period } : {};
  const res = await api.get("/api/reports/training-officer-reports/", { params });
  return res.data;
};

export const exportTrainingReport = async (
  format: 'pdf' | 'excel',
  period: string,
  reportType: string = 'comprehensive'
): Promise<Blob> => {
  const params = {
    format,
    period,
    report_type: reportType
  };

  const res = await api.get("/api/reports/export-training-report/", {
    params,
    responseType: 'blob'
  });
  return res.data;
};

/* ========== HEAD OFFICE REPORTS API ========== */
export interface HeadOfficeReportType {
  summary: {
    total_districts: number;
    total_centers: number;
    total_students: number;
    total_courses: number;
    total_instructors: number;
    completion_rate: number;
    pending_approvals: number;
  };
  district_performance: Array<{
    name: string;
    centers: number;
    students: number;
    instructors: number;
    completion: number;
    growth: number;
  }>;
  island_trends: Array<{
    period: string;
    enrollment: number;
    completions: number;
    new_instructors: number;
  }>;
  course_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  top_performing_centers: Array<{
    name: string;
    district: string;
    students: number;
    instructors: number;
    completion: number;
  }>;
  instructor_summary: Array<{
    district: string;
    total: number;
    active: number;
    avg_rating: number;
  }>;
}

// Fetch head office reports data
export const fetchHeadOfficeReports = async (): Promise<HeadOfficeReportType> => {
  const res = await api.get("/api/reports/head-office/");
  return res.data;
};

// Export head office report
export const exportHeadOfficeReport = async (
  format: 'pdf' | 'excel',
  period: 'weekly' | 'monthly' | 'quarterly' | 'custom',
  report_type: 'island' | 'districts' | 'centers' | 'comprehensive' | 'instructors',
  options?: {
    start_date?: string;
    end_date?: string;
    include_districts?: boolean;
    include_centers?: boolean;
    include_courses?: boolean;
    include_instructors?: boolean;
  }
): Promise<Blob> => {
  const params = {
    format,
    period,
    report_type,
    ...options
  };

  const res = await api.get("/api/reports/export-head-office/", {
    params,
    responseType: 'blob'
  });
  return res.data;
};


/* ========== DISTRICT MANAGER REPORTS API ========== */
export interface DistrictReportType {
  summary: {
    totalCenters: { current: number };
    totalCourses: { current: number };
    totalUsers: { current: number };
    pendingApprovals: { current: number };
    activeStudents: { current: number };
    completionRate: { current: number };
  };
  centerPerformance: Array<{
    name: string;
    students: number;
    courses: number;
    completion: number;
  }>;
  enrollmentTrend: Array<{
    period: string;
    enrollment: number;
    approvals: number;
  }>;
  courseDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentApprovals: Array<{
    id: number;
    type: string;
    name: string;
    status: string;
    date: string;
  }>;
}

// Fetch district reports data
export const fetchDistrictReports = async (): Promise<DistrictReportType> => {
  const res = await api.get("/api/reports/district/");
  return res.data;
};

// Export district report
export const exportDistrictReport = async (
  format: 'pdf' | 'excel',
  period: 'weekly' | 'monthly' | 'quarterly' | 'custom',
  report_type: 'centers' | 'courses' | 'users' | 'approvals' | 'comprehensive',
  options?: {
    start_date?: string;
    end_date?: string;
    include_centers?: boolean;
    include_courses?: boolean;
    include_users?: boolean;
    include_approvals?: boolean;
  }
): Promise<Blob> => {
  const params = {
    format,
    period,
    report_type,
    ...options
  };

  const res = await api.get("/api/reports/export-district/", {
    params,
    responseType: 'blob'
  });
  return res.data;
};

// Permission check
export const canAccessDistrictReports = (): boolean => {
  const role = getUserRole();
  return role === 'district_manager';
};

export const canAccessTrainingOfficerReports = (): boolean => {
  const role = getUserRole();
  return role === 'training_officer';
};


/* ========== REGISTRATION NUMBER API ========== */
export interface RegistrationNumberPreview {
  district_code: string;
  course_code: string;
  batch_id: number | null;  // Added batch_id
  batch_code: string;  // Added batch_code
  batch_name: string;  // Added batch_name
  student_number: string;
  year: string;
  full_registration: string;
  explanation: {
    district_code: string;
    course_code: string;
    batch_year: string;
    student_number: string;
    year: string;
  };
}

export interface DistrictCodeType {
  id: number;
  district_name: string;
  district_code: string;
  description: string;
}

export interface CourseCodeType {
  id: number;
  course_name: string;
  course_code: string;
  description: string;
}

export interface BatchYearType {
  id: number;
  year_code: string;
  description: string;
  is_active: boolean;
}

export interface RegistrationFormatExample {
  format: string;
  explanation: string;
}

export interface RegistrationFormats {
  format: string;
  examples: RegistrationFormatExample[];
  note: string;
}

// Preview registration number
export const previewRegistrationNumber = async (data: {
  district: string;
  course_id?: number;
  enrollment_date?: string;
  batch_id?: number;  // Added batch_id parameter
}): Promise<RegistrationNumberPreview> => {
  const res = await api.post("/api/students/preview_registration/", data);
  return res.data;
};

// Get registration number formats
export const fetchRegistrationFormats = async (): Promise<RegistrationFormats> => {
  const res = await api.get("/api/students/registration_formats/");
  return res.data;
};

// Get available district codes for dropdown
export const fetchAvailableDistrictCodes = async (): Promise<DistrictCodeType[]> => {
  const res = await api.get("/api/students/available_district_codes/");
  return res.data;
};

// Get available course codes for dropdown
export const fetchAvailableCourseCodes = async (): Promise<CourseCodeType[]> => {
  const res = await api.get("/api/students/available_course_codes/");
  return res.data;
};

// Get available batch years for dropdown
export const fetchAvailableBatchYears = async (): Promise<BatchYearType[]> => {
  const res = await api.get("/api/students/available_batch_years/");
  return res.data;
};

// Batch Type interface
export interface BatchType {
  id: number;
  batch_code: string;
  batch_name: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

// Get available batches for dropdown
export const fetchAvailableBatches = async (): Promise<BatchType[]> => {
  const res = await api.get("/api/students/available_batches/");
  return res.data;
};

export default api;