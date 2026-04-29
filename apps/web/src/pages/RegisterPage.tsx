import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', company: '', role: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const passwordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || '';
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][strength] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setIsLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050510] via-[#071025] to-[#050510]" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div><span className="text-white font-bold text-lg">PROTECHT</span><span className="text-blue-400 font-bold text-lg"> BIM</span></div>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold text-white mb-4">Start managing smarter.</h2>
          <p className="text-gray-400 leading-relaxed mb-8">Join construction teams across East Africa using PROTECHT BIM to deliver projects on time and on budget.</p>
          {[
            'Contract administration & variations',
            'Site defect tracking & sign-off',
            'AI-powered progress insights',
            'Daily reports & resource management',
          ].map(f => (
            <div key={f} className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-gray-300 text-sm">{f}</span>
            </div>
          ))}
        </div>

        <p className="relative text-gray-600 text-xs">© 2026 PROTECHT BIM · Construction Intelligence Platform</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div><span className="text-white font-bold text-lg">PROTECHT</span><span className="text-blue-400 font-bold text-lg"> BIM</span></div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-8">Get started — it's free for your first project.</p>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Jane Mwangi"
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-800 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Work email</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="jane@company.co.ke"
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-800 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-800 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-800'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-medium ${['','text-red-400','text-orange-400','text-yellow-400','text-green-400'][strength]}`}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm password</label>
              <input type="password" required value={form.confirmPassword} onChange={set('confirmPassword')}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-[#0A0A0A] border rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none transition-all ${
                  form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'
                }`} />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>

            <button type="submit" disabled={isLoading || !form.name || !form.email || !form.password || form.password !== form.confirmPassword}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20 disabled:shadow-none mt-2">
              {isLoading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Creating account…</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
