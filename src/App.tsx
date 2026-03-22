import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import OrderPage from './pages/OrderPage';
import Demos from './pages/Demos';
import Profile from './pages/Profile';
import { Shield, Menu, X, User, LogOut, LayoutDashboard, Settings, Globe } from 'lucide-react';
import { useState } from 'react';
import { auth } from './firebase';

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-zinc-900 tracking-tight">Mzansi Web</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/demos" className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors flex items-center">
              <Globe className="w-4 h-4 mr-1 text-emerald-500" />
              Showcase
            </Link>
            <Link to="/#plans" className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">Plans</Link>
            <Link to="/#stats" className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">Security</Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="flex items-center space-x-1 text-zinc-600 hover:text-zinc-900 font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-1 text-zinc-600 hover:text-zinc-900 font-medium">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-1 text-zinc-600 hover:text-zinc-900 font-medium">
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <button 
                  onClick={() => auth.signOut()}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-zinc-600 hover:text-zinc-900 font-medium">Login</Link>
                <Link to="/register" className="bg-zinc-900 text-white px-5 py-2 rounded-full font-medium hover:bg-zinc-800 transition-all">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-600">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-6 space-y-4">
          <Link to="/demos" className="block text-zinc-600 font-medium" onClick={() => setIsOpen(false)}>Showcase</Link>
          <Link to="/#plans" className="block text-zinc-600 font-medium" onClick={() => setIsOpen(false)}>Plans</Link>
          <Link to="/#stats" className="block text-zinc-600 font-medium" onClick={() => setIsOpen(false)}>Security</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-zinc-600 font-medium" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link to="/profile" className="block text-zinc-600 font-medium" onClick={() => setIsOpen(false)}>Profile</Link>
              {isAdmin && <Link to="/admin" className="block text-zinc-600 font-medium" onClick={() => setIsOpen(false)}>Admin Panel</Link>}
              <button onClick={() => { auth.signOut(); setIsOpen(false); }} className="block text-red-600 font-medium">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-zinc-600 font-medium" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/register" className="block bg-zinc-900 text-white px-5 py-2 rounded-full text-center font-medium" onClick={() => setIsOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            <Navbar />
            <div className="pt-16">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="/order/:planId" element={
                  <ProtectedRoute>
                    <OrderPage />
                  </ProtectedRoute>
                } />
                <Route path="/demos" element={<Demos />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
