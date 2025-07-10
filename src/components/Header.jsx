import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import LogoutButton from './LogoutButton';

const { FiCheckSquare, FiList, FiHome, FiArchive, FiGrid, FiSettings, FiBriefcase } = FiIcons;

function Header({ onLogout }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/overview', icon: FiGrid, label: 'Overview' },
    { path: '/tasks', icon: FiList, label: 'All Tasks' },
    { path: '/projects', icon: FiBriefcase, label: 'Projects' },
    { path: '/archive', icon: FiArchive, label: 'Archive' },
    { path: '/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <SafeIcon icon={FiCheckSquare} className="text-2xl text-blue-600" />
            <span className="text-xl font-bold text-gray-900">NGOG ToDo Tracker</span>
          </Link>

          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={item.icon} className="text-lg" />
                  <span>{item.label}</span>
                </div>
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}

            {/* Logout Button */}
            <LogoutButton onLogout={onLogout} />
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;