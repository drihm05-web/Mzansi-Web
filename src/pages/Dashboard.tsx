import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order, Announcement } from '../types';
import { Package, Bell, Clock, CheckCircle, AlertCircle, PlusCircle, ShieldCheck, Zap, Shield, Globe, ExternalLink, Link as LinkIcon, X, CreditCard, Info, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { STATS } from '../constants';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [eftDetails, setEftDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'payment'));
      if (snap.exists()) {
        setEftDetails(snap.data());
      }
    };
    fetchSettings();

    const ordersQuery = query(
      collection(db, 'orders'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'announcements'));

    return () => {
      unsubscribeOrders();
      unsubscribeAnnouncements();
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <AlertCircle className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Project Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-zinc-900">Project Details: #{selectedOrder.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedOrder(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
              {/* Payment Instructions for Pending Orders */}
              {selectedOrder.status === 'pending' && (
                <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900">Payment Required</h4>
                      <p className="text-emerald-700 text-xs">Complete your EFT to start the design process</p>
                    </div>
                  </div>

                  {eftDetails ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/50 p-3 rounded-xl border border-emerald-100/50">
                          <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Bank</p>
                          <p className="text-sm font-bold text-emerald-900">{eftDetails.bankName}</p>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-emerald-100/50">
                          <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Account</p>
                          <p className="text-sm font-bold text-emerald-900">{eftDetails.accountNumber}</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Reference</p>
                            <p className="text-lg font-black text-emerald-900 font-mono">#{selectedOrder.id.slice(0, 8)}</p>
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.id.slice(0, 8));
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="flex items-center text-[10px] font-bold text-emerald-700 hover:text-emerald-800"
                          >
                            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            {copied ? 'Copied' : 'Copy Ref'}
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-emerald-800 leading-relaxed italic">
                        {eftDetails.instructions}
                      </p>
                    </div>
                  ) : (
                    <p className="text-emerald-600 text-xs italic">Loading payment details...</p>
                  )}
                </div>
              )}

              {/* URLs Section */}
              {(selectedOrder.siteUrl || selectedOrder.adminUrl) && (
                <div className="space-y-4">
                  <h4 className="font-bold text-zinc-900 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-emerald-600" />
                    Access Links
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedOrder.siteUrl && (
                      <a 
                        href={selectedOrder.siteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                      >
                        <div className="flex items-center">
                          <div className="bg-white p-2 rounded-xl shadow-sm mr-3">
                            <Globe className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-900">Live Website</div>
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-emerald-600" />
                      </a>
                    )}
                    
                    {selectedOrder.adminUrl && (
                      <a 
                        href={selectedOrder.adminUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                      >
                        <div className="flex items-center">
                          <div className="bg-white p-2 rounded-xl shadow-sm mr-3">
                            <LinkIcon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-900">Admin Dashboard</div>
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-emerald-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Progression Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-zinc-900 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-emerald-600" />
                  Project Progression
                </h4>
                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                  {selectedOrder.progressionUpdates && selectedOrder.progressionUpdates.length > 0 ? (
                    selectedOrder.progressionUpdates.slice().reverse().map((update, i) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          <p className="text-sm text-zinc-800 leading-relaxed">{update.message}</p>
                          <p className="text-[10px] text-zinc-400 mt-2 font-medium uppercase tracking-wider">
                            {format(new Date(update.timestamp), 'PPP p')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="relative pl-10">
                      <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-zinc-300 border-2 border-white ring-4 ring-zinc-50" />
                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 italic text-sm text-zinc-400">
                        Project initialization in progress. Check back soon for updates.
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedOrder.adminUrl && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-3 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Keep your admin credentials secure. The dashboard link provides full access to your website's content management system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-zinc-900">Welcome, {profile?.name}</h1>
        <p className="text-zinc-600">Manage your website projects and view updates.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center">
              <Package className="w-6 h-6 mr-2 text-emerald-600" />
              Your Orders
            </h2>
            <button 
              onClick={() => navigate('/#plans')}
              className="flex items-center space-x-2 text-emerald-600 font-bold hover:underline"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Order</span>
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-zinc-200">
              <div className="animate-pulse text-zinc-400">Loading orders...</div>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-zinc-900 text-lg uppercase tracking-tight">Order #{order.id.slice(0, 8)}</h3>
                      <p className="text-zinc-500 text-sm">{format(new Date(order.createdAt), 'PPP')}</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-bold capitalize text-zinc-700">{order.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-zinc-600">
                      Plan: <span className="font-bold text-zinc-900">{order.planId.toUpperCase()}</span>
                    </div>
                    <div className="text-zinc-900 font-bold">R{order.amount}</div>
                  </div>

                  {((order.status !== 'pending') || (order.progressionUpdates && order.progressionUpdates.length > 0)) && (
                    <div className="mt-6 pt-6 border-t border-zinc-100">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center"
                      >
                        <Zap className="w-4 h-4 mr-2" /> View Project Progression & Details
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-zinc-200 border-dashed">
              <Package className="w-12 h-12 text-zinc-300 mb-4" />
              <p className="text-zinc-500">No orders found. Start your first project today!</p>
            </div>
          )}
        </div>

        {/* Announcements & Security */}
        <div className="space-y-12">
          {/* Announcements */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center">
              <Bell className="w-6 h-6 mr-2 text-emerald-600" />
              Announcements
            </h2>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map(ann => (
                  <div key={ann.id} className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                    <h3 className="font-bold text-emerald-900 mb-2">{ann.title}</h3>
                    <p className="text-emerald-800 text-sm leading-relaxed mb-4">{ann.content}</p>
                    <div className="text-emerald-600 text-xs font-medium">
                      {format(new Date(ann.createdAt), 'PPP')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-zinc-500 bg-zinc-50 rounded-3xl border border-zinc-200">
                  No recent announcements.
                </div>
              )}
            </div>
          </div>

          {/* Security Status */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center">
              <ShieldCheck className="w-6 h-6 mr-2 text-emerald-600" />
              Security Infrastructure
            </h2>
            <div className="bg-zinc-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-24 h-24" />
              </div>
              <div className="space-y-6 relative z-10">
                {STATS.filter(s => ['DDoS Attacks Mitigated', 'Security Audits Passed', 'Uptime Percentage'].includes(s.label)).map((stat, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                      {stat.icon === 'Shield' && <Shield className="w-5 h-5 text-emerald-500" />}
                      {stat.icon === 'ShieldCheck' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                      {stat.icon === 'Zap' && <Zap className="w-5 h-5 text-emerald-500" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex items-center text-xs text-zinc-500 font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                  All Systems Operational in Johannesburg & Cape Town
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
