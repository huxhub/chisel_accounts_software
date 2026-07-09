import { useState } from 'react';
import { authService } from '../services/authService';
import { Building2, Lock, User, ArrowRight, Activity } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authService.login({ username, password });
      } else {
        await authService.register({ username, password });
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-red-50/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-accent to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg
              viewBox="0 0 100 100"
              className="w-10 h-10 text-white fill-none stroke-current"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer Gopuram arch */}
              <path d="M22 80 C22 68, 30 66, 30 54 C30 42, 38 40, 38 28 C38 18, 45 14, 50 14 C55 14, 62 18, 62 28 C62 40, 70 42, 70 54 C70 66, 78 68, 78 80" />
              {/* Middle Gopuram arch */}
              <path d="M34 80 C34 71, 40 69, 40 59 C40 49, 45 47, 45 37 C45 32, 48 29, 50 29 C52 29, 55 32, 55 37 C55 49, 60 49, 60 59 C60 69, 66 71, 66 80" strokeWidth="3.5" />
              {/* Inner Gopuram arch */}
              <path d="M46 80 C46 74, 50 71, 50 63 C50 71, 54 74, 54 80" strokeWidth="2.5" />
              {/* Center dot */}
              <circle cx="50" cy="50" r="4.0" className="fill-current stroke-none" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Accounts Manager
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLogin ? 'Sign in to access your dashboard' : 'Create a new account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-accent focus:border-accent block w-full pl-10 sm:text-sm border-slate-300 rounded-xl h-11 bg-slate-50 border transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-accent focus:border-accent block w-full pl-10 sm:text-sm border-slate-300 rounded-xl h-11 bg-slate-50 border transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-accent hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
                {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>

          {/* Or / Register toggle — commented out (registration is invite-only)
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
