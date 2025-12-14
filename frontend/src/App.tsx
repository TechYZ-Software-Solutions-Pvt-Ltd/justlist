import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LeadsPage from './pages/LeadsPage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  console.log('App component rendering');
  
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/search" element={<MainPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/login">Go to Login</a>
        </div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

