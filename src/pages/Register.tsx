import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting registration process for:', email);
    setLoading(true);
    setError('');
    
    try {
      console.log('Calling createUserWithEmailAndPassword...');
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', user.uid);
      
      console.log('Creating user document in Firestore...');
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        name,
        role: 'client',
        createdAt: new Date().toISOString()
      });
      console.log('User document created successfully');

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password registration is not enabled in Firebase Console. Please enable it or use Google Sign-In.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please go to the Login page.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid registration credentials. Please try again.');
      } else {
        setError(err.message || 'Failed to register. Please try again.');
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
      setError(err.message || 'Failed to sign in with Google');
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
          <h1 className="text-3xl font-bold text-zinc-900">Create Account</h1>
          <p className="text-zinc-600 mt-2">Start your digital journey today</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200">
          {/* Firebase Setup Warning */}
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1 uppercase tracking-wider">Firebase Setup Required</p>
              To use Email/Password registration, you must enable it in your <a href="https://console.firebase.google.com/project/gen-lang-client-0452990580/authentication/providers" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a>. Otherwise, please use **Google Sign-In**.
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="John Doe"
              />
            </div>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Register <ArrowRight className="ml-2 w-5 h-5" /></>}
            </button>
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
              Sign up with Google
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
