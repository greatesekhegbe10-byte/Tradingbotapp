
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ChevronRight, Settings, AlertTriangle, Key, User, Mail, Globe, Loader2, UserPlus, LogIn, X, Info } from 'lucide-react';

interface AuthPageProps {
  onLogin: (isAdmin?: boolean) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  
  // Google Auth Flow State
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [googleStep, setGoogleStep] = useState<'picker' | 'input' | 'processing'>('picker');
  const [googleEmail, setGoogleEmail] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Institutional Constants - Updated per user request
  const MASTER_PASSCODE = '09162502987';
  const ADMIN_IDENTITY = 'Alex';

  const startGoogleAuth = () => {
    setShowGooglePopup(true);
    setGoogleStep('picker');
  };

  const handleGoogleAccountSelect = (selectedEmail: string) => {
    setGoogleEmail(selectedEmail);
    setGoogleStep('processing');
    
    // Finalize Google Login Simulation
    setTimeout(() => {
      const isAlex = selectedEmail.toLowerCase().includes('alex');
      setShowGooglePopup(false);
      onLogin(isAlex);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isAdminMode) {
      setTimeout(() => {
        if (passcode === MASTER_PASSCODE) {
          setLoading(false);
          onLogin(true);
        } else {
          setLoading(false);
          setError('Invalid Administrative Passcode.');
          setPasscode('');
        }
      }, 1200);
      return;
    }

    // Traditional Auth Simulation
    setTimeout(() => {
      const isAlex = fullName.toLowerCase() === ADMIN_IDENTITY.toLowerCase() || email.toLowerCase().includes('alex');
      setLoading(false);
      onLogin(isAlex);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden text-gray-100 font-sans">
      
      {/* REAL GOOGLE AUTH POPUP SIMULATION */}
      {showGooglePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white text-gray-900 w-full max-w-[400px] rounded-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 pb-4">
              <div className="flex justify-center mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-center text-gray-800">Sign in with Google</h2>
              <p className="text-sm text-gray-500 text-center mt-1">to continue to NexusTrade AI</p>

              <div className="mt-8 space-y-0.5">
                {googleStep === 'picker' && (
                  <>
                    <button 
                      onClick={() => handleGoogleAccountSelect('alex.trader@gmail.com')}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-t border-gray-100 first:border-t-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">A</div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">Alex</p>
                        <p className="text-xs text-gray-500">alex.trader@gmail.com</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setGoogleStep('input')}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Use another account</p>
                    </button>
                  </>
                )}

                {googleStep === 'input' && (
                  <div className="py-4 space-y-4">
                    <input 
                      type="email" 
                      placeholder="Email or phone" 
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleGoogleAccountSelect(e.currentTarget.value)}
                    />
                    <div className="flex justify-between items-center">
                      <button onClick={() => setGoogleStep('picker')} className="text-blue-600 text-sm font-medium">Back</button>
                      <button 
                        onClick={() => {
                          const input = document.querySelector('input[type="email"]') as HTMLInputElement;
                          if (input.value) handleGoogleAccountSelect(input.value);
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {googleStep === 'processing' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-gray-600">Verifying Identity...</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center px-8">
              <span className="text-[10px] text-gray-500">English (United States)</span>
              <div className="flex gap-4 text-[10px] text-gray-500 font-medium">
                <span>Help</span>
                <span>Privacy</span>
                <span>Terms</span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowGooglePopup(false)} className="absolute top-8 right-8 text-white/50 hover:text-white"><X /></button>
        </div>
      )}

      {/* Main Page Content */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className={`absolute -top-[20%] -left-[10%] w-[70%] h-[70%] blur-[120px] rounded-full transition-all duration-1000 ${isAdminMode ? 'bg-amber-500/10' : 'bg-primary/15'}`}></div>
        <div className={`absolute bottom-0 -right-[10%] w-[60%] h-[60%] blur-[120px] rounded-full transition-all duration-1000 ${isAdminMode ? 'bg-amber-600/5' : 'bg-accent/10'}`}></div>
      </div>

      <div className={`w-full max-w-md bg-surface/40 backdrop-blur-3xl border rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10 transition-all duration-700 ${isAdminMode ? 'border-amber-500/30' : 'border-gray-700/50'}`}>
        
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => {
              setIsAdminMode(!isAdminMode);
              setError(null);
            }}
            className={`p-3 rounded-2xl transition-all duration-500 ${isAdminMode ? 'text-amber-400 bg-amber-400/10 scale-110 shadow-lg shadow-amber-900/40' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
          >
            <Settings className={`w-5 h-5 ${isAdminMode ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-700 transform ${isAdminMode ? 'bg-amber-500 rotate-12' : 'bg-primary'}`}>
            {isAdminMode ? <ShieldCheck className="w-8 h-8 text-black" /> : <Lock className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">Nexus AI</h1>
          <p className="text-[10px] text-gray-500 font-black tracking-[0.3em] uppercase opacity-60">
            {isAdminMode ? "Authorization Protocol" : isSignup ? "Trader Registration" : "Terminal Entry"}
          </p>
        </div>

        {!isAdminMode && (
          <div className="mb-8">
            <button 
              onClick={startGoogleAuth}
              className="w-full py-4 bg-white text-gray-700 font-bold rounded-2xl shadow-xl hover:bg-gray-50 border border-gray-200 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 mb-6 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gray-800 flex-1"></div>
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">OR</span>
              <div className="h-px bg-gray-800 flex-1"></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdminMode ? (
            <>
              {isSignup && (
                <div className="relative group">
                  <User className="absolute left-4 top-4 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name (e.g. Alex)" 
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                    required
                  />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-4 top-4 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Institutional Email" 
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Terminal Password" 
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
              </div>
            </>
          ) : (
            <div className="relative group pt-4">
              <Key className="absolute left-4 top-8 w-5 h-5 text-amber-500" />
              <input 
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode" 
                className="w-full bg-gray-900/60 border border-amber-500/40 rounded-2xl py-4 pl-12 pr-4 text-white text-lg font-mono tracking-[0.5em] focus:ring-1 focus:ring-amber-500 outline-none"
                required
              />
              <p className="mt-4 text-[10px] text-amber-500/50 uppercase font-black text-center tracking-widest flex items-center justify-center gap-2">
                <Info className="w-3 h-3" /> Institutional ROOT Key Required
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-3 h-3" /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest text-[10px] ${
              isAdminMode 
                ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                : 'bg-primary hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isAdminMode ? 'Unlock Maintenance' : isSignup ? 'Create Account' : 'Initialize Terminal'} 
                {isSignup ? <UserPlus className="w-3 h-3" /> : <LogIn className="w-3 h-3" />}
              </>
            )}
          </button>
        </form>

        {!isAdminMode && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-black transition-colors"
            >
              {isSignup ? "Already have a terminal ID? Sign In" : "New Institutional Trader? Register"}
            </button>
          </div>
        )}

        <div className="mt-12 text-center opacity-40">
           <p className="text-[8px] text-gray-600 font-black tracking-[0.4em] uppercase">Quantum Identity Engine v2.5.1</p>
        </div>
      </div>
    </div>
  );
};
