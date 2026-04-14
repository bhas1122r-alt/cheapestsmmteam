/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection, getDocs, writeBatch, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AddFunds from './pages/AddFunds';
import Orders from './pages/Orders';
import ReferEarn from './pages/ReferEarn';
import Services from './pages/Services';
import Transactions from './pages/Transactions';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import Chat from './pages/Chat';
import Premium from './pages/Premium';
import Cheapest from './pages/Cheapest';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NotificationManager from './components/NotificationManager';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Capture referral code from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referredBy', ref);
    }

    const unsubNav = onSnapshot(collection(db, 'navigation'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNavItems(items.sort((a: any, b: any) => a.order - b.order));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'navigation');
    });

    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial check/creation
        try {
          const userDoc = await getDoc(userDocRef);
          let currentProfile = userDoc.data();

          if (!userDoc.exists()) {
            const referredBy = localStorage.getItem('referredBy');
            currentProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'User',
              balance: 1, // 1rs Welcome Bonus
              referralEarnings: 0,
              role: firebaseUser.email === 'bhas1122r@gmail.com' ? 'admin' : 'user',
              plan_type: 'free',
              plan_expiry: null,
              ...(referredBy && referredBy !== firebaseUser.uid ? { referredBy } : {}),
            };
            await setDoc(userDocRef, currentProfile);
            
            // Add transaction record for bonus
            await addDoc(collection(db, 'transactions'), {
              userId: firebaseUser.uid,
              type: 'deposit',
              amount: 1,
              description: 'New User Welcome Bonus',
              createdAt: serverTimestamp(),
            });

            if (referredBy) localStorage.removeItem('referredBy');
          }

          // Initialize Navigation if empty and user is admin
          if (currentProfile?.role === 'admin') {
            const navSnap = await getDocs(collection(db, 'navigation'));
            if (navSnap.empty) {
              const batch = writeBatch(db);
              const defaults = [
                { label: 'New Order', icon: 'ShoppingCart', path: '/', isVisible: true, order: 1 },
                { label: 'Cheapest', icon: 'Zap', path: '/cheapest', isVisible: true, order: 1.5 },
                { label: 'Mass Orders', icon: 'Layers', path: '/mass-orders', isVisible: true, order: 2 },
                { label: 'Orders', icon: 'History', path: '/orders', isVisible: true, order: 3 },
                { label: 'Services', icon: 'List', path: '/services', isVisible: true, order: 4 },
                { label: 'Add Funds', icon: 'Wallet', path: '/add-funds', isVisible: true, order: 5 },
                { label: 'Transactions', icon: 'FileText', path: '/transactions', isVisible: true, order: 6 },
                { label: 'Refill', icon: 'RefreshCw', path: '/refill', isVisible: true, order: 7 },
                { label: 'Tickets', icon: 'Ticket', path: '/tickets', isVisible: true, order: 8 },
                { label: 'Premium', icon: 'Crown', path: '/premium', isVisible: true, order: 8.5 },
                { label: 'API', icon: 'Zap', path: '/api', isVisible: true, order: 9 },
                { label: 'Refer & Earn', icon: 'Users', path: '/refer', isVisible: true, order: 10 },
                { label: 'Blog', icon: 'BookOpen', path: '/blog', isVisible: true, order: 11 },
              ];
              defaults.forEach((item) => {
                const ref = doc(collection(db, 'navigation'));
                batch.set(ref, item);
              });
              await batch.commit();
            } else {
              // Ensure Premium & Cheapest exist for existing users
              const premiumExists = navSnap.docs.some(d => d.data().path === '/premium');
              if (!premiumExists) {
                await addDoc(collection(db, 'navigation'), { 
                  label: 'Premium', 
                  icon: 'Crown', 
                  path: '/premium', 
                  isVisible: true, 
                  order: 8.5 
                });
              }

              const cheapestExists = navSnap.docs.some(d => d.data().path === '/cheapest');
              if (!cheapestExists) {
                await addDoc(collection(db, 'navigation'), { 
                  label: 'Cheapest', 
                  icon: 'Zap', 
                  path: '/cheapest', 
                  isVisible: true, 
                  order: 1.5 
                });
              }
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'users/navigation');
        }

        // Real-time listener
        unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          const data = docSnap.data();
          if (data) {
            // Check for plan expiry
            if (data.plan_type && data.plan_type !== 'free' && data.plan_expiry) {
              const expiry = new Date(data.plan_expiry);
              if (expiry < new Date()) {
                console.log('Plan expired, reverting to free');
                await updateDoc(userDocRef, {
                  plan_type: 'free',
                  plan_expiry: null
                });
                return; // The next snapshot will have the updated data
              }
            }
            setUserProfile(data);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      unsubNav();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        {user && <Navbar userProfile={userProfile} navItems={navItems} />}
        <div className={user ? "flex container mx-auto px-4 py-4 sm:py-8 gap-4 sm:gap-8" : ""}>
          {user && <Sidebar navItems={navItems} />}
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              <Route 
                path="/" 
                element={user ? <Dashboard userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/cheapest" 
                element={user ? <Cheapest userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/admin/*" 
                element={user && userProfile?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} 
              />
              <Route 
                path="/add-funds" 
                element={user ? <AddFunds userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/orders" 
                element={user ? <Orders userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/refer" 
                element={user ? <ReferEarn userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/services" 
                element={user ? <Services userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/transactions" 
                element={user ? <Transactions userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/tickets" 
                element={user ? <Tickets userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/tickets/new" 
                element={user ? <CreateTicket userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/tickets/:id" 
                element={user ? <Chat userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/premium" 
                element={user ? <Premium userProfile={userProfile} /> : <Navigate to="/login" />} 
              />
              {/* Add routes for other sections as needed */}
              <Route path="*" element={<div className="text-center py-20 text-slate-500 italic">This section is coming soon...</div>} />
            </Routes>
          </main>
        </div>
        {user && <NotificationManager userProfile={userProfile} />}
      </div>
    </Router>
  );
}
