import React from 'react';
import { Link } from 'react-router-dom';

const NavHeader = ({ title, icon, backLink = "/" }) => {
  return (
    <div className="nav-header">
      <Link to={backLink} className="back-link">
        <i className="fas fa-arrow-left"></i> Back to Dashboard
      </Link>
      <div className="page-title">
        <i className={icon}></i> {title}
      </div>
    </div>
  );
};

export default NavHeader;