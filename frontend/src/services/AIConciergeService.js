import axios from 'axios';

const AI_CONCIERGE_API_URL = 'http://localhost:8000';

class AIConciergeService {
  async getRecommendations(formData) {
    try {
      const requestData = {
        booking_context: {
          dates: formData.dates,
          location: formData.location,
          party_type: formData.party_type
        },
        preferences: {
          budget: formData.budget,
          interests: formData.interests,
          mobility_needs: formData.mobility_needs,
          dietary_filters: formData.dietary_filters,
          children: formData.children
        },
        free_text_query: formData.free_text_query
      };

      console.log('Sending request to AI Concierge:', requestData);

      const response = await axios.post(`${AI_CONCIERGE_API_URL}/ai-concierge`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 
      });

      console.log('AI Concierge response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error calling AI Concierge service:', error);
      
      if (error.response) {
        throw new Error(`AI Concierge service error: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Unable to connect to AI Concierge service. Please make sure the service is running on port 8000.');
      } else {
        throw new Error(`Unexpected error: ${error.message}`);
      }
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${AI_CONCIERGE_API_URL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('AI Concierge service health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new AIConciergeService();
