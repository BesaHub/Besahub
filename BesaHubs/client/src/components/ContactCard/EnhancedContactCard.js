import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  useTheme
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  Apartment as ApartmentIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  Whatshot as WhotshotIcon,
  AcUnit as AcUnitIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const EnhancedContactCard = ({ 
  contact, 
  onClick, 
  onEmail,
  onCall,
  onAddToDeal,
  onViewDetails
}) => {
  const theme = useTheme();
  
  const getLeadTemperatureConfig = (status) => {
    const configs = {
      hot: {
        gradient: theme.palette.gradient.warning,
        icon: <WhotshotIcon sx={{ fontSize: 12, color: 'white' }} />,
        label: 'Hot Lead'
      },
      warm: {
        gradient: theme.palette.gradient.info,
        icon: <LocalFireDepartmentIcon sx={{ fontSize: 12, color: 'white' }} />,
        label: 'Warm Lead'
      },
      cold: {
        gradient: theme.palette.gradient.secondary,
        icon: <AcUnitIcon sx={{ fontSize: 12, color: 'white' }} />,
        label: 'Cold Lead'
      },
      qualified: {
        gradient: theme.palette.gradient.success,
        icon: <StarIcon sx={{ fontSize: 12, color: 'white' }} />,
        label: 'Qualified'
      },
      converted: {
        gradient: theme.palette.gradient.secondary,
        icon: <TrendingUpIcon sx={{ fontSize: 12, color: 'white' }} />,
        label: 'Converted'
      },
      inactive: {
        gradient: theme.palette.gradient.secondary,
        icon: null,
        label: 'Inactive'
      },
      lost: {
        gradient: theme.palette.gradient.secondary,
        icon: null,
        label: 'Lost'
      }
    };
    return configs[status] || configs.cold;
  };

  const getRoleConfig = (role) => {
    const configs = {
      investor: {
        color: 'secondary',
        icon: <AttachMoneyIcon sx={{ fontSize: 11 }} />,
        label: 'Investor'
      },
      tenant: {
        color: 'primary',
        icon: <PersonIcon sx={{ fontSize: 11 }} />,
        label: 'Tenant'
      },
      landlord: {
        color: 'success',
        icon: <ApartmentIcon sx={{ fontSize: 11 }} />,
        label: 'Landlord'
      },
      buyer: {
        color: 'info',
        icon: <PersonIcon sx={{ fontSize: 11 }} />,
        label: 'Buyer'
      },
      seller: {
        color: 'warning',
        icon: <BusinessIcon sx={{ fontSize: 11 }} />,
        label: 'Seller'
      },
      broker: {
        color: 'default',
        icon: <BusinessIcon sx={{ fontSize: 11 }} />,
        label: 'Broker'
      },
      attorney: {
        color: 'default',
        icon: <PersonIcon sx={{ fontSize: 11 }} />,
        label: 'Attorney'
      }
    };
    return configs[role] || { color: 'default', icon: <PersonIcon sx={{ fontSize: 11 }} />, label: role };
  };

  const getLeadScoreGrade = (score) => {
    if (score >= 80) return { grade: 'A', color: '#2e7d32', stars: 5 };
    if (score >= 60) return { grade: 'B', color: '#1976d2', stars: 4 };
    if (score >= 40) return { grade: 'C', color: '#ed6c02', stars: 3 };
    return { grade: 'D', color: '#d32f2f', stars: 2 };
  };

  const calculateLeadScore = (contact) => {
    let score = 0;
    
    if (contact.leadStatus === 'hot') score += 30;
    else if (contact.leadStatus === 'warm') score += 20;
    else if (contact.leadStatus === 'qualified') score += 25;
    else if (contact.leadStatus === 'converted') score += 40;
    else if (contact.leadStatus === 'cold') score += 10;
    
    if (contact.budgetMax && contact.budgetMax > 5000000) score += 20;
    else if (contact.budgetMax && contact.budgetMax > 1000000) score += 15;
    else if (contact.budgetMax) score += 10;
    
    if (contact.contactRole === 'investor') score += 15;
    else if (contact.contactRole === 'buyer') score += 10;
    
    if (contact.primaryEmail) score += 5;
    if (contact.primaryPhone) score += 5;
    
    const daysSinceContact = contact.lastContactDate 
      ? Math.floor((new Date() - new Date(contact.lastContactDate)) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceContact < 7) score += 15;
    else if (daysSinceContact < 30) score += 10;
    else if (daysSinceContact < 90) score += 5;
    
    return Math.min(Math.max(score, 0), 100);
  };

  const formatBudget = (min, max) => {
    const formatMillion = (val) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
      return `$${val}`;
    };

    if (!min && !max) return null;
    if (min && max) return `${formatMillion(min)} - ${formatMillion(max)}`;
    if (max) return `Up to ${formatMillion(max)}`;
    if (min) return `From ${formatMillion(min)}`;
    return null;
  };

  const getInitials = (firstName, lastName, companyName) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (companyName) {
      return companyName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
    }
    return 'C';
  };

  const getAvatarColor = (contact) => {
    const colors = [
      '#1976d2', '#d32f2f', '#388e3c', '#f57c00', 
      '#7b1fa2', '#0288d1', '#c2185b', '#00796b'
    ];
    const name = contact.firstName || contact.lastName || contact.companyName || '';
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderStars = (count) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < count) {
        stars.push(<StarIcon key={i} sx={{ fontSize: 10, color: '#ffc107' }} />);
      } else {
        stars.push(<StarBorderIcon key={i} sx={{ fontSize: 10, color: '#e0e0e0' }} />);
      }
    }
    return stars;
  };

  const displayName = contact.type === 'company' 
    ? contact.companyName 
    : `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

  const secondaryInfo = contact.type === 'individual' && contact.companyName 
    ? contact.companyName 
    : contact.title;

  const leadScore = calculateLeadScore(contact);
  const scoreGrade = getLeadScoreGrade(leadScore);
  const tempConfig = getLeadTemperatureConfig(contact.leadStatus);
  const roleConfig = getRoleConfig(contact.contactRole);

  const handleEmail = (e) => {
    e.stopPropagation();
    if (onEmail) onEmail(contact);
    else if (contact.primaryEmail) {
      window.location.href = `mailto:${contact.primaryEmail}`;
    }
  };

  const handleCall = (e) => {
    e.stopPropagation();
    if (onCall) onCall(contact);
    else if (contact.primaryPhone) {
      window.location.href = `tel:${contact.primaryPhone}`;
    }
  };

  const handleAddToDeal = (e) => {
    e.stopPropagation();
    if (onAddToDeal) onAddToDeal(contact);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(contact);
    else if (onClick) onClick(contact);
  };

  const handleCardClick = () => {
    if (onClick) onClick(contact);
  };

  return (
    <Card 
      onClick={handleCardClick}
      sx={{ 
        display: 'flex',
        flexDirection: 'row',
        height: 70,
        borderRadius: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: 3,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          '& .quick-actions': {
            opacity: 1,
            transform: 'translateX(0)'
          }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: 85,
        minWidth: 85,
        background: `linear-gradient(135deg, ${getAvatarColor(contact)}15 0%, ${getAvatarColor(contact)}05 100%)`,
        borderRight: `3px solid ${getAvatarColor(contact)}30`
      }}>
        <Badge
          badgeContent={scoreGrade.grade}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: scoreGrade.color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.65rem',
              minWidth: 18,
              height: 18,
              borderRadius: '50%'
            }
          }}
        >
          <Avatar 
            sx={{ 
              width: 44, 
              height: 44, 
              bgcolor: getAvatarColor(contact),
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: 3
            }}
          >
            {contact.avatar ? (
              <img src={contact.avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(contact.firstName, contact.lastName, contact.companyName)
            )}
          </Avatar>
        </Badge>
      </Box>

      <CardContent sx={{ 
        p: 1, 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        '&:last-child': { pb: 1 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '0.875rem',
                lineHeight: 1.2,
                mb: 0.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayName || 'Unnamed Contact'}
            </Typography>
            
            {secondaryInfo && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.2 }}>
                <BusinessIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {secondaryInfo}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, ml: 1 }}>
            {renderStars(scoreGrade.stars)}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.4 }}>
          {contact.primaryEmail && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <EmailIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 160
                }}
              >
                {contact.primaryEmail}
              </Typography>
            </Box>
          )}
          
          {contact.primaryPhone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {contact.primaryPhone}
              </Typography>
            </Box>
          )}

          {(contact.mailingCity || contact.mailingState) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
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

          {formatBudget(contact.budgetMin, contact.budgetMax) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <AttachMoneyIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {formatBudget(contact.budgetMin, contact.budgetMax)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            icon={roleConfig.icon}
            label={roleConfig.label}
            size="small"
            color={roleConfig.color}
            sx={{ 
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 16,
              '& .MuiChip-icon': { fontSize: 10 }
            }}
          />
          
          {contact.leadStatus && (
            <Chip
              icon={tempConfig.icon}
              label={tempConfig.label}
              size="small"
              sx={{ 
                background: tempConfig.gradient,
                color: 'white',
                fontWeight: 700,
                fontSize: '0.65rem',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                height: 16,
                '& .MuiChip-icon': { fontSize: 10 }
              }}
            />
          )}
          
          {contact.lastContactDate && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', ml: 'auto' }}>
              Last contact: {new Date(contact.lastContactDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </CardContent>

      <Box 
        className="quick-actions"
        sx={{
          position: 'absolute',
          top: '50%',
          right: 12,
          transform: 'translateY(-50%) translateX(8px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          opacity: 0,
          transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 2
        }}
      >
        <Tooltip title="Send Email" placement="left">
          <IconButton
            size="small"
            onClick={handleEmail}
            disabled={!contact.primaryEmail}
            sx={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              '&:hover': { 
                background: 'white',
                transform: 'scale(1.1)'
              },
              '&:disabled': {
                background: 'rgba(200,200,200,0.5)'
              }
            }}
          >
            <EmailIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Call" placement="left">
          <IconButton
            size="small"
            onClick={handleCall}
            disabled={!contact.primaryPhone}
            sx={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              '&:hover': { 
                background: 'white',
                transform: 'scale(1.1)'
              },
              '&:disabled': {
                background: 'rgba(200,200,200,0.5)'
              }
            }}
          >
            <PhoneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add to Deal" placement="left">
          <IconButton
            size="small"
            onClick={handleAddToDeal}
            sx={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              '&:hover': { 
                background: 'white',
                transform: 'scale(1.1)'
              }
            }}
          >
            <PersonAddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="View Details" placement="left">
          <IconButton
            size="small"
            onClick={handleViewDetails}
            sx={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              '&:hover': { 
                background: 'white',
                transform: 'scale(1.1)'
              }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

export default React.memo(EnhancedContactCard);
