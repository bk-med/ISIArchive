import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Documents from './pages/dashboard/Documents';
import DocumentDetails from './pages/dashboard/DocumentDetails';
import Trash from './pages/dashboard/Trash';
import Profile from './pages/profile/Profile';
import UserManagement from './pages/admin/UserManagement';
import FiliereManagement from './pages/admin/FiliereManagement';
import MatiereManagement from './pages/admin/MatiereManagement';
import Activity from './pages/admin/Activity';
import SubjectManagement from './pages/professor/SubjectManagement';
import MatiereDetails from './pages/professor/MatiereDetails';
import StudentSubjects from './pages/student/StudentSubjects';
import StudentMatiereDetails from './pages/student/StudentMatiereDetails';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <ProtectedRoute requireAuth={false}>
                  <ForgotPassword />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reset-password"
              element={
                <ProtectedRoute requireAuth={false}>
                  <ResetPassword />
                </ProtectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Documents />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DocumentDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/trash"
              element={
                <ProtectedRoute roles={['professeur', 'admin']}>
                  <Layout>
                    <Trash />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/filieres"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <FiliereManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/matieres"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <MatiereManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <Activity />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                        Administration
                      </h2>
                      <p className="text-secondary-600">
                        Sélectionnez une section d'administration dans le menu
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Professor routes */}
            <Route
              path="/professor/subjects"
              element={
                <ProtectedRoute roles={['professeur']}>
                  <Layout>
                    <SubjectManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/professor/subjects/:id"
              element={
                <ProtectedRoute roles={['professeur']}>
                  <Layout>
                    <MatiereDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/professor/*"
              element={
                <ProtectedRoute roles={['professeur']}>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                        Espace Enseignant
                      </h2>
                      <p className="text-secondary-600">
                        Sélectionnez une section dans le menu
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Student routes */}
            <Route
              path="/student/subjects"
              element={
                <ProtectedRoute roles={['etudiant']}>
                  <Layout>
                    <StudentSubjects />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/subjects/:id"
              element={
                <ProtectedRoute roles={['etudiant']}>
                  <Layout>
                    <StudentMatiereDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/*"
              element={
                <ProtectedRoute roles={['etudiant']}>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                        Espace Étudiant
                      </h2>
                      <p className="text-secondary-600">
                        Sélectionnez une section dans le menu
                      </p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 page */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                  <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="w-8 h-8 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    
                    <h2 className="text-xl font-bold text-secondary-900 mb-2">
                      Page non trouvée
                    </h2>
                    <p className="text-secondary-600 mb-6">
                      La page que vous recherchez n'existe pas.
                    </p>
                    
                    <a
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Retour au tableau de bord
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 