import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Phone, Building, MapPin, Save, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-zinc-900 mb-2">Account Settings</h1>
        <p className="text-zinc-500 font-medium">Manage your personal information and business details.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm text-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner">
              <User className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{profile?.name}</h2>
            <p className="text-zinc-500 text-sm mb-4">{profile?.email}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              profile?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {profile?.role}
            </span>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[32px] text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold">Security Status</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your account is protected with enterprise-grade encryption and multi-factor authentication.
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="tel"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Company Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-zinc-400" />
                <textarea
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium min-h-[120px]"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-6 h-6 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {success && (
              <div className="flex items-center justify-center space-x-2 text-emerald-600 font-bold animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-5 h-5" />
                <span>Profile updated successfully!</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
