import api from './api';

// Property API endpoints
export const propertyApi = {
  // Get all properties with filtering and pagination
  getProperties: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/properties${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get single property by ID
  getProperty: async (id) => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  // Create new property
  createProperty: async (propertyData) => {
    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  // Update existing property
  updateProperty: async (id, propertyData) => {
    try {
      const response = await api.put(`/properties/${id}`, propertyData);
      return response.data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  // Delete property
  deleteProperty: async (id) => {
    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  // Upload property images
  uploadImages: async (id, imageFiles) => {
    try {
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post(`/properties/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  // Upload property documents
  uploadDocuments: async (id, documentFiles) => {
    try {
      const formData = new FormData();
      documentFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await api.post(`/properties/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  },

  // Remove property image
  removeImage: async (id, imageIndex) => {
    try {
      const response = await api.delete(`/properties/${id}/images/${imageIndex}`);
      return response.data;
    } catch (error) {
      console.error('Error removing image:', error);
      throw error;
    }
  },

  // Remove property document
  removeDocument: async (id, documentIndex) => {
    try {
      const response = await api.delete(`/properties/${id}/documents/${documentIndex}`);
      return response.data;
    } catch (error) {
      console.error('Error removing document:', error);
      throw error;
    }
  },

  // Import properties from CSV/Excel
  importProperties: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/properties/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error importing properties:', error);
      throw error;
    }
  },

  // Export properties to CSV/Excel
  exportProperties: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/properties/export${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        responseType: 'blob', // Important for file download
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting properties:', error);
      throw error;
    }
  },

  // Get import template
  getTemplate: async (format = 'csv') => {
    try {
      const response = await api.get(`/properties/template?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  },

  // Search properties for map view
  getMapProperties: async (bounds, filters = {}) => {
    try {
      const params = { bounds, ...filters };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/properties/search/map?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching map properties:', error);
      throw error;
    }
  },

  // Log property inquiry
  logInquiry: async (id, inquiryData) => {
    try {
      const response = await api.post(`/properties/${id}/inquire`, inquiryData);
      return response.data;
    } catch (error) {
      console.error('Error logging inquiry:', error);
      throw error;
    }
  }
};

// Listings API endpoints (extends properties)
export const listingsApi = {
  // Get all listings with enhanced filtering
  getListings: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/listings${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  },

  // Get availability tracking data
  getAvailability: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/listings/availability${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching availability data:', error);
      throw error;
    }
  },

  // Update marketing status
  updateMarketingStatus: async (id, status, notes = '') => {
    try {
      const response = await api.put(`/listings/${id}/marketing-status`, {
        marketingStatus: status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating marketing status:', error);
      throw error;
    }
  },

  // Syndicate listing to portals
  syndicateListing: async (id, portals, customMessage = '') => {
    try {
      const response = await api.post(`/listings/${id}/syndicate`, {
        portals,
        customMessage
      });
      return response.data;
    } catch (error) {
      console.error('Error syndicating listing:', error);
      throw error;
    }
  },

  // Get listing performance metrics
  getPerformance: async (id, timeframe = '30') => {
    try {
      const response = await api.get(`/listings/${id}/performance?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }
  }
};

export default propertyApi;