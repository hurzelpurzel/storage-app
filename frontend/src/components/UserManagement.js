import React, { useState, useEffect } from 'react';
import { s3UsersApi } from '../services/api';
import CreateUserModal from './CreateUserModal';

const UserManagement = ({ environment }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Reload whenever the selected environment changes
  useEffect(() => {
    if (environment) loadUsers();
    else setUsers([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await s3UsersApi.listUsers(environment);
      setUsers(data.data || []);
    } catch (err) {
      setError('Failed to load S3 users.');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    loadUsers();
  };

  const handleDeleteUser = async (userEnv, username) => {
    if (!window.confirm(`Are you sure you want to completely delete S3 user '${username}'?`)) return;
    
    try {
      setLoading(true);
      setError(null);
      await s3UsersApi.deleteUser(userEnv, username);
      await loadUsers(); // Refresh grid automatically
    } catch (err) {
      setError('Failed to delete S3 user. ' + (err.response?.data?.detail || err.message));
      setLoading(false); // Only toggle loading false on err, loadUsers toggles it on success
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>User Management</h2>
          <p style={styles.subtitle}>
            S3 users provisioned via NetApp SVM
            {environment && (
              <span style={styles.envTag}>{environment}</span>
            )}
          </p>
        </div>
        <button
          style={{
            ...styles.createButton,
            ...((!environment) ? styles.createButtonDisabled : {}),
          }}
          onClick={() => setShowCreateModal(true)}
          disabled={!environment}
        >
          + New User
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button style={styles.dismissButton} onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {!environment ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No environment selected.</p>
          <p style={styles.emptyHint}>
            Choose an environment from the dropdown above.
          </p>
        </div>
      ) : loading ? (
        <div style={styles.loadingState}>Loading users…</div>
      ) : users.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No S3 users yet.</p>
          <p style={styles.emptyHint}>
            Click <strong>+ New User</strong> to provision one.
          </p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Access Key</th>
                <th style={styles.th}>Comment</th>
                <th style={styles.th}>Key Expires</th>
                <th style={styles.th}>Created At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>
                    <code style={styles.codeCell}>{user.username}</code>
                  </td>
                  <td style={styles.td}>
                    <code style={styles.codeCell}>{user.access_key}</code>
                  </td>
                  <td style={{ ...styles.td, ...styles.commentCell }}>
                    {user.comment || <span style={styles.nil}>—</span>}
                  </td>
                  <td style={{ ...styles.td, ...styles.dateCell }}>
                    {user.key_expiry_time
                      ? formatDate(user.key_expiry_time)
                      : <span style={styles.nil}>—</span>}
                  </td>
                  <td style={{ ...styles.td, ...styles.dateCell }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDeleteUser(user.environment, user.username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateUserModal
          environment={environment}
          onCreated={handleUserCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a2332',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7a99',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  envTag: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#eff4ff',
    color: '#2563eb',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
  },
  createButton: {
    padding: '9px 18px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  errorBanner: {
    backgroundColor: '#fdecea',
    border: '1px solid #f5c6cb',
    color: '#c0392b',
    padding: '10px 14px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#c0392b',
    lineHeight: 1,
  },
  loadingState: {
    padding: '32px',
    textAlign: 'center',
    color: '#6b7a99',
    fontSize: '14px',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#f8faff',
    borderRadius: '8px',
    border: '1px dashed #d1d9e6',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a2332',
    margin: '0 0 8px 0',
  },
  emptyHint: {
    fontSize: '14px',
    color: '#6b7a99',
    margin: 0,
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e0e7f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f4f6f9',
    borderBottom: '1px solid #e0e7f0',
    fontWeight: '600',
    color: '#6b7a99',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f0f2f7',
  },
  td: {
    padding: '12px 16px',
    color: '#1a2332',
    verticalAlign: 'middle',
  },
  codeCell: {
    fontSize: '13px',
    backgroundColor: '#eef2fa',
    padding: '3px 7px',
    borderRadius: '4px',
    color: '#1a2332',
  },
  commentCell: {
    fontSize: '13px',
    color: '#475569',
    maxWidth: '200px',
  },
  dateCell: {
    color: '#6b7a99',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  nil: {
    color: '#cbd5e1',
  },
  createButtonDisabled: {
    backgroundColor: '#93c5fd',
    cursor: 'not-allowed',
  },
  deleteButton: {
    padding: '4px 10px',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fee2e2',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
};

export default UserManagement;
