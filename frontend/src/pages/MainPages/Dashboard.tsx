import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SharedNavbar from "../../components/SharedNavbar";

// === Import ALL your pages ===
import Centers from "./Centers";
import Users from "./Users";


import HeadOfficeOverview from "../HeadOfficeDashboard/HeadOfficeOverview";
import HeadOfficeCourses from "../HeadOfficeDashboard/HeadOfficeCourses";
import HeadOfficeApprovals from "../HeadOfficeDashboard/HeadOfficeApprovals";
import HeadOfficeReports from "../HeadOfficeDashboard/HeadOfficeReports";

import DistrictManagerOverview from "../DistrictManagerDashboard/DistrictManagerOverview";
import DistrictManagerCourses from "../DistrictManagerDashboard/DistrictManagerCourses";
import DistrictManagerApprovals from "../DistrictManagerDashboard/DistrictManagerApprovals";

import TrainingOfficerInstructor from "../TrainingOfficerDashboard/TrainingOfficerInstructor";
import TrainingOfficerCourses from "../TrainingOfficerDashboard/TrainingOfficerCourses";
import TrainingOfficeOverview from "../TrainingOfficerDashboard/TrainingOfficerOverview";

import DataEntryStudents from "../DataEntryDashboard/DataEntryStudents";
import DataEntryCourses from "../DataEntryDashboard/DataEntryCourses";
import DataEntryEnrollments from "../DataEntryDashboard/DataEntryEnrollments";

import InstructorOverview from "../InstructorDashboard/InstructorOverview";
import InstructorCourses from "../InstructorDashboard/InstructorCourses";
import InstructorStudents from "../InstructorDashboard/InstructorStudents";
import InstructorAttendance from "../InstructorDashboard/InstructorAttendance";


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
      district_manager: "/dashboard/manager",
      training_officer: "/dashboard/training_officer",
      data_entry: "/dashboard/data-entry",
      instructor: "/dashboard/instructor"
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
        {role === "admin" && location.pathname === "/dashboard/admin/approvals" && <HeadOfficeApprovals />}
        {role === "admin" && location.pathname === "/dashboard/admin/courses" && <HeadOfficeCourses />}
        {role === "admin" && location.pathname === "/dashboard/admin/reports" && <HeadOfficeReports />}

        {/* === CENTER MANAGER === */}
        {role === "district_manager" && location.pathname === "/dashboard/manager" && <DistrictManagerOverview />}
        {role === "district_manager" && location.pathname === "/dashboard/manager/centers" && <Centers />}
        {role === "district_manager" && location.pathname === "/dashboard/manager/users" && <Users />}
        {role === "district_manager" && location.pathname === "/dashboard/manager/courses" && <DistrictManagerCourses />}
        {role === "district_manager" && location.pathname === "/dashboard/manager/approvals_dm" && <DistrictManagerApprovals />}

        {/* === TRAINING OFFICER === */}
        {role === "training_officer" && location.pathname === "/dashboard/training_officer/instructors" && <TrainingOfficerInstructor />}
        {role === "training_officer" && location.pathname === "/dashboard/training_officer" && <TrainingOfficeOverview />}
        {role === "training_officer" && location.pathname === "/dashboard/training_officer/courses" && <TrainingOfficerCourses />}


        {/* === DATA ENTRY === */}
        {role === "data_entry" && location.pathname === "/dashboard/data-entry" && <DataEntryStudents />}
        {role === "data_entry" && location.pathname === "/dashboard/data-entry/courses" && <DataEntryCourses />}
        {role === "data_entry" && location.pathname === "/dashboard/data-entry/enrollments" && <DataEntryEnrollments />}

        {/* === INSTRUCTOR === */}
        {role === "instructor" && location.pathname === "/dashboard/instructor" && <InstructorOverview />}
        {role === "instructor" && location.pathname === "/dashboard/instructor/courses" && <InstructorCourses />}
        {role === "instructor" && location.pathname === "/dashboard/instructor/student" && <InstructorStudents />}
        {role === "instructor" && location.pathname === "/dashboard/instructor/attendance" && <InstructorAttendance />}
      </div>
    </div>
  );
};

export default Dashboard;