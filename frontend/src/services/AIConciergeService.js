import axios from 'axios';


// If using ingress in Kubernetes:
const AI_BASE_URL = 'http://airbnb.local/ai';

class AIService {
  // Send a chat message to the backend
  async sendMessage(travelerId, message) {
    try {
      const response = await axios.post(`${AI_BASE_URL}/chatbot`, {
        traveler_id: travelerId,
        message: message,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message to AI:', error);
      throw new Error(
        error.response?.data?.detail || 'Failed to contact AI service.'
      );
    }
  }

  // Fetch chat history for the traveler
  async getHistory(travelerId) {
    try {
      const response = await axios.get(
        `${AI_BASE_URL}/chatbot/history/${travelerId}`
      );
      return response.data.messages || [];
    } catch (error) {
      console.error('❌ Error fetching chat history:', error);
      return [];
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await axios.get(`${AI_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new AIService();
