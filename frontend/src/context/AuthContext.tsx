import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  center: string | null;
  login: (access: string, refresh: string, role: string, center: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refresh_token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [center, setCenter] = useState<string | null>(localStorage.getItem('center'));

  const login = (access: string, refresh: string, userRole: string, userCenter: string | null) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('role', userRole);
    localStorage.setItem('center', userCenter || '');

    setAccessToken(access);
    setRefreshToken(refresh);
    setRole(userRole);
    setCenter(userCenter);
  };

  const logout = () => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setRole(null);
    setCenter(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, role, center, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
