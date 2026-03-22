import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Plan } from '../types';
import { motion } from 'motion/react';
import { Shield, ShieldCheck, Zap, Users, ArrowRight, CheckCircle2, Globe, Lock, Clock } from 'lucide-react';
import { PLANS, STATS } from '../constants';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setPlans(plansData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'plans');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 mb-6 border border-emerald-100">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Secure Web Solutions for South Africa
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold text-zinc-900 tracking-tight leading-[1.1] mb-8">
              Build Your Digital Empire with <span className="text-emerald-600 italic">Mzansi</span> Precision.
            </h1>
            <p className="text-lg text-zinc-600 mb-10 leading-relaxed">
              Premium web development tailored for the SA market. From startups in Braamfontein to enterprises in Sandton, we build secure, high-performance websites that withstand the toughest digital threats.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center"
              >
                Start Your Project <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <a 
                href="#plans"
                className="w-full sm:w-auto bg-white text-zinc-900 border border-zinc-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all text-center"
              >
                View Pricing
              </a>
            </div>
          </motion.div>
        </div>

        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full" />
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {STATS.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="mb-4 flex justify-center">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                    {stat.icon === 'Shield' && <Shield className="w-6 h-6 text-emerald-500" />}
                    {stat.icon === 'ShieldCheck' && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
                    {stat.icon === 'Zap' && <Zap className="w-6 h-6 text-emerald-500" />}
                    {stat.icon === 'Clock' && <Clock className="w-6 h-6 text-emerald-500" />}
                  </div>
                </div>
                <div className="text-4xl lg:text-5xl font-bold mb-2 text-emerald-400">{stat.value}</div>
                <div className="text-zinc-400 font-medium uppercase tracking-widest text-xs">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-32 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-bold text-zinc-900 mb-6 leading-tight">
                Enterprise-Grade Security <br />
                <span className="text-emerald-600">Standard on Every Plan.</span>
              </h2>
              <p className="text-zinc-600 mb-10 text-lg leading-relaxed">
                South Africa faces unique digital challenges. Our infrastructure is built to mitigate massive DDoS attacks and ensure your business stays online 24/7.
              </p>
              <div className="space-y-6">
                {[
                  { title: 'L3/L4/L7 DDoS Mitigation', desc: 'Real-time protection against volumetric and application-layer attacks.' },
                  { title: 'Local SA Hosting', desc: 'Ultra-low latency with servers located in Johannesburg and Cape Town.' },
                  { title: 'Daily Backups', desc: 'Your data is safe with automated off-site backups every 24 hours.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="mt-1 bg-emerald-100 p-2 rounded-lg">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{item.title}</h4>
                      <p className="text-zinc-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent)]" />
                <div className="p-8 h-full flex flex-col justify-center">
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-zinc-800 rounded-xl flex items-center px-4 border border-zinc-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-4 animate-pulse" />
                        <div className="h-2 w-32 bg-zinc-700 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-12 text-center">
                    <Lock className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <div className="text-emerald-500 font-mono text-sm tracking-widest uppercase">System Secure</div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Transparent Pricing</h2>
            <p className="text-zinc-600 text-lg">Choose the plan that fits your business goals. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : plans.length > 0 ? (
              plans.map((plan, i) => (
                <motion.div 
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative p-8 rounded-3xl border ${plan.id === 'business' ? 'border-emerald-500 shadow-xl ring-4 ring-emerald-500/5' : 'border-zinc-200'} bg-white flex flex-col`}
                >
                  {plan.id === 'business' && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                      Most Popular
                    </span>
                  )}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline mb-4">
                      <span className="text-4xl font-bold text-zinc-900">R{plan.price}</span>
                      <span className="text-zinc-500 ml-2">once-off</span>
                    </div>
                    <p className="text-zinc-600 text-sm leading-relaxed">{plan.description}</p>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start text-sm text-zinc-600">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-3">
                    <button 
                      onClick={() => navigate(`/order/${plan.id}`)}
                      className={`w-full py-4 rounded-2xl font-bold transition-all ${
                        plan.id === 'business' 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                          : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      Choose {plan.name}
                    </button>
                    {plan.demoUrl && (
                      <a 
                        href={plan.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-2xl font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all flex items-center justify-center text-sm"
                      >
                        <Globe className="w-4 h-4 mr-2" /> View Demo Site
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-zinc-500">
                No plans available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Custom Design Info */}
      <section className="py-32 bg-zinc-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-8">Custom Design Process</h2>
            <div className="grid sm:grid-cols-2 gap-12">
              {[
                { step: '01', title: 'Plan Selection', desc: 'Choose a base plan that matches your technical requirements.' },
                { step: '02', title: 'Design Brief', desc: 'Submit your brand colors, logo, and inspiration through our dashboard.' },
                { step: '03', title: 'Initial Draft', desc: 'Our designers create a tailored mockup within 48-72 hours.' },
                { step: '04', title: 'Revisions & Launch', desc: 'We refine the design based on your feedback and go live.' }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="text-6xl font-bold text-emerald-500/20 absolute -top-4 -left-4">{item.step}</div>
                  <h4 className="text-xl font-bold mb-2 relative z-10">{item.title}</h4>
                  <p className="text-zinc-400 relative z-10">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              <span className="text-lg font-bold text-zinc-900">Mzansi Web Solutions</span>
            </div>
            <div className="text-zinc-500 text-sm">
              © 2026 Mzansi Web Solutions. Built for South Africa.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">Twitter</a>
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">LinkedIn</a>
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
