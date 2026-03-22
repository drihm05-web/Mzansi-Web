import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, Timestamp, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, User, Send, Clock, CheckCircle, Search, Filter, Trash2, Shield, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  agentId?: string;
  agentName?: string;
  status: 'open' | 'active' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'customer' | 'agent' | 'system';
}

export default function Servicing() {
  const { user, profile, isAdmin } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'active' | 'closed'>('all');

  useEffect(() => {
    if (!user || (profile?.role !== 'admin' && profile?.role !== 'csr')) return;

    let sessionsQuery = query(collection(db, 'chatSessions'), orderBy('lastMessageAt', 'desc'));
    
    if (filter !== 'all') {
      sessionsQuery = query(collection(db, 'chatSessions'), where('status', '==', filter), orderBy('lastMessageAt', 'desc'));
    }

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chatSessions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, filter]);

  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chatSessions', activeSession.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `chatSessions/${activeSession.id}/messages`));

    return () => unsubscribe();
  }, [activeSession]);

  const handlePickupChat = async (session: ChatSession) => {
    if (!user || !profile) return;
    try {
      await updateDoc(doc(db, 'chatSessions', session.id), {
        status: 'active',
        agentId: user.uid,
        agentName: profile.name,
        lastMessageAt: new Date().toISOString()
      });
      
      await addDoc(collection(db, 'chatSessions', session.id, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        text: `${profile.name} has joined the chat.`,
        timestamp: new Date().toISOString(),
        type: 'system'
      });

      setActiveSession({ ...session, status: 'active', agentId: user.uid, agentName: profile.name });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chatSessions/${session.id}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !newMessage.trim() || !user || !profile) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chatSessions', activeSession.id, 'messages'), {
        senderId: user.uid,
        senderName: profile.name,
        text: messageText,
        timestamp: new Date().toISOString(),
        type: 'agent'
      });

      await updateDoc(doc(db, 'chatSessions', activeSession.id), {
        lastMessage: messageText,
        lastMessageAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chatSessions/${activeSession.id}/messages`);
    }
  };

  const handleCloseChat = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'chatSessions', sessionId), {
        status: 'closed',
        lastMessageAt: new Date().toISOString()
      });
      
      await addDoc(collection(db, 'chatSessions', sessionId, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        text: `The chat has been closed.`,
        timestamp: new Date().toISOString(),
        type: 'system'
      });

      if (activeSession?.id === sessionId) {
        setActiveSession(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chatSessions/${sessionId}`);
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'csr') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-zinc-900">Access Denied</h1>
          <p className="text-zinc-600">You do not have permission to access the Servicing page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-emerald-600" />
            Servicing Dashboard
          </h1>
          <p className="text-zinc-600 mt-1">Manage live customer support chats and inquiries.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-sm flex items-center">
            <Clock className="w-4 h-4 mr-2 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-600">{sessions.filter(s => s.status === 'open').length} Open Chats</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
        {/* Chat List */}
        <div className="lg:col-span-4 flex flex-col space-y-4 h-full">
          <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search chats..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {(['all', 'open', 'active', 'closed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    filter === f 
                      ? 'bg-zinc-900 text-white' 
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {sessions
              .filter(s => s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || s.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(session => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  activeSession?.id === session.id 
                    ? 'bg-emerald-50 border-emerald-200 shadow-md' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-zinc-900 text-sm truncate">{session.customerName}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    session.status === 'open' ? 'bg-amber-100 text-amber-700' :
                    session.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate mb-2">{session.lastMessage}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {format(new Date(session.lastMessageAt), 'p')}
                  </span>
                  {session.agentName && (
                    <span className="text-[10px] text-zinc-400 italic">Agent: {session.agentName}</span>
                  )}
                </div>
              </button>
            ))}
            {sessions.length === 0 && !loading && (
              <div className="text-center py-12 text-zinc-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No chat sessions found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center text-zinc-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">{activeSession.customerName}</h3>
                    <p className="text-xs text-zinc-500">{activeSession.customerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activeSession.status === 'open' && (
                    <button 
                      onClick={() => handlePickupChat(activeSession)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      Pickup Chat
                    </button>
                  )}
                  {activeSession.status !== 'closed' && (
                    <button 
                      onClick={() => handleCloseChat(activeSession.id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Close Chat"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30 custom-scrollbar">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.type === 'system' ? 'justify-center' : msg.type === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.type === 'system' ? (
                      <div className="bg-zinc-200/50 text-zinc-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        {msg.text}
                      </div>
                    ) : (
                      <div className={`max-w-[80%] space-y-1 ${msg.type === 'agent' ? 'text-right' : 'text-left'}`}>
                        <div className={`p-4 rounded-2xl text-sm ${
                          msg.type === 'agent' 
                            ? 'bg-zinc-900 text-white rounded-tr-none shadow-lg shadow-zinc-200' 
                            : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {msg.senderName} • {format(new Date(msg.timestamp), 'p')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              {activeSession.status !== 'closed' && (
                <form onSubmit={handleSendMessage} className="p-6 border-t border-zinc-100 bg-white">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Type your message..."
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={activeSession.status === 'open'}
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || activeSession.status === 'open'}
                      className="bg-zinc-900 text-white p-4 rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xl shadow-zinc-200"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  {activeSession.status === 'open' && (
                    <p className="text-[10px] text-amber-600 font-bold mt-2 text-center uppercase tracking-widest">
                      Pickup this chat to start responding
                    </p>
                  )}
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-12 text-center">
              <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Select a Chat</h3>
              <p className="max-w-xs text-sm">Choose a conversation from the list to start assisting customers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
