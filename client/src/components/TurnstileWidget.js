import React, { useState, useRef } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Box, Alert } from '@mui/material';

const TurnstileWidget = ({ onSuccess, onError, onExpire }) => {
  const [error, setError] = useState(null);
  const turnstileRef = useRef(null);

  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

  const handleSuccess = (token) => {
    setError(null);
    if (onSuccess) {
      onSuccess(token);
    }
  };

  const handleError = (errorCode) => {
    const errorMessage = 'Captcha verification failed. Please try again.';
    setError(errorMessage);
    if (onError) {
      onError(errorCode);
    }
  };

  const handleExpire = () => {
    setError('Captcha expired. Please verify again.');
    if (onExpire) {
      onExpire();
    }
  };

  if (!siteKey) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        options={{
          theme: 'light',
          size: 'normal',
        }}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default TurnstileWidget;
