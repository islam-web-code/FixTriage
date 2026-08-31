import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hashPassword } from '../lib/hashPassword';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: await hashPassword(password) }),
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
        <h1>Welcome back</h1>
        <p className="muted">Log in to book services or manage your provider profile.</p>
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSubmit}>
          Log in
        </button>
        {error && <p className="msg-error">{error}</p>}
        <p className="muted" style={{ marginTop: 16 }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;