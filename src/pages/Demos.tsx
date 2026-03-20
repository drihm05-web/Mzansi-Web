import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Demo } from '../types';
import { Globe, ExternalLink, Loader2, ImageIcon, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function Demos() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'demos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDemos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Demo)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'demos'));
    return () => unsubscribe();
  }, []);

  const filteredDemos = demos.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4 tracking-tight"
          >
            Our Work <span className="text-emerald-600 italic serif">Showcase</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-600 text-lg max-w-2xl mx-auto"
          >
            Explore our collection of high-performance, secure websites built for businesses across South Africa.
          </motion.p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="relative w-full max-w-md">
            <input 
              type="text"
              placeholder="Search demos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
            <p className="text-zinc-500 font-medium">Loading our showcase...</p>
          </div>
        ) : filteredDemos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDemos.map((demo, index) => (
              <motion.div 
                key={demo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500"
              >
                <div className="relative h-56 overflow-hidden">
                  {demo.imageUrl ? (
                    <img 
                      src={demo.imageUrl} 
                      alt={demo.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-zinc-200" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <a 
                      href={demo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white text-zinc-900 px-6 py-2 rounded-full font-bold text-sm flex items-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> Live Preview
                    </a>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-emerald-600 transition-colors">{demo.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed mb-6 line-clamp-3">
                    {demo.description}
                  </p>
                  <div className="flex items-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <Globe className="w-4 h-4 mr-2 text-emerald-500" />
                    Verified Deployment
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-200">
            <Globe className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No demos found</h3>
            <p className="text-zinc-500">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
