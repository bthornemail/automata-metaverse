/**
 * Simple test component to verify rendering
 */

import React from 'react';

export const MetaversePortalTest: React.FC = () => {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '600px',
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '20px',
        fontSize: '24px',
        fontWeight: 'bold'
      }}
    >
      <div>TEST: MetaversePortalTest Component</div>
      <div>If you see this, React is rendering</div>
      <div style={{ marginTop: '20px', fontSize: '16px' }}>
        This is a test component to verify the portal container is working.
      </div>
    </div>
  );
};
