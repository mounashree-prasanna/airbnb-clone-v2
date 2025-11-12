import {
  FiX,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiStar,
  FiSun,
  FiCloud,
  FiCloudRain,
  FiUmbrella,
  FiCheck
} from 'react-icons/fi';
import { FaBaby } from 'react-icons/fa';
import { FaWheelchair } from 'react-icons/fa';
import React, { useState } from "react";
const ConciergeResults = ({ results, onClose }) => {
  const [activeTab, setActiveTab] = useState('itinerary');

  if (!results) return null;

  const getWeatherIcon = (condition) => {
    const conditionLower = condition.toLowerCase();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-4xl h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Your Personalized Travel Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Weather Info */}
        {results.weather_info && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 mx-6 mt-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiSun className="mr-2" />
              Weather Forecast
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {results.weather_info.forecast.map((day, index) => (
                <div key={index} className="bg-white p-3 rounded-lg text-center">
                  <div className="text-sm font-medium">{day.date}</div>
                  <div className="text-2xl my-1">{getWeatherIcon(day.condition)}</div>
                  <div className="text-lg font-semibold">{day.temp}</div>
                  <div className="text-xs text-gray-600">{day.condition}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Events */}
        {results.local_events && results.local_events.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 mx-6 mt-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Local Events</h3>
            <div className="space-y-2">
              {results.local_events.map((event, index) => (
                <div key={index} className="bg-white p-3 rounded-lg">
                  <div className="font-medium">{event.name}</div>
                  <div className="text-sm text-gray-600">{event.date} • {event.location}</div>
                  <div className="text-sm text-gray-500">{event.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex border-b border-gray-200 mx-6 mt-6">
        {[
          { id: 'itinerary', label: 'Day-by-Day Plan' },
          { id: 'activities', label: 'Activities' },
          { id: 'restaurants', label: 'Restaurants' },
          { id: 'packing', label: 'Packing List' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}  // ← this is the important part
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        </div>

        <div className="p-6">
          {activeTab === 'itinerary' && (
            <div className="space-y-6">
              {results.day_by_day_plan.map((day, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Morning</h4>
                      {day.morning.length > 0 ? (
                        day.morning.map((activity, idx) => (
                          <div key={idx} className="bg-white p-2 rounded mb-2">
                            <div className="font-medium text-sm">{activity.title}</div>
                            <div className="text-xs text-gray-600">{activity.duration}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Free time</div>
                      )}
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Afternoon</h4>
                      {day.afternoon.length > 0 ? (
                        day.afternoon.map((activity, idx) => (
                          <div key={idx} className="bg-white p-2 rounded mb-2">
                            <div className="font-medium text-sm">{activity.title}</div>
                            <div className="text-xs text-gray-600">{activity.duration}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Free time</div>
                      )}
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Evening</h4>
                      {day.evening.length > 0 ? (
                        day.evening.map((activity, idx) => (
                          <div key={idx} className="bg-white p-2 rounded mb-2">
                            <div className="font-medium text-sm">{activity.title}</div>
                            <div className="text-xs text-gray-600">{activity.duration}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Free time</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.activity_cards && results.activity_cards.length > 0 ? (
                results.activity_cards.map((activity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg mb-2">{activity.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2" />
                        {activity.address}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="mr-2" />
                        {activity.duration}
                      </div>
                      <div className="flex items-center">
                        <FiDollarSign className={`mr-2 ${getPriceTierColor(activity.price_tier)}`} />
                        <span className={getPriceTierColor(activity.price_tier)}>{activity.price_tier}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {activity.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center mt-3 space-x-4">
                      {activity.wheelchair_friendly && (
                        <div className="flex items-center text-green-600 text-sm">
                          <FaWheelchair className="mr-1" />
                          Wheelchair Accessible
                        </div>
                      )}
                      {activity.child_friendly && (
                        <div className="flex items-center text-blue-600 text-sm">
                          <FaBaby className="mr-1" />
                          Child Friendly
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center col-span-2">
                  No activities found.
                </div>
              )}
            </div>
          )}

          {activeTab === 'restaurants' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.restaurant_recommendations && results.restaurant_recommendations.length > 0 ? (
                results.restaurant_recommendations.map((restaurant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                      <div className="flex items-center text-yellow-500">
                        <FiStar className="mr-1" />
                        {restaurant.rating}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2" />
                        {restaurant.address}
                      </div>
                      <div className="flex items-center">
                        <FiDollarSign className={`mr-2 ${getPriceTierColor(restaurant.price_tier)}`} />
                        <span className={getPriceTierColor(restaurant.price_tier)}>{restaurant.price_tier}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Cuisine:</span> {restaurant.cuisine_type}
                      </div>
                    </div>
                    
                    {restaurant.dietary_accommodations && restaurant.dietary_accommodations.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Dietary Accommodations:</div>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.dietary_accommodations.map((diet, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                            >
                              {diet}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center col-span-2">
                  No restaurants found.
                </div>
              )}
            </div>
          )}

          {activeTab === 'packing' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  <FiUmbrella className="mr-2" />
                  Weather-Aware Packing List
                </h3>
                <p className="text-sm text-gray-600">
                  Items marked with weather icons are weather-dependent based on your travel dates.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['clothing', 'personal', 'electronics', 'documents', 'weather', 'food', 'activities'].map(category => {
                  const categoryItems = results.packing_checklist.filter(item => item.category === category);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-3 capitalize">{category}</h4>
                      <div className="space-y-2">
                        {categoryItems.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <FiCheck className="text-green-500" />
                            <span className="text-sm">{item.item}</span>
                            {item.weather_dependent && (
                              <FiUmbrella className="text-blue-500 text-xs" title="Weather dependent" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConciergeResults;
