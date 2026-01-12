import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Stack
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  Home,
  BugReport
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external error tracking service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In production, send to error tracking service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Mock external logging - replace with actual service
    console.log('Error reported to tracking service:', errorReport);
    
    // Optional: Send to backend
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(err => console.log('Could not send error to backend:', err));
    } catch (e) {
      // Fail silently
    }
  };

  handleRefresh = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReportIssue = () => {
    const issueBody = `
**Error ID:** ${this.state.errorId}
**Timestamp:** ${new Date().toISOString()}
**URL:** ${window.location.href}

**Error Message:**
${this.state.error?.message || 'Unknown error'}

**Stack Trace:**
\`\`\`
${this.state.error?.stack || 'No stack trace available'}
\`\`\`

**Component Stack:**
\`\`\`
${this.state.errorInfo?.componentStack || 'No component stack available'}
\`\`\`

**User Agent:**
${navigator.userAgent}

**Additional Context:**
Please describe what you were doing when this error occurred.
    `.trim();

    const issueUrl = `https://github.com/your-org/your-repo/issues/new?title=Application Error: ${encodeURIComponent(this.state.error?.message || 'Unknown error')}&body=${encodeURIComponent(issueBody)}`;
    
    window.open(issueUrl, '_blank');
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'error.main' }}>
                Oops! Something went wrong
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </Typography>

              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Error Details:
                </Typography>
                <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  Error ID: {this.state.errorId}<br />
                  {this.state.error?.message || 'Unknown error occurred'}
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRefresh}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go Home
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<BugReport />}
                  onClick={this.handleReportIssue}
                >
                  Report Issue
                </Button>
              </Stack>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 4, textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Development Debug Info:
                  </Typography>
                  
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {this.state.error.stack}
                    </Typography>
                  </Alert>

                  {this.state.errorInfo && (
                    <Alert severity="info">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                        Component Stack:
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;