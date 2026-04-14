import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, QrCode, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function AddFunds({ userProfile }: { userProfile: any }) {
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [usdtQrCodeUrl, setUsdtQrCodeUrl] = useState('');
  const [usdtWalletAddress, setUsdtWalletAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState('');
  const [minDepositINR, setMinDepositINR] = useState(10);
  const [minDepositUSDT, setMinDepositUSDT] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'usdt'>('upi');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'payment'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setQrCodeUrl(data.qrCodeUrl || '');
        setUsdtQrCodeUrl(data.usdtQrCodeUrl || '');
        setUsdtWalletAddress(data.usdtWalletAddress || '');
        setUsdtNetwork(data.usdtNetwork || '');
        setMinDepositINR(data.minDepositINR || 10);
        setMinDepositUSDT(data.minDepositUSDT || 10);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const minAmount = paymentMethod === 'upi' ? minDepositINR : minDepositUSDT;
    if (parseFloat(amount) < minAmount) {
      setError(`Minimum deposit for ${paymentMethod.toUpperCase()} is ${minAmount}${paymentMethod === 'upi' ? ' INR' : ' USDT'}.`);
      return;
    }

    if (!transactionId.trim()) {
      setError('Please enter the UTR or Transaction ID.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'fundRequests'), {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        amount: parseFloat(amount),
        transactionId: transactionId.trim(),
        paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSuccess('Fund request submitted successfully! Admin will verify and add balance soon.');
      setAmount('');
      setTransactionId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'fundRequests');
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Add Funds</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-xl bg-slate-900/50 p-1 border border-slate-800">
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                paymentMethod === 'upi' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              UPI / QR
            </button>
            <button
              onClick={() => setPaymentMethod('usdt')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                paymentMethod === 'usdt' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              USDT (Crypto)
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-emerald-500 border border-emerald-500/20">
            <Wallet className="h-5 w-5" />
            <span className="font-bold">Balance: ₹{userProfile?.balance?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-2">
        {/* Payment Instructions */}
        <motion.div 
          key={paymentMethod}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-8 backdrop-blur-xl space-y-4 sm:space-y-6"
        >
          {paymentMethod === 'upi' ? (
            <>
              <div className="flex items-center gap-3 text-blue-400">
                <QrCode className="h-6 w-6" />
                <h2 className="text-xl font-bold">Scan to Pay (UPI)</h2>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-2xl">
                <img 
                  src={qrCodeUrl || '/qr-code.png'} 
                  alt="Payment QR Code" 
                  className="w-64 h-64 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Payment%20Gateway';
                  }}
                />
              </div>

              <div className="space-y-4 text-slate-400 text-sm">
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400 border border-blue-500/30">1</span>
                  Scan the QR code using any UPI app (GPay, PhonePe, Paytm, etc.)
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400 border border-blue-500/30">2</span>
                  Enter the amount you want to add and complete the payment.
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400 border border-blue-500/30">3</span>
                  Copy the UTR / Transaction ID from the payment success screen.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-emerald-400">
                <QrCode className="h-6 w-6" />
                <h2 className="text-xl font-bold">Pay with USDT</h2>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-2xl">
                <img 
                  src={usdtQrCodeUrl || '/qr-code.png'} 
                  alt="USDT QR Code" 
                  className="w-64 h-64 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${usdtWalletAddress || 'USDT'}`;
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-950/50 p-4 border border-slate-800">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wallet Address</label>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <code className="text-xs text-emerald-400 break-all">{usdtWalletAddress || 'Not set'}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(usdtWalletAddress);
                        alert('Address copied!');
                      }}
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-400"
                    >
                      COPY
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950/50 p-4 border border-slate-800">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Network</label>
                  <p className="text-sm text-white font-bold mt-1">{usdtNetwork || 'Not set'}</p>
                </div>

                <div className="space-y-3 text-slate-400 text-sm">
                  <p className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">1</span>
                    Send USDT to the address above using the specified network.
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">2</span>
                    Copy the Transaction Hash (TXID) after the payment is confirmed.
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">3</span>
                    Submit the amount in INR (approx) and the TXID in the form.
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Submission Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-8 backdrop-blur-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">
                {paymentMethod === 'upi' ? 'Amount (INR)' : 'Amount (INR Equivalent)' }
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-8 pr-4 text-white focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">
                {paymentMethod === 'upi' ? 'UTR / Transaction ID' : 'Transaction Hash (TXID)'}
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={paymentMethod === 'upi' ? "Enter 12-digit UTR number" : "Enter TXID"}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 px-4 text-white focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white btn-primary-glow disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Payment Details
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="text-blue-400 font-bold">Note:</span> Funds will be added to your account after verification (usually within 5-30 minutes). Please ensure the Transaction ID is correct to avoid delays.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
