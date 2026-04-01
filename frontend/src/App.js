import React, { useState } from 'react';
import CategoryPicker from './components/CategoryPicker';
import S3ObjectStorage from './components/S3ObjectStorage';

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  if (selectedCategory === 's3-object-storage') {
    return <S3ObjectStorage onBack={handleBack} />;
  }

  return <CategoryPicker onSelect={handleSelectCategory} />;
}

export default App;