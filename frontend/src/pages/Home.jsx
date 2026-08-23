import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('http://localhost:3000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <p className="muted" style={{ textAlign: 'center', marginTop: 60 }}>Loading...</p>;

  return (
    <div className="page">
      <h1>
        Hi, {user.email.split('@')[0]} 👋
      </h1>
      <p className="muted">
        Signed in as <strong>{user.email}</strong>
        <span className="badge" style={{ marginLeft: 8 }}>{user.role}</span>
      </p>

            <div className="card">
        <div className="stack">
          <h2>Need something fixed?</h2>
          <p className="muted">Browse nearby providers by category and view their services.</p>
          <div>
            <Link to="/providers" className="btn btn-primary">Browse providers</Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="stack">
          <h2>Offer your skills</h2>
          <p className="muted">Create a provider profile and list the services you offer.</p>
          <div>
            <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
          </div>
        </div>
      </div>

      <button className="btn btn-danger" onClick={handleLogout} style={{ marginTop: 10 }}>
        Log out
      </button>
    </div>
  );
}

export default Home;