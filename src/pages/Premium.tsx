import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, Zap, Star, Shield, AlertCircle, Clock, ArrowRight, Wallet, QrCode } from 'lucide-react';

const PLANS = [
  {
    id: 'silver',
    name: 'Silver',
    price: 199,
    multiplier: 0.9,
    bonus: 50,
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    borderColor: 'border-slate-400/20',
    features: [
      '10% Discount on all services',
      'Faster order processing',
      'Silver Badge on profile',
      '₹50 Wallet Bonus'
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 499,
    multiplier: 0.8,
    bonus: 150,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
    popular: true,
    features: [
      '20% Discount on all services',
      'Priority order processing',
      'Gold Badge on profile',
      '₹150 Wallet Bonus',
      'Exclusive Gold-only services'
    ]
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 999,
    multiplier: 0.7,
    bonus: 400,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    features: [
      '30% Discount on all services',
      'Instant order processing',
      'VIP Badge on profile',
      '₹400 Wallet Bonus',
      'Dedicated Support Manager',
      'Access to all exclusive services'
    ]
  }
];

export default function Premium({ userProfile }: { userProfile: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'payment'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'subscriptionRequests'),
      where('userId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'subscriptionRequests');
    });

    return () => unsub();
  }, [userProfile?.uid]);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !transactionId) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addDoc(collection(db, 'subscriptionRequests'), {
        userId: userProfile.uid,
        userEmail: userProfile.email,
        planType: selectedPlan.id,
        amount: selectedPlan.price,
        transactionId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSuccess('Upgrade request submitted! Admin will approve it soon.');
      setTransactionId('');
      setSelectedPlan(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'subscriptionRequests');
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPlanActive = (planId: string) => {
    if (userProfile?.plan_type !== planId) return false;
    if (!userProfile?.plan_expiry) return false;
    return new Date(userProfile.plan_expiry) > new Date();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-500 border border-blue-500/20"
        >
          <Crown className="h-4 w-4" />
          Premium Subscriptions
        </motion.div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Upgrade Your <span className="text-blue-500">Experience</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Get massive discounts, priority processing, and exclusive rewards by joining our premium tiers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative flex flex-col rounded-3xl border p-8 backdrop-blur-xl transition-all hover:scale-[1.02]",
              plan.popular ? "border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10" : "border-slate-800 bg-slate-900/50"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-black uppercase tracking-widest text-white">
                Most Popular
              </div>
            )}

            <div className="mb-8 space-y-2">
              <div className={cn("flex items-center gap-2 font-black uppercase tracking-widest", plan.color)}>
                {plan.id === 'silver' && <Zap className="h-5 w-5" />}
                {plan.id === 'gold' && <Star className="h-5 w-5" />}
                {plan.id === 'vip' && <Crown className="h-5 w-5" />}
                {plan.name}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">₹{plan.price}</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
            </div>

            <div className="mb-8 flex-1 space-y-4">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <div className={cn("mt-0.5 rounded-full p-0.5", plan.bgColor)}>
                    <Check className={cn("h-3 w-3", plan.color)} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedPlan(plan)}
              disabled={isPlanActive(plan.id)}
              className={cn(
                "w-full rounded-2xl py-4 font-black btn-primary-glow disabled:opacity-50 disabled:cursor-not-allowed",
                isPlanActive(plan.id) 
                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                  : plan.popular 
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-white border border-slate-700"
              )}
            >
              {isPlanActive(plan.id) ? 'Plan Active' : 'Upgrade Now'}
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">Upgrade to {selectedPlan.name}</h2>
                <button 
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <Check className="h-6 w-6 rotate-45" />
                </button>
              </div>

              <div className="mb-8 space-y-4 rounded-2xl bg-slate-950/50 p-6 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Plan Price</span>
                  <span className="text-xl font-black text-white">₹{selectedPlan.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Validity</span>
                  <span className="text-white font-bold">30 Days</span>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 text-center mb-4">
                    Please pay ₹{selectedPlan.price} to our official UPI and enter the transaction ID below.
                  </p>
                  
                  {/* QR Code Display */}
                  <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl mb-4">
                    <img 
                      src={
                        selectedPlan.id === 'silver' ? settings?.silverQrCodeUrl :
                        selectedPlan.id === 'gold' ? settings?.goldQrCodeUrl :
                        settings?.vipQrCodeUrl || '/qr-code.png'
                      } 
                      alt={`${selectedPlan.name} QR Code`} 
                      className="w-48 h-48 object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Pay%20INR%20${selectedPlan.price}%20for%20${selectedPlan.name}%20Plan`;
                      }}
                    />
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                      <QrCode className="h-3 w-3" />
                      Scan to Pay
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpgrade} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Transaction ID / UTR</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter 12-digit UTR number"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 py-4 font-black text-white btn-primary-glow disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-black text-white">Why Go Premium?</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Dynamic Pricing
              </div>
              <p className="text-sm text-slate-400">Save up to 30% on every single order you place. The more you spend, the more you save.</p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Priority Support
              </div>
              <p className="text-sm text-slate-400">Your tickets and orders are moved to the front of the queue automatically.</p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-400" />
                Exclusive Services
              </div>
              <p className="text-sm text-slate-400">Access high-retention, premium services that are hidden from free users.</p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                Instant Bonuses
              </div>
              <p className="text-sm text-slate-400">Get up to ₹400 added to your wallet immediately after your upgrade is approved.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-black text-white">Request History</h2>
            </div>
          </div>
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-4 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border",
                    req.planType === 'silver' ? "bg-slate-400/10 border-slate-400/20 text-slate-400" :
                    req.planType === 'gold' ? "bg-amber-400/10 border-amber-400/20 text-amber-400" :
                    "bg-purple-400/10 border-purple-400/20 text-purple-400"
                  )}>
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white uppercase">{req.planType} Plan</div>
                    <div className="text-[10px] font-mono text-slate-500">ID: {req.transactionId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                    req.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                    req.status === 'rejected' ? "bg-red-500/10 text-red-400" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    {req.status}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-600">
                    {req.createdAt?.toDate().toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="py-10 text-center text-slate-500 italic">No upgrade requests found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
