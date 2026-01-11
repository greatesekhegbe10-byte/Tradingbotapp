
# NexusTrade AI - Deployment Guide

## 🚀 How to Deploy to GitHub

1. **Initialize Git**:
   ```bash
   git init
   git remote add origin https://github.com/YOUR_USERNAME/nexus-trade-ai.git
   ```

2. **Push Code**:
   ```bash
   git add .
   git commit -m "Deploy: Institutional Cluster v3.5"
   git push -u origin main
   ```

3. **Deploy to GitHub Pages**:
   - Install `gh-pages`: `npm install gh-pages --save-dev`
   - Run: `npm run deploy`
   - Your app will be live at `https://YOUR_USERNAME.github.io/nexus-trade-ai/`

## 🛠 Admin Maintenance Instructions

- **Accurate Stats**: The Admin Dashboard is hard-linked to the internal payment ledger. To verify a payment, navigate to the **Financial Matrix** tab and click **"Confirm Settlement"**. This will instantly update the global "Verified Settlements" counter.
- **Key Access**: Infrastructure keys (Paystack/Flutterwave) are editable under the **Gateway Bridge** tab. These are decrypted for active Admin sessions as per protocol requirements.
- **Live Monitoring**: Use the **User Registry** to suspend or provision new trading nodes in real-time.
