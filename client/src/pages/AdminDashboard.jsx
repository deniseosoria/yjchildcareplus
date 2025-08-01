import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import UserManagement from '../components/admin/UserManagement';
import ClassManagement from '../components/admin/ClassManagement';
import CertificateManagement from '../components/admin/CertificateManagement';
import EnrollmentManagement from '../components/admin/EnrollmentManagement';
import FinancialManagement from '../components/admin/FinancialManagement';
import NotificationCenter from '../components/admin/NotificationCenter';
// import SystemSettings from '../components/admin/SystemSettings';
import adminService from '../services/adminService';

function AdminDashboard({ defaultSection = 'analytics' }) {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState(defaultSection);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);

    // Memoize the navigation items to prevent unnecessary re-renders
    const navigationItems = useMemo(() => [
        { id: 'analytics', label: 'Analytics', icon: '📊' },
        { id: 'users', label: 'User Management', icon: '👥' },
        { id: 'classes', label: 'Class Management', icon: '🏫' },
        { id: 'enrollments', label: 'Enrollment Management', icon: '📝' },
        { id: 'financial', label: 'Financial Management', icon: '💵' },
        { id: 'certificates', label: 'Certificate Management', icon: '🎓' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
    ], []);

    // Fetch analytics data from backend
    const fetchAnalyticsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const analyticsData = await adminService.fetchAllAnalytics();
            setDashboardData(analyticsData);
        } catch (err) {
            setError(err.message || 'Failed to load analytics data');
            console.error('Error fetching analytics data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Only load data for analytics section
    useEffect(() => {
        if (activeSection === 'analytics' && !dashboardData && !authLoading) {
            fetchAnalyticsData();
        }
    }, [activeSection, dashboardData, authLoading]);

    // Update active section when route changes
    useEffect(() => {
        const path = location.pathname.split('/').pop();
        if (path && path !== 'admin') {
            setActiveSection(path);
        }
    }, [location]);

    const handleSectionChange = (section) => {
        if (section === activeSection) return; // Prevent unnecessary navigation
        setActiveSection(section);
        navigate(`/admin/${section}`);
    };

    // Memoize the rendered section to prevent unnecessary re-renders
    const renderedSection = useMemo(() => {
        if (!user) return null;

        switch (activeSection) {
            case 'analytics':
                return dashboardData ? <AnalyticsDashboard data={dashboardData} /> : null;
            case 'users':
                return <UserManagement />;
            case 'classes':
                return <ClassManagement />;
            case 'enrollments':
                return <EnrollmentManagement />;
            case 'financial':
                return <FinancialManagement />;
            case 'certificates':
                return <CertificateManagement />;
            case 'notifications':
                return <NotificationCenter />;
            // case 'settings':
            //     return <SystemSettings />;
            default:
                return <div>Select a section from the sidebar</div>;
        }
    }, [activeSection, dashboardData, user]);

    // Show loading state while auth is loading
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show error if user is not admin
    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">Access Denied</p>
                    <p>You do not have permission to access this page.</p>
                </div>
            </div>
        );
    }

    // Show loading state for analytics data
    if (loading && activeSection === 'analytics') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Show loading state for rendered section
    if (!renderedSection) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Main render
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Welcome, {user.name || 'Admin'}
                    </p>
                </div>
                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-64 flex-shrink-0">
                        <nav className="space-y-1">
                            {navigationItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSectionChange(item.id)}
                                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeSection === item.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        {renderedSection}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(AdminDashboard); 