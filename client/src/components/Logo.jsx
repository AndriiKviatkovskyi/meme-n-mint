import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

function Logo() {
  return (
    <Link to="/" style={{ textDecoration: 'none', color: 'inherit', marginRight: '50px' }}>
      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'darkblue', padding: '0px' }}>
        <img src={logo} alt="Logo" style={{ height: '35px', marginTop: '10px' }} />
      </div>
    </Link>
  );
}

export default Logo;