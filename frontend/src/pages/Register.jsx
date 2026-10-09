import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hashPassword } from '../lib/hashPassword';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(null);
        if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: await hashPassword(password), name }),
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
        <div className="stack">
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
          <button className="btn btn-primary" onClick={handleSubmit} style={{ inlineSize: '100%' }}>
            Create account
          </button>
          {error && <p className="msg-error">{error}</p>}
          <p className="muted">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;