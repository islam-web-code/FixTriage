import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  if (!user) return <p style={{ textAlign: 'center', marginTop: 40 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>FixTriage</h1>
      <p>
        Logged in as <strong>{user.email}</strong> (role: {user.role})
      </p>
      <button onClick={handleLogout} style={{ padding: '8px 20px' }}>
        Logout
      </button>
    </div>
  );
}

export default Home;