import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import Archive from './pages/Archive';
import CategoryOverview from './pages/CategoryOverview';
import ProjectsCooperations from './pages/ProjectsCooperations';
import EventsPage from './pages/EventsPage';
import Settings from './pages/Settings';
import NotificationBanner from './components/NotificationBanner';
import PasswordProtection from './components/PasswordProtection';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { TaskProvider } from './contexts/TaskContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ActivityLogCategoryProvider } from './contexts/ActivityLogCategoryContext';
import { EventProvider } from './contexts/EventContext';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthentication = (authenticated) => {
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is already authenticated
      const isAuth = sessionStorage.getItem('todoAppAuthenticated') === 'true';
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Show loading spinner during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticate={handleAuthentication} />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <TaskProvider>
          <CategoryProvider>
            <ProjectProvider>
              <ActivityLogCategoryProvider>
                <EventProvider>
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
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/archive" element={<Archive />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </motion.main>
                  </div>
                </EventProvider>
              </ActivityLogCategoryProvider>
            </ProjectProvider>
          </CategoryProvider>
        </TaskProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;