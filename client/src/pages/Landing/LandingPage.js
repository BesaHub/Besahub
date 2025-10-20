import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  AppBar, Toolbar, IconButton, useTheme, useMediaQuery,
  Dialog, DialogContent, Tabs, Tab
} from '@mui/material';
import {
  TrendingUp, Business, Assignment, Analytics, Security,
  LocationOn, AccountBalance, Phone, Menu
} from '@mui/icons-material';
import Login from '../Auth/Login';
import Register from '../Auth/Register';

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [authDialog, setAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState(0);

  const features = [
    {
      icon: <Business sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Property Intelligence',
      description: 'Comprehensive property data with market analytics, ownership intelligence, and predictive insights.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Deal Acceleration',
      description: 'AI-powered pipeline management that accelerates deals by 30% with automated workflows.'
    },
    {
      icon: <Assignment sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Lead Management',
      description: 'Intelligent lead scoring and automated nurturing from LoopNet, Crexi, and other sources.'
    },
    {
      icon: <Analytics sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Market Analytics',
      description: 'Real-time market trends, comparable data, and predictive analytics for informed decisions.'
    },
    {
      icon: <Security sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Secure Platform',
      description: 'Bank-grade security with SOC 2 compliance, 2FA, and enterprise-level data protection.'
    },
    {
      icon: <LocationOn sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Territory Management',
      description: 'Geographic lead assignment with mapping integration and territory-based analytics.'
    }
  ];

  const stats = [
    { number: '$2.5B+', label: 'Transactions Managed' },
    { number: '15M+', label: 'Properties Tracked' },
    { number: '5,000+', label: 'Active Brokers' },
    { number: '99.9%', label: 'Uptime Guarantee' }
  ];

  const testimonials = [
    {
      quote: "This platform has transformed our deal velocity. We're closing 40% more transactions with the same team.",
      author: "Sarah Chen",
      title: "Managing Partner, Chen Commercial Group",
      company: "Tier 1 Brokerage"
    },
    {
      quote: "The predictive analytics helped us identify $50M in opportunities we would have missed.",
      author: "Marcus Rodriguez",
      title: "Senior Broker",
      company: "Metropolitan Real Estate"
    }
  ];

  return (
    <Box>
      {/* Header */}
      <AppBar position="fixed" sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AccountBalance sx={{ color: 'primary.main', mr: 1, fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              BesaHub
            </Typography>
          </Box>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Button color="inherit" sx={{ color: 'text.primary' }}>Features</Button>
              <Button color="inherit" sx={{ color: 'text.primary' }}>Pricing</Button>
              <Button color="inherit" sx={{ color: 'text.primary' }}>Resources</Button>
            </Box>
          )}
          <Box sx={{ ml: 2 }}>
            <Button
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={() => { setAuthTab(0); setAuthDialog(true); }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => { setAuthTab(1); setAuthDialog(true); }}
            >
              Start Free Trial
            </Button>
          </Box>
          {isMobile && (
            <IconButton>
              <Menu />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: 12,
          pb: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, lineHeight: 1.2 }}>
                The Most Powerful
                <Box component="span" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>
                  BesaHub CRM Platform
                </Box>
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.95, lineHeight: 1.6 }}>
                Accelerate deals, manage properties, and scale your commercial real estate business 
                with AI-powered insights and enterprise-grade tools trusted by 5,000+ brokers.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                  onClick={() => { setAuthTab(1); setAuthDialog(true); }}
                >
                  Start Free 30-Day Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  startIcon={<Phone />}
                >
                  Book Demo
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Live Dashboard Preview
                  </Typography>
                  <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={6}>
                      <Card sx={{ height: 80, bgcolor: 'rgba(255,255,255,0.95)' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                            $2.3M
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pipeline Value
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ height: 80, bgcolor: 'rgba(255,255,255,0.95)' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
                            23
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Deals
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                    {stat.number}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Everything You Need to Dominate Real Estate
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Built specifically for commercial real estate professionals with features that 
              accelerate deals and maximize your market advantage.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: 8, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', mb: 6 }}>
            Trusted by Industry Leaders
          </Typography>
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ p: 4, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{testimonial.quote}"
                  </Typography>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {testimonial.author}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.title}
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                      {testimonial.company}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
            Ready to Transform Your Business?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join 5,000+ commercial real estate professionals accelerating deals with BesaHub.
            Start your free 30-day trial today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
            }}
            onClick={() => { setAuthTab(1); setAuthDialog(true); }}
          >
            Start Free Trial - No Credit Card Required
          </Button>
        </Container>
      </Box>

      {/* Auth Dialog */}
      <Dialog
        open={authDialog}
        onClose={() => setAuthDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={authTab} onChange={(e, newValue) => setAuthTab(newValue)} centered>
            <Tab label="Sign In" />
            <Tab label="Sign Up" />
          </Tabs>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {authTab === 0 ? (
            <Login
              onSuccess={() => {
                console.log('🎉 LandingPage: Login onSuccess callback triggered');
                // Close dialog and force navigation to dashboard
                console.log('🚪 LandingPage: Closing auth dialog');
                setAuthDialog(false);
                // Force a navigation to dashboard after successful login
                console.log('🧭 LandingPage: Navigating to dashboard');
                window.location.href = '/dashboard';
              }}
              embedded={true}
            />
          ) : (
            <Register
              onSuccess={() => {
                // Close dialog and force navigation to dashboard
                setAuthDialog(false);
                // Force a navigation to dashboard after successful registration
                window.location.href = '/dashboard';
              }}
              embedded={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LandingPage;