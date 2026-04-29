import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Eye, EyeOff, AlertCircle, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'pm' | 'eng') => {
    const emails = { admin: 'admin@protecht.demo', pm: 'pm@protecht.demo', eng: 'eng@protecht.demo' };
    setEmail(emails[role]);
    setPassword('Demo1234!');
  };

  const features = [
    { icon: BarChart3,  label: 'Real-time portfolio intelligence' },
    { icon: Shield,     label: 'Contract & change order management' },
    { icon: Zap,        label: 'AI-powered risk assessment (ARIA)' },
  ];

  return (
    <div className="min-h-screen bg-black flex">

      {/* ── LEFT PANEL — branding ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050510] via-[#071025] to-[#050510]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg">PROTECHT</span>
            <span className="text-blue-400 font-bold text-lg"> BIM</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 font-medium mb-6">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Construction Intelligence Platform
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-5">
            Manage every<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              KES Billion
            </span>
            <br />project with clarity.
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            From contracts and change orders to snag lists and daily reports — PROTECHT BIM gives your team one intelligent platform.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-gray-300 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative flex items-center gap-6">
          <div className="flex -space-x-2">
            {['A', 'P', 'E'].map((l, i) => (
              <div key={i} className={`w-9 h-9 rounded-full border-2 border-[#050510] flex items-center justify-center text-sm font-bold text-white ${['bg-blue-600', 'bg-purple-600', 'bg-green-600'][i]}`}>{l}</div>
            ))}
          </div>
          <div>
            <p className="text-white text-sm font-medium">Trusted by construction teams</p>
            <p className="text-gray-500 text-xs">Nairobi · Mombasa · Kampala · Dar es Salaam</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — login form ──────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">PROTECHT</span>
              <span className="text-blue-400 font-bold text-lg"> BIM</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-8">Welcome back. Enter your credentials to continue.</p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input type="email" required autoComplete="email" value={email}
                onChange={e => setEmail(e.target.value)} disabled={isLoading}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-800 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-800 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all pr-12 disabled:opacity-50" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20 disabled:shadow-none">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 bg-[#0A0A0A] border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'pm', 'eng'] as const).map(role => (
                <button key={role} type="button" onClick={() => fillDemo(role)}
                  className="flex flex-col items-center gap-1 p-2 bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 rounded-lg transition-all group">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${role === 'admin' ? 'bg-blue-600' : role === 'pm' ? 'bg-purple-600' : 'bg-green-600'}`}>
                    {role === 'admin' ? 'A' : role === 'pm' ? 'P' : 'E'}
                  </div>
                  <span className="text-[10px] text-gray-400 capitalize group-hover:text-white transition-colors">{role === 'eng' ? 'Engineer' : role === 'pm' ? 'Proj. Mgr' : 'Admin'}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">Click a role to pre-fill credentials · Password: Demo1234!</p>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            New to PROTECHT?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Create account</Link>
          </p>

          <p className="text-center text-xs text-gray-700 mt-8">© 2026 PROTECHT BIM · Construction Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
