import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Checkbox,
  Divider,
  Alert,
  useTheme,
  Button
} from '@mui/material';
import {
  TrendingUp,
  Home,
  AttachMoney,
  People,
  Assignment,
  MoreVert,
  ArrowForward,
  Phone,
  Visibility,
  Description,
  AccessTime,
  CheckCircleOutline,
  AccountBalance
} from '@mui/icons-material';
import leaseApi from '../../services/leaseApi';
import debtApi from '../../services/debtApi';
import { taskApi, propertyApi, contactApi, dealApi } from '../../services/api';
import useScrollReveal from '../../utils/useScrollReveal';
import { CardSkeleton } from '../../components/Common/LoadingSkeletons';
import UpcomingMeetingsWidget from '../../components/Dashboard/UpcomingMeetingsWidget';
import UpcomingTasksWidget from '../../components/Dashboard/UpcomingTasksWidget';
import CalendarWidget from '../../components/Dashboard/CalendarWidget';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [activitySectionRef, activityVisible] = useScrollReveal({ threshold: 0.1 });

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeDeals: 0,
    totalContacts: 0,
    monthlyRevenue: 0
  });
  const [statsError, setStatsError] = useState(null);

  const [leasesExpiring, setLeasesExpiring] = useState(0);
  const [leasesExpiringThreeMonths, setLeasesExpiringThreeMonths] = useState(0);
  const [debtMaturing, setDebtMaturing] = useState(0);
  const [totalDebtValue, setTotalDebtValue] = useState('0.0');

  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [pipelineData, setPipelineData] = useState({});
  const [pipelineLoading, setPipelineLoading] = useState(true);

  useEffect(() => {
    const fetchLeaseData = async () => {
      try {
        const response12Months = await leaseApi.getExpiringLeases(365);
        const response3Months = await leaseApi.getExpiringLeases(90);
        
        if (response12Months?.leases) {
          setLeasesExpiring(response12Months.leases.length);
        }
        
        if (response3Months?.leases) {
          setLeasesExpiringThreeMonths(response3Months.leases.length);
        }
      } catch (error) {
        console.error('Failed to fetch lease data:', error);
      }
    };

    const fetchDebtData = async () => {
      try {
        const response = await debtApi.getMaturingDebts(365);
        
        if (response?.debts) {
          setDebtMaturing(response.debts.length);
          
          const totalValue = response.debts.reduce((sum, debt) => {
            return sum + (parseFloat(debt.amount) || 0);
          }, 0);
          
          setTotalDebtValue((totalValue / 1000000).toFixed(1));
        }
      } catch (error) {
        console.error('Failed to fetch debt data:', error);
      }
    };

    fetchLeaseData();
    fetchDebtData();
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setStatsError(null);

        const [propertiesRes, contactsRes, dealsRes] = await Promise.all([
          propertyApi.getAll({ page: 1, limit: 1 }),
          contactApi.getAll({ page: 1, limit: 1 }),
          dealApi.getAll({ page: 1, limit: 1 })
        ]);

        const activeDealsCount = dealsRes.data?.pagination?.totalItems || 0;
        const totalPropertiesCount = propertiesRes.data?.pagination?.totalItems || 0;
        const totalContactsCount = contactsRes.data?.pagination?.totalItems || 0;

        const closedDealsRes = await dealApi.getAll({ stage: 'won', page: 1, limit: 100 });
        const closedDeals = closedDealsRes.data?.deals || [];
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = closedDeals
          .filter(deal => {
            const closeDate = new Date(deal.actualCloseDate);
            return closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear;
          })
          .reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);

        setStats({
          totalProperties: totalPropertiesCount,
          activeDeals: activeDealsCount,
          totalContacts: totalContactsCount,
          monthlyRevenue: Math.round(monthlyRevenue)
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStatsError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      try {
        setTasksLoading(true);
        const response = await taskApi.getAll({ 
          status: 'pending',
          sortBy: 'dueDate',
          sortOrder: 'ASC',
          limit: 5
        });

        const tasks = (response.data?.tasks || []).map(task => {
          const dueDate = new Date(task.dueDate);
          const now = new Date();
          const isToday = dueDate.toDateString() === now.toDateString();
          
          let timeString = dueDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          
          if (!isToday) {
            timeString = dueDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            }) + ' ' + timeString;
          }

          const taskType = task.taskType || 'other';
          
          return {
            id: task.id,
            title: task.title,
            client: task.contact?.firstName ? 
              `${task.contact.firstName} ${task.contact.lastName || ''}`.trim() : 
              task.contact?.companyName || task.property?.name || 'General',
            time: timeString,
            priority: task.priority || 'low',
            type: taskType,
            completed: task.status === 'completed',
            dueDate: task.dueDate
          };
        });

        setUpcomingTasks(tasks);
      } catch (error) {
        console.error('Failed to fetch upcoming tasks:', error);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchUpcomingTasks();
  }, []);


  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        setPipelineLoading(true);
        const response = await dealApi.getDealsByStage();
        
        if (response && response.dealsByStage) {
          setPipelineData(response.dealsByStage);
        } else {
          setPipelineData({});
        }
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
        setPipelineData({});
      } finally {
        setPipelineLoading(false);
      }
    };

    fetchPipelineData();
  }, []);

  const handleTaskToggle = useCallback(async (taskId) => {
    const task = upcomingTasks.find(t => t.id === taskId);
    if (!task) return;

    const optimisticUpdate = upcomingTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setUpcomingTasks(optimisticUpdate);

    try {
      if (!task.completed) {
        await taskApi.complete(taskId, { notes: 'Completed from dashboard' });
      } else {
        await taskApi.update(taskId, { status: 'pending' });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      setUpcomingTasks(upcomingTasks);
    }
  }, [upcomingTasks]);


  const getTaskIcon = useCallback((type) => {
    switch (type) {
      case 'call':
        return <Phone sx={{ fontSize: 18, color: theme.palette.primary.main }} />;
      case 'viewing':
        return <Visibility sx={{ fontSize: 18, color: theme.palette.success.main }} />;
      case 'document':
        return <Description sx={{ fontSize: 18, color: theme.palette.warning.main }} />;
      default:
        return <Assignment sx={{ fontSize: 18, color: theme.palette.grey[600] }} />;
    }
  }, [theme]);

  const statsCards = useMemo(() => [
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      change: '+12%',
      trend: 12,
      isPositive: true,
      icon: <Home sx={{ fontSize: 24, color: 'white' }} />,
      gradient: theme.palette.gradient.primary,
      link: '/properties'
    },
    {
      title: 'Active Deals',
      value: stats.activeDeals,
      change: '+8%',
      trend: 8,
      isPositive: true,
      icon: <AttachMoney sx={{ fontSize: 24, color: 'white' }} />,
      gradient: theme.palette.gradient.success,
      link: '/deals'
    },
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      change: '+15%',
      trend: 15,
      isPositive: true,
      icon: <People sx={{ fontSize: 24, color: 'white' }} />,
      gradient: theme.palette.gradient.info,
      link: '/contacts'
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      change: '+5%',
      trend: 5,
      isPositive: true,
      icon: <TrendingUp sx={{ fontSize: 24, color: 'white' }} />,
      gradient: theme.palette.gradient.secondary,
      link: '/analytics'
    },
    {
      title: 'Expiring Leases',
      value: leasesExpiring,
      change: `${leasesExpiringThreeMonths} in 3mo`,
      trend: null,
      isPositive: false,
      colorTheme: 'warning',
      icon: <AccessTime sx={{ fontSize: 24, color: 'white' }} />,
      gradient: theme.palette.gradient.warning,
      link: '/leases'
    },
    {
      title: 'Maturing Debt',
      value: debtMaturing,
      change: `$${totalDebtValue}M maturing`,
      trend: null,
      isPositive: false,
      colorTheme: 'error',
      icon: (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" style={{ display: 'block' }}>
            {/* Clock circle with dark blue/navy background */}
            <circle cx="12" cy="12" r="10" fill="#1a237e" stroke="#283593" strokeWidth="1.5"/>
            {/* Clock circle outline */}
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none"/>
            {/* Clock hour markers - white on dark background */}
            <circle cx="12" cy="5" r="1" fill="white"/>
            <circle cx="19" cy="12" r="1" fill="white"/>
            <circle cx="12" cy="19" r="1" fill="white"/>
            <circle cx="5" cy="12" r="1" fill="white"/>
            {/* Clock hands - white */}
            <line x1="12" y1="12" x2="12" y2="7.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="12" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Center dot - white */}
            <circle cx="12" cy="12" r="1.5" fill="white"/>
            {/* Dollar sign - gold/yellow for visibility */}
            <text x="12" y="17.5" textAnchor="middle" fill="#ffd700" fontSize="10" fontWeight="bold" fontFamily="system-ui, Arial, sans-serif">$</text>
          </svg>
        </Box>
      ),
      gradient: theme.palette.gradient.error,
      link: '/debt'
    }
  ], [stats, leasesExpiring, leasesExpiringThreeMonths, debtMaturing, totalDebtValue, theme]);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {statsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {statsError}
        </Alert>
      )}

      <Grid container spacing={2}>
        {isLoading ? (
          <CardSkeleton count={6} />
        ) : (
          statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: theme.shadows[10],
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.5s ease-out',
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: theme.shadows[20]
                  },
                  '&:active': {
                    transform: 'translateY(-6px) scale(0.98)'
                  }
                }}
                onClick={() => navigate(stat.link)}
              >
                <CardContent sx={{ p: 1.5 }}>
                  <Box 
                    sx={{
                      background: stat.gradient,
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      boxShadow: theme.shadows[10],
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'rotate(5deg) scale(1.1)'
                      }
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}

        <Grid item xs={12}>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
              Sales Pipeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visual overview of your deals across all pipeline stages
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: theme.shadows[10],
              p: 2
            }}
          >
            {pipelineLoading ? (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Box key={i} sx={{ flex: 1 }}>
                    <CardSkeleton count={1} />
                  </Box>
                ))}
              </Box>
            ) : (
              <Grid container spacing={1.5}>
                {['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((stage) => {
                  const deals = pipelineData[stage] || [];
                  const stageColors = {
                    lead: theme.palette.grey[500],
                    qualified: theme.palette.info.main,
                    proposal: theme.palette.warning.main,
                    negotiation: theme.palette.secondary.main,
                    won: theme.palette.success.main,
                    lost: theme.palette.error.main
                  };
                  const stageLabels = {
                    lead: 'Lead',
                    qualified: 'Qualified',
                    proposal: 'Proposal',
                    negotiation: 'Negotiation',
                    won: 'Won',
                    lost: 'Lost'
                  };
                  
                  return (
                    <Grid item xs={6} sm={4} md={2} key={stage}>
                      <Card
                        onClick={() => navigate('/pipeline')}
                        sx={{
                          p: 1.5,
                          textAlign: 'center',
                          cursor: 'pointer',
                          border: `2px solid ${stageColors[stage]}`,
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8],
                            borderColor: stageColors[stage],
                            bgcolor: `${stageColors[stage]}10`
                          }
                        }}
                      >
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700,
                            color: stageColors[stage],
                            mb: 0.5
                          }}
                        >
                          {deals.length}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem'
                          }}
                        >
                          {stageLabels[stage]}
                        </Typography>
                        {deals.length > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block',
                              mt: 0.5,
                              color: 'text.secondary'
                            }}
                          >
                            ${deals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0).toLocaleString()}
                          </Typography>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/pipeline')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                View Full Pipeline
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box 
            ref={activitySectionRef}
            sx={{ 
              mt: 2, 
              mb: 1,
              opacity: activityVisible ? 1 : 0,
              transform: activityVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
              Upcoming Tasks & Meetings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay organized with your upcoming to-dos and calendar events
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <UpcomingMeetingsWidget />
        </Grid>

        <Grid item xs={12} md={4}>
          <UpcomingTasksWidget limit={5} />
        </Grid>

        <Grid item xs={12} md={4}>
          <CalendarWidget limit={5} />
        </Grid>

        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: 3,
              height: '400px',
              display: 'flex',
              flexDirection: 'column',
              opacity: activityVisible ? 1 : 0,
              transform: activityVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.2s'
            }}
          >
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Today's Tasks
                </Typography>
                <IconButton 
                  size="small"
                  onClick={() => navigate('/tasks')}
                  sx={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'rotate(90deg)'
                    },
                    '&:active': {
                      transform: 'scale(0.9)'
                    }
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              {tasksLoading ? (
                <Box 
                  sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}
                >
                  <Typography variant="body2">Loading tasks...</Typography>
                </Box>
              ) : upcomingTasks.length === 0 ? (
                <Box 
                  sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}
                >
                  <CheckCircleOutline sx={{ fontSize: 48, mb: 1.5, opacity: 0.3 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    No tasks for today
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0.5 }}>
                    You're all caught up!
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0, overflow: 'auto', flex: 1, mx: -1 }}>
                  {upcomingTasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem 
                        sx={{ 
                          px: 1, 
                          py: 1,
                          alignItems: 'flex-start',
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <Checkbox
                          checked={task.completed}
                          onChange={() => handleTaskToggle(task.id)}
                          sx={{ 
                            mt: -0.5,
                            mr: 1.5,
                            color: 'primary.main',
                            '&.Mui-checked': {
                              color: 'success.main'
                            }
                          }}
                        />
                        <Box sx={{ mr: 1.5, mt: 0.5 }}>
                          {getTaskIcon(task.type)}
                        </Box>
                        <ListItemText
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                              <Typography 
                                component="span"
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: '0.9375rem',
                                  textDecoration: task.completed ? 'line-through' : 'none',
                                  color: task.completed ? 'text.disabled' : 'text.primary',
                                  flex: 1,
                                  mr: 1
                                }}
                              >
                                {task.title}
                              </Typography>
                              <Chip
                                size="small"
                                label={task.priority}
                                color={
                                  task.priority === 'high' ? 'error' :
                                  task.priority === 'medium' ? 'warning' : 'default'
                                }
                                sx={{ 
                                  fontSize: '0.75rem', 
                                  height: '24px',
                                  fontWeight: 600,
                                  minWidth: '60px'
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography 
                                component="span"
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ fontSize: '0.8125rem' }}
                              >
                                {task.client}
                              </Typography>
                              <Typography 
                                component="span"
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ mx: 0.75, fontSize: '0.8125rem' }}
                              >
                                •
                              </Typography>
                              <AccessTime sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                              <Typography 
                                component="span"
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                              >
                                {task.time}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < upcomingTasks.length - 1 && <Divider sx={{ my: 0.5 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
