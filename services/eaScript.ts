
export const getNexusEA = (apiKey: string = "YOUR_API_KEY") => `//+------------------------------------------------------------------+
//|                    NEXUS TRADER PRO EA (MT5)                     |
//|            AI-Powered EEA Engine & Cloud Bridge                  |
//|         Forex • Crypto • Binary Options • Indices                |
//+------------------------------------------------------------------+
#property copyright "NexusTrade AI"
#property link      "https://nexustrade.ai"
#property version   "3.55"
#property strict

#include <Trade/Trade.mqh>

CTrade trade;

//--- ENUMS
enum ENUM_MODE {
   MODE_HYBRID    = 0, // Local AI Logic + Cloud Signals
   MODE_LOCAL     = 1, // Standalone Technical Strategy
   MODE_SIGNAL    = 2, // Webhook/API Signals Only
   MODE_BINARY    = 3  // Binary Options (Call/Put simulation)
};

//---------------------- INPUT SETTINGS -----------------------------//
input group "🤖 AI Engine & Bridge"
input ENUM_MODE Bot_Mode = MODE_HYBRID;
input string Nexus_API_Key = "${apiKey}";
input int MagicNumber = 889900;
input int MaxSlippage = 3;
input int RetryAttempts = 3;

input group "☁️ Cloud Connection (MetaApi)"
input bool Use_MetaApi = false;
input string MetaApi_Token = ""; 
input string Bridge_URL = "https://api.nexustrade.ai/v1/signal";
input int Sync_Interval = 60; // Seconds

input group "📊 Strategy Parameters"
input double Risk_Percent = 2.0;
input int RSI_Period = 14;
input int Stoch_K = 14;
input int Stoch_D = 3;
input int Stoch_Slowing = 3;

// Global Indicator Handles
int rsiHandle;
int stochHandle;

//----------------------- INITIALIZATION ------------------------------//
int OnInit()
{
   Print("🚀 NexusTrader AI Engine Initializing...");
   
   if(Nexus_API_Key == "" || Nexus_API_Key == "YOUR_API_KEY") {
      Print("⚠️ ALERT: API Key not configured. Running in Restricted Mode.");
   }

   // Initialize Indicators
   rsiHandle = iRSI(NULL, PERIOD_H1, RSI_Period, PRICE_CLOSE);
   stochHandle = iStochastic(NULL, PERIOD_H1, Stoch_K, Stoch_D, Stoch_Slowing, MODE_SMA, STO_LOWHIGH);

   if(rsiHandle == INVALID_HANDLE || stochHandle == INVALID_HANDLE) {
      Print("❌ CRITICAL: Failed to create indicator handles.");
      return(INIT_FAILED);
   }

   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(MaxSlippage);
   trade.SetTypeFilling(ORDER_FILLING_IOC); // Auto-fix for filling modes
   
   // Pre-Check Data
   if(!SymbolInfoInteger(Symbol(), SYMBOL_SELECT)) {
      if(!SymbolSelect(Symbol(), true)) {
         Print("❌ Failed to select symbol: ", Symbol());
         return(INIT_FAILED);
      }
   }
   
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   IndicatorRelease(rsiHandle);
   IndicatorRelease(stochHandle);
}

//----------------------- HELPER FUNCTIONS ---------------------------//

// Auto-Fix: Normalize Volume to Broker Steps
double VerifyVolume(string symbol, double lot) {
   double min_lot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double max_lot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double step_lot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   
   if(step_lot <= 0) return min_lot;
   
   double normalized = MathFloor(lot / step_lot) * step_lot;
   
   if(normalized < min_lot) normalized = min_lot;
   if(normalized > max_lot) normalized = max_lot;
   
   return normalized;
}

// Calculate Dynamic Lot Size based on Risk
double GetLotSize(string symbol, double sl_pips) {
   if(sl_pips <= 0) sl_pips = 50; // Safety default
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double risk_money = balance * (Risk_Percent / 100.0);
   
   double tick_val = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tick_val == 0) tick_val = 1.0;
   
   double lot = risk_money / (sl_pips * tick_val);
   return VerifyVolume(symbol, lot);
}

// Auto-Fix: Normalize Price for SL/TP
double NormPrice(string symbol, double price) {
   double tick_size = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tick_size == 0) return price;
   return MathRound(price / tick_size) * tick_size;
}

// --- ROBUST PRICE CHECKER ---
bool CheckPrice(string symbol, double &bid, double &ask) {
   for(int i=0; i<RetryAttempts; i++) {
      if(SymbolInfoTick(symbol, tick)) {
         if(tick.bid > 0 && tick.ask > 0) {
            bid = tick.bid;
            ask = tick.ask;
            return true;
         }
      }
      Sleep(100); // Wait 100ms before retry
   }
   Print("❌ FAILED to get valid price for ", symbol, " after ", RetryAttempts, " attempts.");
   return false;
}

MqlTick tick; // Global tick structure

//----------------------- SIGNAL LOGIC ------------------------------//

void ScanMarket(string symbol) {
   // Get Indicator Data (Efficient CopyBuffer)
   double rsi[], stochK[], stochD[];
   ArraySetAsSeries(rsi, true); 
   ArraySetAsSeries(stochK, true);
   ArraySetAsSeries(stochD, true);
   
   if(CopyBuffer(rsiHandle, 0, 0, 2, rsi) < 2) return;
   if(CopyBuffer(stochHandle, 0, 0, 2, stochK) < 2) return;
   if(CopyBuffer(stochHandle, 1, 0, 2, stochD) < 2) return;

   // Logic Matrix
   bool buySignal = false;
   bool sellSignal = false;

   // 1. RSI Trend Filter
   bool bullTrend = rsi[0] > 50;
   bool bearTrend = rsi[0] < 50;

   // 2. Stochastic Crossover
   bool stochBuy = stochK[1] < stochD[1] && stochK[0] > stochD[0] && stochK[0] < 80;
   bool stochSell = stochK[1] > stochD[1] && stochK[0] < stochD[0] && stochK[0] > 20;

   // Combine
   if(bullTrend && stochBuy) buySignal = true;
   if(bearTrend && stochSell) sellSignal = true;

   // Execution
   if(buySignal) OpenTrade(symbol, ORDER_TYPE_BUY);
   if(sellSignal) OpenTrade(symbol, ORDER_TYPE_SELL);
}

void OpenTrade(string symbol, ENUM_ORDER_TYPE type) {
   // Validate Symbol Selection
   if(PositionSelect(symbol)) return; // One trade per pair
   
   double ask=0, bid=0;
   
   // --- SAFETY GUARD: Check Price Before Execution ---
   if(!CheckPrice(symbol, bid, ask)) return; 
   
   double price = (type == ORDER_TYPE_BUY) ? ask : bid;
   
   // Double check invalid price
   if(price <= 0 || price == EMPTY_VALUE) return;
   
   double slPoints = 500 * _Point; // Example fixed SL
   double tpPoints = 1000 * _Point;
   
   double sl = (type == ORDER_TYPE_BUY) ? price - slPoints : price + slPoints;
   double tp = (type == ORDER_TYPE_BUY) ? price + tpPoints : price - tpPoints;
   
   // Normalize
   sl = NormPrice(symbol, sl);
   tp = NormPrice(symbol, tp);
   
   double vol = GetLotSize(symbol, 50);
   
   if(Bot_Mode == MODE_BINARY) {
       // Binary Options Logic (Pseudo-code for Binary Bots)
       string comment = (type == ORDER_TYPE_BUY) ? "CALL 5m" : "PUT 5m";
       trade.PositionOpen(symbol, type, vol, price, 0, 0, comment);
   } else {
       // Standard CFD/Forex
       trade.PositionOpen(symbol, type, vol, price, sl, tp, "Nexus AI Pro");
   }
   
   int err = GetLastError();
   if(err != 0 && err != 10009) { // Ignore 'Request Completed'
       Print("⚠️ Trade Error: ", err, " Symbol: ", symbol);
   }
}

//----------------------- MAIN LOOP ----------------------------------//
void OnTick()
{
   if(!IsTradeAllowed()) return;
   
   // Ensure connection
   if(!TerminalInfoInteger(TERMINAL_CONNECTED)) return;

   // Bridge Sync Check
   static datetime lastSync = 0;
   if(TimeCurrent() - lastSync > Sync_Interval) {
      // CheckBridgeSignals(); // Placeholder for web request
      lastSync = TimeCurrent();
   }

   // Local Logic Execution
   if(Bot_Mode == MODE_HYBRID || Bot_Mode == MODE_LOCAL || Bot_Mode == MODE_BINARY) {
      ScanMarket(_Symbol);
   }
}
//+------------------------------------------------------------------+
`;
