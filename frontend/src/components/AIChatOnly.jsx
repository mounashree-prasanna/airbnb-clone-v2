import React, { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiSend, FiX, FiSun, FiCloud, FiCloudRain, FiMapPin, FiClock, FiDollarSign, FiStar, FiUmbrella, FiCheck } from 'react-icons/fi';
import { FaBaby, FaWheelchair } from 'react-icons/fa';
import { useAppSelector } from '../store/hooks';
import AIService from '../services/AIConciergeService';

const AIChatOnly = ({ travelerId }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Get bookings from Redux store if available
  const bookings = useAppSelector((state) => state.bookings?.items || []);
  
  // Get auth state to clear messages on logout
  const isAuthenticated = useAppSelector((state) => state.auth?.isAuthenticated ?? false);
  const currentUserId = useAppSelector((state) => state.auth?.userId ?? null);
  const previousTravelerIdRef = useRef(null);

  // Clear messages when user logs out or when a different user logs in
  useEffect(() => {
    // If user logs out (not authenticated)
    if (!isAuthenticated) {
      if (previousTravelerIdRef.current) {
        // Clear history from backend for the previous user
        AIService.clearHistory(previousTravelerIdRef.current).catch(() => {
          // Silently fail - not critical
        });
        previousTravelerIdRef.current = null;
      }
      setMessages([]);
      return;
    }

    // If user is authenticated and travelerId changed (different user logged in)
    if (isAuthenticated && travelerId && travelerId !== previousTravelerIdRef.current) {
      // Clear messages for the new user (they should start fresh)
      setMessages([]);
      // Clear history from backend for the previous user if exists
      if (previousTravelerIdRef.current) {
        AIService.clearHistory(previousTravelerIdRef.current).catch(() => {
          // Silently fail - not critical
        });
      }
      previousTravelerIdRef.current = travelerId;
    } else if (isAuthenticated && travelerId) {
      // Same user, just update the ref
      previousTravelerIdRef.current = travelerId;
    }
  }, [isAuthenticated, travelerId, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load previous chat history when opened
  useEffect(() => {
    if (open && travelerId && isAuthenticated) {
      AIService.getHistory(travelerId)
        .then((data) => {
          const formatted = data.map((m) => ({
            who: m.role === 'user' ? 'user' : 'assistant',
            text: m.content,
            itinerary: m.itinerary || null,
          }));
          setMessages(formatted);
        })
        .catch((err) => {
          if (err.response?.status && err.response.status !== 0) {
            console.error('Error fetching chat history:', err);
          }
        });
    }
  }, [open, travelerId, isAuthenticated]);

  // Handle message send
  const handleSend = async () => {
    if (!input.trim() || !travelerId) return;
    const newMessages = [...messages, { who: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Check if user is asking about bookings/history
      const messageLower = input.toLowerCase();
      const isBookingQuery = messageLower.includes('booking') || 
                            messageLower.includes('travel history') || 
                            messageLower.includes('recent booking') ||
                            messageLower.includes('my booking') ||
                            messageLower.includes('past booking');
      
      // Get most recent booking if available and user is asking about it
      const bookingContext = (isBookingQuery && bookings.length > 0) ? (() => {
        const booking = bookings[0];
        // Normalize dates to YYYY-MM-DD format (extract date part from ISO strings)
        const normalizeDate = (dateValue) => {
          if (!dateValue) return null;
          // If it's already a YYYY-MM-DD string, return as-is
          if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) {
            return dateValue.trim();
          }
          // If it's a string with time, extract just the date part
          if (typeof dateValue === 'string' && dateValue.includes('T')) {
            return dateValue.split('T')[0];
          }
          // If it's a Date object, format it using local date (not UTC)
          if (dateValue instanceof Date) {
            const year = dateValue.getFullYear();
            const month = String(dateValue.getMonth() + 1).padStart(2, '0');
            const day = String(dateValue.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          // Try to parse as date and format
          try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          } catch (e) {
            // Ignore parsing errors
          }
          return dateValue;
        };
        
        return {
          location: booking.location || booking.title,
          startDate: normalizeDate(booking.startDate || booking.start_date),
          endDate: normalizeDate(booking.endDate || booking.end_date),
          propertyId: booking.propertyId || booking.property_id
        };
      })() : null;

      const data = await AIService.sendMessage(travelerId, input, bookingContext);
      setMessages([...newMessages, { 
        who: 'assistant', 
        text: data.reply,
        itinerary: data.itinerary || null
      }]);
    } catch (err) {
      console.error('Chat send error:', err);
      const errorMessage = err.message || 'AI service not responding. Please try again.';
      setMessages([
        ...newMessages,
        { who: 'assistant', text: `❌ ${errorMessage}`, itinerary: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('sunny')) return <FiSun className="text-yellow-500" />;
    if (conditionLower.includes('cloudy')) return <FiCloud className="text-gray-500" />;
    if (conditionLower.includes('rain')) return <FiCloudRain className="text-blue-500" />;
    return <FiSun className="text-yellow-500" />;
  };

  const getPriceTierColor = (tier) => {
    switch (tier) {
      case '$': return 'text-green-600';
      case '$$': return 'text-yellow-600';
      case '$$$': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderItinerary = (itinerary) => {
    if (!itinerary) return null;

    return (
      <div className="mt-3 space-y-4 text-left">
        {/* Weather Info */}
        {itinerary.weather_info && itinerary.weather_info.forecast && itinerary.weather_info.forecast.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h4 className="text-sm font-semibold mb-2 flex items-center text-blue-800">
              <FiSun className="mr-2" />
              Weather Forecast
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {itinerary.weather_info.forecast.slice(0, 3).map((day, idx) => (
                <div key={idx} className="bg-white p-2 rounded text-center">
                  <div className="text-xs font-medium">{day.date}</div>
                  <div className="text-lg my-1">{getWeatherIcon(day.condition)}</div>
                  <div className="text-sm font-semibold">{day.temp}</div>
                  <div className="text-xs text-gray-600">{day.condition}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day-by-Day Plan */}
        {itinerary.day_by_day_plan && itinerary.day_by_day_plan.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-800">Day-by-Day Plan</h4>
            {itinerary.day_by_day_plan.map((day, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="font-medium text-yellow-800 mb-1">Morning</div>
                    {day.morning?.[0] && (
                      <div className="text-gray-700">
                        {day.morning[0].address ? (
                          <a href={day.morning[0].address} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                            {day.morning[0].title}
                          </a>
                        ) : (
                          <span>{day.morning[0].title}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="font-medium text-orange-800 mb-1">Afternoon</div>
                    {day.afternoon?.[0] && (
                      <div className="text-gray-700">
                        {day.afternoon[0].address ? (
                          <a href={day.afternoon[0].address} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                            {day.afternoon[0].title}
                          </a>
                        ) : (
                          <span>{day.afternoon[0].title}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="font-medium text-purple-800 mb-1">Evening</div>
                    {day.evening?.[0] && (
                      <div className="text-gray-700">
                        {day.evening[0].address ? (
                          <a href={day.evening[0].address} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                            {day.evening[0].title}
                          </a>
                        ) : (
                          <span>{day.evening[0].title}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activities */}
        {itinerary.activity_cards && itinerary.activity_cards.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Top Activities</h4>
            <div className="space-y-2">
              {itinerary.activity_cards.slice(0, 3).map((activity, idx) => (
                <div key={idx} className="bg-white p-2 rounded text-xs">
                  <div className="font-medium text-gray-800">
                    {activity.address ? (
                      <a href={activity.address} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {activity.title}
                      </a>
                    ) : (
                      <span>{activity.title}</span>
                    )}
                  </div>
                  {activity.address && (
                    <div className="text-gray-500 text-xs mt-1 truncate">{activity.address}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restaurants */}
        {itinerary.restaurant_recommendations && itinerary.restaurant_recommendations.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Restaurant Recommendations</h4>
            <div className="space-y-2">
              {itinerary.restaurant_recommendations.slice(0, 3).map((restaurant, idx) => (
                <div key={idx} className="bg-white p-2 rounded text-xs">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-800">
                      {restaurant.address ? (
                        <a href={restaurant.address} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {restaurant.name}
                        </a>
                      ) : (
                        <span>{restaurant.name}</span>
                      )}
                    </div>
                    {restaurant.rating && (
                      <div className="flex items-center text-yellow-500">
                        <FiStar size={10} />
                        <span className="ml-1">{restaurant.rating}</span>
                      </div>
                    )}
                  </div>
                  {restaurant.cuisine_type && (
                    <div className="text-gray-600 mt-1">{restaurant.cuisine_type}</div>
                  )}
                  {restaurant.address && (
                    <div className="text-gray-500 text-xs mt-1 truncate">{restaurant.address}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packing List */}
        {itinerary.packing_checklist && itinerary.packing_checklist.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <FiUmbrella className="mr-2" />
              Packing Checklist
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {itinerary.packing_checklist.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center text-xs bg-white p-1 rounded">
                  <FiCheck className="text-green-500 mr-1" size={10} />
                  <span className="text-gray-700">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-rose-500 text-white p-4 rounded-full shadow-lg hover:bg-rose-600 hover:scale-105 transition-transform z-50"
        title="AI Concierge Chat"
      >
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-rose-500 text-white p-3 font-semibold flex justify-between items-center flex-shrink-0">
            <span>AI Concierge Chat</span>
            <button onClick={() => setOpen(false)} className="hover:bg-rose-600 rounded p-1 transition-colors">
              <FiX size={18} />
            </button>
          </div>

          {/* Chat Messages - Scrollable */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 p-3 overflow-y-auto space-y-2 min-h-0"
            style={{ maxHeight: 'calc(600px - 120px)' }}
          >
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
                  className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                    m.who === 'user'
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div>{m.text}</div>
                  {m.itinerary && renderItinerary(m.itinerary)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-400 italic">AI is typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex border-t border-gray-200 flex-shrink-0">
            <input
              type="text"
              className="flex-1 p-2 text-sm outline-none"
              placeholder="Type your travel request..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-rose-500 text-white px-4 text-sm hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatOnly;
