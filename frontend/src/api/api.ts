// src/api/api.ts - COMPLETE FIXED VERSION
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
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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
  is_active: boolean;
  is_staff: boolean;
  last_login: string | null;
}

/* ========== CENTER API ========== */
export interface Center {
  id: number;
  name: string;
  location: string | null;
  district: string | null;
  manager?: string | null;
  phone?: string | null;
  students?: number | null;
  instructors?: number | null;
  status?: string;
  performance?: string | null;
}

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
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Inactive';
  priority: string;
  created_at: string;
  updated_at: string;
}

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

/* ========== USER MANAGEMENT API ========== */
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

/* ========== CENTER MANAGEMENT API ========== */
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
  students?: number | null;
  instructors?: number | null;
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
    students: number | null;
    instructors: number | null;
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

/* ========== COURSE MANAGEMENT API - FIXED ========== */
export const fetchCourses = async (params?: {
  district?: string;
  status?: string;
  category?: string;
}): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/", { params });
  return res.data;
};

/* GET /api/courses/my/ - Instructor's assigned courses */
export const fetchMyCourses = async (): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/my/");
  return res.data;
};

/* GET /api/courses/available/ - Available courses for instructors */
export const fetchAvailableCourses = async (): Promise<CourseType[]> => {
  const res = await api.get("/api/courses/available/");
  return res.data;
};

/* GET /api/courses/pending/ - Pending approval courses */
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

/* POST /api/courses/:id/assign_instructor/ */
export const assignInstructor = async (id: number, instructorId: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/assign_instructor/`, { instructor_id: instructorId });
  return res.data;
};

/* POST /api/courses/:id/assign_to_me/ - Instructor self-assign */
export const assignCourseToMe = async (id: number): Promise<CourseType> => {
  const res = await api.post(`/api/courses/${id}/assign_to_me/`);
  return res.data;
};

/* POST /api/courses/:id/submit_for_approval/ */
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

/* ========== COURSE APPROVAL API ========== */
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

export const approveCourse = async (id: number): Promise<CourseApprovalType> => {
  const res = await api.post(`/api/course-approvals/${id}/approve/`);
  return res.data;
};

export const rejectCourse = async (id: number): Promise<CourseApprovalType> => {
  const res = await api.post(`/api/course-approvals/${id}/reject/`);
  return res.data;
};

export const requestCourseChanges = async (id: number, comments: string): Promise<CourseApprovalType> => {
  const res = await api.post(`/api/course-approvals/${id}/request_changes/`, { comments });
  return res.data;
};

/* ========== COURSE ENROLLMENT API ========== */
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

/* ========== GENERAL APPROVALS API ========== */
export const fetchApprovals = async (): Promise<ApprovalType[]> => {
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

/* ========== DASHBOARD & REPORTS API ========== */
export const fetchOverview = async () => {
  const res = await api.get("/api/overview/");
  return res.data;
};

export const fetchReports = async (period: string, center: string) => {
  const res = await api.get(`/api/reports/?period=${period}&center=${center}`);
  return res.data;
};

export const fetchDashboardStats = async () => {
  const res = await api.get("/api/dashboard/stats/");
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

/* ========== INSTRUCTOR API ========== */
export const fetchInstructors = async (): Promise<UserType[]> => {
  const res = await api.get("/api/instructors/");
  return res.data;
};

export const fetchUsersByRole = async (role?: string): Promise<UserType[]> => {
  const params = role ? { role } : {};
  const res = await api.get("/api/users/", { params });
  return res.data;
};

/* ========== REFRESH TOKEN ========== */
export const refreshToken = async (): Promise<{ access: string }> => {
  const refresh = localStorage.getItem("refresh_token");
  const res = await api.post("/api/token/refresh/", { refresh });
  localStorage.setItem("access_token", res.data.access);
  return res.data;
};

// Add to api.ts
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

// Course Content API
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

// Course Progress API
export const fetchCourseProgress = async (courseId: number): Promise<CourseProgressType[]> => {
  const res = await api.get(`/api/course-progress/?course=${courseId}`);
  return res.data;
};

// Course Reports API
export const fetchCourseReports = async (courseId: number): Promise<CourseReportType[]> => {
  const res = await api.get(`/api/course-reports/?course=${courseId}`);
  return res.data;
};

export const createCourseReport = async (data: Partial<CourseReportType>): Promise<CourseReportType> => {
  const res = await api.post('/api/course-reports/', data);
  return res.data;
};

// Analytics API
export const fetchCourseAnalytics = async (courseId: number): Promise<CourseAnalyticsType> => {
  const res = await api.get(`/api/courses/${courseId}/analytics/`);
  return res.data;
};

export const fetchStudentProgress = async (courseId: number): Promise<CourseProgressType[]> => {
  const res = await api.get(`/api/courses/${courseId}/student-progress/`);
  return res.data;
};

/* ========== COURSE EXPORT API ========== */
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

export default api;