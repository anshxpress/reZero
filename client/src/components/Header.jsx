import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden rounded-md p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-secondary-900">
                Re-Zero AI Framework
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="rounded-full p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center rounded-full bg-secondary-100 p-2 text-secondary-500 hover:bg-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <User className="h-6 w-6" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 text-sm text-secondary-700 border-b border-secondary-200">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-secondary-500">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Profile Settings
                  </Link>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
