import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setError('Backend not reachable'));
  }, []);

  return (
    <div>
      <h1>FixTriage</h1>
      <h2>Backend status:</h2>
      {health && (
        <p style={{ color: 'green' }}>
          ✅ {health.status} — {health.service}
        </p>
      )}
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
      {!health && !error && <p>Checking...</p>}
    </div>
  );
}

export default App;