import '../styles/header.css';

const Header = ({ show3DButton = false }) => {
  return (
    <header className="header">
      <div className="logo-section">
        <img 
          src="/images/glug-logo.png" 
          alt="GLUG & Robotics Club" 
          className="glug-logo"
          onError={(e) => (e.target.style.display = 'none')}
        />
        <div className="brand-divider"></div>
        <div className="neuroscope-text">
          NeuroScope {show3DButton ? '3D' : '2D'}
        </div>
      </div>
      <img 
        src="/images/reva-logo.png" 
        alt="REVA University" 
        className="reva-logo"
        onError={(e) => (e.target.style.display = 'none')}
      />
    </header>
  );
};

export default Header;
