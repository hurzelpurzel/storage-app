import React, { useState } from 'react';
import { authApi } from '../services/api';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import AuthBar from './AuthBar';

const PKCE_VERIFIER_KEY = 'pkce_code_verifier';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Generate PKCE pair in the browser
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // 2. Persist the verifier — it must survive the full-page redirect to Azure
      sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

      // 3. Ask the backend for the auth URL, passing the challenge
      const data = await authApi.getLoginUrl(challenge);
      if (data.enabled && data.login_url) {
        window.location.href = data.login_url;
      } else {
        setError('Authentication is not configured on the server.');
      }
    } catch (err) {
      setError('Failed to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <AuthBar />
      <div style={styles.centred}>
        <div style={styles.card}>
          <h1 style={styles.title}>Storage Management</h1>
          <p style={styles.subtitle}>
            Sign in with your organisational account to continue.
          </p>
          {error && <p style={styles.error}>{error}</p>}
          <button
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Redirecting…' : 'Sign in with Microsoft'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    flexDirection: 'column',
  },
  centred: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a2332',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7a99',
    margin: '0 0 32px 0',
    lineHeight: '1.6',
  },
  button: {
    display: 'inline-block',
    padding: '12px 28px',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4e8',
    cursor: 'not-allowed',
  },
  error: {
    color: '#c0392b',
    fontSize: '13px',
    marginBottom: '16px',
  },
};

export default LoginPage;
