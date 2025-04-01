import React from 'react';
import { Link } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'darkblue' }}>
        [Your Logo Placeholder]
      </div>
    </Link>
  );
}

export default Logo;