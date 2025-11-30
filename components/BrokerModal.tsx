
import React, { useState, useEffect } from 'react';
import { X, Server, Globe, CheckCircle, AlertCircle, Zap, Search } from 'lucide-react';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (broker: string, isLive: boolean) => void;
}

export const BrokerModal: React.FC<BrokerModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [selectedBroker, setSelectedBroker] = useState('Pocket Option');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    server: 'Live-Server-1',
    login: '',
    password: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        server: 'Live-Server-1',
        login: '',
        password: ''
      });
      setError(null);
      setConnecting(false);
      setSearchTerm('');
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
      const validServerKeywords = ['server', 'demo', 'live', 'real', 'mt4', 'mt5', 'pocket', 'quotex', 'iq', 'api'];
      const looksLikeServer = validServerKeywords.some(k => formData.server.toLowerCase().includes(k)) || formData.server.length > 3;
      
      if (!looksLikeServer) {
        setError('Connection Failed: Invalid Server Address. Host not reachable.');
        setConnecting(false);
        return;
      }

      // Simulate Account ID Validation
      if (formData.login.length < 5) {
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

      // Detect Live vs Demo
      const isLive = formData.server.toLowerCase().includes('live') || formData.server.toLowerCase().includes('real');

      onConnect(selectedBroker, isLive);
      setConnecting(false);
      onClose();
    }, 2000);
  };

  const allBrokers = [
    { name: 'Pocket Option', icon: 'PO', color: 'text-blue-400 border-blue-400' },
    { name: 'Quotex', icon: 'QX', color: 'text-orange-400 border-orange-400' },
    { name: 'IQ Option', icon: 'IQ', color: 'text-orange-500 border-orange-500' },
    { name: 'Deriv / Binary', icon: 'D', color: 'text-red-400 border-red-400' },
    { name: 'MetaTrader 5', icon: 'M5', color: 'text-green-400 border-green-400' },
    { name: 'MetaTrader 4', icon: 'M4', color: 'text-green-400 border-green-400' },
    { name: 'Binance', icon: 'B', color: 'text-yellow-400 border-yellow-400' },
    { name: 'Custom Webhook', icon: 'API', color: 'text-purple-400 border-purple-400' },
    { name: 'Exness', icon: 'EX', color: 'text-yellow-500 border-yellow-500' },
    { name: 'XM Global', icon: 'XM', color: 'text-black border-white' },
    { name: 'IC Markets', icon: 'IC', color: 'text-green-500 border-green-500' },
    { name: 'Interactive Brokers', icon: 'IB', color: 'text-red-500 border-red-500' },
  ];

  const filteredBrokers = allBrokers.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface border border-gray-700 w-full max-w-lg mx-auto rounded-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Universal Broker Connect</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-400 mb-4 hidden sm:block">
            NexusTrade's <span className="text-primary font-bold">Universal Bridge™</span> supports all major CFDs, Binary Options, and Spot brokers. API routing ensures low-latency execution.
          </p>
          
          {/* Search Bar */}
          <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input 
                 type="text"
                 placeholder="Search 500+ Registered Brokers..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              />
          </div>

          {/* Broker Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {filteredBrokers.length > 0 ? (
                filteredBrokers.slice(0, 8).map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => setSelectedBroker(b.name)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      selectedBroker === b.name 
                        ? `bg-gray-800 ${b.color} shadow-lg shadow-black/40` 
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl font-black mb-1">{b.icon}</span>
                    <span className="text-[10px] text-center leading-tight truncate w-full font-medium">{b.name}</span>
                  </button>
                ))
            ) : (
                <button
                    type="button"
                    onClick={() => setSelectedBroker(searchTerm || 'Custom Broker')}
                    className="col-span-4 p-4 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                    <Zap className="w-4 h-4" />
                    <span>Connect Custom Broker: "{searchTerm}"</span>
                </button>
            )}
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
              <label className="block text-xs font-medium text-gray-400 mb-1">Server / API Endpoint</label>
              <div className="relative">
                <Server className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  name="server"
                  value={formData.server}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                  placeholder={`e.g. live-server.${selectedBroker.toLowerCase().replace(/\s/g, '')}.com`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Login ID / API Key</label>
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
                <label className="block text-xs font-medium text-gray-400 mb-1">Password / Secret</label>
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
                   Fetching Balance...
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" /> Connect {selectedBroker}
                </>
              )}
            </button>
            <div className="text-center">
                 <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" /> SSL Encrypted Connection
                 </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
