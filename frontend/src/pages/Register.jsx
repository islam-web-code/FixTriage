import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : data.message);
        return;
      }
      localStorage.setItem('token', data.accessToken);
      navigate('/');
    } catch {
      setError('Backend not reachable');
    }
  };

  return (
    <div className="page page-narrow">
      <div className="card">
        <h1>Create your account</h1>
        <p className="muted">Join FixTriage — find help nearby, or offer your skills.</p>
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          placeholder="Password (min 8 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSubmit}>
          Create account
        </button>
        {error && <p className="msg-error">{error}</p>}
        <p className="muted" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;