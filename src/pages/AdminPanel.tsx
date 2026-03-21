import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, deleteDoc, Timestamp, where, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, Announcement, Demo, ProgressionUpdate, UserProfile, Plan, DiscountCode } from '../types';
import { 
  Package, Bell, Globe, Plus, Trash2, Edit3, Save, X, 
  CheckCircle, Clock, AlertCircle, ExternalLink, Zap, 
  Link as LinkIcon, Info, LayoutDashboard, Database, Users,
  Tag, Calendar, ChevronRight, Search, CreditCard, Settings
} from 'lucide-react';
import { format } from 'date-fns';

type TabType = 'orders' | 'users' | 'plans' | 'marketing' | 'demos' | 'settings';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [eftDetails, setEftDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchCode: '',
    instructions: ''
  });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      setDiscountCodes(snapshot.docs.map(doc => ({ ...doc.data() } as DiscountCode)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'discountCodes'));

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'payment'), (snapshot) => {
      if (snapshot.exists()) {
        setEftDetails(snapshot.data() as any);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribePlans();
      unsubscribeAnnouncements();
      unsubscribeDemos();
      unsubscribeDiscounts();
      unsubscribeSettings();
    };
  }, []);

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
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${id}`);
    }
  };

  const handleAddAnnouncement = async () => {
    const title = prompt('Enter announcement title:');
    const content = prompt('Enter announcement content:');
    if (!title || !content) return;

    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    }
  };

  const handleAddDemo = async () => {
    const title = prompt('Enter demo title:');
    const description = prompt('Enter demo description:');
    const url = prompt('Enter demo URL:');
    if (!title || !description || !url) return;

    try {
      await addDoc(collection(db, 'demos'), {
        title,
        description,
        url,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'demos');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    }
  };

  const handleDeleteDemo = async (id: string) => {
    if (!confirm('Delete this demo?')) return;
    try {
      await deleteDoc(doc(db, 'demos', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `demos/${id}`);
    }
  };

  const handleAddDiscountCode = async () => {
    const code = prompt('Enter discount code (e.g. SAVE20):');
    const percentage = prompt('Enter discount percentage (e.g. 20):');
    if (!code || !percentage) return;

    try {
      await addDoc(collection(db, 'discountCodes'), {
        code: code.toUpperCase(),
        percentage: Number(percentage),
        active: true,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'discountCodes');
    }
  };

  const handleDeleteDiscountCode = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    try {
      // We need the document ID. In the map we used code.code as key, but we need the firestore doc id.
      // Let's update the snapshot to include ID.
      const q = query(collection(db, 'discountCodes'), where('code', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(doc(db, 'discountCodes', snap.docs[0].id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `discountCodes/${id}`);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'payment'), eftDetails);
      alert('Settings saved successfully!');
    } catch (err) {
      // If it doesn't exist, create it
      try {
        await setDoc(doc(db, 'settings', 'payment'), eftDetails);
        alert('Settings saved successfully!');
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.UPDATE, 'settings/payment');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan? This may affect existing orders.')) return;
    try {
      await deleteDoc(doc(db, 'plans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `plans/${id}`);
    }
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
        // For new plans, we need an ID. Let's use a slug or random ID if not provided
        const newPlanId = editingPlan.name.toLowerCase().replace(/\s+/g, '-');
        await addDoc(collection(db, 'plans'), {
          ...editingPlan,
          id: newPlanId // Firestore addDoc generates a random ID, but the Plan interface expects an 'id' field.
        });
      }
      setEditingPlan(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `plans/${editingPlan.id || 'new'}`);
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
    { id: 'users', label: 'Users', icon: Users },
    { id: 'plans', label: 'Plans', icon: Database },
    { id: 'marketing', label: 'Marketing', icon: Zap },
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
                      <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
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
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-zinc-400 hover:text-emerald-600"><Edit3 className="w-4 h-4" /></button>
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
              <button 
                onClick={() => setEditingPlan({ id: '', name: '', price: 0, description: '', features: [], targetAudience: '' })}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Plan
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-zinc-900">{plan.name}</h3>
                      <p className="text-2xl font-black text-emerald-600 mt-1">R{plan.price}</p>
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
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Announcements */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                  <Bell className="w-6 h-6 mr-2 text-emerald-600" />
                  Announcements
                </h2>
                <button 
                  onClick={handleAddAnnouncement}
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
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-zinc-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                  onClick={handleAddDiscountCode}
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
                    <button 
                      onClick={() => handleDeleteDiscountCode(code.code)}
                      className="text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                      <button className="p-2 text-zinc-400 hover:text-emerald-600"><Edit3 className="w-4 h-4" /></button>
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
        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Payment Settings</h2>
                  <p className="text-zinc-500 text-sm">Configure your EFT details for customer payments</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bank Name</label>
                  <input 
                    type="text"
                    value={eftDetails.bankName}
                    onChange={(e) => setEftDetails({...eftDetails, bankName: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. First National Bank"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Account Holder</label>
                  <input 
                    type="text"
                    value={eftDetails.accountHolder}
                    onChange={(e) => setEftDetails({...eftDetails, accountHolder: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. Design Agency PTY LTD"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Account Number</label>
                  <input 
                    type="text"
                    value={eftDetails.accountNumber}
                    onChange={(e) => setEftDetails({...eftDetails, accountNumber: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. 62812345678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Branch Code</label>
                  <input 
                    type="text"
                    value={eftDetails.branchCode}
                    onChange={(e) => setEftDetails({...eftDetails, branchCode: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. 250655"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Instructions</label>
                  <textarea 
                    value={eftDetails.instructions}
                    onChange={(e) => setEftDetails({...eftDetails, instructions: e.target.value})}
                    rows={4}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="e.g. Please use your Order Number as the payment reference. Send proof of payment to accounts@example.com"
                  />
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-zinc-100">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" /> Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
