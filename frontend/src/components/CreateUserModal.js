import React, { useState } from 'react';
import { s3UsersApi } from '../services/api';

/**
 * Modal for creating a new S3 user.
 *
 * Flow:
 *  1. User enters a username and optional comment, then submits.
 *  2. Backend calls NetApp SVM API and returns access_key + secret_key.
 *  3. The secret_key is displayed once with a prominent warning.
 *  4. Closing the modal calls onCreated() so the parent can refresh its list.
 */
const CreateUserModal = ({ environment, onCreated, onCancel }) => {
  const [step, setStep] = useState('form'); // 'form' | 'loading' | 'secret'
  const [username, setUsername] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setStep('loading');
    setError(null);

    try {
      const result = await s3UsersApi.createUser(
        environment,
        username.trim(),
        comment.trim() || null,
      );
      setCreatedUser(result);
      setStep('secret');
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to create user. Please try again.';
      setError(msg);
      setStep('form');
    }
  };

  const handleCopy = () => {
    if (createdUser?.secret_key) {
      navigator.clipboard.writeText(createdUser.secret_key).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleClose = () => {
    onCreated();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* ---- Form step ---- */}
        {(step === 'form' || step === 'loading') && (
          <>
            <h2 style={styles.title}>Create S3 User</h2>
            <p style={styles.hint}>
              A user will be created on the NetApp SVM
              {environment && (
                <span style={styles.envTag}> ({environment})</span>
              )}
              . The access key will be stored; the secret key is shown only once.
            </p>

            {error && <div style={styles.errorBanner}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>
                Username <span style={styles.required}>*</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. john.doe"
                  autoFocus
                  disabled={step === 'loading'}
                  required
                />
              </label>

              <label style={styles.label}>
                Comment
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={styles.textarea}
                  placeholder="Optional description for this user"
                  rows={2}
                  disabled={step === 'loading'}
                />
              </label>

              <div style={styles.buttonRow}>
                <button
                  type="button"
                  onClick={onCancel}
                  style={styles.cancelButton}
                  disabled={step === 'loading'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={step === 'loading' || !username.trim()}
                >
                  {step === 'loading' ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ---- Secret display step ---- */}
        {step === 'secret' && createdUser && (
          <>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.title}>User Created</h2>

            <div style={styles.warningBanner}>
              <strong>Important:</strong> The secret key below will only be
              displayed once. Copy it now and store it securely — it cannot be
              retrieved again.
            </div>

            <div style={styles.credentialBlock}>
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Environment</span>
                <code style={styles.credValue}>{createdUser.environment}</code>
              </div>
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Username</span>
                <code style={styles.credValue}>{createdUser.username}</code>
              </div>
              {createdUser.comment && (
                <div style={styles.credRow}>
                  <span style={styles.credLabel}>Comment</span>
                  <span style={styles.credValueText}>{createdUser.comment}</span>
                </div>
              )}
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Access Key</span>
                <code style={styles.credValue}>{createdUser.access_key}</code>
              </div>
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Secret Key</span>
                <div style={styles.secretRow}>
                  <code style={{ ...styles.credValue, ...styles.secretCode }}>
                    {createdUser.secret_key}
                  </code>
                  <button onClick={handleCopy} style={styles.copyButton}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              {createdUser.key_expiry_time && (
                <div style={styles.credRow}>
                  <span style={styles.credLabel}>Key Expires</span>
                  <span style={styles.credValueText}>
                    {new Date(createdUser.key_expiry_time).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div style={styles.buttonRow}>
              <button onClick={handleClose} style={styles.submitButton}>
                I have saved the secret key
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  successIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#27ae60',
    color: 'white',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a2332',
    margin: '0 0 12px 0',
    textAlign: 'center',
  },
  hint: {
    fontSize: '14px',
    color: '#6b7a99',
    marginBottom: '20px',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fdecea',
    border: '1px solid #f5c6cb',
    color: '#c0392b',
    padding: '10px 14px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  warningBanner: {
    backgroundColor: '#fff8e1',
    border: '1px solid #ffe082',
    color: '#856404',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d9e6',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d9e6',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  envTag: {
    fontWeight: '700',
    color: '#2563eb',
  },
  required: {
    color: '#ef4444',
    fontWeight: '700',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #d1d9e6',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
  },
  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  credentialBlock: {
    backgroundColor: '#f8faff',
    border: '1px solid #d1d9e6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  credRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  credLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6b7a99',
  },
  credValue: {
    fontSize: '13px',
    color: '#1a2332',
    backgroundColor: '#eef2fa',
    padding: '6px 10px',
    borderRadius: '4px',
    wordBreak: 'break-all',
  },
  secretRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  secretCode: {
    flex: 1,
    border: '2px solid #f0b429',
    backgroundColor: '#fffbea',
  },
  copyButton: {
    padding: '6px 12px',
    border: '1px solid #d1d9e6',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  credValueText: {
    fontSize: '13px',
    color: '#1a2332',
    padding: '6px 10px',
    lineHeight: '1.5',
  },
};

export default CreateUserModal;
