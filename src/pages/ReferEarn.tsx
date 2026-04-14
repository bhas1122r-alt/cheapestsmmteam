import { motion } from 'motion/react';
import { Users, Copy, CheckCircle2, Gift, TrendingUp, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function ReferEarn({ userProfile }: { userProfile: any }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}?ref=${userProfile?.uid}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    {
      label: 'Total Earned',
      value: `₹${userProfile?.referralEarnings?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Commission Rate',
      value: '2%',
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Referral Status',
      value: 'Active',
      icon: CheckCircle2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          Refer & Earn
        </h1>
        <p className="text-slate-400">Invite your friends and earn a 2% commission on every deposit they make!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className={cn("rounded-xl p-3", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-2">
        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-8 backdrop-blur-xl space-y-4 sm:space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Your Referral Link</h2>
            <p className="text-sm text-slate-400">Share this link with your friends to start earning.</p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center gap-4 rounded-xl bg-slate-950 p-4 border border-slate-800">
              <code className="flex-1 text-sm text-blue-400 truncate font-mono">
                {referralLink}
              </code>
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all",
                  copied ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-500"
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    COPY
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">How it works</h3>
            <div className="space-y-4">
              {[
                { step: 1, text: 'Copy your unique referral link above.' },
                { step: 2, text: 'Share it with your friends or on social media.' },
                { step: 3, text: 'When they sign up and deposit funds, you get 2% commission instantly!' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400 border border-blue-500/20">
                    {item.step}
                  </span>
                  <p className="pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Promotion Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-800 bg-gradient-to-br from-blue-600/5 to-purple-600/5 p-4 sm:p-8 backdrop-blur-xl flex flex-col justify-center items-center text-center space-y-4 sm:space-y-6"
        >
          <div className="rounded-full bg-blue-500/10 p-6 border border-blue-500/20">
            <Users className="h-12 w-12 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white font-sans tracking-tight">Grow Together</h2>
            <p className="text-slate-400 max-w-xs mx-auto">
              There is no limit to how much you can earn. The more friends you refer, the more passive income you generate!
            </p>
          </div>
          <div className="w-full pt-4">
            <div className="rounded-xl bg-slate-950/50 p-4 border border-slate-800">
              <p className="text-xs text-slate-500 italic">
                "I've earned over ₹5,000 just by sharing my link on my Telegram channel!"
              </p>
              <p className="mt-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">- Top Referrer</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
