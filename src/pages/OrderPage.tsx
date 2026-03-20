import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PLANS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, ArrowRight, CheckCircle2, Loader2, Tag, CreditCard, Copy, Check, Info, X } from 'lucide-react';

export default function OrderPage() {
  const { planId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const plan = PLANS.find(p => p.id === planId);

  const [designBrief, setDesignBrief] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<number>(0);
  const [discountStatus, setDiscountStatus] = useState<'valid' | 'invalid' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<{ id: string } | null>(null);
  const [eftDetails, setEftDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'payment'));
      if (snap.exists()) {
        setEftDetails(snap.data());
      }
    };
    fetchSettings();
  }, []);

  if (!plan) return <div className="p-20 text-center">Plan not found.</div>;

  const finalPrice = plan.price * (1 - discountApplied / 100);

  const applyDiscount = async () => {
    if (!discountCode) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'discountCodes'), where('code', '==', discountCode.toUpperCase()), where('active', '==', true));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDiscountApplied(snap.docs[0].data().percentage);
        setDiscountStatus('valid');
        setError('');
      } else {
        setError('Invalid or expired discount code.');
        setDiscountApplied(0);
        setDiscountStatus('invalid');
      }
    } catch (err) {
      console.error(err);
      setDiscountStatus('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        clientId: user.uid,
        planId: plan.id,
        status: 'pending',
        designBrief,
        amount: finalPrice,
        discountCode: discountApplied > 0 ? discountCode : null,
        createdAt: new Date().toISOString()
      });
      setSuccessOrder({ id: docRef.id });
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (successOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Order Received!</h1>
        <p className="text-zinc-600 text-lg mb-12">
          Thank you for choosing us. Your order <span className="font-mono font-bold text-zinc-900">#{successOrder.id.slice(0, 8)}</span> has been placed.
        </p>

        <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-xl text-left space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Payment Instructions</h3>
              <p className="text-zinc-500 text-sm">Please complete your EFT payment to start the design process</p>
            </div>
          </div>

          {eftDetails ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Bank Name</p>
                  <p className="font-bold text-zinc-900">{eftDetails.bankName}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Account Holder</p>
                  <p className="font-bold text-zinc-900">{eftDetails.accountHolder}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Account Number</p>
                  <p className="font-bold text-zinc-900">{eftDetails.accountNumber}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Branch Code</p>
                  <p className="font-bold text-zinc-900">{eftDetails.branchCode}</p>
                </div>
              </div>

              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2 flex items-center">
                  <Info className="w-3 h-3 mr-1" /> Payment Reference
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-emerald-900 font-mono">#{successOrder.id.slice(0, 8)}</p>
                  <button 
                    onClick={() => copyToClipboard(successOrder.id.slice(0, 8))}
                    className="flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? 'Copied' : 'Copy Ref'}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-sm text-zinc-600 leading-relaxed italic">
                  {eftDetails.instructions}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 italic">Loading payment details...</p>
          )}

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-2 gap-16">
        {/* Order Details */}
        <div className="space-y-10">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 mb-4">Complete Your Order</h1>
            <p className="text-zinc-600 text-lg">You've selected the <span className="font-bold text-zinc-900">{plan.name}</span>. Let's get started on your design.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Plan Summary</h3>
            <ul className="space-y-4 mb-8">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start text-sm text-zinc-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="pt-6 border-t border-zinc-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-500">Base Price</span>
                <span className="font-bold text-zinc-900">R{plan.price}</span>
              </div>
              {discountApplied > 0 && (
                <div className="flex justify-between items-center mb-2 text-emerald-600">
                  <span>Discount ({discountApplied}%)</span>
                  <span>-R{(plan.price * discountApplied / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                <span className="text-lg font-bold text-zinc-900">Total</span>
                <span className="text-3xl font-bold text-emerald-600">R{finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-start space-x-4">
            <Shield className="w-6 h-6 text-emerald-600 mt-1" />
            <div>
              <h4 className="font-bold text-emerald-900">Secure Payment</h4>
              <p className="text-emerald-800 text-sm">Once you submit your order, our team will contact you for payment processing via secure EFT or PayFast.</p>
            </div>
          </div>
        </div>

        {/* Design Brief Form */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-zinc-100">
          <form onSubmit={handleOrder} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-4 uppercase tracking-widest">Design Brief & Requirements</label>
              <textarea
                required
                value={designBrief}
                onChange={(e) => setDesignBrief(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-48 transition-all"
                placeholder="Tell us about your brand, colors, logo inspiration, and any specific features you need..."
              />
              <p className="text-xs text-zinc-400 mt-3 italic">Our designers will use this as a starting point for your first draft.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-4 uppercase tracking-widest">Discount Code</label>
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setDiscountStatus(null);
                    }}
                    className={`w-full pl-12 pr-12 py-4 rounded-2xl border ${
                      discountStatus === 'valid' ? 'border-emerald-500 bg-emerald-50/30' : 
                      discountStatus === 'invalid' ? 'border-red-500 bg-red-50/30' : 
                      'border-zinc-200'
                    } focus:border-emerald-500 outline-none transition-all`}
                    placeholder="ENTER CODE"
                  />
                  {discountStatus === 'valid' && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-in zoom-in duration-300" />
                  )}
                  {discountStatus === 'invalid' && (
                    <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 animate-in zoom-in duration-300" />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={applyDiscount}
                  disabled={loading || !discountCode}
                  className="bg-zinc-100 text-zinc-900 px-6 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Submit Order <ArrowRight className="ml-2 w-6 h-6" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
