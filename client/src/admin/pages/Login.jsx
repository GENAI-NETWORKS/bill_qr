import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import { QrCode, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@billqr.com');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0f1a 0%, #141622 50%, #1a1040 100%)' }}>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6c63ff, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />

      <div className="w-full max-w-md px-6 z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 gradient-primary shadow-lg">
            <QrCode size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>BillQR</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to continue</h2>

          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16}
                  style={{
                    position: 'absolute', left: 14,
                    top: '50%', transform: 'translateY(-50%)',
                    color: '#64748b', pointerEvents: 'none', zIndex: 1
                  }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="admin@billqr.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16}
                  style={{
                    position: 'absolute', left: 14,
                    top: '50%', transform: 'translateY(-50%)',
                    color: '#64748b', pointerEvents: 'none', zIndex: 1
                  }} />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40, paddingRight: 42 }}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 12,
                    top: '50%', transform: 'translateY(-50%)',
                    color: '#64748b', background: 'none',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', padding: 4
                  }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="loginBtn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
              style={{ width: '100%' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-custom" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#334155' }}>
          Default: admin@billqr.com / admin123
        </p>
      </div>
    </div>
  );
}
