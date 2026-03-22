import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, deleteDoc, Timestamp, where, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, Announcement, Demo, ProgressionUpdate, UserProfile, Plan, DiscountCode, Quote, EmailLog } from '../types';
import { PLANS } from '../constants';
import { 
  Package, Bell, Globe, Plus, Trash2, Edit3, Edit2, Save, X, 
  CheckCircle, Clock, AlertCircle, ExternalLink, Zap, 
  Link as LinkIcon, Info, LayoutDashboard, Database, Users,
  Tag, Calendar, ChevronRight, Search, CreditCard, Settings,
  FileText, Mail, BarChart3, TrendingUp, User, Shield, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

type TabType = 'orders' | 'users' | 'plans' | 'marketing' | 'demos' | 'settings' | 'crm' | 'servicing';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [eftDetails, setEftDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchCode: '',
    instructions: ''
  });
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    senderEmail: '',
    senderName: 'Mzansi Web Solutions'
  });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingDemo, setEditingDemo] = useState<Demo | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingDiscountCode, setEditingDiscountCode] = useState<DiscountCode | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [generatingQuote, setGeneratingQuote] = useState<{
    clientEmail: string;
    planName: string;
    amount: number;
    requirements: string;
  } | null>(null);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [emailModal, setEmailModal] = useState<{ to: string, subject: string, content: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const plansQuery = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const demosQuery = query(collection(db, 'demos'), orderBy('createdAt', 'desc'));
    const discountsQuery = query(collection(db, 'discountCodes'));

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
      setLoading(false);
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubscribePlans = onSnapshot(plansQuery, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'plans'));

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'announcements'));

    const unsubscribeDemos = onSnapshot(demosQuery, (snapshot) => {
      setDemos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Demo)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'demos'));

    const unsubscribeDiscounts = onSnapshot(discountsQuery, (snapshot) => {
      setDiscountCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'discountCodes'));

    const unsubscribeQuotes = onSnapshot(query(collection(db, 'quotes'), orderBy('createdAt', 'desc')), (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'quotes'));

    const unsubscribeEmails = onSnapshot(query(collection(db, 'emailLogs'), orderBy('sentAt', 'desc')), (snapshot) => {
      setEmailLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'emailLogs'));

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'payment'), (snapshot) => {
      if (snapshot.exists()) {
        setEftDetails(snapshot.data() as any);
      }
    });

    const unsubscribeEmailSettings = onSnapshot(doc(db, 'settings', 'email'), (snapshot) => {
      if (snapshot.exists()) {
        setEmailSettings(snapshot.data() as any);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribePlans();
      unsubscribeAnnouncements();
      unsubscribeDemos();
      unsubscribeDiscounts();
      unsubscribeQuotes();
      unsubscribeEmails();
      unsubscribeSettings();
      unsubscribeEmailSettings();
    };
  }, []);

  const handleSeedStats = async (userId: string) => {
    setConfirmModal({
      title: 'Seed Stats',
      message: 'Seed 30 days of dummy stats for this user?',
      onConfirm: async () => {
        try {
          const batch = [];
          for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            batch.push(addDoc(collection(db, 'userStats'), {
              userId,
              date: date.toISOString().split('T')[0],
              mitigations: Math.floor(Math.random() * 5000) + 1000,
              uptime: 99.9,
              requests: Math.floor(Math.random() * 100000) + 50000
            }));
          }
          await Promise.all(batch);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'userStats');
        }
      }
    });
  };

  const handleGenerateQuote = async () => {
    if (!generatingQuote) return;
    const { clientEmail, planName, amount, requirements } = generatingQuote;
    if (!clientEmail || !planName || isNaN(amount)) return;
    
    const user = users.find(u => u.email === clientEmail);
    if (!user) {
      setToast({ message: 'User not found. Please ensure they have an account.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'quotes'), {
        clientId: user.uid,
        clientName: user.name,
        clientEmail: user.email,
        planName,
        amount,
        requirements: requirements || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setGeneratingQuote(null);
      setToast({ message: 'Quote generated successfully!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'quotes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailModal || !emailModal.subject || !emailModal.content) return;
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailModal.to,
          subject: emailModal.subject,
          content: emailModal.content,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await addDoc(collection(db, 'emailLogs'), {
          to: emailModal.to,
          subject: emailModal.subject,
          content: emailModal.content,
          sentAt: new Date().toISOString(),
          status: 'sent',
          type: 'outbound'
        });
        setToast({ message: 'Email sent and logged successfully!', type: 'success' });
        setEmailModal(null);
      } else {
        await addDoc(collection(db, 'emailLogs'), {
          to: emailModal.to,
          subject: emailModal.subject,
          content: emailModal.content,
          sentAt: new Date().toISOString(),
          status: 'failed',
          type: 'outbound',
          error: result.message
        });
        setToast({ message: `Failed to send email: ${result.message}`, type: 'error' });
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setToast({ message: 'An error occurred while sending the email.', type: 'error' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteEmailLog = async (id: string) => {
    setConfirmModal({
      title: 'Delete Email Log',
      message: 'Are you sure you want to delete this email log?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'emailLogs', id));
          setToast({ message: 'Email log deleted successfully!', type: 'success' });
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `emailLogs/${id}`);
        }
      }
    });
  };

  const handleDeleteUser = async (uid: string) => {
    setConfirmModal({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This will NOT delete their auth account.',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', uid));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
        }
      }
    });
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    setIsUpdatingUser(true);
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleSaveOrderDetails = async () => {
    if (!editingOrder) return;
    setIsSaving(true);
    try {
      const orderRef = doc(db, 'orders', editingOrder.id);
      await updateDoc(orderRef, {
        status: editingOrder.status,
        siteUrl: editingOrder.siteUrl || '',
        adminUrl: editingOrder.adminUrl || '',
        progressionUpdates: editingOrder.progressionUpdates || []
      });
      setEditingOrder(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${editingOrder.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProgressionUpdate = () => {
    if (!editingOrder || !newUpdate.trim()) return;
    
    const update: ProgressionUpdate = {
      message: newUpdate.trim(),
      timestamp: new Date().toISOString()
    };

    setEditingOrder({
      ...editingOrder,
      progressionUpdates: [...(editingOrder.progressionUpdates || []), update]
    });
    setNewUpdate('');
  };

  const handleDeleteOrder = async (id: string) => {
    setConfirmModal({
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'orders', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `orders/${id}`);
        }
      }
    });
  };

  const handleAddDemo = () => {
    setEditingDemo({ id: '', title: '', description: '', url: '', createdAt: '' });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setConfirmModal({
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'announcements', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
        }
      }
    });
  };

  const handleDeleteDemo = async (id: string) => {
    setConfirmModal({
      title: 'Delete Demo',
      message: 'Are you sure you want to delete this demo?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'demos', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `demos/${id}`);
        }
      }
    });
  };

  const handleDeleteDiscountCode = async (id: string) => {
    setConfirmModal({
      title: 'Delete Discount Code',
      message: 'Are you sure you want to delete this discount code?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'discountCodes', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `discountCodes/${id}`);
        }
      }
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'payment'), eftDetails);
      setToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (err) {
      // If it doesn't exist, create it
      try {
        await setDoc(doc(db, 'settings', 'payment'), eftDetails);
        setToast({ message: 'Settings saved successfully!', type: 'success' });
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.UPDATE, 'settings/payment');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'email'), emailSettings);
      setToast({ message: 'Email settings saved successfully!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedPlans = async () => {
    setConfirmModal({
      title: 'Seed Plans',
      message: 'This will seed the database with the initial plans. Existing plans with the same IDs will be overwritten.',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          for (const plan of PLANS) {
            await setDoc(doc(db, 'plans', plan.id), plan);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'plans');
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const handleDeletePlan = async (id: string) => {
    console.log('Attempting to delete plan:', id);
    setConfirmModal({
      title: 'Delete Plan',
      message: 'Are you sure you want to delete this plan? This may affect existing orders.',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'plans', id));
          setToast({ message: 'Plan deleted successfully!', type: 'success' });
        } catch (err) {
          console.error('Delete plan error:', err);
          handleFirestoreError(err, OperationType.DELETE, `plans/${id}`);
        }
      }
    });
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setIsSaving(true);
    try {
      if (editingPlan.id) {
        const planRef = doc(db, 'plans', editingPlan.id);
        const { id, ...planData } = editingPlan;
        await updateDoc(planRef, planData);
      } else {
        const newPlanId = editingPlan.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'plans', newPlanId), {
          ...editingPlan,
          id: newPlanId
        });
      }
      setEditingPlan(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `plans/${editingPlan.id || 'new'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDemo = async () => {
    if (!editingDemo) return;
    setIsSaving(true);
    try {
      if (editingDemo.id) {
        const demoRef = doc(db, 'demos', editingDemo.id);
        const { id, ...demoData } = editingDemo;
        await updateDoc(demoRef, demoData);
      } else {
        await addDoc(collection(db, 'demos'), {
          ...editingDemo,
          createdAt: new Date().toISOString()
        });
      }
      setEditingDemo(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `demos/${editingDemo.id || 'new'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!editingAnnouncement) return;
    setIsSaving(true);
    try {
      if (editingAnnouncement.id) {
        await updateDoc(doc(db, 'announcements', editingAnnouncement.id), {
          title: editingAnnouncement.title,
          content: editingAnnouncement.content
        });
      } else {
        await addDoc(collection(db, 'announcements'), {
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          createdAt: new Date().toISOString()
        });
      }
      setEditingAnnouncement(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'announcements');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDiscountCode = async () => {
    if (!editingDiscountCode) return;
    setIsSaving(true);
    try {
      const codeData = {
        code: editingDiscountCode.code.toUpperCase(),
        percentage: Number(editingDiscountCode.percentage),
        active: editingDiscountCode.active ?? true,
        expiresAt: editingDiscountCode.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      if ((editingDiscountCode as any).id) {
        await updateDoc(doc(db, 'discountCodes', (editingDiscountCode as any).id), codeData);
      } else {
        await addDoc(collection(db, 'discountCodes'), {
          ...codeData,
          createdAt: new Date().toISOString()
        });
      }
      setEditingDiscountCode(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'discountCodes');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'in-progress': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'pending': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'cancelled': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-zinc-500 bg-zinc-50 border-zinc-100';
    }
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'servicing', label: 'Servicing', icon: Mail },
    { id: 'marketing', label: 'Marketing', icon: TrendingUp },
    { id: 'plans', label: 'Plans', icon: Database },
    { id: 'demos', label: 'Demos', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center">
            <LayoutDashboard className="w-8 h-8 mr-3 text-emerald-600" />
            Admin Control Panel
          </h1>
          <p className="text-zinc-600 mt-1">Manage your entire platform from one place.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-sm flex items-center">
            <Database className="w-4 h-4 mr-2 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-600">{orders.length} Orders</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
                : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-emerald-400' : 'text-zinc-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'servicing' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 p-12 rounded-[40px] text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Mail className="w-48 h-48" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-4xl font-black mb-4 tracking-tight">CSR Servicing Center</h2>
                <p className="text-zinc-400 text-lg mb-8">Manage real-time customer support, chat history, and agent performance from our dedicated servicing portal.</p>
                <button 
                  onClick={() => navigate('/servicing')}
                  className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all flex items-center shadow-xl shadow-emerald-500/20"
                >
                  Open Servicing Portal <ExternalLink className="w-5 h-5 ml-3" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Live Chats</h3>
                <p className="text-zinc-500 text-sm mb-4">Monitor active conversations between agents and customers.</p>
                <div className="text-3xl font-black text-zinc-900">Active</div>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Agent Logs</h3>
                <p className="text-zinc-500 text-sm mb-4">Track CSR activity, response times, and resolution rates.</p>
                <div className="text-3xl font-black text-zinc-900">Logged</div>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Security</h3>
                <p className="text-zinc-500 text-sm mb-4">Encrypted communication logs for compliance and auditing.</p>
                <div className="text-3xl font-black text-zinc-900">Secure</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-zinc-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-emerald-600" />
                System Settings
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Payment Settings */}
              <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Payment (EFT) Details</h3>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bank Name</label>
                    <input 
                      type="text"
                      value={eftDetails.bankName}
                      onChange={(e) => setEftDetails({...eftDetails, bankName: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Holder</label>
                    <input 
                      type="text"
                      value={eftDetails.accountHolder}
                      onChange={(e) => setEftDetails({...eftDetails, accountHolder: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Number</label>
                    <input 
                      type="text"
                      value={eftDetails.accountNumber}
                      onChange={(e) => setEftDetails({...eftDetails, accountNumber: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Branch Code</label>
                    <input 
                      type="text"
                      value={eftDetails.branchCode}
                      onChange={(e) => setEftDetails({...eftDetails, branchCode: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Instructions</label>
                  <textarea 
                    value={eftDetails.instructions}
                    onChange={(e) => setEftDetails({...eftDetails, instructions: e.target.value})}
                    rows={3}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center shadow-lg shadow-zinc-200"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Payment Details'}
                </button>
              </div>

              {/* Email Settings */}
              <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Email (SMTP) Configuration</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SMTP Host</label>
                    <input 
                      type="text"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SMTP Port</label>
                    <input 
                      type="text"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SMTP User</label>
                    <input 
                      type="text"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SMTP Password</label>
                    <input 
                      type="password"
                      value={emailSettings.smtpPass}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPass: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sender Email</label>
                    <input 
                      type="email"
                      value={emailSettings.senderEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, senderEmail: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sender Name</label>
                    <input 
                      type="text"
                      value={emailSettings.senderName}
                      onChange={(e) => setEmailSettings({...emailSettings, senderName: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveEmailSettings}
                  disabled={isSaving}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center shadow-lg shadow-zinc-200"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Email Configuration'}
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'crm' && (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-3xl font-black text-zinc-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-emerald-600" />
                Customer Relationship Management
              </h2>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search clients by name or email..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                  <div key={user.uid} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <User className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-zinc-900">{user.name}</h3>
                          <p className="text-zinc-500 text-sm font-medium">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                              {user.role}
                            </span>
                            {user.company && (
                              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                {user.company}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setEmailModal({ to: user.email, subject: `Regarding your project at Mzansi Web`, content: `Hi ${user.name},\n\n` })}
                          className="p-3 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                          title="Send Email"
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setEditingUser(user)}
                          className="p-3 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-3 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                <div className="bg-zinc-900 p-8 rounded-[40px] text-white shadow-2xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-emerald-400" />
                    CRM Insights
                  </h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-zinc-400 text-sm font-medium">Total Clients</span>
                      <span className="text-2xl font-black">{users.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-zinc-400 text-sm font-medium">Active Proposals</span>
                      <span className="text-2xl font-black">{quotes.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-zinc-400 text-sm font-medium">Conversion Rate</span>
                      <span className="text-2xl font-black">24%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
                  <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center">
                    <Mail className="w-6 h-6 mr-2 text-emerald-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {emailLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-2xl hover:bg-zinc-50 transition-colors">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 line-clamp-1">{log.subject}</p>
                          <p className="text-[10px] text-zinc-500">To: {log.to}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                <Package className="w-6 h-6 mr-2 text-emerald-600" />
                Customer Orders
              </h2>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {orders.map(order => (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold text-zinc-400">#{order.id.slice(0, 8)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-zinc-900">{order.clientId.slice(0, 8)}...</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold px-2 py-1 bg-zinc-100 rounded-md text-zinc-600 uppercase">{order.planId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                              {order.status.replace('-', ' ')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-zinc-900">R{order.amount}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => setEditingOrder(order)}
                                className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                title="Edit Order"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Detailed Order View */}
                        <tr className="bg-zinc-50/30">
                          <td colSpan={6} className="px-6 py-4 border-t border-zinc-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div className="flex items-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                  <Info className="w-3 h-3 mr-2" /> Project Requirements
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white p-3 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Platform</p>
                                    <p className="text-sm font-medium text-zinc-700">{order.requirements?.platform || 'Standard'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Gateway</p>
                                    <p className="text-sm font-medium text-zinc-700">{order.requirements?.paymentGateway || 'None'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Security</p>
                                    <p className="text-sm font-medium text-zinc-700">{order.requirements?.securityLevel || 'Standard'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold">CSR Agents</p>
                                    <p className="text-sm font-medium text-zinc-700">{order.requirements?.csrAgents || 'None'}</p>
                                  </div>
                                </div>
                                {order.requirements?.specifics && (
                                  <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Specific Requirements</p>
                                    <p className="text-xs text-zinc-600 leading-relaxed">{order.requirements.specifics}</p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center text-xs font-bold text-emerald-600 uppercase tracking-widest">
                                  <Zap className="w-3 h-3 mr-2" /> AI Generated Blueprint
                                </div>
                                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden group">
                                  {order.aiVisionImage && (
                                    <div className="aspect-video w-full overflow-hidden border-b border-emerald-100">
                                      <img 
                                        src={order.aiVisionImage} 
                                        alt="AI Vision Blueprint" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  )}
                                  <div className="p-4">
                                    {order.aiVision ? (
                                      <p className="text-xs text-emerald-800 italic leading-relaxed font-medium">"{order.aiVision}"</p>
                                    ) : (
                                      <p className="text-xs text-zinc-400 italic leading-relaxed">No AI vision generated yet.</p>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                                  <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Original Design Brief</p>
                                  <p className="text-xs text-zinc-600 leading-relaxed">{order.designBrief}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                <Users className="w-6 h-6 mr-2 text-emerald-600" />
                Registered Users
              </h2>
            </div>
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {users.map(user => (
                      <tr key={user.uid} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3">
                              <Users className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-900">{user.name}</div>
                              <div className="text-xs text-zinc-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                            user.role === 'admin' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-zinc-400 hover:text-emerald-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 text-zinc-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                <Database className="w-6 h-6 mr-2 text-emerald-600" />
                Subscription Plans
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleSeedPlans}
                  disabled={isSaving}
                  className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-all text-xs font-bold flex items-center"
                >
                  <Zap className="w-3 h-3 mr-2" /> Seed Initial Plans
                </button>
                <button 
                  onClick={() => setEditingPlan({ 
                    id: '', 
                    name: '', 
                    price: 0, 
                    monthlyFee: 0,
                    managementFee: 0,
                    securityFee: 0,
                    description: '', 
                    features: [], 
                    targetAudience: '' 
                  })}
                  className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Plan
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-zinc-900">{plan.name}</h3>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <p className="text-2xl font-black text-emerald-600">R{plan.price}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Once-off</p>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-sm font-bold text-zinc-900">R{plan.monthlyFee + (plan.managementFee || 0) + (plan.securityFee || 0)}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Per Month</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setEditingPlan(plan)}
                        className="p-2 text-zinc-400 hover:text-emerald-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-zinc-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{plan.description}</p>
                  <div className="space-y-2">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center text-xs text-zinc-500">
                        <CheckCircle className="w-3 h-3 mr-2 text-emerald-500" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-12">
            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600">+12%</span>
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Total Quotes</p>
                <p className="text-3xl font-black text-zinc-900 mt-1">{quotes.length}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-600">Active</span>
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Emails Sent</p>
                <p className="text-3xl font-black text-zinc-900 mt-1">{emailLogs.length}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 rounded-2xl">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-amber-600">High</span>
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Conversion Rate</p>
                <p className="text-3xl font-black text-zinc-900 mt-1">24%</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Quotes Management */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-emerald-600" />
                    Quotes & Proposals
                  </h2>
                  <button 
                    onClick={() => setGeneratingQuote({ clientEmail: '', planName: '', amount: 0, requirements: '' })}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" /> New Quote
                  </button>
                </div>
                <div className="space-y-4">
                  {quotes.length > 0 ? quotes.map(quote => (
                    <div key={quote.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-zinc-900">{quote.planName}</h3>
                          <p className="text-xs text-zinc-500">{quote.clientName} ({quote.clientEmail})</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          quote.status === 'sent' ? 'bg-blue-50 text-blue-600' : 
                          quote.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-xl font-black text-zinc-900">R{quote.amount.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEmailModal({ to: quote.clientEmail, subject: `Quote for ${quote.planName}`, content: `Hi ${quote.clientName},\n\nHere is your quote for ${quote.planName}.\n\nRequirements: ${quote.requirements}\n\nAmount: R${quote.amount}\n\n` })}
                            className="p-2 text-zinc-400 hover:text-emerald-600"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                title: 'Delete Quote',
                                message: 'Are you sure you want to delete this quote?',
                                isDanger: true,
                                onConfirm: async () => {
                                  try {
                                    await deleteDoc(doc(db, 'quotes', quote.id));
                                  } catch (err) {
                                    handleFirestoreError(err, OperationType.DELETE, `quotes/${quote.id}`);
                                  }
                                }
                              });
                            }}
                            className="p-2 text-zinc-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 text-zinc-400">
                      No quotes generated yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Email Tracking */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                    <Mail className="w-6 h-6 mr-2 text-emerald-600" />
                    Email Communications
                  </h2>
                </div>
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="divide-y divide-zinc-100">
                    {emailLogs.length > 0 ? emailLogs.map(log => (
                      <div key={log.id} className="p-4 hover:bg-zinc-50 transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-zinc-900">{log.subject}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              log.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 
                              log.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600'
                            }`}>
                              {log.status}
                            </span>
                            <button 
                              onClick={() => handleDeleteEmailLog(log.id)}
                              className="p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 mb-2">To: {log.to}</p>
                        <p className="text-[10px] text-zinc-400">{format(new Date(log.sentAt), 'PPP p')}</p>
                      </div>
                    )) : (
                      <div className="p-12 text-center text-zinc-400">
                        No emails tracked yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Announcements & Discounts */}
            <div className="grid lg:grid-cols-2 gap-12 pt-12 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                  <Bell className="w-6 h-6 mr-2 text-emerald-600" />
                  Announcements
                </h2>
                <button 
                  onClick={() => setEditingAnnouncement({ id: '', title: '', content: '', createdAt: '' })}
                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-zinc-900">{ann.title}</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setEditingAnnouncement(ann)}
                          className="text-zinc-400 hover:text-emerald-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="text-zinc-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-zinc-600 text-sm leading-relaxed mb-4">{ann.content}</p>
                    <div className="text-xs text-zinc-400 font-medium">
                      {format(new Date(ann.createdAt), 'PPP')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Codes */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                  <Tag className="w-6 h-6 mr-2 text-emerald-600" />
                  Discount Codes
                </h2>
                <button 
                  onClick={() => setEditingDiscountCode({ code: '', percentage: 0, active: true, expiresAt: '' })}
                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {discountCodes.map(code => (
                  <div key={code.code} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="font-mono font-bold text-zinc-900 mr-2">{code.code}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          code.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {code.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-emerald-600 font-bold mt-1">{code.percentage}% OFF</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => setEditingDiscountCode(code as any)}
                        className="text-zinc-400 hover:text-emerald-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiscountCode((code as any).id)}
                        className="text-zinc-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'demos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                <Globe className="w-6 h-6 mr-2 text-emerald-600" />
                Showcase Demos
              </h2>
              <button 
                onClick={handleAddDemo}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Demo
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {demos.map(demo => (
                <div key={demo.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-zinc-900">{demo.title}</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setEditingDemo(demo)}
                        className="p-2 text-zinc-400 hover:text-emerald-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDemo(demo.id)}
                        className="p-2 text-zinc-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{demo.description}</p>
                  <a href={demo.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 text-xs font-bold flex items-center hover:underline">
                    View Demo <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Edit User Role</h3>
                <p className="text-xs text-zinc-500 mt-1">{editingUser.name}</p>
              </div>
              <button onClick={() => setEditingUser(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Role</label>
                  <select
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-sm font-medium"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  >
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                    <option value="csr">CSR Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Company</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-sm font-medium"
                    value={editingUser.company || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Phone</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-sm font-medium"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Address</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-sm font-medium"
                    value={editingUser.address || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Context / Project Info</label>
                <textarea
                  className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-sm font-medium min-h-[100px]"
                  value={editingUser.context || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, context: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Internal Admin Notes</label>
                <textarea
                  className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-sm font-medium min-h-[100px]"
                  value={editingUser.notes || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <button 
                  onClick={() => handleSeedStats(editingUser.uid)}
                  className="w-full py-3 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center"
                >
                  <BarChart3 className="w-4 h-4 mr-2" /> Seed 30-Day Dashboard Stats
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-4 rounded-2xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateUser(editingUser.uid, { 
                    role: editingUser.role,
                    company: editingUser.company || '',
                    phone: editingUser.phone || '',
                    address: editingUser.address || '',
                    context: editingUser.context || '',
                    notes: editingUser.notes || ''
                  })}
                  disabled={isUpdatingUser}
                  className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {isUpdatingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Edit Order Details</h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">#{editingOrder.id}</p>
              </div>
              <button onClick={() => setEditingOrder(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Status & URLs */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Order Status</label>
                  <select 
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value as any})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Live Site URL</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="url"
                      value={editingOrder.siteUrl || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, siteUrl: e.target.value})}
                      placeholder="https://example.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Admin Dashboard URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="url"
                      value={editingOrder.adminUrl || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, adminUrl: e.target.value})}
                      placeholder="https://example.com/admin"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Progression Updates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center">
                    <Zap className="w-3 h-3 mr-1 text-emerald-600" />
                    Progression Timeline
                  </label>
                  <span className="text-[10px] font-bold text-zinc-400">{editingOrder.progressionUpdates?.length || 0} Updates</span>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    placeholder="Add a new update message..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProgressionUpdate()}
                  />
                  <button 
                    onClick={handleAddProgressionUpdate}
                    disabled={!newUpdate.trim()}
                    className="bg-zinc-900 text-white px-6 rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-3 mt-4">
                  {editingOrder.progressionUpdates && editingOrder.progressionUpdates.length > 0 ? (
                    editingOrder.progressionUpdates.slice().reverse().map((update, i) => (
                      <div key={i} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex justify-between items-start group">
                        <div className="space-y-1">
                          <p className="text-sm text-zinc-800">{update.message}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">
                            {format(new Date(update.timestamp), 'PPP p')}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const updates = [...(editingOrder.progressionUpdates || [])];
                            updates.splice(editingOrder.progressionUpdates!.length - 1 - i, 1);
                            setEditingOrder({...editingOrder, progressionUpdates: updates});
                          }}
                          className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
                      <Info className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-400">No progression updates yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-3">
              <button 
                onClick={() => setEditingOrder(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveOrderDetails}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{editingPlan.id ? 'Edit Plan' : 'Add New Plan'}</h3>
                {editingPlan.id && <p className="text-xs text-zinc-500 font-mono mt-1">ID: {editingPlan.id}</p>}
              </div>
              <button onClick={() => setEditingPlan(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan Name</label>
                  <input 
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Price (R)</label>
                  <input 
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Monthly Fee (R)</label>
                  <input 
                    type="number"
                    value={editingPlan.monthlyFee}
                    onChange={(e) => setEditingPlan({...editingPlan, monthlyFee: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Management Fee (R)</label>
                  <input 
                    type="number"
                    value={editingPlan.managementFee}
                    onChange={(e) => setEditingPlan({...editingPlan, managementFee: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Security Fee (R)</label>
                  <input 
                    type="number"
                    value={editingPlan.securityFee}
                    onChange={(e) => setEditingPlan({...editingPlan, securityFee: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                    rows={3}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Audience</label>
                  <input 
                    type="text"
                    value={editingPlan.targetAudience}
                    onChange={(e) => setEditingPlan({...editingPlan, targetAudience: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Features (One per line)</label>
                  <textarea 
                    value={editingPlan.features.join('\n')}
                    onChange={(e) => setEditingPlan({...editingPlan, features: e.target.value.split('\n').filter(f => f.trim())})}
                    rows={5}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Demo URL (Optional)</label>
                  <input 
                    type="url"
                    value={editingPlan.demoUrl || ''}
                    onChange={(e) => setEditingPlan({...editingPlan, demoUrl: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-3">
              <button 
                onClick={() => setEditingPlan(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePlan}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> {editingPlan.id ? 'Save Changes' : 'Add Plan'}
                  </>
                )}
              </button>
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

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmModal.isDanger ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{confirmModal.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-4 rounded-2xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Quote Modal */}
      {generatingQuote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-xl font-bold text-zinc-900">Generate New Quote</h3>
              <button onClick={() => setGeneratingQuote(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Client Email</label>
                <input 
                  type="email"
                  value={generatingQuote.clientEmail}
                  onChange={(e) => setGeneratingQuote({...generatingQuote, clientEmail: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan Name</label>
                <input 
                  type="text"
                  value={generatingQuote.planName}
                  onChange={(e) => setGeneratingQuote({...generatingQuote, planName: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="e.g. Custom Business Solution"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount (R)</label>
                <input 
                  type="number"
                  value={generatingQuote.amount}
                  onChange={(e) => setGeneratingQuote({...generatingQuote, amount: Number(e.target.value)})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Requirements</label>
                <textarea 
                  value={generatingQuote.requirements}
                  onChange={(e) => setGeneratingQuote({...generatingQuote, requirements: e.target.value})}
                  rows={4}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  placeholder="Describe the scope of work..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setGeneratingQuote(null)} className="flex-1 py-3 rounded-xl border border-zinc-200 font-bold text-zinc-600">Cancel</button>
                <button onClick={handleGenerateQuote} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {isSaving ? 'Generating...' : 'Generate Quote'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-xl font-bold text-zinc-900">{editingAnnouncement.id ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setEditingAnnouncement(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                <input 
                  type="text"
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Content</label>
                <textarea 
                  value={editingAnnouncement.content}
                  onChange={(e) => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})}
                  rows={4}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingAnnouncement(null)} className="flex-1 py-3 rounded-xl border border-zinc-200 font-bold text-zinc-600">Cancel</button>
                <button onClick={handleSaveAnnouncement} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Discount Code Modal */}
      {editingDiscountCode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-xl font-bold text-zinc-900">{(editingDiscountCode as any).id ? 'Edit Discount' : 'New Discount'}</h3>
              <button onClick={() => setEditingDiscountCode(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Code</label>
                <input 
                  type="text"
                  value={editingDiscountCode.code}
                  onChange={(e) => setEditingDiscountCode({...editingDiscountCode, code: e.target.value.toUpperCase()})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="e.g. SUMMER20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Percentage Off (%)</label>
                <input 
                  type="number"
                  value={editingDiscountCode.percentage}
                  onChange={(e) => setEditingDiscountCode({...editingDiscountCode, percentage: Number(e.target.value)})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox"
                  checked={editingDiscountCode.active}
                  onChange={(e) => setEditingDiscountCode({...editingDiscountCode, active: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label className="text-sm font-bold text-zinc-700">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingDiscountCode(null)} className="flex-1 py-3 rounded-xl border border-zinc-200 font-bold text-zinc-600">Cancel</button>
                <button onClick={handleSaveDiscountCode} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Demo Modal */}
      {editingDemo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{editingDemo.id ? 'Edit Demo' : 'Add New Demo'}</h3>
                {editingDemo.id && <p className="text-xs text-zinc-500 font-mono mt-1">ID: {editingDemo.id}</p>}
              </div>
              <button onClick={() => setEditingDemo(null)}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Demo Title</label>
                  <input 
                    type="text"
                    value={editingDemo.title}
                    onChange={(e) => setEditingDemo({...editingDemo, title: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="e.g. E-commerce Platform"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Demo URL</label>
                  <input 
                    type="url"
                    value={editingDemo.url}
                    onChange={(e) => setEditingDemo({...editingDemo, url: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="https://demo.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={editingDemo.description}
                    onChange={(e) => setEditingDemo({...editingDemo, description: e.target.value})}
                    rows={4}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                    placeholder="Describe the features and purpose of this demo..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Image URL (Optional)</label>
                  <input 
                    type="url"
                    value={editingDemo.imageUrl || ''}
                    onChange={(e) => setEditingDemo({...editingDemo, imageUrl: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-3">
              <button 
                onClick={() => setEditingDemo(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDemo}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> {editingDemo.id ? 'Save Changes' : 'Add Demo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="text-2xl font-black text-zinc-900">Compose Email</h3>
                <p className="text-zinc-500 text-sm font-medium">Sending to: {emailModal.to}</p>
              </div>
              <button onClick={() => setEmailModal(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-400 hover:text-zinc-600" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Subject</label>
                <input
                  type="text"
                  className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal({ ...emailModal, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Message Content</label>
                <textarea
                  className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium min-h-[250px]"
                  value={emailModal.content}
                  onChange={(e) => setEmailModal({ ...emailModal, content: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEmailModal(null)}
                  className="flex-1 py-5 rounded-2xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="flex-1 py-5 rounded-2xl bg-emerald-600 text-white font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-6 h-6 mr-2" />
                      Send & Log
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
