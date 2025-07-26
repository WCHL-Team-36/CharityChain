# 🔗 Wallet Integration Guide

## **Wallet yang Didukung CharityChain**

### **1. 🛡️ Internet Identity (Recommended)**
**Status**: ✅ Terintegrasi penuh  
**Type**: Official IC Wallet  
**Setup**: Tidak perlu install, langsung akses

**Keunggulan**:
- ✅ **Resmi DFINITY**: Wallet native IC ecosystem
- ✅ **WebAuthn/Biometric**: Login dengan fingerprint/FaceID
- ✅ **No Private Key**: Tidak perlu kelola private key manual
- ✅ **Cross-Platform**: Web, mobile, desktop
- ✅ **Zero Cost**: Gratis untuk semua user

**Cara Connect**:
1. Klik "Connect Wallet" → "Internet Identity"
2. Buat account baru atau login existing
3. Approve connection dengan dApp

---

### **2. 🔌 Plug Wallet (Popular Choice)**
**Status**: ✅ Terintegrasi penuh  
**Type**: Browser Extension + Mobile App  
**Install**: https://plugwallet.ooo/

**Keunggulan**:
- ✅ **User Friendly**: Interface paling mudah
- ✅ **Multi-Token**: Support ICP, ckBTC, SNS tokens
- ✅ **DeFi Ready**: Swap, stake, governance
- ✅ **NFT Support**: View dan manage NFTs
- ✅ **Mobile App**: iOS & Android available

**Cara Install & Connect**:
1. Install Plug extension dari Chrome Web Store
2. Buat wallet baru atau import existing
3. Di CharityChain, pilih "Plug Wallet"
4. Approve connection request

---

### **3. 💎 Stoic Wallet**
**Status**: ✅ Terintegrasi  
**Type**: Web-based Wallet  
**Access**: https://www.stoicwallet.com/

**Keunggulan**:
- ✅ **No Installation**: Web-based, no extension needed
- ✅ **NFT Gallery**: Built-in NFT viewer
- ✅ **Governance**: Participate in IC governance
- ✅ **Multi-Device**: Sync across devices

**Cara Connect**:
1. Buka Stoic Wallet website
2. Connect dengan existing wallet
3. Di CharityChain, pilih "Stoic Wallet"

---

### **4. 🔧 Development Wallet (Testing Only)**
**Status**: ✅ Active  
**Type**: Local Testing Wallet  
**Purpose**: Development & Testing

**Keunggulan**:
- ✅ **Instant**: No setup required
- ✅ **Persistent**: Saves across sessions
- ✅ **Mock Balance**: Pre-funded for testing
- ⚠️ **Test Only**: Jangan gunakan untuk real assets

---

## **🚀 Quick Start Guide**

### **Install Dependencies**:
```bash
npm install ic-stoic-identity
```

### **For Real Testing (Recommended)**:

1. **Install Plug Wallet**:
   ```
   🔗 https://plugwallet.ooo/
   → Chrome Extension
   → Create new wallet
   → Fund dengan ICP dari exchange
   ```

2. **Setup Internet Identity**:
   ```
   🔗 https://identity.ic0.app/
   → Create new anchor
   → Add biometric device
   → Save recovery phrase
   ```

3. **Connect to CharityChain**:
   - Open http://localhost:4943
   - Click "Connect Wallet"
   - Choose your preferred wallet
   - Approve connection

### **Testing Flow**:
```
1. Connect wallet ✅
2. View campaigns ✅  
3. Make donation ✅
4. Receive NFT receipt ✅
5. Check transaction history ✅
```

---

## **💡 Wallet Recommendations by Use Case**

### **🏆 Best for Beginners**:
**Plug Wallet** - Paling user-friendly, support lengkap

### **🔒 Best for Security**:
**Internet Identity** - Official, biometric auth, no private key

### **🎨 Best for NFT Collectors**:
**Stoic Wallet** - Built-in NFT gallery

### **⚡ Best for Testing**:
**Development Wallet** - Instant setup, mock balance

---

## **🔧 Integration Code Examples**

### **Switch to Enhanced Wallet Context**:
```typescript
// Replace current WalletContext with EnhancedWalletContext
import { WalletProvider } from './contexts/EnhancedWalletContext';

// In App.tsx
<WalletProvider>
  <YourApp />
</WalletProvider>
```

### **Add Wallet Selector Component**:
```typescript
import WalletSelector from './components/WalletSelector';

// Replace current connect button
<WalletSelector />
```

---

## **🐛 Troubleshooting**

### **Plug Wallet Issues**:
- Pastikan extension installed & unlocked
- Check network (localhost vs mainnet)
- Whitelist canister IDs

### **Internet Identity Issues**:
- Clear browser cache if login stuck
- Check biometric permissions
- Try different browser

### **Connection Failed**:
- Refresh page dan try again
- Check console for error details
- Verify canister IDs correct

---

## **🔐 Security Best Practices**

1. **Never share private keys**
2. **Verify dApp URLs** before connecting
3. **Use hardware wallets** for large amounts
4. **Keep recovery phrases** safe & offline
5. **Regular wallet updates**

---

**📞 Need Help?**
- Check browser console for errors
- Test with development wallet first
- Verify wallet extension permissions
- Ensure canister IDs are correct

**🎯 Ready to test with real wallets!**
