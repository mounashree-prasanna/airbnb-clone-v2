import React, { useState } from 'react';
import {
  FiX,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiDollarSign,
  FiHeart
} from 'react-icons/fi';
import { FaUtensils, FaWheelchair } from 'react-icons/fa';

const AIConciergeButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-50"
      title="AI Concierge Agent"
    >
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <span className="text-purple-600 font-bold text-sm">AI</span>
        </div>
        <span className="hidden sm:block font-medium">Concierge</span>
      </div>
    </button>
  );
};

const AIConciergePanel = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    dates: '',
    location: '',
    party_type: 'couple',
    budget: 'medium',
    interests: [],
    mobility_needs: 'none',
    dietary_filters: [],
    children: 0,
    free_text_query: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleDietaryToggle = (diet) => {
    setFormData(prev => ({
      ...prev,
      dietary_filters: prev.dietary_filters.includes(diet)
        ? prev.dietary_filters.filter(d => d !== diet)
        : [...prev.dietary_filters, diet]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting concierge request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">AI Concierge Agent</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Booking Context */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiCalendar className="mr-2" />
              Booking Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Dates
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2025-10-01 to 2025-10-05"
                  value={formData.dates}
                  onChange={(e) => handleInputChange('dates', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiMapPin className="inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., San Jose, CA"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiUsers className="inline mr-1" />
                  Party Type
                </label>
                <select
                  value={formData.party_type}
                  onChange={(e) => handleInputChange('party_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="solo">Solo Traveler</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family</option>
                  <option value="group">Group</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiHeart className="mr-2" />
              Preferences
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiDollarSign className="inline mr-1" />
                  Budget
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low ($)</option>
                  <option value="medium">Medium ($$)</option>
                  <option value="high">High ($$$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['culture', 'nature', 'food', 'adventure', 'shopping', 'nightlife', 'history', 'art'].map(interest => (
                    <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestToggle(interest)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm capitalize">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaWheelchair className="inline mr-1" />
                  Mobility Needs
                </label>
                <select
                  value={formData.mobility_needs}
                  onChange={(e) => handleInputChange('mobility_needs', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="none">No special needs</option>
                  <option value="limited">Limited mobility</option>
                  <option value="wheelchair">Wheelchair accessible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaUtensils className="inline mr-1" /> 
                  Dietary Requirements
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'kosher', 'halal'].map(diet => (
                    <label key={diet} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.dietary_filters.includes(diet)}
                        onChange={() => handleDietaryToggle(diet)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm capitalize">{diet}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Requests (Optional)
            </label>
            <textarea
              placeholder="Tell us more about your preferences, e.g., 'we're vegan, no long hikes, two kids'"
              value={formData.free_text_query}
              onChange={(e) => handleInputChange('free_text_query', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Get Recommendations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { AIConciergeButton, AIConciergePanel };
