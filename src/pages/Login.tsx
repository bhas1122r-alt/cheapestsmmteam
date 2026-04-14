import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center backdrop-blur-xl"
      >
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Cheap<span className="text-blue-500">SMM</span>Team
          </h1>
          <p className="text-sm sm:text-base text-slate-400">The most affordable SMM panel in India</p>
        </div>

        <button
          onClick={handleLogin}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white btn-primary-glow"
        >
          <LogIn className="h-5 w-5" />
          Sign in with Google
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform group-hover:translate-x-full" />
        </button>

        <div className="text-sm text-slate-500">
          By signing in, you agree to our Terms of Service
        </div>
      </motion.div>
    </div>
  );
}
