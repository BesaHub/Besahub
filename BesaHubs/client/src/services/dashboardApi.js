import api from './api';

export const getDashboards = async () => {
  const response = await api.get('/dashboards');
  return response.data;
};

export const createDashboard = async (data) => {
  const response = await api.post('/dashboards', data);
  return response.data;
};

export const getDashboard = async (id) => {
  const response = await api.get(`/dashboards/${id}`);
  return response.data;
};

export const updateDashboard = async (id, data) => {
  const response = await api.put(`/dashboards/${id}`, data);
  return response.data;
};

export const deleteDashboard = async (id) => {
  const response = await api.delete(`/dashboards/${id}`);
  return response.data;
};

export const shareDashboard = async (id, shareData) => {
  const response = await api.post(`/dashboards/${id}/share`, shareData);
  return response.data;
};

export const setDefaultDashboard = async (id) => {
  const response = await api.post(`/dashboards/${id}/default`);
  return response.data;
};

export const getWidgets = async (dashboardId) => {
  const response = await api.get(`/dashboards/${dashboardId}/widgets`);
  return response.data;
};

export const createWidget = async (dashboardId, data) => {
  const response = await api.post(`/dashboards/${dashboardId}/widgets`, data);
  return response.data;
};

export const updateWidget = async (id, data) => {
  const response = await api.put(`/dashboards/widgets/${id}`, data);
  return response.data;
};

export const deleteWidget = async (id) => {
  const response = await api.delete(`/dashboards/widgets/${id}`);
  return response.data;
};

export const executeQuery = async (widgetConfig) => {
  const response = await api.post('/dashboards/widgets/query', widgetConfig);
  return response.data;
};

export const refreshWidget = async (id) => {
  const response = await api.post(`/dashboards/widgets/${id}/refresh`);
  return response.data;
};

export const dashboardApi = {
  getDashboards,
  createDashboard,
  getDashboard,
  updateDashboard,
  deleteDashboard,
  shareDashboard,
  setDefaultDashboard,
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  executeQuery,
  refreshWidget
};

export default dashboardApi;
