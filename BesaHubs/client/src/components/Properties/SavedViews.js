import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  ViewList,
  Tune
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const VIEW_STORAGE_KEY = 'properties_saved_views';

// Default views configuration
const getDefaultViews = (currentUser) => [
  {
    id: 'all',
    name: 'All Properties',
    filters: {
      type: '',
      propertyStatus: '',
      search: ''
    },
    isDefault: true,
    isSystem: true
  },
  {
    id: 'my-properties',
    name: 'My Properties',
    filters: {
      type: '',
      propertyStatus: '',
      search: '',
      listingAgentId: currentUser?.id,
      listingAgentEmail: currentUser?.email,
      listingAgentName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : ''
    },
    isDefault: false,
    isSystem: true
  },
  {
    id: 'active-listings',
    name: 'Active Listings',
    filters: {
      type: '',
      propertyStatus: 'active',
      search: '',
      marketingStatus: 'published'
    },
    isDefault: false,
    isSystem: true
  },
  {
    id: 'under-loi',
    name: 'Under LOI',
    filters: {
      type: '',
      propertyStatus: 'under_loi',
      search: ''
    },
    isDefault: false,
    isSystem: true
  },
  {
    id: 'off-market',
    name: 'Off Market',
    filters: {
      type: '',
      propertyStatus: 'off_market',
      search: ''
    },
    isDefault: false,
    isSystem: true
  },
  {
    id: 'sold-leased',
    name: 'Sold / Leased',
    filters: {
      type: '',
      propertyStatus: 'sold_leased',
      search: ''
    },
    isDefault: false,
    isSystem: true
  }
];

const SavedViews = ({ 
  selectedViewId, 
  onViewChange, 
  filters, 
  onFiltersChange,
  properties = [], // Properties array for counting
  variant = 'tabs' // 'tabs' or 'dropdown'
}) => {
  const { user } = useAuth();
  const [views, setViews] = useState([]);
  const [localSelectedViewId, setLocalSelectedViewId] = useState(selectedViewId || 'all');
  const lastAppliedFiltersRef = useRef(null);

  // Function to count properties matching a view's filters
  const countMatchingProperties = useCallback((view, propertiesList, currentUser) => {
    if (!propertiesList || propertiesList.length === 0) return 0;

    return propertiesList.filter(property => {
      // Apply type filter
      if (view.filters.type && property.propertyType !== view.filters.type) {
        return false;
      }

      // Apply propertyStatus filter
      if (view.filters.propertyStatus) {
        if (Array.isArray(view.filters.propertyStatus)) {
          if (!view.filters.propertyStatus.includes(property.propertyStatus)) {
            return false;
          }
        } else {
          if (property.propertyStatus !== view.filters.propertyStatus) {
            return false;
          }
        }
      }

      // Apply search filter
      if (view.filters.search) {
        const searchLower = view.filters.search.toLowerCase();
        const matchesSearch = 
          property.name?.toLowerCase().includes(searchLower) ||
          property.address?.toLowerCase().includes(searchLower) ||
          property.city?.toLowerCase().includes(searchLower);
        if (!matchesSearch) {
          return false;
        }
      }

      // Apply listing agent filter (for "My Properties" view)
      // Priority: 1. Primary broker assignment (listingAgentId, listingAgentEmail, listingAgent)
      //           2. If broker assignment is missing, default to creator (createdBy)
      if (view.filters.listingAgentId || view.filters.listingAgentEmail || view.filters.listingAgentName) {
        const currentUserId = view.filters.listingAgentId || currentUser?.id;
        const currentUserEmail = view.filters.listingAgentEmail || currentUser?.email;
        
        // Check if property has any broker assignment
        const hasBrokerAssignment = !!(
          property.listingAgentId || 
          property.listingAgentEmail || 
          property.listingAgent
        );
        
        let matchesListingAgent = false;
        let brokerMatches = false;
        
        if (hasBrokerAssignment) {
          // Check primary broker assignment first
          // 1. Check listingAgentId (primary broker ID)
          if (currentUserId && property.listingAgentId) {
            brokerMatches = String(property.listingAgentId) === String(currentUserId);
          }
          
          // 2. Check listingAgentEmail (primary broker email)
          if (!brokerMatches && currentUserEmail && property.listingAgentEmail) {
            brokerMatches = property.listingAgentEmail.toLowerCase() === currentUserEmail.toLowerCase();
          }
          
          // 3. Check listingAgent object or string
          if (!brokerMatches && property.listingAgent) {
            if (typeof property.listingAgent === 'object') {
              // Match by ID in listingAgent object
              if (currentUserId && property.listingAgent.id) {
                brokerMatches = String(property.listingAgent.id) === String(currentUserId);
              }
              // Match by email in listingAgent object
              if (!brokerMatches && currentUserEmail && property.listingAgent.email) {
                brokerMatches = property.listingAgent.email.toLowerCase() === currentUserEmail.toLowerCase();
              }
              // Match by name in listingAgent object
              if (!brokerMatches && view.filters.listingAgentName) {
                const agentName = `${property.listingAgent.firstName || ''} ${property.listingAgent.lastName || ''}`.trim();
                brokerMatches = agentName.toLowerCase() === view.filters.listingAgentName.toLowerCase();
              }
            } else if (typeof property.listingAgent === 'string') {
              // String might contain email or name
              if (currentUserEmail) {
                brokerMatches = property.listingAgent.toLowerCase().includes(currentUserEmail.toLowerCase());
              }
              if (!brokerMatches && view.filters.listingAgentName) {
                brokerMatches = property.listingAgent.toLowerCase().includes(view.filters.listingAgentName.toLowerCase());
              }
            }
          }
          
          // If broker is assigned, use broker match result
          matchesListingAgent = brokerMatches;
        } else {
          // No broker assignment - default to creator (createdBy)
          if (currentUserId && property.createdBy) {
            matchesListingAgent = String(property.createdBy) === String(currentUserId);
          }
        }
        
        if (!matchesListingAgent) {
          return false;
        }
      }

      // Apply marketing status filter
      if (view.filters.marketingStatus && property.marketingStatus !== view.filters.marketingStatus) {
        return false;
      }

      // Apply transaction status filter
      if (view.filters.transactionStatus && property.transactionStatus !== view.filters.transactionStatus) {
        return false;
      }

      return true;
    }).length;
  }, []);

  // Calculate counts for each view
  const viewCounts = useMemo(() => {
    const counts = {};
    views.forEach(view => {
      counts[view.id] = countMatchingProperties(view, properties, user);
    });
    return counts;
  }, [views, properties, user, countMatchingProperties]);

  // Load views from localStorage or create defaults
  useEffect(() => {
    const loadViews = () => {
      try {
        const savedViewsStr = localStorage.getItem(VIEW_STORAGE_KEY);
        let savedViews = [];
        
        if (savedViewsStr) {
          savedViews = JSON.parse(savedViewsStr);
        }

        const defaultViews = getDefaultViews(user);
        
        // Merge saved views with defaults, keeping defaults and adding custom views
        const systemViewIds = new Set(defaultViews.map(v => v.id));
        const customViews = savedViews.filter(v => !systemViewIds.has(v.id));
        
        setViews([...defaultViews, ...customViews]);
      } catch (error) {
        console.error('Error loading saved views:', error);
        setViews(getDefaultViews(user));
      }
    };

    if (user !== undefined) {
      loadViews();
    }
  }, [user]);

  // Save views to localStorage whenever they change
  useEffect(() => {
    if (views.length > 0) {
      try {
        localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(views));
      } catch (error) {
        console.error('Error saving views:', error);
      }
    }
  }, [views]);

  // Apply view filters when view changes
  useEffect(() => {
    if (selectedViewId !== localSelectedViewId) {
      setLocalSelectedViewId(selectedViewId);
    }
  }, [selectedViewId]);

  useEffect(() => {
    if (localSelectedViewId && views.length > 0 && onFiltersChange) {
      const selectedView = views.find(v => v.id === localSelectedViewId);
      if (selectedView) {
        // Apply the view's filters
        const filtersToApply = { ...selectedView.filters };
        const filtersKey = JSON.stringify(filtersToApply);
        // Only apply if filters have changed to avoid infinite loops
        if (lastAppliedFiltersRef.current !== filtersKey) {
          lastAppliedFiltersRef.current = filtersKey;
          onFiltersChange(filtersToApply);
        }
      }
    }
  }, [localSelectedViewId, views, onFiltersChange]);

  const handleViewChange = useCallback((event, newValue) => {
    const viewId = variant === 'tabs' ? newValue : event.target.value;
    setLocalSelectedViewId(viewId);
    if (onViewChange) {
      onViewChange(viewId);
    }
  }, [variant, onViewChange]);

  const selectedView = views.find(v => v.id === localSelectedViewId);

  if (variant === 'dropdown') {
    return (
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>View</InputLabel>
        <Select
          value={localSelectedViewId}
          onChange={handleViewChange}
          label="View"
          startAdornment={
            <ViewList sx={{ mr: 1, color: 'text.secondary' }} />
          }
        >
          {views.map((view) => {
            const count = viewCounts[view.id] || 0;
            return (
              <MenuItem key={view.id} value={view.id}>
                {view.name} ({count})
                {view.isDefault && (
                  <Chip 
                    label="Default" 
                    size="small" 
                    sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} 
                  />
                )}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    );
  }

  // Tabs variant
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={localSelectedViewId || 'all'}
        onChange={handleViewChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
            '&.Mui-selected': {
              fontWeight: 600
            }
          }
        }}
      >
        {views.map((view) => {
          const count = viewCounts[view.id] || 0;
          return (
            <Tab
              key={view.id}
              value={view.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{view.name}</span>
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      height: 18,
                      minWidth: 18,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 0.75,
                        py: 0
                      }
                    }}
                  />
                </Box>
              }
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default SavedViews;
