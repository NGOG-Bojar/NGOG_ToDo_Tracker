import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import LogoutButton from './LogoutButton';

const {
  FiCheckSquare,
  FiList,
  FiHome,
  FiArchive,
  FiGrid,
  FiSettings,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronUp
} = FiIcons;

function Header() {
  const location = useLocation();
  const [showTasksSubmenu, setShowTasksSubmenu] = useState(false);
  const { user, session } = useAuth();

  const navItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    {
      path: '/overview',
      icon: FiList,
      label: 'Tasks',
      hasSubmenu: true,
      submenuItems: [
        { path: '/tasks', label: 'All Tasks', icon: FiList }
      ]
    },
    { path: '/projects', icon: FiBriefcase, label: 'Projects' },
    { path: '/events', icon: FiCalendar, label: 'Events' },
    { path: '/archive', icon: FiArchive, label: 'Archive' },
    { path: '/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <SafeIcon icon={FiCheckSquare} className="text-2xl text-blue-600" />
            <span className="text-xl font-bold text-gray-900">NGOG ToDo Tracker</span>
          </Link>
          <nav className="flex items-center space-x-4">
            {navItems.map((item) => (
              <div key={item.path} className="relative">
                {item.hasSubmenu ? (
                  <div className="flex flex-col">
                    <button 
                      onClick={() => setShowTasksSubmenu(!showTasksSubmenu)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                        location.pathname === item.path || 
                        (showTasksSubmenu && item.submenuItems.some(subItem => location.pathname === subItem.path)) 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      } transition-all duration-200`}
                    >
                      <SafeIcon icon={item.icon} className="text-lg mr-1.5" />
                      <span className="min-w-[56px] text-left">{item.label}</span>
                      <SafeIcon 
                        icon={showTasksSubmenu ? FiChevronUp : FiChevronDown} 
                        className="ml-1 text-sm" 
                      />
                    </button>
                    
                    {showTasksSubmenu && (
                      <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 z-10 min-w-[140px]">
                        <div className="py-1">
                          <Link 
                            to={item.path}
                            className={`block px-3 py-1.5 text-sm font-medium ${
                              location.pathname === item.path 
                                ? 'text-blue-600 bg-blue-50' 
                                : 'text-gray-700 hover:bg-gray-50'
                            } transition-colors`}
                          >
                            <SafeIcon icon={FiGrid} className="inline mr-1.5 text-base" />
                            Overview
                          </Link>
                          {item.submenuItems.map(subItem => (
                            <Link 
                              key={subItem.path}
                              to={subItem.path}
                              className={`block px-3 py-1.5 text-sm font-medium ${
                                location.pathname === subItem.path 
                                  ? 'text-blue-600 bg-blue-50' 
                                  : 'text-gray-700 hover:bg-gray-50'
                              } transition-colors`}
                            >
                              <SafeIcon icon={subItem.icon} className="inline mr-1.5 text-base" />
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`relative flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                      location.pathname === item.path 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    } transition-all duration-200`}
                  >
                    <SafeIcon icon={item.icon} className="text-lg mr-1.5" />
                    <span className="min-w-[56px] text-left">{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
            {/* Logout Button */}
            {user && session && (
              <div className="ml-3 pl-3 border-l border-gray-200">
                <LogoutButton />
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;