import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Paper,
  CircularProgress, Alert, Chip, LinearProgress, List,
  ListItem, ListItemText, ListItemIcon, Avatar, Divider
} from '@mui/material';
import {
  Email, Phone, Sms, WhatsApp, TrendingUp, TrendingDown,
  Reply, OpenInNew, Schedule, CheckCircle, Error, AccessTime
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import communicationsApi from '../../services/communicationsApi';

const CommunicationAnalytics = ({ analytics }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('7d');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getResponseRate = () => {
    const { email } = analytics.responseRate;
    if (email.sent === 0) return 0;
    return ((email.replied / email.sent) * 100).toFixed(1);
  };

  const getCommunicationTypeData = () => {
    return Object.entries(analytics.byType).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      icon: type === 'email' ? <Email /> : 
            type === 'call' ? <Phone /> :
            type === 'sms' ? <Sms /> : <WhatsApp />
    }));
  };

  const getDailyActivityData = () => {
    return analytics.dailyActivity.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: day.total,
      email: day.email,
      call: day.call,
      sms: day.sms,
      whatsapp: day.whatsapp
    }));
  };

  const getDirectionData = () => {
    return [
      { name: 'Inbound', value: analytics.byDirection.inbound, color: '#00C49F' },
      { name: 'Outbound', value: analytics.byDirection.outbound, color: '#0088FE' }
    ];
  };

  return (
    <Box>
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Email />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(analytics.totalCommunications)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Communications
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="caption" color="success.main">
                  +12% from last week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Reply />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {getResponseRate()}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Email Response Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="caption" color="success.main">
                  +5% from last week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <OpenInNew />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {analytics.responseRate.email.sent}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Emails Sent
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="caption" color="success.main">
                  +8% from last week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Phone />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {analytics.byType.call}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Calls Made
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="error" sx={{ mr: 1 }} />
                <Typography variant="caption" color="error.main">
                  -3% from last week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Daily Activity Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Communication Activity
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getDailyActivityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="email" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="call" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="sms" stroke="#ffc658" strokeWidth={2} />
                    <Line type="monotone" dataKey="whatsapp" stroke="#25D366" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Communication Types Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Communication Types
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCommunicationTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCommunicationTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Direction Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inbound vs Outbound
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDirectionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Communication Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Communication Breakdown
              </Typography>
              <List>
                {getCommunicationTypeData().map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: COLORS[index % COLORS.length], width: 32, height: 32 }}>
                        {item.icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(item.value / analytics.totalCommunications) * 100}
                            sx={{ flexGrow: 1, mr: 2 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {item.value}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {getResponseRate()}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email Response Rate
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                      <Typography variant="caption" color="success.main">
                        Above industry average
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info" sx={{ fontWeight: 'bold' }}>
                      {analytics.byDirection.inbound}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inbound Communications
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <TrendingUp color="success" sx={{ mr: 1 }} />
                      <Typography variant="caption" color="success.main">
                        +15% this week
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning" sx={{ fontWeight: 'bold' }}>
                      {analytics.byDirection.outbound}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Outbound Communications
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <TrendingUp color="success" sx={{ mr: 1 }} />
                      <Typography variant="caption" color="success.main">
                        +8% this week
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CommunicationAnalytics;
