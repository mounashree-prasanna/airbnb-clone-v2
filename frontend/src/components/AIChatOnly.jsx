import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import AIService from '../services/AIConciergeService';
import ConciergeResults from './ConciergeResults';

const AIChatOnly = ({ travelerId }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Load previous chat history when opened
  useEffect(() => {
    if (open && travelerId) {
      AIService.getHistory(travelerId)
        .then((data) => {
          const formatted = data.map((m) => ({
            who: m.role === 'user' ? 'user' : 'assistant',
            text: m.content,
          }));
          setMessages(formatted);
        })
        .catch((err) => console.error('Error fetching chat history:', err));
    }
  }, [open, travelerId]);

  // Handle message send
  const handleSend = async () => {
    if (!input.trim() || !travelerId) return;
    const newMessages = [...messages, { who: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await AIService.sendMessage(travelerId, input);
      setMessages([...newMessages, { who: 'assistant', text: data.reply }]);
      if (data.itinerary) setResults(data.itinerary);
    } catch (err) {
      console.error('Chat send error:', err);
      setMessages([
        ...newMessages,
        { who: 'assistant', text: ' AI service not responding. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50"
        title="AI Concierge Chat"
      >
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 font-semibold flex justify-between items-center">
            <span>AI Concierge Chat</span>
            <button onClick={() => setOpen(false)}>
              <FiX size={18} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.length === 0 && !loading && (
              <p className="text-sm text-gray-400 text-center mt-6">
                👋 Hi there! Ask me to plan your next trip.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                    m.who === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-400 italic">AI is typing...</div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex border-t">
            <input
              type="text"
              className="flex-1 p-2 text-sm outline-none"
              placeholder="Type your travel request..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-purple-600 text-white px-4 text-sm hover:bg-purple-700 transition-colors"
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}

      {/* Itinerary Results */}
      {results && (
        <ConciergeResults results={results} onClose={() => setResults(null)} />
      )}
    </>
  );
};

export default AIChatOnly;
