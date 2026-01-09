
import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ChevronRight, Settings, AlertTriangle, Key, User } from 'lucide-react';

interface AuthPageProps {
  onLogin: (isAdmin?: boolean) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Updated Institutional Maintenance Passcode
  const MASTER_PASSCODE = '09162502987';
  const REQUIRED_USER = 'Alex';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // If in Admin Mode, validate passcode first
    if (isAdminMode) {
        setTimeout(() => {
            if (passcode === MASTER_PASSCODE) {
                setLoading(false);
                onLogin(true); // Login as Admin
            } else {
                setLoading(false);
                setError('Invalid Administrative Passcode. Access attempt recorded.');
                setPasscode('');
            }
        }, 1200);
        return;
    }

    // Standard User Login with specific username check
    setTimeout(() => {
      if (username.toLowerCase() === REQUIRED_USER.toLowerCase()) {
        setLoading(false);
        onLogin(false);
      } else {
        setLoading(false);
        setError(`Access Denied: Trader identity '${username}' not recognized in this sector.`);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Aura background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] blur-[120px] rounded-full transition-colors duration-1000 ${isAdminMode ? 'bg-amber-500/15' : 'bg-primary/10'}`}></div>
        <div className={`absolute bottom-0 -right-[10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${isAdminMode ? 'bg-amber-600/10' : 'bg-accent/10'}`}></div>
      </div>

      <div className={`w-full max-w-md bg-surface/40 backdrop-blur-2xl border rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in transition-all duration-700 ${isAdminMode ? 'border-amber-500/40 shadow-amber-900/20' : 'border-gray-700 shadow-primary/10'}`}>
        
        {/* Maintenance Toggle */}
        <div className="absolute top-6 right-6">
            <button 
                onClick={() => {
                    setIsAdminMode(!isAdminMode);
                    setError(null);
                }}
                className={`p-2.5 rounded-xl transition-all duration-300 ${isAdminMode ? 'text-amber-400 bg-amber-400/10 scale-110' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                title="System Maintenance"
            >
                <Settings className={`w-5 h-5 ${isAdminMode ? 'animate-spin-slow' : ''}`} />
            </button>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-700 transform ${isAdminMode ? 'bg-gradient-to-br from-amber-400 to-amber-700 shadow-amber-500/30 rotate-12' : 'bg-gradient-to-br from-primary to-accent shadow-primary/30'}`}>
            {isAdminMode ? <ShieldCheck className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">NexusTrade AI</h1>
          <div className="h-1 w-12 bg-primary rounded-full mt-2 mb-3"></div>
          <p className="text-gray-400 text-sm font-medium text-center">
            {isAdminMode ? (
                <span className="text-amber-500 flex items-center gap-2 justify-center tracking-widest uppercase text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" /> System Maintenance Terminal
                </span>
            ) : "Institutional Algorithmic Gateway"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {!isAdminMode ? (
                <>
                <div className="relative group">
                    <User className={`absolute left-4 top-3.5 w-5 h-5 transition-colors ${username ? 'text-primary' : 'text-gray-500'}`} />
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Trader ID (e.g. Alex)" 
                        className="w-full bg-gray-900/60 border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-medium"
                        required
                    />
                </div>
                <div className="relative group">
                    <Lock className={`absolute left-4 top-3.5 w-5 h-5 transition-colors ${password ? 'text-primary' : 'text-gray-500'}`} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Secure Password" 
                        className="w-full bg-gray-900/60 border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-medium"
                        required
                    />
                </div>
                </>
            ) : (
                <div className="relative animate-fade-in group">
                    <Key className="absolute left-4 top-3.5 w-5 h-5 text-amber-500" />
                    <input 
                        type="password" 
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Maintenance Passcode" 
                        className="w-full bg-gray-900/60 border border-amber-500/40 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all font-mono tracking-[0.3em] font-bold"
                        required
                    />
                </div>
            )}
          </div>

          {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold animate-shake flex items-center gap-3">
                  <div className="p-1.5 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  {error}
              </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full font-black py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-xl uppercase tracking-widest text-sm ${
              isAdminMode 
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' 
                : 'bg-primary hover:bg-blue-500 text-white shadow-primary/20 hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>{isAdminMode ? 'LINKING...' : 'SYNCING...'}</span>
              </div>
            ) : (
              <>
                {isAdminMode ? 'Unlock Maintenance' : 'Initialize Terminal'} 
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center space-y-2">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {isAdminMode 
                ? "Restricted Zone • Encrypted Session • ID: NX-SYS"
                : "Quantum Encryption Enabled • v2.5.0 Build 104"
            }
          </p>
          {!isAdminMode && (
              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600 font-bold">
                  <span className="hover:text-primary cursor-pointer transition-colors">PRIVACY</span>
                  <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                  <span className="hover:text-primary cursor-pointer transition-colors">SECURITY</span>
                  <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                  <span className="hover:text-primary cursor-pointer transition-colors">PROTOCOLS</span>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
