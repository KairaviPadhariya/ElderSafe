import { Link } from 'react-router-dom';

type NavHeaderProps = {
  title: string;
  icon: string;
  backLink?: string;
};

const NavHeader = ({ title, icon, backLink = "/" }: NavHeaderProps) => {
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
