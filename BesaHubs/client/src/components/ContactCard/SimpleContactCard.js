import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Psychology,
  Star,
  TrendingUp
} from '@mui/icons-material';

const SimpleContactCard = ({ 
  contact, 
  onClick,
  showLeadScore = true 
}) => {
  const [leadScore, setLeadScore] = useState(null);

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

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50'; // Green
    if (score >= 60) return '#ff9800'; // Orange
    if (score >= 40) return '#2196f3'; // Blue
    return '#757575'; // Gray
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <Star sx={{ fontSize: 16, color: '#4caf50' }} />;
    if (score >= 60) return <TrendingUp sx={{ fontSize: 16, color: '#ff9800' }} />;
    return <Psychology sx={{ fontSize: 16, color: '#757575' }} />;
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

  const handleClick = () => {
    console.log('Simple card clicked, calling onClick with:', contact);
    onClick(contact);
  };

  return (
    <Card 
      onClick={handleClick}
      sx={{ 
        height: '100%', 
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
          backgroundColor: 'action.hover'
        }
      }}
    >
      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header with Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Badge
            badgeContent={leadScore && showLeadScore ? leadScore.score : null}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: leadScore ? getScoreColor(leadScore.score) : 'grey.500',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem'
              }
            }}
          >
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
          </Badge>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '1rem',
                  lineHeight: 1.3,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}
              >
                {displayName || 'Unnamed Contact'}
              </Typography>
              {leadScore && showLeadScore && (
                <Tooltip title={`Lead Score: ${leadScore.score}/100 (${leadScore.grade})`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {getScoreIcon(leadScore.score)}
                  </Box>
                </Tooltip>
              )}
            </Box>
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
            
            {/* Lead Score Progress Bar */}
            {leadScore && showLeadScore && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Lead Score
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {leadScore.grade}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={leadScore.score}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(leadScore.score),
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            )}
          </Box>
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

        {/* Quick Action Buttons */}
        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {contact.primaryPhone && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<Phone />}
                onClick={(e) => {
                  e.stopPropagation();
                  // Trigger dialer functionality
                  if (window.confirm(`Call ${contact.primaryPhone}?`)) {
                    // Use tel: protocol to open native dialer
                    window.open(`tel:${contact.primaryPhone}`, '_self');
                  }
                }}
                sx={{ flex: 1 }}
              >
                Call
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                console.log('View Details button clicked');
                onClick(contact);
              }}
              sx={{ flex: contact.primaryPhone ? 1 : 2 }}
            >
              View Details
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SimpleContactCard;