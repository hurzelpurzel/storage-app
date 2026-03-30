import React, { useState, useEffect } from 'react';
import { storageItemsApi } from '../services/api';
import StorageItemForm from './StorageItemForm';

const StorageItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadItems();
  }, [currentPage, categoryFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await storageItemsApi.getStorageItems(
        currentPage, 
        20, 
        categoryFilter || null
      );
      setItems(data.data);
      setPagination(data.pagination);
      
      // Extract unique categories for filter
      const uniqueCategories = [...new Set(data.data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      setError('Failed to load storage items');
      console.error('Load items error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (itemData) => {
    try {
      await storageItemsApi.createStorageItem(itemData);
      setShowForm(false);
      loadItems(); // Reload the list
    } catch (err) {
      setError('Failed to create item');
      console.error('Create item error:', err);
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      await storageItemsApi.updateStorageItem(editingItem.id, itemData);
      setEditingItem(null);
      loadItems(); // Reload the list
    } catch (err) {
      setError('Failed to update item');
      console.error('Update item error:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await storageItemsApi.deleteStorageItem(itemId);
        loadItems(); // Reload the list
      } catch (err) {
        setError('Failed to delete item');
        console.error('Delete item error:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : '-';
  };

  if (loading) {
    return <div style={styles.loading}>Loading storage items...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Storage Management</h1>
        <button 
          onClick={() => setShowForm(true)} 
          style={styles.addButton}
        >
          Add New Item
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError(null)} style={styles.closeError}>×</button>
        </div>
      )}

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Filter by Category:</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.itemGrid}>
        {items.map(item => (
          <div key={item.id} style={styles.itemCard}>
            <div style={styles.itemHeader}>
              <h3 style={styles.itemName}>{item.name}</h3>
              <div style={styles.itemActions}>
                <button 
                  onClick={() => setEditingItem(item)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>

            <div style={styles.itemDetails}>
              <p style={styles.itemDescription}>{item.description}</p>
              
              <div style={styles.itemMeta}>
                <span style={styles.category}>{item.category}</span>
                <span style={styles.quantity}>Qty: {item.quantity}</span>
                <span style={styles.price}>{formatPrice(item.unit_price)}</span>
              </div>

              {item.location && (
                <p style={styles.location}>📍 {item.location}</p>
              )}

              {item.tags && item.tags.length > 0 && (
                <div style={styles.tags}>
                  {item.tags.map((tag, index) => (
                    <span key={index} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}

              <p style={styles.dates}>
                Created: {formatDate(item.created_at)} | 
                Updated: {formatDate(item.updated_at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {pagination.total_pages > 1 && (
        <div style={styles.pagination}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={styles.paginationButton}
          >
            Previous
          </button>
          
          <span style={styles.paginationInfo}>
            Page {currentPage} of {pagination.total_pages} 
            ({pagination.total} items)
          </span>
          
          <button 
            onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
            disabled={currentPage === pagination.total_pages}
            style={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <StorageItemForm
          onSubmit={handleCreateItem}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingItem && (
        <StorageItemForm
          item={editingItem}
          isEditing={true}
          onSubmit={handleUpdateItem}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeError: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
  },
  filters: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontWeight: 'bold',
  },
  filterSelect: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  itemName: {
    margin: '0',
    color: '#2c3e50',
    fontSize: '18px',
  },
  itemActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  itemDetails: {
    fontSize: '14px',
  },
  itemDescription: {
    color: '#7f8c8d',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  itemMeta: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  category: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  quantity: {
    backgroundColor: '#e8f4f8',
    color: '#2c3e50',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  price: {
    backgroundColor: '#d5f4e6',
    color: '#27ae60',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  location: {
    color: '#8e44ad',
    fontSize: '12px',
    margin: '4px 0',
  },
  tags: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  tag: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
    border: '1px solid #dee2e6',
  },
  dates: {
    color: '#95a5a6',
    fontSize: '11px',
    marginTop: '8px',
    marginBottom: '0',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '20px',
  },
  paginationButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  paginationInfo: {
    color: '#7f8c8d',
  },
};

export default StorageItemList;