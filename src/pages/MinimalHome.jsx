import React from 'react';

const MinimalHome = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{ color: '#1976d2' }}>NEWStep Eng News</h1>
      <p>Minimal Home Page - Testing Basic React</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Status Check</h2>
        <ul>
          <li>✅ React is working</li>
          <li>✅ Basic styling is working</li>
          <li>✅ Component rendering is working</li>
        </ul>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => alert('Button works!')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Button
          </button>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Navigation Test</h3>
        <p>If this page loads, the basic React app is working.</p>
        <p>The issue might be with:</p>
        <ul>
          <li>Context Providers</li>
          <li>Material-UI components</li>
          <li>Firebase initialization</li>
          <li>Complex hooks</li>
        </ul>
      </div>
    </div>
  );
};

export default MinimalHome;