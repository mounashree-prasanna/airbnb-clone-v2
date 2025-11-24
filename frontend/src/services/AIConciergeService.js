import axios from 'axios';

// AI Service URL - supports both local development and Kubernetes
// For local dev, set VITE_AI_SERVICE_URL=http://localhost:7005 in .env
// For Kubernetes, use: http://airbnb.local/ai (default)
const getAIBaseURL = () => {
  // Check environment variable first (highest priority)
  const envUrl = import.meta.env.VITE_AI_SERVICE_URL;
  if (envUrl) {
    console.log('🔧 Using AI service URL from env:', envUrl);
    return envUrl;
  }
  
  // Default to relative URL (works for both local frontend and deployed frontend)
  // This ensures API calls use the same origin as the frontend (no CORS issues)
  const k8sUrl = '/ai';
  console.log('🔧 Using relative AI service URL:', k8sUrl);
  return k8sUrl;
};

// Get URL at module load (will be evaluated when service is used)
let AI_BASE_URL = null;
const getBaseURL = () => {
  if (!AI_BASE_URL) {
    AI_BASE_URL = getAIBaseURL();
  }
  return AI_BASE_URL;
};

class AIService {
  // Send a chat message to the backend
  async sendMessage(travelerId, message, bookingContext = null) {
    try {
      const baseUrl = getBaseURL();
      const response = await axios.post(
        `${baseUrl}/chatbot`,
        {
          traveler_id: travelerId,
          message: message,
          booking_context: bookingContext,  // Pass booking data if available
        },
        { 
          withCredentials: true,
          timeout: 180000, // 3 minutes timeout (LLM processing can take time)
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message to AI:', error);
      
      // Provide more specific error messages
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        throw new Error('AI service is not available. Please check if the service is running on port 7005 or if Kubernetes ingress is configured.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Request timed out after 3 minutes. The AI service is processing your request but it\'s taking longer than expected. Please try again with a simpler request or wait a moment.');
      } else if (error.response?.status === 404) {
        throw new Error('AI service endpoint not found. Please check the service configuration.');
      } else if (error.response?.status === 0 || error.message.includes('CORS')) {
        throw new Error('CORS error: AI service is not allowing requests from this origin. Please check CORS configuration.');
      } else if (error.response?.status >= 500) {
        throw new Error('AI service error. Please try again later.');
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        error.message ||
        'Failed to contact AI service. Please check if the service is running.'
      );
    }
  }

  // Fetch chat history for the traveler
  async getHistory(travelerId) {
    try {
      const baseUrl = getBaseURL();
      const response = await axios.get(
        `${baseUrl}/chatbot/history/${travelerId}`,
        { withCredentials: true }
      );
      return response.data.messages || [];
    } catch (error) {
      console.error('❌ Error fetching chat history:', error);
      return [];
    }
  }

  // Clear chat history
  async clearHistory(travelerId) {
    try {
      const baseUrl = getBaseURL();
      const response = await axios.delete(
        `${baseUrl}/chatbot/history/${travelerId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error clearing chat history:', error);
      // Don't throw - clearing history is not critical
      return { message: 'History cleared locally' };
    }
  }

  // Health check
  async checkHealth() {
    try {
      const baseUrl = getBaseURL();
      const response = await axios.get(`${baseUrl}/health`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new AIService();
