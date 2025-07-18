import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
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
import { TaskProvider } from './contexts/TaskContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ActivityLogCategoryProvider } from './contexts/ActivityLogCategoryContext';
import { EventProvider } from './contexts/EventContext';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  return (
    <AuthProvider>
      <AuthGuard>
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
                    </div>
                  </EventProvider>
                </ActivityLogCategoryProvider>
              </ProjectProvider>
            </CategoryProvider>
          </TaskProvider>
        </Router>
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;