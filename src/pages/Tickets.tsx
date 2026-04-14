import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { Ticket, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Tickets({ userProfile }: { userProfile: any }) {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tickets');
    });

    return () => unsub();
  }, [userProfile?.uid]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'closed': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          <p className="text-sm text-slate-400">Need help? Create a ticket and talk to our AI agent or staff.</p>
        </div>
        <Link
          to="/tickets/new"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white btn-primary-glow shadow-lg shadow-blue-900/20"
        >
          <Plus className="h-5 w-5" />
          Create Ticket
        </Link>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/tickets/${ticket.id}`}
              className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl transition-all hover:bg-slate-800/50 hover:border-slate-700"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border",
                  getStatusStyle(ticket.status)
                )}>
                  <Ticket className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{ticket.subject}</h3>
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      getStatusStyle(ticket.status)
                    )}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ticket.createdAt?.toDate().toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.request}
                    </span>
                    {ticket.orderId && (
                      <span className="text-blue-500/70 font-mono">#{ticket.orderId}</span>
                    )}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ))}

        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
              <Ticket className="h-10 w-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-white">No tickets yet</h3>
            <p className="mt-2 text-slate-500">If you have any issues or questions, feel free to create a ticket.</p>
          </div>
        )}
      </div>
    </div>
  );
}
