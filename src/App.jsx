import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskArchive from './pages/TaskArchive';
import CategoryOverview from './pages/CategoryOverview';
import ProjectsCooperations from './pages/ProjectsCooperations';
import Settings from './pages/Settings';
import NotificationBanner from './components/NotificationBanner';
import PasswordProtection from './components/PasswordProtection';
import { TaskProvider } from './contexts/TaskContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ProjectProvider } from './contexts/ProjectContext';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const handleAuthentication = (authenticated) => {
    setIsAuthenticated(authenticated);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticate={handleAuthentication} />;
  }

  return (
    <Router>
      <TaskProvider>
        <CategoryProvider>
          <ProjectProvider>
            <div className="min-h-screen bg-gray-50">
              <Header onLogout={handleLogout} />
              <NotificationBanner 
                show={showNotification} 
                onClose={() => setShowNotification(false)} 
              />
              <motion.main
                className="container mx-auto px-4 py-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/overview" element={<CategoryOverview />} />
                  <Route path="/tasks" element={<TaskList />} />
                  <Route path="/projects" element={<ProjectsCooperations />} />
                  <Route path="/archive" element={<TaskArchive />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </motion.main>
            </div>
          </ProjectProvider>
        </CategoryProvider>
      </TaskProvider>
    </Router>
  );
}

export default App;