import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order, Announcement, UserStat, Quote } from '../types';
import { Package, Bell, Clock, CheckCircle, AlertCircle, PlusCircle, ShieldCheck, Zap, Shield, Globe, ExternalLink, Link as LinkIcon, X, CreditCard, Info, Copy, Check, Sliders, MessageSquare, Send, BarChart3, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { STATS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { addDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [eftDetails, setEftDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<UserStat[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customBudget, setCustomBudget] = useState(5000);
  const [customRequirements, setCustomRequirements] = useState('');
  const [projectDetails, setProjectDetails] = useState({
    platform: 'E-commerce',
    paymentGateway: 'Stripe',
    securityLevel: 'Standard',
    csrAgents: 'None',
    specifics: ''
  });
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
      setLoading(false);
    });

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'announcements');
    });

    const statsQuery = query(
      collection(db, 'userStats'),
      where('userId', '==', user.uid),
      orderBy('date', 'asc'),
      limit(30)
    );

    const unsubscribeStats = onSnapshot(statsQuery, (snapshot) => {
      setStats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserStat)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'userStats'));

    const quotesQuery = query(
      collection(db, 'quotes'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeQuotes = onSnapshot(quotesQuery, (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'quotes'));

    return () => {
      unsubscribeOrders();
      unsubscribeAnnouncements();
      unsubscribeStats();
      unsubscribeQuotes();
    };
  }, [user]);

  const handleRequestCustomPlan = async () => {
    if (!user) return;
    setIsSubmittingCustom(true);
    try {
      // Generate AI Vision
      let aiVision = '';
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const model = "gemini-3-flash-preview";
        const prompt = `As a senior web architect, generate a visionary project blueprint for a client who wants a ${projectDetails.platform} platform. 
        Requirements:
        - Payment Gateway: ${projectDetails.paymentGateway}
        - Security: ${projectDetails.securityLevel}
        - Support: ${projectDetails.csrAgents}
        - Specifics: ${projectDetails.specifics || customRequirements}
        
        Provide a 3-sentence high-level technical vision that sounds futuristic and professional.`;
        
        const result = await ai.models.generateContent({
          model,
          contents: prompt
        });
        aiVision = result.text || '';
      } catch (aiErr) {
        console.error('AI Generation failed:', aiErr);
        aiVision = 'Our architects are currently drafting your custom blueprint.';
      }

      await addDoc(collection(db, 'orders'), {
        clientId: user.uid,
        planId: 'custom',
        status: 'pending',
        designBrief: customRequirements || projectDetails.specifics,
        amount: customBudget,
        createdAt: new Date().toISOString(),
        isCustom: true,
        customRequirements: customRequirements || projectDetails.specifics,
        requirements: projectDetails,
        aiVision,
        budget: customBudget
      });
      setCustomRequirements('');
      setProjectDetails({
        platform: 'E-commerce',
        paymentGateway: 'Stripe',
        securityLevel: 'Standard',
        csrAgents: 'None',
        specifics: ''
      });
      setToast({ message: 'Custom plan request sent! AI has generated your project blueprint.', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

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

              {/* AI Vision Section */}
              {selectedOrder.aiVision && (
                <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-16 h-16 text-emerald-600" />
                  </div>
                  <h4 className="text-emerald-900 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2" /> AI Project Blueprint
                  </h4>
                  <p className="text-emerald-800 text-sm italic leading-relaxed relative z-10 font-medium">
                    "{selectedOrder.aiVision}"
                  </p>
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Quote Details Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-zinc-900">Proposal: {selectedQuote.planName}</h3>
              <button onClick={() => setSelectedQuote(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
              <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Estimated Investment</p>
                    <p className="text-4xl font-black text-emerald-900">R{selectedQuote.amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-600 uppercase">{selectedQuote.status}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-emerald-900">Project Scope & Requirements</h4>
                  <p className="text-emerald-800 text-sm leading-relaxed bg-white/50 p-4 rounded-2xl border border-emerald-100/50">
                    {selectedQuote.requirements}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-zinc-900 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-emerald-600" />
                  Next Steps
                </h4>
                <div className="grid gap-4">
                  <div className="flex items-start space-x-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 font-bold text-emerald-600">1</div>
                    <p className="text-sm text-zinc-600">Review the proposal and requirements above.</p>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 font-bold text-emerald-600">2</div>
                    <p className="text-sm text-zinc-600">Contact our team if you need any adjustments or have questions.</p>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 font-bold text-emerald-600">3</div>
                    <p className="text-sm text-zinc-600">Once you're ready, we'll convert this proposal into an active project.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
              <button 
                onClick={() => setSelectedQuote(null)}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all"
              >
                Close Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Welcome, {profile?.name}</h1>
          <p className="text-zinc-500 font-medium">Manage your digital infrastructure and project progression.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/#plans')}
            className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center shadow-lg shadow-zinc-900/20"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> New Project
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="mb-12">
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Security & Performance Metrics</h2>
              <p className="text-sm text-zinc-500">Real-time mitigation and traffic analysis</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                Live Monitoring
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                  <defs>
                    <linearGradient id="colorMit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    tickFormatter={(str) => format(new Date(str), 'MMM d')}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="mitigations" stroke="#10b981" fillOpacity={1} fill="url(#colorMit)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <Shield className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">No statistical data available yet.</p>
                <p className="text-[10px]">Data will appear once your site is live and receiving traffic.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Quotes Section */}
        {quotes.length > 0 && (
          <div className="lg:col-span-3 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-zinc-900 flex items-center">
                <FileText className="w-8 h-8 mr-3 text-emerald-600" />
                Proposals & Quotes
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotes.map(quote => (
                <div key={quote.id} className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                      quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{quote.planName}</h3>
                  <p className="text-zinc-500 text-sm mb-6 line-clamp-2">{quote.requirements}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                    <p className="text-2xl font-black text-zinc-900">R{quote.amount.toLocaleString()}</p>
                    <button 
                      onClick={() => setSelectedQuote(quote)}
                      className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center">
              <Package className="w-6 h-6 mr-2 text-emerald-600" />
              Active Projects
            </h2>
            
            {loading ? (
              <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-zinc-200">
                <div className="animate-pulse text-zinc-400">Loading projects...</div>
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-zinc-900 text-lg uppercase tracking-tight">Project #{order.id.slice(0, 8)}</h3>
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
                        {order.isCustom && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">CUSTOM</span>}
                      </div>
                      <div className="text-zinc-900 font-bold">R{order.amount}</div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-100">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center"
                      >
                        <Zap className="w-4 h-4 mr-2" /> View Progression
                      </button>
                    </div>
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

          {/* Custom Plan Builder */}
          <div className="bg-zinc-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sliders className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-8">
              <div>
                <h2 className="text-3xl font-black mb-2">Build Your Custom Solution</h2>
                <p className="text-zinc-400 font-medium">Need something specific? Adjust your budget and requirements.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Target Budget</label>
                    <span className="text-emerald-400 font-black text-xl">R{customBudget.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="2000" 
                    max="50000" 
                    step="500"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-600 uppercase">
                    <span>R2,000</span>
                    <span>R50,000+</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Platform Type</label>
                    <select 
                      value={projectDetails.platform}
                      onChange={(e) => setProjectDetails({...projectDetails, platform: e.target.value as any})}
                      className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="E-commerce">E-commerce</option>
                      <option value="SaaS">SaaS Platform</option>
                      <option value="Blog">Professional Blog</option>
                      <option value="Portfolio">Creative Portfolio</option>
                      <option value="Custom">Custom Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Payment Gateway</label>
                    <select 
                      value={projectDetails.paymentGateway}
                      onChange={(e) => setProjectDetails({...projectDetails, paymentGateway: e.target.value as any})}
                      className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Stripe">Stripe (Global)</option>
                      <option value="PayPal">PayPal</option>
                      <option value="PayFast">PayFast (SA)</option>
                      <option value="None">No Payments Needed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Security Level</label>
                    <select 
                      value={projectDetails.securityLevel}
                      onChange={(e) => setProjectDetails({...projectDetails, securityLevel: e.target.value as any})}
                      className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Standard">Standard (SSL + Basic)</option>
                      <option value="Enhanced">Enhanced (2FA + WAF)</option>
                      <option value="Military-Grade">Military-Grade (Encrypted + Audited)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">CSR Support Agents</label>
                    <select 
                      value={projectDetails.csrAgents}
                      onChange={(e) => setProjectDetails({...projectDetails, csrAgents: e.target.value as any})}
                      className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="None">No Agents</option>
                      <option value="1-2 Agents">1-2 Dedicated Agents</option>
                      <option value="3-5 Agents">3-5 Dedicated Agents</option>
                      <option value="Dedicated Team">Full Dedicated Team</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Specific Requirements</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-zinc-600" />
                    <textarea 
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                      placeholder="Tell us about your custom needs (e.g. custom API, specific design style, high-traffic scaling...)"
                      className="w-full bg-zinc-800 border-none rounded-2xl p-4 pl-12 text-sm text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 min-h-[120px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleRequestCustomPlan}
                  disabled={isSubmittingCustom || !customRequirements.trim()}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-600/20"
                >
                  {isSubmittingCustom ? 'Generating AI Vision...' : (
                    <>
                      <Send className="w-5 h-5 mr-3" /> Request Custom Quote
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
