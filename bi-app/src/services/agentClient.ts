import axios, { AxiosInstance, AxiosError } from 'axios';

class AgentClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AGENT_SERVICE_URL || 'http://localhost:4000',
      timeout: parseInt(process.env.AGENT_TIMEOUT_MS || '120000', 10),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Agent service error:', error.message);
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Agent service is unavailable');
        }
        throw error;
      }
    );
  }

  async generateResponse(
    userId: number,
    conversationId: number,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    organisationId?: number
  ) {
    try {
      const response = await this.client.post('/api/conversations/generate', {
        userId,
        conversationId,
        userMessage,
        history: conversationHistory,
        ...(organisationId !== undefined && { organisationId }),
      });
      return response.data;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  async ingestDocument(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId: number,
    organisationId: number,
    documentType: string,
    tags: string[] = []
  ) {
    try {
      const response = await this.client.post('/api/documents/ingest', {
        userId,
        organisationId,
        documentType,
        tags,
        filename,
        mimeType,
        bufferBase64: buffer.toString('base64'),
      });
      return response.data;
    } catch (error) {
      console.error('Error ingesting document:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string) {
    try {
      await this.client.delete(`/api/documents/${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async searchContext(userId: number, query: string, limit: number = 5) {
    try {
      const response = await this.client.post('/api/conversations/search', {
        userId,
        query,
        limit
      });
      return response.data;
    } catch (error) {
      console.error('Error searching context:', error);
      throw error;
    }
  }

  async analyzeData(userId: number, description: string, data: any) {
    try {
      const response = await this.client.post('/analyze', {
        userId,
        description,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing data:', error);
      throw error;
    }
  }

  async generatePlan(userId: number, problemId: number, insights: string[]) {
    try {
      const response = await this.client.post('/generate-plan', {
        userId,
        problemId,
        insights
      });
      return response.data;
    } catch (error) {
      console.error('Error generating plan:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: String(error) };
    }
  }
}

export const agentClient = new AgentClient();