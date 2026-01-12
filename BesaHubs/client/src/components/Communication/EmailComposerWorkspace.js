import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  Chip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Save as SaveIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useCommunication } from '../../contexts/CommunicationContext';
import api from '../../services/api';

const EmailComposerWorkspace = () => {
  const { emailDrawerOpen, setEmailDrawerOpen, selectedContact } = useCommunication();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emailHistory, setEmailHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailDrawerOpen) {
      fetchEmailHistory();
      if (selectedContact && selectedContact.primaryEmail) {
        setTo(selectedContact.primaryEmail);
      }
    }
  }, [emailDrawerOpen, selectedContact]);

  const fetchEmailHistory = async () => {
    try {
      const response = await api.get('/communications/emails?limit=10');
      setEmailHistory(response.data);
    } catch (error) {
      console.error('Error fetching email history:', error);
    }
  };

  const handleSendEmail = async (send = false) => {
    if (!to || !subject || !body) {
      alert('Please fill in To, Subject, and Body fields');
      return;
    }

    setLoading(true);
    try {
      const emailData = {
        to,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        body,
        contactId: selectedContact?.id || null,
        send
      };

      await api.post('/communications/emails', emailData);
      alert(send ? 'Email logged as sent' : 'Email saved as draft');
      resetForm();
      fetchEmailHistory();
    } catch (error) {
      console.error('Error saving email:', error);
      alert('Failed to save email');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
  };

  const handleClose = () => {
    setEmailDrawerOpen(false);
    resetForm();
  };

  return (
    <Drawer
      anchor="right"
      open={emailDrawerOpen}
      onClose={handleClose}
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ width: 500, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            Email Composer
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedContact && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Contact
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {selectedContact.firstName} {selectedContact.lastName}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="CC"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="cc@example.com (optional)"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="BCC"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            placeholder="bcc@example.com (optional)"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Body"
            multiline
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Compose your email..."
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleSendEmail(true)}
              disabled={loading}
              startIcon={<SendIcon />}
            >
              {loading ? 'Sending...' : 'Send & Log'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleSendEmail(false)}
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              Save Draft
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Recent Emails
          </Typography>
          <List>
            {emailHistory.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No email history yet
              </Typography>
            ) : (
              emailHistory.map((email) => (
                <ListItem
                  key={email.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {email.subject}
                    </Typography>
                    <Chip
                      label={email.status}
                      size="small"
                      color={email.status === 'sent' ? 'success' : 'default'}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    To: {email.to} • {new Date(email.createdAt).toLocaleString()}
                  </Typography>
                  {email.body && (
                    <Typography variant="caption" sx={{ mt: 1 }} noWrap>
                      {email.body.substring(0, 100)}...
                    </Typography>
                  )}
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default EmailComposerWorkspace;
