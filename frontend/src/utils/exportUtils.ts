// src/utils/exportUtils.ts - CLIENT-SIDE EXPORT UTILITIES
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// PDF Export Function
export const exportToPDF = async (reportData: any, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Course Report', 14, 22);
      
      // Add course information
      doc.setFontSize(12);
      doc.text(`Course: ${reportData.course.name} (${reportData.course.code})`, 14, 35);
      doc.text(`Category: ${reportData.course.category || 'N/A'}`, 14, 45);
      doc.text(`District: ${reportData.course.district}`, 14, 55);
      doc.text(`Status: ${reportData.course.status}`, 14, 65);
      doc.text(`Students: ${reportData.course.students}`, 14, 75);
      doc.text(`Progress: ${reportData.course.progress}%`, 14, 85);
      
      // Add key metrics table
      const metricsData = [
        ['Total Students', reportData.analytics.total_students],
        ['Completion Rate', `${reportData.analytics.completion_rate}%`],
        ['Average Attendance', `${reportData.analytics.average_attendance}%`],
        ['Upcoming Deadlines', reportData.analytics.upcoming_deadlines.length]
      ];
      
      (doc as any).autoTable({
        startY: 95,
        head: [['Metric', 'Value']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }
      });
      
      // Add student performance table
      const performanceData = Object.entries(reportData.analytics.student_performance).map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        value
      ]);
      
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Performance Level', 'Students']],
        body: performanceData,
        theme: 'grid'
      });
      
      // Add weekly progress
      const progressData = reportData.analytics.weekly_progress.map((week: any) => [
        week.week,
        `${week.progress}%`
      ]);
      
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Week', 'Progress']],
        body: progressData,
        theme: 'grid'
      });
      
      // Add generated date
      doc.setFontSize(10);
      doc.text(`Generated on: ${reportData.generatedAt}`, 14, (doc as any).lastAutoTable.finalY + 15);
      
      // Save the PDF
      doc.save(`${filename}.pdf`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Excel Export Function
export const exportToExcel = async (reportData: any, filename: string): Promise<void> => {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Course Information Sheet
    const courseInfoData = [
      ['Course Report', '', '', ''],
      ['Course Name:', reportData.course.name, 'Course Code:', reportData.course.code],
      ['Category:', reportData.course.category || 'N/A', 'District:', reportData.course.district],
      ['Status:', reportData.course.status, 'Schedule:', reportData.course.schedule || 'N/A'],
      ['Students:', reportData.course.students, 'Progress:', `${reportData.course.progress}%`],
      ['Next Session:', reportData.course.next_session || 'N/A', 'Created:', new Date(reportData.course.created_at).toLocaleDateString()],
      [''],
      ['Key Metrics', ''],
      ['Total Students', reportData.analytics.total_students],
      ['Completion Rate', `${reportData.analytics.completion_rate}%`],
      ['Average Attendance', `${reportData.analytics.average_attendance}%`],
      ['Upcoming Deadlines', reportData.analytics.upcoming_deadlines.length]
    ];
    
    const courseInfoSheet = XLSX.utils.aoa_to_sheet(courseInfoData);
    XLSX.utils.book_append_sheet(workbook, courseInfoSheet, 'Course Info');
    
    // Student Performance Sheet
    const performanceData = [
      ['Performance Level', 'Students'],
      ...Object.entries(reportData.analytics.student_performance).map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        value
      ])
    ];
    
    const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
    XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Student Performance');
    
    // Weekly Progress Sheet
    const progressData = [
      ['Week', 'Progress'],
      ...reportData.analytics.weekly_progress.map((week: any) => [
        week.week,
        `${week.progress}%`
      ])
    ];
    
    const progressSheet = XLSX.utils.aoa_to_sheet(progressData);
    XLSX.utils.book_append_sheet(workbook, progressSheet, 'Weekly Progress');
    
    // Upcoming Deadlines Sheet
    const deadlinesData = [
      ['Task', 'Due Date', 'Submissions'],
      ...reportData.analytics.upcoming_deadlines.map((deadline: any) => [
        deadline.task,
        deadline.due_date,
        deadline.submissions
      ])
    ];
    
    const deadlinesSheet = XLSX.utils.aoa_to_sheet(deadlinesData);
    XLSX.utils.book_append_sheet(workbook, deadlinesSheet, 'Upcoming Deadlines');
    
    // Generate and download Excel file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    throw error;
  }
};

// CSV Export Function
export const exportToCSV = async (reportData: any, filename: string): Promise<void> => {
  try {
    // Create CSV content
    let csvContent = 'Course Report\n\n';
    
    // Course Information
    csvContent += 'Course Information\n';
    csvContent += `Course Name,${reportData.course.name}\n`;
    csvContent += `Course Code,${reportData.course.code}\n`;
    csvContent += `Category,${reportData.course.category || 'N/A'}\n`;
    csvContent += `District,${reportData.course.district}\n`;
    csvContent += `Status,${reportData.course.status}\n`;
    csvContent += `Students,${reportData.course.students}\n`;
    csvContent += `Progress,${reportData.course.progress}%\n`;
    csvContent += `Schedule,${reportData.course.schedule || 'N/A'}\n`;
    csvContent += `Next Session,${reportData.course.next_session || 'N/A'}\n\n`;
    
    // Key Metrics
    csvContent += 'Key Metrics\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Students,${reportData.analytics.total_students}\n`;
    csvContent += `Completion Rate,${reportData.analytics.completion_rate}%\n`;
    csvContent += `Average Attendance,${reportData.analytics.average_attendance}%\n`;
    csvContent += `Upcoming Deadlines,${reportData.analytics.upcoming_deadlines.length}\n\n`;
    
    // Student Performance
    csvContent += 'Student Performance\n';
    csvContent += 'Level,Students\n';
    Object.entries(reportData.analytics.student_performance).forEach(([key, value]) => {
      csvContent += `${key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')},${value}\n`;
    });
    csvContent += '\n';
    
    // Weekly Progress
    csvContent += 'Weekly Progress\n';
    csvContent += 'Week,Progress\n';
    reportData.analytics.weekly_progress.forEach((week: any) => {
      csvContent += `${week.week},${week.progress}%\n`;
    });
    csvContent += '\n';
    
    // Upcoming Deadlines
    csvContent += 'Upcoming Deadlines\n';
    csvContent += 'Task,Due Date,Submissions\n';
    reportData.analytics.upcoming_deadlines.forEach((deadline: any) => {
      csvContent += `${deadline.task},${deadline.due_date},${deadline.submissions}\n`;
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    throw error;
  }
};