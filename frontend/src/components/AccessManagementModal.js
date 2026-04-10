import React, { useState, useEffect } from 'react';
import { s3BucketsApi } from '../services/api';

const AccessManagementModal = ({ isOpen, onClose, bucketUuid, bucketName, environment }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userList, setUserList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && bucketUuid) {
      fetchAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, bucketUuid]);

  const fetchAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await s3BucketsApi.getBucketAccess(environment, bucketUuid);
      setUserList(res.access_list || []);
    } catch (err) {
      setError('Failed to fetch identity mappings for bucket. ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAccessChange = (username, accessLevel) => {
    setUserList((prev) =>
      prev.map((u) => (u.username === username ? { ...u, access: accessLevel } : u))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await s3BucketsApi.updateBucketAccess(environment, bucketUuid, userList);
      onClose(); // Auto-close natively on completely successful push
    } catch (err) {
      setError('Failed to orchestrate access changes natively: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            Manage IAM Access
            <span style={styles.badge}>{bucketName}</span>
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}
          
          {loading ? (
            <div style={styles.loading}>Resolving active S3 Identity Groups natively...</div>
          ) : userList.length === 0 ? (
            <div style={styles.empty}>
              No S3 Users strictly owned by your database account were discovered in this environment. Please natively create one!
            </div>
          ) : (
            <div style={styles.grid}>
                {userList.map((user) => (
                    <div key={user.username} style={styles.row}>
                        <div style={styles.username}>
                          <strong>{user.username}</strong>
                        </div>
                        <div style={styles.toggles}>
                          <label style={styles.label}>
                            <input
                              type="radio"
                              name={`access_${user.username}`}
                              value="none"
                              checked={user.access === 'none'}
                              onChange={() => handleAccessChange(user.username, 'none')}
                              style={styles.radio}
                            />
                            No Access
                          </label>
                          <label style={styles.label}>
                            <input
                              type="radio"
                              name={`access_${user.username}`}
                              value="read"
                              checked={user.access === 'read'}
                              onChange={() => handleAccessChange(user.username, 'read')}
                              style={styles.radio}
                            />
                            Read-Only
                          </label>
                          <label style={styles.label}>
                            <input
                              type="radio"
                              name={`access_${user.username}`}
                              value="full"
                              checked={user.access === 'full'}
                              onChange={() => handleAccessChange(user.username, 'full')}
                              style={styles.radio}
                            />
                            Full Access
                          </label>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button 
            style={{ ...styles.saveBtn, ...(saving ? styles.savingBtn : {}) }} 
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Orchestrating Changes...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '550px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxHeight: '85vh',
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badge: {
    padding: '4px 10px',
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    lineHeight: '1',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: '6px',
    border: '1px solid #fecaca',
    marginBottom: '16px',
    fontSize: '13px',
  },
  loading: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  username: {
    fontSize: '14px',
    color: '#334155',
  },
  toggles: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
  },
  radio: {
    cursor: 'pointer',
    accentColor: '#3b82f6',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  cancelBtn: {
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  saveBtn: {
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  savingBtn: {
    backgroundColor: '#93c5fd',
    cursor: 'wait',
  },
};

export default AccessManagementModal;
