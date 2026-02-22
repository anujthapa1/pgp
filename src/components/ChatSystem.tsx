import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Send, User as UserIcon, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const ChatSystem: React.FC<{ targetId?: string, onClose?: () => void }> = ({ targetId, onClose }) => {
  const { currentUser, messages, sendMessage, drivers, dispatchers } = useStore();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(targetId || null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const contacts = currentUser?.role === 'dispatcher' ? drivers : dispatchers;
  const currentChatMessages = messages.filter(m =>
    (m.senderId === currentUser?.id && m.receiverId === selectedContactId) ||
    (m.senderId === selectedContactId && m.receiverId === currentUser?.id)
  );

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [currentChatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && selectedContactId) {
      sendMessage(selectedContactId, inputText.trim());
      setInputText('');
    }
  };

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  return (
    <div className="flex h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Contacts List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
            <MessageSquare className="mr-2 text-primary-500" size={20} /> Messages
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={`w-full flex items-center p-3 rounded-2xl transition-all ${selectedContactId === contact.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-200' : 'hover:bg-white text-gray-600'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 font-bold ${selectedContactId === contact.id ? 'bg-white/20' : 'bg-gray-200'}`}>
                {contact.name.charAt(0)}
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-bold text-sm truncate">{contact.name}</p>
                <p className={`text-[10px] uppercase font-black tracking-widest ${selectedContactId === contact.id ? 'text-white/70' : 'text-gray-400'}`}>
                  {contact.id}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedContact ? (
          <>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-600">
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{selectedContact.name}</h4>
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" /> Online
                  </p>
                </div>
              </div>
              {onClose && <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X /></button>}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {currentChatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2 opacity-50">
                  <MessageSquare size={48} />
                  <p className="font-bold uppercase tracking-widest text-xs">No messages yet</p>
                </div>
              )}
              {currentChatMessages.map(msg => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm font-medium shadow-sm ${isMine ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                      {msg.text}
                      <p className={`text-[9px] mt-1 opacity-50 ${isMine ? 'text-right' : 'text-left'}`}>
                        {format(new Date(msg.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="p-5 border-t border-gray-100 flex space-x-3">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:border-primary-500 outline-none transition-all"
              />
              <button
                type="submit"
                className="bg-primary-500 p-4 rounded-2xl text-white shadow-lg shadow-primary-200 hover:bg-primary-600 transition active:scale-95"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-300">
            <div className="bg-gray-50 p-8 rounded-full mb-6">
              <UserIcon size={64} className="opacity-20" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Internal Comms</h3>
            <p className="text-gray-400 text-sm font-medium">Select a contact from the left to start chatting with your team.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;
