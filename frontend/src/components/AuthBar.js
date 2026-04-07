import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Thin status bar shown at the top of every screen.
 * - When authenticated: shows "Logged in as <username>" + Logout button.
 * - When not authenticated: shows "Not logged in".
 */
const AuthBar = () => {
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <div style={styles.bar}>
      {isAuthenticated ? (
        <>
          <span style={styles.status}>
            <span style={styles.dot} /> Logged in as{' '}
            <strong style={styles.username}>{username || 'unknown'}</strong>
          </span>
          <button style={styles.logoutBtn} onClick={logout}>
            Sign out
          </button>
        </>
      ) : (
        <span style={{ ...styles.status, ...styles.statusAnon }}>
          <span style={{ ...styles.dot, ...styles.dotAnon }} /> Not logged in
        </span>
      )}
    </div>
  );
};

const styles = {
  bar: {
    width: '100%',
    backgroundColor: '#1a2332',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '6px 20px',
    fontSize: '13px',
    boxSizing: 'border-box',
    gap: '16px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusAnon: {
    color: '#94a3b8',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    display: 'inline-block',
    flexShrink: 0,
  },
  dotAnon: {
    backgroundColor: '#64748b',
  },
  username: {
    fontWeight: '600',
    color: '#f1f5f9',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #475569',
    borderRadius: '4px',
    color: '#cbd5e1',
    fontSize: '12px',
    padding: '3px 10px',
    cursor: 'pointer',
  },
};

export default AuthBar;
