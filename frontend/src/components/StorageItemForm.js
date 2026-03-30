import React, { useState } from 'react';

const StorageItemForm = ({ item, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || '',
    quantity: item?.quantity || 0,
    unit_price: item?.unit_price || '',
    location: item?.location || '',
    tags: item?.tags ? item.tags.join(', ') : '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity must be non-negative';
    }
    
    if (formData.unit_price && formData.unit_price < 0) {
      newErrors.unit_price = 'Unit price must be non-negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      quantity: parseInt(formData.quantity, 10),
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };

    onSubmit(submitData);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>{isEditing ? 'Edit Storage Item' : 'Add New Storage Item'}</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Name *
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{...styles.input, ...(errors.name ? styles.errorInput : {})}}
                required
              />
              {errors.name && <span style={styles.errorText}>{errors.name}</span>}
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{...styles.textarea, ...(errors.description ? styles.errorInput : {})}}
                rows={3}
              />
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Category *
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{...styles.input, ...(errors.category ? styles.errorInput : {})}}
                required
              />
              {errors.category && <span style={styles.errorText}>{errors.category}</span>}
            </label>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Quantity *
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  style={{...styles.input, ...(errors.quantity ? styles.errorInput : {})}}
                  min="0"
                  required
                />
                {errors.quantity && <span style={styles.errorText}>{errors.quantity}</span>}
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Unit Price
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  style={{...styles.input, ...(errors.unit_price ? styles.errorInput : {})}}
                  min="0"
                  step="0.01"
                />
                {errors.unit_price && <span style={styles.errorText}>{errors.unit_price}</span>}
              </label>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Location
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                style={styles.input}
              />
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Tags (comma separated)
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                style={styles.input}
                placeholder="tag1, tag2, tag3"
              />
            </label>
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onCancel} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton}>
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#333',
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  textarea: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical',
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: '12px',
    marginTop: '4px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3498db',
    color: 'white',
    cursor: 'pointer',
  },
};

export default StorageItemForm;