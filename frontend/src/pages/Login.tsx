import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Flame, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Left Panel - Hostel Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&auto=format&fit=crop&q=80"
          alt="Claria University Hostel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/60 to-indigo-950/70" />
        {/* Text over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur p-2 rounded-xl border border-white/10">
              <Flame className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">CLARIA UNIVERSITY HOSTEL</span>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Smart Living,<br />Smarter Management.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              AI-powered hostel platform managing rooms, fees, complaints, visitor passes and attendance - all in one place.
            </p>
            <div className="mt-8 flex gap-6">
              <div>
                <p className="text-2xl font-extrabold text-white">500+</p>
                <p className="text-xs text-slate-400 mt-0.5">Students Managed</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-2xl font-extrabold text-white">50+</p>
                <p className="text-xs text-slate-400 mt-0.5">Rooms Allocated</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-2xl font-extrabold text-white">99%</p>
                <p className="text-xs text-slate-400 mt-0.5">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative overflow-hidden px-6 py-12">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />

        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 page-fade">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary/15 text-primary p-3 rounded-2xl mb-4 border border-primary/20">
              <Flame className="w-8 h-8 animate-pulse text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Welcome Back</h1>
            <p className="text-sm text-slate-400 mt-1">Claria University Hostel Management Platform</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-xl mb-6 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-6">
            <span>Testing credentials? Try </span>
            <code className="text-slate-300 font-semibold">admin@aegis.com</code>
            <span> / </span>
            <code className="text-slate-300 font-semibold">password123</code>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
