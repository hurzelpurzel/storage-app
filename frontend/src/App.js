import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CategoryPicker from './components/CategoryPicker';
import S3ObjectStorage from './components/S3ObjectStorage';
import LoginPage from './components/LoginPage';
import OAuthCallback from './components/OAuthCallback';

const SESSION_KEY = 'pendingCategory';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  // Persist selectedCategory in sessionStorage so it survives the OIDC redirect.
  const [selectedCategory, setSelectedCategory] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || null
  );

  const selectCategory = (id) => {
    sessionStorage.setItem(SESSION_KEY, id);
    setSelectedCategory(id);
  };

  const clearCategory = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSelectedCategory(null);
  };

  // Handle OIDC redirect-back before anything else.
  // OAuthCallback sets the token in AuthContext; once isAuthenticated becomes
  // true this block is skipped and we fall through to the protected view below.
  if (new URLSearchParams(window.location.search).has('code')) {
    return <OAuthCallback />;
  }

  // Protected view: user selected a category but is not yet authenticated.
  if (selectedCategory && !isAuthenticated) {
    return <LoginPage />;
  }

  // Protected view: authenticated and a category is selected.
  if (selectedCategory && isAuthenticated) {
    if (selectedCategory === 's3-object-storage') {
      return <S3ObjectStorage onBack={clearCategory} />;
    }
    // Unknown category — fall back to home.
    clearCategory();
  }

  // Public home screen.
  return <CategoryPicker onSelect={selectCategory} />;
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
