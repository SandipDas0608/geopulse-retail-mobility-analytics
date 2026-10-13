function Header({ title = "Dashboard" }) {
  return (
    <header className="top-header">
      <div>
        <h1>{title}</h1>
        <p>Hyper-Local Retail Mobility Analytics</p>
      </div>

      <div className="user-profile">
        <div className="user-info">
          
        </div>
      </div>
    </header>
  );
}

export default Header;