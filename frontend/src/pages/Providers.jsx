import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'electrical',
  'plumbing',
  'car_repair',
  'cleaning',
  'ac_maintenance',
  'phone_repair',
  'cameras',
  'general_handyman',
];

function Providers() {
  const [providers, setProviders] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = category
      ? `http://localhost:3000/providers?category=${category}`
      : 'http://localhost:3000/providers';
    fetch(url)
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="page">
      <h1>Find a provider</h1>
      <p className="muted">Browse skilled people near you, by category.</p>

      <select
        className="input"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ maxInlineSize: '16rem' }}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c.replace('_', ' ')}
          </option>
        ))}
      </select>

      {loading && <p className="muted">Loading providers...</p>}
      {!loading && providers.length === 0 && (
        <div className="card">
          <h3>No providers found</h3>
          <p className="muted">Try a different category, or be the first — open the dashboard and list your services.</p>
        </div>
      )}

      <div className="list-long">
        {providers.map((p) => (
          <div className="card" key={p.id} style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3>{p.user.name}</h3>
              {p.bio && <p className="muted">{p.bio}</p>}
              {p.address && <p className="muted">📍 {p.address}</p>}
              <p style={{ marginTop: 'var(--space-2)' }} className="cluster">
                {p.services.length > 0 ? (
                  p.services.map((s) => (
                    <span className="badge" key={s.id}>
                      {s.category.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="muted">No services listed yet</span>
                )}
              </p>
            </div>
            <Link to={`/providers/${p.id}`} className="btn btn-primary">
              View profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Providers;