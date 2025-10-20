import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Business,
  Person,
  Email,
  Phone,
  LocationOn,
  MoreVert,
  Edit,
  Delete,
  Message,
  Assessment
} from '@mui/icons-material';
import { useState } from 'react';

const ContactCard = ({ 
  contact, 
  onClick, 
  onEdit, 
  onDelete, 
  onMessage,
  onViewAnalytics 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action) => {
    handleMenuClose();
    action();
  };

  const handleCardClick = (event) => {
    console.log('Card clicked, event target:', event.target);
    console.log('Closest button:', event.target.closest('button'));
    console.log('Closest no-click:', event.target.closest('[data-no-click]'));
    
    // Only trigger if not clicking on menu or other interactive elements
    if (event.target.closest('[data-no-click]') || event.target.closest('button')) {
      console.log('Click ignored due to interactive element');
      return;
    }
    
    console.log('Calling onClick with contact:', contact);
    onClick(contact);
  };

  const getContactTypeColor = (role) => {
    const colors = {
      tenant: 'primary',
      landlord: 'success',
      buyer: 'info',
      seller: 'warning',
      investor: 'secondary',
      broker: 'default',
      attorney: 'default',
      lender: 'success',
      contractor: 'default',
      vendor: 'default',
      other: 'default'
    };
    return colors[role] || 'default';
  };

  const getLeadStatusColor = (status) => {
    const colors = {
      cold: 'default',
      warm: 'warning',
      hot: 'error',
      qualified: 'success',
      converted: 'primary',
      lost: 'default',
      inactive: 'default'
    };
    return colors[status] || 'default';
  };

  const formatBudget = (min, max) => {
    if (!min && !max) return null;
    if (min && max) {
      return `$${(min / 1000000).toFixed(1)}M - $${(max / 1000000).toFixed(1)}M`;
    }
    if (max) return `Up to $${(max / 1000000).toFixed(1)}M`;
    if (min) return `From $${(min / 1000000).toFixed(1)}M`;
    return null;
  };

  const getInitials = (firstName, lastName, companyName) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    if (companyName) {
      return companyName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2);
    }
    return 'C';
  };

  const displayName = contact.type === 'company' 
    ? contact.companyName 
    : `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

  const secondaryInfo = contact.type === 'individual' && contact.companyName 
    ? contact.companyName 
    : contact.title;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardActionArea onClick={handleCardClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header with Avatar and Menu */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48, 
                mr: 2, 
                bgcolor: contact.type === 'company' ? 'primary.main' : 'secondary.main' 
              }}
            >
              {contact.avatar ? (
                <img src={contact.avatar} alt={displayName} style={{ width: '100%', height: '100%' }} />
              ) : (
                getInitials(contact.firstName, contact.lastName, contact.companyName)
              )}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '1rem',
                  lineHeight: 1.3,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {displayName || 'Unnamed Contact'}
              </Typography>
              {secondaryInfo && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {secondaryInfo}
                </Typography>
              )}
            </Box>
            <IconButton 
              size="small" 
              onClick={handleMenuClick}
              sx={{ ml: 1 }}
              data-no-click="true"
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>

          {/* Contact Info */}
          <Box sx={{ mb: 2, flex: 1 }}>
            {contact.primaryEmail && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {contact.primaryEmail}
                </Typography>
              </Box>
            )}
            
            {contact.primaryPhone && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {contact.primaryPhone}
                </Typography>
              </Box>
            )}

            {(contact.mailingCity || contact.mailingState) && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {contact.mailingCity && contact.mailingState 
                    ? `${contact.mailingCity}, ${contact.mailingState}`
                    : contact.mailingCity || contact.mailingState
                  }
                </Typography>
              </Box>
            )}

            {/* Budget for investors */}
            {contact.contactRole === 'investor' && formatBudget(contact.budgetMin, contact.budgetMax) && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  mt: 1
                }}
              >
                Budget: {formatBudget(contact.budgetMin, contact.budgetMax)}
              </Typography>
            )}
          </Box>

          {/* Tags and Status */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Chip
              label={contact.contactRole || 'Contact'}
              size="small"
              color={getContactTypeColor(contact.contactRole)}
              variant="outlined"
            />
            {contact.leadStatus && (
              <Chip
                label={contact.leadStatus.toUpperCase()}
                size="small"
                color={getLeadStatusColor(contact.leadStatus)}
                variant="filled"
              />
            )}
          </Box>

          {/* Property Types of Interest */}
          {contact.propertyTypeInterest && contact.propertyTypeInterest.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Interested in: {contact.propertyTypeInterest.slice(0, 2).join(', ')}
                {contact.propertyTypeInterest.length > 2 && ` +${contact.propertyTypeInterest.length - 2} more`}
              </Typography>
            </Box>
          )}

          {/* Last Contact Date */}
          {contact.lastContactDate && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>
              Last contact: {new Date(contact.lastContactDate).toLocaleDateString()}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => handleMenuAction(() => onEdit(contact))}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Contact</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction(() => onMessage(contact))}>
          <ListItemIcon>
            <Message fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Message</ListItemText>
        </MenuItem>
        
        {contact.contactRole === 'investor' && onViewAnalytics && (
          <MenuItem onClick={() => handleMenuAction(() => onViewAnalytics(contact))}>
            <ListItemIcon>
              <Assessment fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Analytics</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem 
          onClick={() => handleMenuAction(() => onDelete(contact))}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete Contact</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ContactCard;