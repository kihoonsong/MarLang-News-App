import React from 'react';

const SimpleHome = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Home Page</h1>
      <p>This is a simplified version to test if React is working.</p>
      <div>
        <h2>Test Content</h2>
        <p>If you can see this, React is working properly.</p>
        <button onClick={() => alert('Button clicked!')}>
          Test Button
        </button>
      </div>
    </div>
  );
};

export default SimpleHome;