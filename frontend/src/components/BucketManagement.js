import React, { useState, useEffect } from 'react';
import { s3BucketsApi } from '../services/api';
import AccessManagementModal from './AccessManagementModal';

const BucketManagement = ({ environment }) => {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bucketName, setBucketName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  
  // Details Modal variables
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDetailsPayload, setActiveDetailsPayload] = useState(null);
  
  // Access Orchestration hooks
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [targetAccessBucket, setTargetAccessBucket] = useState({ uuid: null, name: null });

  useEffect(() => {
    if (environment) loadBuckets();
    else setBuckets([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment]);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await s3BucketsApi.listBuckets(environment);
      setBuckets(res.data || []);
    } catch (err) {
      setError('Failed to load S3 buckets.');
      console.error('Load buckets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBucket = async (e) => {
    e.preventDefault();
    if (!environment) return;
    if (!bucketName.trim()) {
      setActionError('Bucket name is required.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      await s3BucketsApi.createBucket(environment, bucketName.trim());
      setBucketName('');
      await loadBuckets();
    } catch (err) {
      setActionError('Failed to create bucket. ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBucket = async (bucketUuid, name) => {
    if (bucketUuid === 'pending') {
      alert("This bucket is still 'pending' creation on the NetApp array. Please press the Refresh button to synchronize its UUID before deleting.");
      return;
    }
    
    if (!window.confirm(`Are you absolutely sure you want to completely delete S3 bucket '${name}'?`)) return;
    
    try {
      setLoading(true);
      setError(null);
      await s3BucketsApi.deleteBucket(environment, bucketUuid);
      await loadBuckets();
    } catch (err) {
      setError('Failed to delete bucket. ' + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  const handleFetchDetails = async (bucketUuid) => {
    try {
      setActiveDetailsPayload(null);
      setDetailsLoading(true);
      setDetailsModalOpen(true);
      const data = await s3BucketsApi.getBucketDetails(environment, bucketUuid);
      setActiveDetailsPayload(data);
    } catch (err) {
      setActiveDetailsPayload({ error: 'Failed to fetch details.', details: err.response?.data?.detail || err.message });
    } finally {
      setDetailsLoading(false);
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
          <h2 style={styles.title}>Bucket Management</h2>
          <p style={styles.subtitle}>
            S3 Buckets permanently anchored to SVM
            {environment && (
              <span style={styles.envTag}>{environment}</span>
            )}
          </p>
        </div>
        <button
          style={{
            ...styles.refreshButton,
            ...(!environment ? styles.createButtonDisabled : {}),
            ...(loading ? styles.refreshButtonLoading : {})
          }}
          onClick={loadBuckets}
          disabled={!environment || loading}
        >
          {loading ? 'Refreshing...' : '↻ Refresh Status'}
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button style={styles.dismissButton} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Creation Form */}
      {environment && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Provision New S3 Bucket</h3>
          <form onSubmit={handleCreateBucket} style={styles.formContainer}>
            <input
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="my-bucket-name"
              style={styles.input}
              disabled={actionLoading}
            />
            <button 
              type="submit" 
              style={{ ...styles.submitButton, ...(actionLoading && styles.createButtonDisabled) }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deploying...' : '+ Create Bucket'}
            </button>
          </form>
          {actionError && <div style={{...styles.errorBanner, marginTop: '10px'}}>{actionError}</div>}
        </div>
      )}

      {/* Data Grid */}
      {!environment ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No environment selected.</p>
          <p style={styles.emptyHint}>Choose an environment from the dropdown above.</p>
        </div>
      ) : loading && buckets.length === 0 ? (
        <div style={styles.loadingState}>Loading buckets…</div>
      ) : buckets.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No S3 buckets tracked.</p>
          <p style={styles.emptyHint}>Use the form above to provision one.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Bucket Name</th>
                <th style={styles.th}>Environment Role</th>
                <th style={styles.th}>Global UUID</th>
                <th style={styles.th}>Tracked Since</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => {
                const isPending = b.bucket_uuid === 'pending';
                const isDeleting = b.deletion === 'pending';
                return (
                  <tr key={b.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{b.name}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.envTag}>{b.environment}</span>
                    </td>
                    <td style={styles.td}>
                      {isPending ? (
                        <span style={styles.pendingBadge}>Pending Resolution...</span>
                      ) : (
                        <span 
                           style={{ ...styles.codeCell, ...styles.clickableCodeCell }} 
                           onClick={() => handleFetchDetails(b.bucket_uuid)}
                           title="Click to view full NetApp JSON proxy configuration."
                        >
                          {b.bucket_uuid}
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, color: '#6b7a99' }}>
                      {formatDate(b.created_at)}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtonGroup}>
                          {isDeleting ? (
                             <span style={styles.deletingBadge}>Deleting...</span>
                          ) : (
                             <button
                               style={isPending ? styles.deleteButtonDisabled : styles.deleteButton}
                               onClick={() => handleDeleteBucket(b.bucket_uuid, b.name)}
                               disabled={isPending}
                             >
                               Delete
                             </button>
                          )}
                          <button
                            style={isPending || isDeleting || !b.policies_ready ? styles.manageButtonDisabled : styles.manageButton}
                            onClick={() => {
                                setTargetAccessBucket({ uuid: b.bucket_uuid, name: b.name });
                                setAccessModalOpen(true);
                            }}
                            disabled={isPending || isDeleting || !b.policies_ready}
                            title={!b.policies_ready ? "Security groups are still provisioning..." : "Manage bucket permissions"}
                          >
                            {!b.policies_ready ? 'Provisioning...' : 'Manage Access'}
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* IAM Access Overlay Modal */}
      <AccessManagementModal
        isOpen={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        bucketUuid={targetAccessBucket.uuid}
        bucketName={targetAccessBucket.name}
        environment={environment}
      />

      {/* JSON Modal Overlay */}
      {detailsModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
             <div style={styles.modalHeader}>
               <h3 style={styles.modalTitle}>S3 Bucket Parameters</h3>
               <button onClick={() => setDetailsModalOpen(false)} style={styles.closeButton}>×</button>
             </div>
             <div style={styles.modalBody}>
               {detailsLoading ? (
                 <div style={styles.loadingState}>Fetching active NetApp configuration...</div>
               ) : (
                 <pre style={styles.jsonDump}>
                   {JSON.stringify(activeDetailsPayload, null, 2)}
                 </pre>
               )}
             </div>
          </div>
        </div>
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
  refreshButton: {
    padding: '9px 18px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  refreshButtonLoading: {
    backgroundColor: '#6ee7b7',
    cursor: 'wait',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e7f0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a2332',
    margin: '0 0 16px 0',
  },
  formContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d9e6',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1a2332',
    outline: 'none',
    maxWidth: '300px',
  },
  submitButton: {
    padding: '10px 18px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  createButtonDisabled: {
    backgroundColor: '#93c5fd',
    cursor: 'not-allowed',
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
    fontFamily: 'monospace',
  },
  pendingBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    border: '1px solid #fde68a',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  deletingBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  actionButtonGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  manageButton: {
    padding: '4px 10px',
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    border: '1px solid #bfdbfe',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  manageButtonDisabled: {
    padding: '4px 10px',
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '12px',
    fontWeight: '600',
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
  deleteButtonDisabled: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '12px',
    fontWeight: '600',
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
  loadingState: {
    padding: '32px',
    textAlign: 'center',
    color: '#6b7a99',
    fontSize: '14px',
  },
  clickableCodeCell: {
    cursor: 'pointer',
    color: '#2563eb',
    textDecoration: 'underline',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #e0e7f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a2332',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7a99',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: '#f8faff',
  },
  jsonDump: {
    margin: 0,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    padding: '16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflowX: 'auto',
  },
};

export default BucketManagement;
