import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import { s3EnvironmentsApi } from '../services/api';

const SECTIONS = [
  { id: 'user-management', label: 'User Management' },
  { id: 'bucket-management', label: 'Bucket Management' },
];

const ENV_BADGE_COLORS = {
  'DEV/TEST': { bg: '#dbeafe', color: '#1d4ed8' },
  'UAT/PROD': { bg: '#dcfce7', color: '#15803d' },
  'INFRA':    { bg: '#fef9c3', color: '#854d0e' },
};

function envBadgeStyle(name) {
  const found = Object.entries(ENV_BADGE_COLORS).find(([k]) =>
    name?.toUpperCase().includes(k)
  );
  return found
    ? { backgroundColor: found[1].bg, color: found[1].color }
    : { backgroundColor: '#f1f5f9', color: '#475569' };
}

const S3ObjectStorage = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('user-management');
  const [environments, setEnvironments] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState('');
  const [envsLoading, setEnvsLoading] = useState(true);
  const [envsError, setEnvsError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await s3EnvironmentsApi.listEnvironments();
        const names = (data.environments || []).map((e) => e.name);
        setEnvironments(names);
        if (names.length > 0) setSelectedEnv(names[0]);
      } catch (err) {
        setEnvsError('Could not load environments from server.');
      } finally {
        setEnvsLoading(false);
      }
    })();
  }, []);

  return (
    <div style={styles.page}>
      {/* Top navigation bar */}
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <div style={styles.breadcrumb}>
          <span style={styles.breadcrumbCategory}>S3 Object Storage</span>
          <span style={styles.breadcrumbSep}>/</span>
          <span style={styles.breadcrumbSection}>
            {SECTIONS.find((s) => s.id === activeSection)?.label}
          </span>
        </div>

        {/* Environment selector — right side of top bar */}
        <div style={styles.envSelectorWrapper}>
          {envsLoading ? (
            <span style={styles.envLoading}>Loading environments…</span>
          ) : envsError ? (
            <span style={styles.envError}>{envsError}</span>
          ) : environments.length === 0 ? (
            <span style={styles.envError}>No environments configured</span>
          ) : (
            <>
              <label style={styles.envLabel} htmlFor="env-select">
                Environment
              </label>
              <div style={styles.envSelectWrapper}>
                <select
                  id="env-select"
                  value={selectedEnv}
                  onChange={(e) => setSelectedEnv(e.target.value)}
                  style={styles.envSelect}
                >
                  {environments.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {selectedEnv && (
                  <span
                    style={{
                      ...styles.envBadge,
                      ...envBadgeStyle(selectedEnv),
                    }}
                  >
                    {selectedEnv}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        {/* Sidebar */}
        <nav style={styles.sidebar}>
          <p style={styles.sidebarHeading}>Sections</p>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              style={{
                ...styles.sidebarItem,
                ...(activeSection === section.id
                  ? styles.sidebarItemActive
                  : {}),
              }}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* Main content area */}
        <main style={styles.content}>
          {activeSection === 'user-management' && (
            <UserManagement environment={selectedEnv} />
          )}

          {activeSection === 'bucket-management' && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>🪣</div>
              <h2 style={styles.placeholderTitle}>Bucket Management</h2>
              <p style={styles.placeholderText}>
                This section is not yet implemented.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e7f0',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    padding: '4px 0',
    flexShrink: 0,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    flex: 1,
  },
  breadcrumbCategory: {
    fontWeight: '700',
    color: '#1a2332',
  },
  breadcrumbSep: {
    color: '#b0b8cc',
  },
  breadcrumbSection: {
    color: '#6b7a99',
  },
  envSelectorWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  envLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7a99',
    whiteSpace: 'nowrap',
  },
  envLoading: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  envError: {
    fontSize: '13px',
    color: '#ef4444',
  },
  envSelectWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  envSelect: {
    padding: '6px 10px',
    border: '1px solid #d1d9e6',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#1a2332',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  envBadge: {
    display: 'none', // hidden — colour is conveyed by the select itself
  },
  layout: {
    display: 'flex',
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '32px auto',
    padding: '0 24px',
    gap: '24px',
    alignItems: 'flex-start',
    boxSizing: 'border-box',
  },
  sidebar: {
    width: '200px',
    flexShrink: 0,
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    border: '1px solid #e0e7f0',
  },
  sidebarHeading: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#8a92a6',
    margin: '0 0 10px 0',
    padding: '0 8px',
  },
  sidebarItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '9px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#3a4560',
    backgroundColor: 'transparent',
    marginBottom: '2px',
  },
  sidebarItemActive: {
    backgroundColor: '#eff4ff',
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '28px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    border: '1px solid #e0e7f0',
    minHeight: '400px',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },
  placeholderIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  placeholderTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a2332',
    margin: '0 0 8px 0',
  },
  placeholderText: {
    fontSize: '14px',
    color: '#6b7a99',
    margin: 0,
  },
};

export default S3ObjectStorage;
