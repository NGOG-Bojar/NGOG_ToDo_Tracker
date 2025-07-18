import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import Archive from './pages/Archive';
import CategoryOverview from './pages/CategoryOverview';
import ProjectsCooperations from './pages/ProjectsCooperations';
import EventsPage from './pages/EventsPage';
import Settings from './pages/Settings';
import NotificationBanner from './components/NotificationBanner';
import AuthGuard from './components/auth/AuthGuard';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import SyncConflictHandler from './components/SyncConflictHandler';
import { TaskProvider } from './contexts/TaskContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ActivityLogCategoryProvider } from './contexts/ActivityLogCategoryContext';
import { EventProvider } from './contexts/EventContext';
import './App.css';

function AppContent() {
  const { user, session, loading } = useAuth();
  const [showNotification, setShowNotification] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <TaskProvider>
        <CategoryProvider>
          <ProjectProvider>
            <ActivityLogCategoryProvider>
              <EventProvider>
                <div className="min-h-screen bg-gray-50">
                  <Header />
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
                  <SyncStatusIndicator />
                  <SyncConflictHandler />
                </div>
              </EventProvider>
            </ActivityLogCategoryProvider>
          </ProjectProvider>
        </CategoryProvider>
      </TaskProvider>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;