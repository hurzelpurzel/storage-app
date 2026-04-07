import React, { useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PKCE_VERIFIER_KEY = 'pkce_code_verifier';

/**
 * Handles the redirect back from the OIDC provider.
 * Reads the code_verifier from sessionStorage (stored before the redirect),
 * exchanges the auth code + verifier for a JWT, then cleans up.
 */
const OAuthCallback = () => {
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const isAuthenticating = React.useRef(false); // Track if we've already started

  useEffect(() => {
    // In React 18 Strict Mode, useEffect runs twice. Prevent the second fire.
    if (isAuthenticating.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const oauthError = params.get('error');
    const oauthErrorDesc = params.get('error_description');

    if (oauthError) {
      setError(`Login failed: ${oauthErrorDesc || oauthError}`);
      window.history.replaceState({}, document.title, '/');
      return;
    }

    if (!code) {
      setError('No authorisation code found in the callback URL.');
      return;
    }

    const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if (!codeVerifier) {
      setError('PKCE verifier missing — please try signing in again.');
      window.history.replaceState({}, document.title, '/');
      return;
    }

    // Mark as started so double-renders don't hit this
    isAuthenticating.current = true;
    
    // Verifier is single-use — remove it before the async call
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);

    authApi
      .handleCallback(code, codeVerifier)
      .then((data) => {
        if (data.access_token) {
          // Store token and username, then strip ?code=... from the URL.
          login(data.access_token, data.username || null);
          window.history.replaceState({}, document.title, '/');
        } else {
          setError('Server did not return an access token.');
        }
      })
      .catch((err) => {
        const detail = err.response?.data?.detail || err.message;
        setError(`Authentication failed: ${detail}`);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.error}>{error}</p>
          <a href="/" style={styles.link}>Return to home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.message}>Completing sign-in…</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
    padding: '40px',
    textAlign: 'center',
  },
  message: {
    color: '#6b7a99',
    fontSize: '15px',
  },
  error: {
    color: '#c0392b',
    fontSize: '14px',
    marginBottom: '16px',
  },
  link: {
    color: '#0078d4',
    fontSize: '14px',
  },
};

export default OAuthCallback;
