// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SharedNavbar from "../../components/SharedNavbar";

//Main
import Centers from "./Centers";
import Users from "./Users";
import Instructor from "./Instructor";
import Students from "./Students";

// ADMIN
import HeadOfficeOverview from "../HeadOfficeDashboard/HeadOfficeOverview";
import HeadOfficeCourses from "../HeadOfficeDashboard/HeadOfficeCourses";
import HeadOfficeApprovals from "../HeadOfficeDashboard/HeadOfficeApprovals";
import HeadOfficeReports from "../HeadOfficeDashboard/HeadOfficeReports";

// DISTRICT MANAGER
import DistrictManagerOverview from "../DistrictManagerDashboard/DistrictManagerOverview";
import DistrictManagerCourses from "../DistrictManagerDashboard/DistrictManagerCourses";
import DistrictManagerApprovals from "../DistrictManagerDashboard/DistrictManagerApprovals";
import DistrictManagerReports from "../DistrictManagerDashboard/DistrictManagerReports";

// TRAINING OFFICER
import TrainingOfficerCourses from "../TrainingOfficerDashboard/TrainingOfficerCourses";
import TrainingOfficerOverview from "../TrainingOfficerDashboard/TrainingOfficerOverview";
import TrainingOfficerReports from "../TrainingOfficerDashboard/TrainingOfficerReports";

// DATA ENTRY
import DataEntryStudents from "../DataEntryDashboard/DataEntryStudents";
import DataEntryOverview from "../DataEntryDashboard/DataEntryOverview";

// INSTRUCTOR
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
    const r = localStorage.getItem("user_role") || "";
    const first = localStorage.getItem("user_first_name") || "";
    const last = localStorage.getItem("user_last_name") || "";

    setRole(r);
    setUserName(`${first} ${last}`.trim() || "User");

    if (location.pathname === "/dashboard") {
      navigate(getDefaultPath(r), { replace: true });
    }
  }, [location.pathname]);

  const getDefaultPath = (r: string) => {
    const paths: any = {
      admin: "/dashboard/admin",
      district_manager: "/dashboard/manager",
      training_officer: "/dashboard/training_officer",
      data_entry: "/dashboard/data-entry",
      instructor: "/dashboard/instructor",
    };
    return paths[r] || "/dashboard/admin";
  };

  if (!role) return <div className="p-10 text-center">Loading Dashboard...</div>;

  const renderContent = () => {
    const p = location.pathname;

    // ADMIN
    if (role === "admin") {
      if (p === "/dashboard/admin") return <HeadOfficeOverview />;
      if (p === "/dashboard/admin/centers") return <Centers />;
      if (p === "/dashboard/admin/users") return <Users />;
      if (p === "/dashboard/admin/instructors") return <Instructor />;
      if (p === "/dashboard/admin/courses") return <HeadOfficeCourses />;
      if (p === "/dashboard/admin/students") return <Students />;
      if (p === "/dashboard/admin/approvals") return <HeadOfficeApprovals />;
      if (p === "/dashboard/admin/reports") return <HeadOfficeReports />;
    }

    // DISTRICT MANAGER
    if (role === "district_manager") {
      if (p === "/dashboard/manager") return <DistrictManagerOverview />;
      if (p === "/dashboard/manager/centers") return <Centers />;
      if (p === "/dashboard/manager/users") return <Users />;
      if (p === "/dashboard/manager/students") return <Students />;
      if (p === "/dashboard/manager/instructors") return <Instructor />;
      if (p === "/dashboard/manager/courses") return <DistrictManagerCourses />;
      if (p === "/dashboard/manager/approvals_dm") return <DistrictManagerApprovals />;
      if (p === "/dashboard/manager/reports") return <DistrictManagerReports />;
    }

    // TRAINING OFFICER
    if (role === "training_officer") {
      if (p === "/dashboard/training_officer") return <TrainingOfficerOverview />;
      if (p === "/dashboard/training_officer/courses") return <TrainingOfficerCourses />;
      if (p === "/dashboard/training_officer/users") return <Users />;
      if (p === "/dashboard/training_officer/instructors") return <Instructor />;
      if (p === "/dashboard/training_officer/reports") return <TrainingOfficerReports />;
    }

    // DATA ENTRY
    if (role === "data_entry") {
      if (p === "/dashboard/data-entry") return <DataEntryStudents />;
      if (p === "/dashboard/data-entry/overview") return <DataEntryOverview />;
    }

    // INSTRUCTOR
    if (role === "instructor") {
      if (p === "/dashboard/instructor") return <InstructorOverview />;
      if (p === "/dashboard/instructor/courses") return <InstructorCourses />;
      if (p === "/dashboard/instructor/student") return <InstructorStudents />;
      if (p === "/dashboard/instructor/attendance") return <InstructorAttendance />;
    }

    return <div className="p-10">Page Not Found</div>;
  };

  return (
    <SharedNavbar userRole={role as any} userName={userName}>
      {renderContent()}
    </SharedNavbar>
  );
};

export default Dashboard;