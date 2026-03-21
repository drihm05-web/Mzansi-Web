import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is disabled. Please enable it in Firebase Console (Authentication > Sign-in method) or use Google Sign-In.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. If you haven\'t registered yet, please use the Register link below.');
      } else {
        setError(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoAdmin = () => {
    setEmail('drihm05@gmail.com');
    setPassword('admin123');
  };

  const handleAdminQuickStart = async () => {
    setLoading(true);
    setError('');
    const adminEmail = 'drihm05@gmail.com';
    const adminPass = 'admin123';
    
    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      navigate('/dashboard');
    } catch (err: any) {
      console.log("Admin sign-in failed:", err.code);
      
      // If sign-in fails because user doesn't exist, try to register
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          console.log("Attempting auto-registration for admin...");
          const { user } = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: adminEmail,
            name: 'Admin User',
            role: 'admin',
            createdAt: new Date().toISOString()
          });
          navigate('/dashboard');
        } catch (regErr: any) {
          console.error("Admin auto-registration failed:", regErr.code);
          if (regErr.code === 'auth/email-already-in-use') {
            setError('The admin account already exists but with a different password. Please use your password or Google Sign-In.');
          } else if (regErr.code === 'auth/operation-not-allowed') {
            setError('Email/Password login is disabled in Firebase. Please enable it or use Google Sign-In.');
          } else {
            setError('Admin account exists but sign-in failed. Please use Google Sign-In.');
          }
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is disabled. Please enable it in Firebase Console.');
      } else {
        setError(err.message || 'Failed to login as admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists, if not create it
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Google User',
          role: 'client',
          createdAt: new Date().toISOString()
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Unauthorized domain. Please add your Vercel domain to the "Authorized domains" list in the Firebase Console (Authentication > Settings).');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completion.');
      } else if (err.message && (err.message.includes('offline') || err.message.includes('client is offline'))) {
        setError('Firestore is offline. This usually means your Firebase configuration (Project ID or Database ID) is incorrect or the database is not provisioned. Please check your firebase-applet-config.json.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-zinc-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-6">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Welcome Back</h1>
          <p className="text-zinc-600 mt-2">Access your Mzansi Web dashboard</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200">
          {/* Firebase Setup Warning */}
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1 uppercase tracking-wider">Firebase Setup Required</p>
              To use Email/Password login, you must enable it in your <a href="https://console.firebase.google.com/project/gen-lang-client-0452990580/authentication/providers" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a>. Otherwise, please use **Google Sign-In**.
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login <ArrowRight className="ml-2 w-5 h-5" /></>}
              </button>
              
              <button
                type="button"
                onClick={handleAdminQuickStart}
                disabled={loading}
                className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold hover:bg-emerald-100 transition-all text-sm flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign in as Admin (Quick Start)
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-zinc-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-zinc-200 text-zinc-700 py-4 rounded-xl font-bold hover:bg-zinc-50 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" alt="Google" />
              Sign in with Google
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline">
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
