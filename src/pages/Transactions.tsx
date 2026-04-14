import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { History, ArrowUpRight, ArrowDownLeft, Gift, RefreshCcw, Search, Filter } from 'lucide-react';

export default function Transactions({ userProfile }: { userProfile: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    return () => unsub();
  }, [userProfile?.uid]);

  const filteredTransactions = transactions.filter(tx => 
    filter === 'All' || tx.type === filter.toLowerCase()
  );

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-5 w-5 text-emerald-500" />;
      case 'spend': return <ArrowUpRight className="h-5 w-5 text-blue-500" />;
      case 'referral': return <Gift className="h-5 w-5 text-purple-500" />;
      case 'refund': return <RefreshCcw className="h-5 w-5 text-amber-500" />;
      default: return <History className="h-5 w-5 text-slate-400" />;
    }
  };

  const getTxBg = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'spend': return 'bg-blue-500/10 border-blue-500/20';
      case 'referral': return 'bg-purple-500/10 border-purple-500/20';
      case 'refund': return 'bg-amber-500/10 border-amber-500/20';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Transactions</h1>
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/50 p-1 border border-slate-800">
          {['All', 'Deposit', 'Spend', 'Referral', 'Refund'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                filter === type 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                <th className="px-4 sm:px-6 py-4">Transaction ID</th>
                <th className="px-4 sm:px-6 py-4">Type</th>
                <th className="px-4 sm:px-6 py-4">Amount</th>
                <th className="px-4 sm:px-6 py-4">Description</th>
                <th className="px-4 sm:px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.map((tx, index) => (
                <motion.tr 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-500">#{tx.id.slice(0, 8)}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border", getTxBg(tx.type))}>
                        {getTxIcon(tx.type)}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-white capitalize">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className={cn(
                      "text-xs sm:text-sm font-bold",
                      tx.type === 'deposit' || tx.type === 'referral' || tx.type === 'refund' ? "text-emerald-500" : "text-red-500"
                    )}>
                      {tx.type === 'deposit' || tx.type === 'referral' || tx.type === 'refund' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-xs sm:text-sm text-slate-400 max-w-[100px] sm:max-w-xs truncate font-medium">{tx.description}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="text-xs text-slate-500 font-medium">
                      {tx.createdAt?.toDate().toLocaleDateString()}
                      <br />
                      <span className="text-[10px] opacity-50">{tx.createdAt?.toDate().toLocaleTimeString()}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <History className="h-8 w-8 opacity-20" />
                      <p className="italic">No transactions found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
