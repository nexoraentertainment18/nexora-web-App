import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const HelpWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['my-feedback'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/feedback/my-feedback');
      return response.data;
    },
    enabled: isOpen && !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (msg) => {
      return axios.post('/api/v1/feedback', { message: msg });
    },
    onSuccess: () => {
      console.log("Feedback submitted successfully");
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      setMessage('');
    },
  });

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feedbacks, isOpen]);

  if (!user) return null; // Only show for logged in users

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("handleSubmit triggered with message:", message);
    if (message.trim()) {
      console.log("Mutating...");
      submitMutation.mutate(message, {
        onError: (err) => {
          console.error("Mutation failed!", err);
          if (err.response && err.response.data) {
            console.error("Backend Error Message:", err.response.data);
            alert("Error: " + JSON.stringify(err.response.data));
          }
        }
      });
    }
  };

  return (
    <>
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col h-[500px] max-h-[70vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center text-white">
            <div>
              <h3 className="font-bold text-lg leading-none">Support & Feedback</h3>
              <p className="text-[10px] text-purple-200 mt-1 uppercase tracking-wider">How can we help?</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-950/50 space-y-4">
            <div className="flex flex-col gap-1 items-start">
              <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm shadow-sm border border-slate-700/50 max-w-[85%]">
                Hi {user.firstName}! Let us know if you have any questions or feedback.
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center text-xs text-slate-500 py-4 animate-pulse">Loading previous chats...</div>
            ) : (
              (Array.isArray(feedbacks) ? feedbacks : []).slice().reverse().map((fb) => (
                <React.Fragment key={fb.id}>
                  {/* User Message */}
                  <div className="flex flex-col gap-1 items-end">
                    <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%]">
                      {fb.message}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Admin Reply */}
                  {fb.adminResponse && (
                    <div className="flex flex-col gap-1 items-start mt-2">
                      <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm shadow-sm border border-slate-700/50 max-w-[85%]">
                        {fb.adminResponse}
                      </div>
                      <span className="text-[10px] text-slate-500">Admin Response</span>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitMutation.isPending}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!message.trim() || submitMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white p-2.5 rounded-full transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Glowing Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full text-white shadow-xl transition-all duration-300 z-50 flex items-center gap-2
          ${isOpen ? 'bg-slate-800 hover:bg-slate-700 rotate-90 scale-90' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 animate-pulse shadow-purple-500/50'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <>
            <MessageCircle className="w-6 h-6" />
            <span className="font-bold text-sm tracking-wide pr-1">Help</span>
          </>
        )}
      </button>
    </>
  );
};

export default HelpWidget;
