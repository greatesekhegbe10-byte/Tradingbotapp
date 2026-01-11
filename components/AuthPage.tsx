
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, User, Loader2, LogIn, AlertTriangle, Key, X, Info, UserPlus, Globe, ArrowRight, Eye, EyeOff, Shield, RotateCcw } from 'lucide-react';
import { NEXUS_LOGO } from '../assets';
import { registerUser, loginUser, resetPasswordRequest } from '../services/authService';

interface AuthPageProps {
  onLogin: (isAdmin?: boolean, customProfile?: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'ROOT' | 'FORGOT'>('LOGIN');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const MASTER_PASSCODE = '09162502987';
  const ADMIN_NAME = 'Alex';

  useEffect(() => {
    if (failedAttempts >= 3) {
      setError("RATE LIMIT: Node locked for 30s due to failed handshakes.");
      const timer = setTimeout(() => setFailedAttempts(0), 30000);
      return () => clearTimeout(timer);
    }
  }, [failedAttempts]);

  const handleGoogleAuth = (mode: 'SIGNIN' | 'SIGNUP') => {
    if (!email.includes('@gmail.com')) {
      setError("Institutional Google Auth requires a valid @gmail.com address.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setTimeout(() => {
      const mockProfile = {
        displayName: mode === 'SIGNUP' ? (fullName || "New Node") : "Verified Node",
        email: email,
        photoURL: `https://i.pravatar.cc/150?u=${email}`,
        uid: "google-" + Math.random().toString(36).substr(2, 9)
      };
      setLoading(false);
      onLogin(false, mockProfile);
    }, 1500);
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (failedAttempts >= 3) return;
    
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === 'ROOT') {
        if (passcode === MASTER_PASSCODE) {
          setTimeout(() => {
            setLoading(false);
            onLogin(true, { displayName: ADMIN_NAME, email: "alex.root@nexus.ai" });
          }, 800);
        } else {
          throw new Error('UNAUTHORIZED: Identity mismatch. Access Denied.');
        }
        return;
      }

      if (authMode === 'FORGOT') {
        const res = await resetPasswordRequest(email);
        setSuccessMsg(res.message);
        setLoading(false);
        return;
      }

      if (authMode === 'SIGNUP') {
        if (password.length < 8) throw new Error("Security Policy: Password must be 8+ characters.");
        const res = await registerUser(fullName, email, password);
        setSuccessMsg(res.message);
        setAuthMode('LOGIN');
      } else {
        const res = await loginUser(email, password);
        onLogin(false, res.user);
      }
    } catch (err: any) {
      setError(err.message || "Protocol Error.");
      setFailedAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background decoration remains same... */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className={`w-full max-w-md bg-[#0a101f]/90 backdrop-blur-3xl border rounded-[3rem] p-10 md:p-12 shadow-2xl relative z-10 transition-all duration-500 ${authMode === 'ROOT' ? 'border-amber-500/40 shadow-amber-950/20' : 'border-gray-800'}`}>
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center mb-4 shadow-2xl border transition-all duration-500 transform hover:scale-105 ${authMode === 'ROOT' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-primary/10 border-primary/20'}`}>
             <img src={NEXUS_LOGO} alt="Nexus Bot" className={`w-12 h-12 ${authMode === 'ROOT' ? 'grayscale brightness-200' : ''}`} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1 italic">NexusTrade</h1>
          <p className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase opacity-70">
            {authMode === 'ROOT' ? "Root Terminal" : authMode === 'FORGOT' ? "Recovery Protocol" : "Institutional Cluster v3.6"}
          </p>
        </div>

        {/* Mode Toggles (Hide in Root or Forgot) */}
        {(authMode === 'LOGIN' || authMode === 'SIGNUP') && (
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-gray-800 mb-8">
            <button 
              onClick={() => setAuthMode('LOGIN')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'LOGIN' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthMode('SIGNUP')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'SIGNUP' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Manual Input Form */}
        <form onSubmit={handleManualAuth} className="space-y-4">
          {authMode === 'SIGNUP' && (
            <div className="relative group animate-fade-in">
              <User className="absolute left-4 top-4 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name" 
                className="w-full bg-black/40 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                required
              />
            </div>
          )}

          {authMode !== 'ROOT' && (
            <div className="relative group">
              <Mail className="absolute left-4 top-4 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Institutional Email" 
                className="w-full bg-black/40 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700 font-mono"
                required
              />
            </div>
          )}

          {(authMode === 'LOGIN' || authMode === 'SIGNUP') && (
            <div className="relative group animate-fade-in">
              <Shield className="absolute left-4 top-4 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Account Password" 
                className="w-full bg-black/40 border border-gray-800 rounded-2xl py-4 pl-12 pr-12 text-white text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {authMode === 'ROOT' && (
            <div className="relative group animate-fade-in">
              <Key className="absolute left-4 top-5 w-5 h-5 text-amber-500" />
              <input 
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Alex Root Passcode" 
                className="w-full bg-black/40 border border-amber-500/40 rounded-2xl py-6 pl-12 pr-4 text-white text-xl font-mono tracking-[0.5em] focus:ring-1 focus:ring-amber-500 outline-none placeholder:text-gray-800 text-center"
                autoFocus
                required
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success text-[10px] font-black uppercase flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0" /> {successMsg}
            </div>
          )}

          {authMode === 'LOGIN' && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setAuthMode('FORGOT')}
                className="text-[9px] font-black text-gray-600 hover:text-primary uppercase tracking-widest transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {authMode !== 'ROOT' ? (
              <div className="space-y-3 pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full font-black py-4 bg-primary hover:bg-blue-500 text-white rounded-2xl transition-all shadow-xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-primary/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        {authMode === 'SIGNUP' ? 'Initialize Node' : authMode === 'FORGOT' ? 'Request Recovery' : 'Connect Terminal'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {authMode !== 'FORGOT' && (
                    <>
                      <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-gray-800"></div>
                        <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">or SSO Secure</span>
                        <div className="flex-1 h-px bg-gray-800"></div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleGoogleAuth(authMode === 'SIGNUP' ? 'SIGNUP' : 'SIGNIN')}
                        disabled={loading || !email.includes('@gmail.com')}
                        className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all disabled:opacity-30 shadow-xl"
                      >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-4 h-4" />
                        Continue with Google
                      </button>
                    </>
                  )}

                  {authMode === 'FORGOT' && (
                    <button 
                      type="button"
                      onClick={() => setAuthMode('LOGIN')}
                      className="w-full flex items-center justify-center gap-2 text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors mt-4"
                    >
                      <RotateCcw className="w-3 h-3" /> Back to Connection
                    </button>
                  )}
              </div>
          ) : (
              <button 
                type="submit" 
                disabled={loading}
                className="w-full font-black py-6 bg-amber-500 hover:bg-amber-400 text-black rounded-[2rem] transition-all shadow-xl uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-amber-950/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Initialize Alex Root Hub
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
          )}
        </form>

        {/* Admin Secret Portal Link */}
        <div className="mt-10 text-center">
          <button 
            onClick={() => {
              setAuthMode(authMode === 'ROOT' ? 'LOGIN' : 'ROOT');
              setError(null);
              setSuccessMsg(null);
            }} 
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'ROOT' ? 'text-gray-500 hover:text-white' : 'text-gray-800 hover:text-amber-500/60'}`}
          >
            {authMode === 'ROOT' ? "Back to Trader Gate" : "Institutional Root Access"}
          </button>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="mt-8 text-center opacity-30">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.6em]">Secure Protocol v3.6 • SSL Encrypted Handshake</p>
      </div>
    </div>
  );
};
