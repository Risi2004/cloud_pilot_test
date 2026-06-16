import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 900000 // 900s (15 min) timeout to allow slow local Ollama processes to complete
});

export const analyzeRepository = async (githubUrl) => {
  const response = await api.post('/analyze', { githubUrl });
  return response.data;
};

export const analyzeEditorCode = async (files, projectName) => {
  const response = await api.post('/analyze/editor', { files, projectName });
  return response.data;
};

export const analyzeLocalDirectory = async (localPath) => {
  const response = await api.post('/analyze/local', { localPath });
  return response.data;
};

export const importLocalWorkspace = async (localPath) => {
  const response = await api.post('/analyze/import-local', { localPath });
  return response.data;
};

export const getRecommendation = async (payload) => {
  // payload can contain githubUrl or analysisId
  const response = await api.post('/recommend', payload);
  return response.data;
};

export const getDeploymentPlan = async (payload) => {
  // payload can contain githubUrl or analysisId
  const response = await api.post('/deployment-plan', payload);
  return response.data;
};

export const triggerAutoDeployment = async (payload) => {
  const response = await api.post('/deployment-plan/deploy', payload);
  return response.data;
};

export const getDeploymentStatus = async (payload) => {
  const response = await api.post('/deployment-plan/status', payload);
  return response.data;
};

export const autoFixAndRedeploy = async (payload) => {
  const response = await api.post('/deployment-plan/auto-fix', payload);
  return response.data;
};

export const sendChatMessage = async (message, history = []) => {
  const response = await api.post('/chat', { message, history });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard-stats');
  return response.data;
};

export default {
  analyzeRepository,
  analyzeEditorCode,
  analyzeLocalDirectory,
  importLocalWorkspace,
  getRecommendation,
  getDeploymentPlan,
  triggerAutoDeployment,
  getDeploymentStatus,
  autoFixAndRedeploy,
  sendChatMessage,
  getDashboardStats
};

