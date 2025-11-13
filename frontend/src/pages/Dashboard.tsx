import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SharedNavbar from "../components/SharedNavbar";

// === Import ALL your pages ===
import HeadOfficeOverview from "./HeadOfficeDashboard/Overview";
import Centers from "./HeadOfficeDashboard/Centers";
import Users from "./HeadOfficeDashboard/Users";
import Approvals from "./HeadOfficeDashboard/Approvals";
import Reports from "./HeadOfficeDashboard/Reports";

import CenterManagerOverview from "./CenterManagerDashboard/Overview";
import CenterManagerStudents from "./CenterManagerDashboard/Students";
import CenterManagerCourses from "./CenterManagerDashboard/Courses";
import CenterManagerInstructor from "./CenterManagerDashboard/Instructor";

import InstructorCourses from "./InstructorDashboard/InstructorCourses";
import InstructorStudents from "./InstructorDashboard/InstructorStudents";
import InstructorAttendance from "./InstructorDashboard/InstructorAttendance";

import DataEntryStudents from "./DataEntryDashboard/DataEntryStudents";
import DataEntryCourses from "./DataEntryDashboard/DataEntryCourses";
import DataEntryEnrollments from "./DataEntryDashboard/DataEntryEnrollments";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<string>("");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const r = localStorage.getItem("user_role") as any;
    const first = localStorage.getItem("user_first_name") || "";
    const last = localStorage.getItem("user_last_name") || "";
    setRole(r);
    setUserName(`${first} ${last}`.trim() || "User");

    // Auto-redirect to default tab
    if (location.pathname === "/dashboard") {
      const defaultPath = getDefaultPath(r);
      navigate(defaultPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  const getDefaultPath = (role: string) => {
    const map: Record<string, string> = {
      admin: "/dashboard/admin",
      center_manager: "/dashboard/manager",
      instructor: "/dashboard/instructor",
      data_entry: "/dashboard/data-entry",
    };
    return map[role] || "/dashboard/admin";
  };

  if (!role) return <div className="p-8 text-center">Logging in...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavbar userRole={role as any} userName={userName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* === ADMIN === */}
        {role === "admin" && location.pathname === "/dashboard/admin" && <HeadOfficeOverview />}
        {role === "admin" && location.pathname === "/dashboard/admin/centers" && <Centers />}
        {role === "admin" && location.pathname === "/dashboard/admin/users" && <Users />}
        {role === "admin" && location.pathname === "/dashboard/admin/approvals" && <Approvals />}
        {role === "admin" && location.pathname === "/dashboard/admin/reports" && <Reports />}

        {/* === CENTER MANAGER === */}
        {role === "center_manager" && location.pathname === "/dashboard/manager" && <CenterManagerOverview />}
        {role === "center_manager" && location.pathname === "/dashboard/manager/students" && <CenterManagerStudents />}
        {role === "center_manager" && location.pathname === "/dashboard/manager/courses" && <CenterManagerCourses />}
        {role === "center_manager" && location.pathname === "/dashboard/manager/instructors" && <CenterManagerInstructor />}

        {/* === INSTRUCTOR === */}
        {role === "instructor" && location.pathname === "/dashboard/instructor" && <InstructorCourses />}
        {role === "instructor" && location.pathname === "/dashboard/instructor/students" && <InstructorStudents />}
        {role === "instructor" && location.pathname === "/dashboard/instructor/attendance" && <InstructorAttendance />}

        {/* === DATA ENTRY === */}
        {role === "data_entry" && location.pathname === "/dashboard/data-entry" && <DataEntryStudents />}
        {role === "data_entry" && location.pathname === "/dashboard/data-entry/courses" && <DataEntryCourses />}
        {role === "data_entry" && location.pathname === "/dashboard/data-entry/enrollments" && <DataEntryEnrollments />}
      </div>
    </div>
  );
};

export default Dashboard;