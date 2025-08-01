import React, { useMemo } from 'react';
import {
    createBrowserRouter,
    RouterProvider,
    createRoutesFromElements,
    Route,
    Navigate,
    useLocation,
    Outlet
} from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import Classes from './pages/Classes';
import Contact from './pages/Contact';
import ClassDetails from './pages/ClassDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProfilePage from './components/profile/ProfilePage';
import './App.css';

// Protected Route component
const ProtectedRoute = React.memo(({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }

    return <>{children}</>;
});

// Admin Route component
const AdminRoute = React.memo(({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
});

// Header wrapper component to always render header
const HeaderWrapper = React.memo(() => {
    return <Header />;
});

// AppContent component that uses useAuth
function AppContent() {
    const location = useLocation();
    const { loading } = useAuth();
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <HeaderWrapper />
            {isAdminRoute ? (
                <div className="admin-route">
                    <Outlet />
                </div>
            ) : (
                <main className="container mx-auto px-4 py-8">
                    <Outlet />
                </main>
            )}
        </div>
    );
}

// Create router with future flags
const router = createBrowserRouter(
    createRoutesFromElements(
        <Route element={<AppContent />}>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ClassDetails />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route path="/profile" element={
                <ProtectedRoute>
                    <ProfilePage />
                </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="analytics" />
                </AdminRoute>
            } />
            <Route path="/admin/analytics" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="analytics" />
                </AdminRoute>
            } />
            <Route path="/admin/users" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="users" />
                </AdminRoute>
            } />
            <Route path="/admin/classes" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="classes" />
                </AdminRoute>
            } />
            <Route path="/admin/enrollments" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="enrollments" />
                </AdminRoute>
            } />
            <Route path="/admin/financial" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="financial" />
                </AdminRoute>
            } />
            <Route path="/admin/certificates" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="certificates" />
                </AdminRoute>
            } />
            <Route path="/admin/notifications" element={
                <AdminRoute>
                    <AdminDashboard defaultSection="notifications" />
                </AdminRoute>
            } />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
    ),
    {
        future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true
        }
    }
);

// Main App component
const App = React.memo(() => {
    return (
        <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </SnackbarProvider>
    );
});

export default App;