import React, { useState, useEffect } from 'react';
import { X, Server, Globe, CheckCircle, AlertCircle, Zap, Search, Download, FileCode, CloudLightning, Key, Radio, Link as LinkIcon } from 'lucide-react';
import { getNexusEA } from '../services/eaScript';

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
  
  // Bridge Config State
  const [connectionMethod, setConnectionMethod] = useState<'cloud' | 'ea' | 'webhook'>('ea');
  const [metaApiToken, setMetaApiToken] = useState('');
  const [bridgeId, setBridgeId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  
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
      // Generate random webhook
      setWebhookUrl(`https://hook.nexustrade.ai/v1/${Math.random().toString(36).substring(2, 10)}`);
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
    
    // Webhook Mode bypasses standard validation
    if (selectedBroker.includes('Webhook')) {
       setConnecting(true);
       setTimeout(() => {
           onConnect('Webhook Bridge', true);
           setConnecting(false);
           onClose();
       }, 1000);
       return;
    }
    
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

  const handleDownloadEA = () => {
      // Use the MetaApi token if provided, otherwise default key
      const apiKeyToUse = metaApiToken.length > 10 ? metaApiToken : "YOUR_API_KEY_HERE";
      const eaCode = getNexusEA(apiKeyToUse);
      
      const element = document.createElement("a");
      const file = new Blob([eaCode], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "NexusTrader_Pro_EA.mq5";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
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

  // Check if a bridge-compatible broker is selected
  const isBridgeBroker = selectedBroker.includes('MetaTrader') || selectedBroker.includes('Exness') || selectedBroker.includes('XM');
  const isWebhook = selectedBroker.includes('Webhook') || selectedBroker === 'Custom Webhook';

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
                    onClick={() => {
                        setSelectedBroker(b.name);
                        if(b.name.includes('Webhook')) setConnectionMethod('webhook');
                        else if(b.name.includes('MetaTrader')) setConnectionMethod('ea');
                    }}
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
          
          {/* Bridge Configuration Section */}
          {(isBridgeBroker || isWebhook) && (
              <div className="mb-6 bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="p-3 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
                      <CloudLightning className="w-4 h-4 text-yellow-500" />
                      <h4 className="text-sm font-bold text-white">Bridge Mode Configuration</h4>
                  </div>
                  
                  <div className="p-4 space-y-4">
                      {/* Mode Selector */}
                      <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
                          <button 
                            onClick={() => setConnectionMethod('ea')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${connectionMethod === 'ea' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
                          >
                              Local EA / EEA
                          </button>
                          <button 
                            onClick={() => setConnectionMethod('cloud')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${connectionMethod === 'cloud' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
                          >
                              MetaApi Cloud
                          </button>
                          <button 
                            onClick={() => setConnectionMethod('webhook')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${connectionMethod === 'webhook' ? 'bg-gray-700 text-white shadow' : 'text-gray-500'}`}
                          >
                              Webhook
                          </button>
                      </div>

                      {connectionMethod === 'cloud' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                              <div className="relative">
                                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                  <input 
                                      type="password" 
                                      placeholder="MetaApi / Bridge Token"
                                      value={metaApiToken}
                                      onChange={(e) => setMetaApiToken(e.target.value)}
                                      className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:border-primary outline-none"
                                  />
                              </div>
                              <div className="relative">
                                  <Server className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                  <input 
                                      type="text" 
                                      placeholder="Bridge Account ID"
                                      value={bridgeId}
                                      onChange={(e) => setBridgeId(e.target.value)}
                                      className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:border-primary outline-none"
                                  />
                              </div>
                          </div>
                      )}

                      {connectionMethod === 'ea' && (
                          <div className="flex items-center justify-between p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg animate-fade-in">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400">
                                      <FileCode className="w-5 h-5" />
                                  </div>
                                  <div>
                                      <h4 className="text-sm font-bold text-white">Nexus Pro EA (.MQ5)</h4>
                                      <p className="text-[10px] text-gray-400">Auto-Fix Logic • Binary Mode • EEA Ready</p>
                                  </div>
                              </div>
                              <button 
                                onClick={handleDownloadEA}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-900/20"
                              >
                                  <Download className="w-3 h-3" /> Get Bot File
                              </button>
                          </div>
                      )}

                      {connectionMethod === 'webhook' && (
                          <div className="animate-fade-in">
                              <label className="text-xs text-gray-400 mb-1 block">Your Personal Webhook URL</label>
                              <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-primary" />
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={webhookUrl}
                                        className="w-full bg-gray-800 border border-primary/30 rounded-lg py-2 pl-9 pr-3 text-xs text-primary font-mono outline-none"
                                    />
                                  </div>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                                    className="px-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 text-white"
                                  >
                                      <Download className="w-4 h-4" />
                                  </button>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-2">
                                  Paste this URL into TradingView alerts or your external EEA to receive signals directly.
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-sm text-danger animate-pulse">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Connection Form (Hidden for Webhook) */}
          {!isWebhook && connectionMethod !== 'webhook' && (
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
                       Establishing Bridge...
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
          )}

          {/* Webhook specific connect button */}
          {(isWebhook || connectionMethod === 'webhook') && (
               <button 
                  onClick={handleConnect}
                  className="w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 mt-4 bg-primary hover:bg-blue-600 shadow-lg shadow-blue-900/20"
                >
                   {connecting ? (
                       <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Activating Listener...
                       </span>
                   ) : (
                       <>
                          <Zap className="w-4 h-4 fill-current" /> Activate Webhook Listener
                       </>
                   )}
                </button>
          )}

        </div>
      </div>
    </div>
  );
}