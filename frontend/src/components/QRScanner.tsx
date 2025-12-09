
import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, CheckCircle, AlertCircle, User, RefreshCw } from 'lucide-react';
import { scanQRCodeForAttendance, getStudentByQRCode, fetchMyCourses } from '../api/api';
import type { StudentType, CourseType } from '../api/api';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScanComplete: (result: any) => void;
  onClose: () => void;
  courseId?: number;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete, onClose, courseId }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [student, setStudent] = useState<StudentType | null>(null);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(courseId || null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    loadCourses();
    startCamera();
    
    // Cleanup function to ensure camera is stopped
    return () => {
      cleanupCamera();
    };
  }, []);

  // Separate cleanup function that's also used in stopCamera
  const cleanupCamera = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop(); // Stop each track
        streamRef.current?.removeTrack(track); // Remove from stream
      });
      streamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force reload to clear
    }
    
    setScanning(false);
  };

  const loadCourses = async () => {
    try {
      const myCourses = await fetchMyCourses();
      setCourses(myCourses);
      if (myCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(myCourses[0].id);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const startCamera = async () => {
    try {
      // First clean up any existing camera
      cleanupCamera();
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Store stream reference
      streamRef.current = stream;
      
      // Setup video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => {
              setScanning(true);
              scanFrame();
            })
            .catch(err => {
              console.error('Error playing video:', err);
              setStatus('error');
              setMessage('Failed to start camera stream');
              cleanupCamera();
            });
        };
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setStatus('error');
      setMessage('Unable to access camera. Please check permissions.');
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        handleQRCode(code.data);
      }
    }

    if (scanning) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  const stopCamera = () => {
    cleanupCamera();
  };

  const handleQRCode = async (qrData: string) => {
    if (!selectedCourse) {
      setStatus('error');
      setMessage('Please select a course first');
      return;
    }

    setLoading(true);
    setStatus('idle');
    
    // Stop scanning while processing
    stopCamera();

    try {
      // Try to parse as JSON first
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as direct registration number
        parsedData = { registration_no: qrData.trim() };
      }

      // Get student details
      const studentData = await getStudentByQRCode(JSON.stringify(parsedData));
      setStudent(studentData);

      // Mark attendance
      const result = await scanQRCodeForAttendance(JSON.stringify(parsedData), selectedCourse);
      
      setScannedData(result);
      setStatus('success');
      setMessage(`Attendance marked for ${studentData.full_name_english}`);
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onScanComplete(result);
        handleClose();
      }, 2000);

    } catch (error: any) {
      console.error('QR scan error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || error.message || 'Failed to process QR code');
      
      // Restart camera on error
      setTimeout(startCamera, 1000);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    stopCamera();
    setScannedData(null);
    setStudent(null);
    setStatus('idle');
    setMessage('');
    setLoading(false);
    
    // Restart camera after a brief delay
    setTimeout(startCamera, 300);
  };

  const handleClose = () => {
    cleanupCamera(); // Ensure camera is properly stopped
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">QR Code Scanner</h2>
            <p className="text-sm text-gray-600">Scan student ID card QR code</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course (for attendance)
            </label>
            <select
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading || scanning}
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.code}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Scanner */}
          <div className="space-y-4">
            <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-900 min-h-[350px] flex items-center justify-center">
              {/* Camera View */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
                muted
                playsInline
              />
              
              {/* Canvas for QR detection (hidden) */}
              <canvas ref={canvasRef} className="hidden" />
              
              {!scanning && !loading && (
                <div className="text-center p-6 z-10">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">Starting camera...</p>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-24 mx-auto"></div>
                  </div>
                </div>
              )}
              
              {/* Scanning overlay */}
              {scanning && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 z-20">
                  <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative animate-pulse">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-500"></div>
                  </div>
                  <p className="mt-6 text-white font-medium text-lg">Align QR code within frame</p>
                  <p className="text-gray-300 text-sm mt-2">Position student's ID card QR code inside the green frame</p>
                </div>
              )}
              
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-white font-medium">Processing QR code...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Camera Controls */}
            <div className="flex justify-center space-x-4">
              {scanning ? (
                <button
                  onClick={stopCamera}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                  disabled={loading}
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              )}
              
              <button
                onClick={resetScanner}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Status Display */}
          {status !== 'idle' && (
            <div className={`p-4 rounded-lg border ${
              status === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-3">
                {status === 'success' ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">
                    {status === 'success' ? 'Success!' : 'Error'}
                  </p>
                  <p className="mt-1">{message}</p>
                  {status === 'success' && (
                    <p className="text-sm mt-2 text-green-700">
                      Closing automatically...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Student Info Display */}
          {student && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Student Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Name:</p>
                  <p className="text-gray-900">{student.full_name_english}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Reg No:</p>
                  <p className="text-gray-900 font-mono">{student.registration_no}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">NIC:</p>
                  <p className="text-gray-900">{student.nic_id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Course:</p>
                  <p className="text-gray-900">{student.course_name || 'Not assigned'}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-gray-600">Center:</p>
                  <p className="text-gray-900">{student.center_name || 'Not assigned'}</p>
                </div>
                {scannedData?.attendance && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
                    <p className="font-medium text-gray-600">Attendance Result:</p>
                    <div className={`inline-flex items-center space-x-2 mt-1 px-3 py-1 rounded-full ${
                      scannedData.attendance.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : scannedData.attendance.status === 'late' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="font-semibold capitalize">
                        {scannedData.attendance.status}
                      </span>
                      {scannedData.attendance.check_in_time && (
                        <span className="text-xs">
                          at {scannedData.attendance.check_in_time}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">How to scan:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>Hold student's ID card QR code steady in front of camera</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>Ensure good lighting and clear view of QR code</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>Camera will auto-detect and mark attendance</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {scanning ? (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>Scanning for QR codes...</span>
              </div>
            ) : (
              <span>Camera is off</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={resetScanner}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              disabled={loading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;