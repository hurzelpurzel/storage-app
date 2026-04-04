import React from 'react';
import AuthBar from './AuthBar';

const CATEGORIES = [
  {
    id: 's3-object-storage',
    label: 'S3 Object Storage',
    description: 'Manage S3 buckets and users via NetApp SVM',
  },
  {
    id: 'migdas-austausch-service',
    label: 'MigDas Austausch Service',
    description: 'Coming soon',
    disabled: true,
  },
];

const CategoryPicker = ({ onSelect }) => {
  return (
    <div style={styles.container}>
      <AuthBar />
      <div style={styles.body}>
      <div style={styles.header}>
        <h1 style={styles.title}>Storage Management</h1>
        <p style={styles.subtitle}>Select a service category to get started</p>
      </div>

      <div style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            style={{
              ...styles.card,
              ...(cat.disabled ? styles.cardDisabled : styles.cardEnabled),
            }}
            onClick={() => !cat.disabled && onSelect(cat.id)}
            disabled={cat.disabled}
          >
            <div style={styles.cardIcon}>
              {cat.id === 's3-object-storage' ? '🗄️' : '🔄'}
            </div>
            <h2 style={styles.cardTitle}>{cat.label}</h2>
            <p style={styles.cardDesc}>{cat.description}</p>
            {cat.disabled && (
              <span style={styles.comingSoon}>Coming Soon</span>
            )}
          </button>
        ))}
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
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a2332',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7a99',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '720px',
    width: '100%',
  },
  card: {
    background: 'white',
    border: '2px solid transparent',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'relative',
  },
  cardEnabled: {
    borderColor: '#e0e7f0',
    color: '#1a2332',
  },
  cardDisabled: {
    borderColor: '#e0e7f0',
    color: '#aab0be',
    cursor: 'not-allowed',
    backgroundColor: '#fafbfc',
  },
  cardIcon: {
    fontSize: '40px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#6b7a99',
    margin: 0,
    lineHeight: '1.5',
  },
  comingSoon: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '3px 10px',
    backgroundColor: '#e8ecf4',
    color: '#8a92a6',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};

export default CategoryPicker;
