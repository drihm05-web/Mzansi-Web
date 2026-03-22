import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, X, Minus, User, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'customer' | 'agent' | 'system';
}

export default function ChatWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('chatSessionId'));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'open' | 'active' | 'closed' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;

    const messagesQuery = query(
      collection(db, 'chatSessions', sessionId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `chatSessions/${sessionId}/messages`));

    const unsubscribeSession = onSnapshot(doc(db, 'chatSessions', sessionId), (doc) => {
      if (doc.exists()) {
        setSessionStatus(doc.data().status);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeSession();
    };
  }, [sessionId]);

  const handleStartChat = async () => {
    if (!user || !profile) {
      // For anonymous users, we could implement a guest name, but let's assume they must be logged in for now
      return;
    }

    setIsConnecting(true);
    try {
      // Check for existing open/active session
      const q = query(
        collection(db, 'chatSessions'),
        where('customerId', '==', user.uid),
        where('status', 'in', ['open', 'active']),
        limit(1)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        const sid = existing.docs[0].id;
        setSessionId(sid);
        localStorage.setItem('chatSessionId', sid);
        setIsConnecting(false);
        return;
      }

      const sessionRef = await addDoc(collection(db, 'chatSessions'), {
        customerId: user.uid,
        customerName: profile.name,
        customerEmail: user.email,
        status: 'open',
        lastMessage: 'Started a new chat',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'chatSessions', sessionRef.id, 'messages'), {
        senderId: 'system',
        senderName: 'System',
        text: 'Welcome to Mzansi Web Support! An agent will be with you shortly.',
        timestamp: new Date().toISOString(),
        type: 'system'
      });

      setSessionId(sessionRef.id);
      localStorage.setItem('chatSessionId', sessionRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chatSessions');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !newMessage.trim() || !user || !profile) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chatSessions', sessionId, 'messages'), {
        senderId: user.uid,
        senderName: profile.name,
        text: messageText,
        timestamp: new Date().toISOString(),
        type: 'customer'
      });

      await updateDoc(doc(db, 'chatSessions', sessionId), {
        lastMessage: messageText,
        lastMessageAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chatSessions/${sessionId}/messages`);
    }
  };

  if (!user) return null; // Only show for logged in users

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-[32px] shadow-2xl border border-zinc-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-zinc-900 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Support Chat</h3>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 custom-scrollbar">
            {!sessionId ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-6">
                <div className="w-16 h-16 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center text-zinc-400 shadow-sm">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Need help?</h4>
                  <p className="text-xs text-zinc-500 mt-1">Start a conversation with our support team.</p>
                </div>
                <button 
                  onClick={handleStartChat}
                  disabled={isConnecting}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Start Chat'}
                </button>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.type === 'system' ? 'justify-center' : msg.type === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.type === 'system' ? (
                      <div className="bg-zinc-200/50 text-zinc-500 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        {msg.text}
                      </div>
                    ) : (
                      <div className={`max-w-[85%] space-y-1 ${msg.type === 'customer' ? 'text-right' : 'text-left'}`}>
                        <div className={`p-3 rounded-2xl text-xs ${
                          msg.type === 'customer' 
                            ? 'bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <p className="text-[9px] text-zinc-400 font-medium">
                          {format(new Date(msg.timestamp), 'p')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {sessionId && sessionStatus !== 'closed' && (
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-zinc-900 text-white p-2 rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
          {sessionStatus === 'closed' && (
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Chat Closed</p>
              <button 
                onClick={() => { setSessionId(null); localStorage.removeItem('chatSessionId'); }}
                className="text-xs text-emerald-600 font-bold hover:underline mt-1"
              >
                Start New Chat
              </button>
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl hover:bg-zinc-800 transition-all hover:scale-110 active:scale-95 group relative"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
        </button>
      )}
    </div>
  );
}
