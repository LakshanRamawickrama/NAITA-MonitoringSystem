// src/pages/Login.tsx - Updated with Account Status Check
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { loginUser, checkAccountStatus, logoutUser } from "../../api/api";

// Account Status Check Component (Integrated)
const AccountStatusCheck: React.FC = () => {
  useEffect(() => {
    const checkStatusOnMount = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      try {
        const status = await checkAccountStatus();
        if (!status.is_active) {
          // User is deactivated, show message and logout
          setTimeout(() => {
            logoutUser();
            window.location.href = '/login';
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking account status on mount:', error);
      }
    };
    
    checkStatusOnMount();
    
    // Check every 5 minutes
    const interval = setInterval(checkStatusOnMount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return null;
};

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeactivatedMessage, setShowDeactivatedMessage] = useState(false);
  const navigate = useNavigate();

  // Check if user was redirected due to deactivation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const deactivated = urlParams.get('deactivated');
    const accountDeactivated = localStorage.getItem('account_deactivated');
    
    if (deactivated === 'true' || accountDeactivated === 'true') {
      setShowDeactivatedMessage(true);
      localStorage.removeItem('account_deactivated');
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check if user is already logged in but account might be deactivated
    const token = localStorage.getItem('access_token');
    if (token) {
      checkExistingUserStatus();
    }
  }, []);

  const checkExistingUserStatus = async () => {
    try {
      const status = await checkAccountStatus();
      if (!status.is_active) {
        setShowDeactivatedMessage(true);
        logoutUser();
      } else {
        // User is active, redirect to dashboard
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error('Error checking existing user status:', error);
      // If token is invalid, clear it
      localStorage.removeItem('access_token');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setShowDeactivatedMessage(false);
    setLoading(true);

    try {
      await loginUser(email, password); // Saves role, name, center_id
      
      // After successful login, check account status
      try {
        const status = await checkAccountStatus();
        
        if (!status.is_active) {
          // Account is deactivated
          localStorage.setItem('account_deactivated', 'true');
          setShowDeactivatedMessage(true);
          logoutUser();
          setErrorMsg("Your account has been deactivated. Please contact your administrator.");
          return;
        }
        
        // Account is active, proceed to dashboard
        navigate("/dashboard", { replace: true });
        
      } catch (statusError) {
        console.error('Error checking account status after login:', statusError);
        // If status check fails but login succeeded, proceed to dashboard
        navigate("/dashboard", { replace: true });
      }
      
    } catch (err: any) {
      console.error("Login failed:", err);
      
      // Check for specific deactivation error message
      if (err.response?.data?.detail?.includes("deactivated") || 
          err.response?.data?.detail?.includes("inactive") ||
          err.message?.includes("deactivated")) {
        setShowDeactivatedMessage(true);
        setErrorMsg("Your account has been deactivated. Please contact your administrator.");
      } else {
        setErrorMsg(err.response?.data?.detail || "Invalid email or password.");
      }
      
      // Clear sensitive data on login failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-50 flex items-center justify-center px-4">
      {/* Account Status Check Component */}
      <AccountStatusCheck />
      
      <div className="max-w-md w-full space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-transparent rounded-full flex items-center justify-center mb-4 shadow-md">
            <img 
              src="/naita-logo.png" 
              alt="NAITA Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextSibling && ((target.nextSibling as HTMLElement).style.display = 'flex');
              }}
            />
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center hidden">
              <span className="text-red-600 font-bold text-4xl">N</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">NAITA MIS</h2>
          <p className="mt-2 text-gray-600">Digital Monitoring System</p>
        </div>

        {/* Deactivated Account Warning */}
        {showDeactivatedMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Account Deactivated</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your account has been deactivated by an administrator. 
                  Please contact your district manager or system administrator 
                  to reactivate your account.
                </p>
                <div className="mt-2 text-xs text-red-600">
                  <p><strong>What this means:</strong></p>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>You cannot access any dashboard features</li>
                    <li>You will be logged out of all active sessions</li>
                    <li>You need administrator approval to regain access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg(""); // Clear error when user starts typing
                  setShowDeactivatedMessage(false);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="Enter your email"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(""); // Clear error when user starts typing
                  setShowDeactivatedMessage(false);
                }}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && !showDeactivatedMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Login Help */}
          <div className="text-sm text-gray-600">
            <p>Use your registered email and password to login.</p>
            <p className="mt-1 text-xs text-gray-500">
              If you've forgotten your password, contact your administrator.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || showDeactivatedMessage}
            className={`w-full py-3 px-4 rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors font-medium flex items-center justify-center space-x-2 ${
              showDeactivatedMessage
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : showDeactivatedMessage ? (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span>Account Deactivated</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Admin Contact Info */}
        {showDeactivatedMessage && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Need Help?</h4>
            <p className="text-sm text-yellow-700">
              Contact your system administrator or district manager:
            </p>
            <div className="mt-2 text-xs text-yellow-600 space-y-1">
              <p><strong>Phone:</strong> +94 11 2 123 456</p>
              <p><strong>Email:</strong> support@naita.gov.lk</p>
              <p><strong>Hours:</strong> Mon-Fri, 8:30 AM - 4:30 PM</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            National Apprentice & Industrial Training Authority
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Secure Login System • v2.0
          </p>
          <div className="mt-3 flex justify-center space-x-4 text-xs text-gray-400">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Use</span>
            <span>•</span>
            <span>Help Center</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;