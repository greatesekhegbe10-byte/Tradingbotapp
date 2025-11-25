import React, { useState, useEffect } from 'react';
import { X, Server, Globe, CheckCircle, AlertCircle } from 'lucide-react';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (broker: string) => void;
}

export const BrokerModal: React.FC<BrokerModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [selectedBroker, setSelectedBroker] = useState('MetaTrader 5');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    server: 'Demo-Server-US',
    login: '',
    password: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        server: 'Demo-Server-US',
        login: '',
        password: ''
      });
      setError(null);
      setConnecting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.login || !formData.password || !formData.server) {
      setError('All fields are required to establish a connection.');
      return;
    }

    setConnecting(true);
    setError(null);

    // Simulate network request and authentication
    setTimeout(() => {
      // Simulate Server Address Validation
      // Checks if the server name looks somewhat valid (contains common keywords or reasonable length)
      const validServerKeywords = ['server', 'demo', 'live', 'real', 'mt4', 'mt5'];
      const looksLikeServer = validServerKeywords.some(k => formData.server.toLowerCase().includes(k)) || formData.server.length > 8;
      
      if (!looksLikeServer) {
        setError('Connection Failed: Invalid Server Address. Host not reachable.');
        setConnecting(false);
        return;
      }

      // Simulate Account ID Validation
      // Assuming valid trading IDs are usually numeric and of decent length
      if (formData.login.length < 5 || !/^\d+$/.test(formData.login.replace(/\s/g, ''))) {
         // Allow non-numeric for demo purposes if user types 'demo', but otherwise warn
         if (!formData.login.toLowerCase().includes('demo')) {
            setError('Login Error: Trading Account ID not found on server.');
            setConnecting(false);
            return;
         }
      }

      // Simulate Password Validation
      if (formData.password.length < 6) {
        setError('Authentication Failed: Password incorrect.');
        setConnecting(false);
        return;
      }

      onConnect(selectedBroker);
      setConnecting(false);
      onClose();
    }, 2000);
  };

  const brokers = [
    { name: 'MetaTrader 5', icon: 'M5' },
    { name: 'MetaTrader 4', icon: 'M4' },
    { name: 'Binance', icon: 'B' },
    { name: 'Interactive Brokers', icon: 'IB' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface border border-gray-700 w-full max-w-lg mx-auto rounded-xl shadow-2xl overflow-hidden relative">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Connect Broker Account</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-400 mb-6 hidden sm:block">
            Securely connect your brokerage account to enable automated execution. NexusTrade supports all major regions including restricted zones via high-speed proxy routing.
          </p>

          {/* Broker Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {brokers.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => setSelectedBroker(b.name)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  selectedBroker === b.name 
                    ? 'bg-primary/20 border-primary text-white' 
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl font-bold mb-1">{b.icon}</span>
                <span className="text-[10px] text-center leading-tight truncate w-full">{b.name}</span>
              </button>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-sm text-danger animate-pulse">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Connection Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Server / Region</label>
              <div className="relative">
                <Server className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  name="server"
                  value={formData.server}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                  placeholder="e.g. MetaQuotes-Demo"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Login ID</label>
                <input 
                  type="text" 
                  name="login"
                  value={formData.login}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                  placeholder="Account ID" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={connecting}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 mt-4 ${
                connecting ? 'bg-gray-600 cursor-not-allowed' : 'bg-success hover:bg-green-600 shadow-lg shadow-green-900/20'
              }`}
            >
              {connecting ? (
                <span className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Connecting...
                </span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Connect {selectedBroker}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};