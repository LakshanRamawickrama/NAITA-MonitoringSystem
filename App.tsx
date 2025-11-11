import React from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './src/pages/Home';
import Login from './src/pages/Login';
import NotFound from './src/pages/NotFound';

// Head Office Dashboard Pages
import HeadOfficeOverview from './src/pages/HeadOfficeDashboard/Overview';
import Centers from './src/pages/HeadOfficeDashboard/Centers';
import Users from './src/pages/HeadOfficeDashboard/Users';
import Approvals from './src/pages/HeadOfficeDashboard/Approvals';
import Reports from './src/pages/HeadOfficeDashboard/Reports';

// Center Manager Dashboard Pages
import CenterManagerOverview from './src/pages/CenterManagerDashboard/Overview';
import CenterManagerStudents from './src/pages/CenterManagerDashboard/Students';
import CenterManagerCourses from './src/pages/CenterManagerDashboard/Courses';
import CenterManagerInstructor from './src/pages/CenterManagerDashboard/Instructor';

// Instructor Dashboard Pages
import InstructorCourses from './src/pages/InstructorDashboard/InstructorCourses';
import InstructorAttendance from './src/pages/InstructorDashboard/InstructorAttendance';
import InstructorStudents from './src/pages/InstructorDashboard/InstructorStudents';

// Data Entry Staff Dashboard Pages
import DataEntryCourses from './src/pages/DataEntryDashboard/DataEntryCourses';
import DataEntryEnrollments from './src/pages/DataEntryDashboard/DataEntryEnrollments';
import DataEntryStudents from './src/pages/DataEntryDashboard/DataEntryStudents';

const App: React.FC = () => {
  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <Router>
        <main className="min-h-screen font-inter">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Head Office Dashboard Routes */}
            <Route path="/admin" element={<HeadOfficeOverview />} />
            <Route path="/admin/centers" element={<Centers />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/approvals" element={<Approvals />} />
            <Route path="/admin/reports" element={<Reports />} />
            
            {/* Center Manager Dashboard Routes */}
            <Route path="/manager" element={<CenterManagerOverview />} />
            <Route path="/manager/students" element={<CenterManagerStudents />} />
            <Route path="/manager/courses" element={<CenterManagerCourses/>} />
            <Route path="/manager/instructors" element={<CenterManagerInstructor/>} />
            
            {/* Instructor Dashboard Routes */}
            <Route path="/instructor" element={<InstructorCourses/>} />
            <Route path="/instructor/students" element={<InstructorStudents/>} />
            <Route path="/instructor/attendance" element={<InstructorAttendance/>} />
            
            {/* Data Entry Staff Dashboard Routes */}
            <Route path="/data-entry" element={<DataEntryStudents/>} />
            <Route path="/data-entry/courses" element={<DataEntryCourses/>} />
            <Route path="/data-entry/enrollments" element={<DataEntryEnrollments/>} />
            
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </main>
      </Router>
    </Theme>
  );
}

export default App;