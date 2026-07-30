import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

// Roles that are explicitly NOT admin-panel roles.
// Any user with one of these roles will be blocked from /admin routes.
const PUBLIC_ROLES = ['User', 'Brand Owner', 'Company Owner', 'Merchant', 'owner', 'Owner', 'OWNER'];

export default function ProtectedRoute({ children, allowedRoles, blockPublicRoles }) {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // blockPublicRoles mode: used for /admin routes.
    // Lets through Super Admin + any custom RBAC role.
    // Blocks User, Brand Owner, Company Owner, Merchant.
    if (blockPublicRoles) {
        if (PUBLIC_ROLES.includes(user.role)) {
            return (
                <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-50">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Unauthorized Access</h1>
                    <p className="text-slate-600 mb-6">You do not have permission to view this page.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            );
        }
        return children;
    }

    // allowedRoles mode: strict allowlist (used for /brand routes)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Unauthorized Access</h1>
                <p className="text-slate-600 mb-6">You do not have permission to view this page.</p>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return children;
}
