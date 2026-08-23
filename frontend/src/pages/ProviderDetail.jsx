import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

function ProviderDetail() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/providers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setProvider(data))
      .catch(() => setError('Provider not found'));
  }, [id]);

  if (error)
    return (
      <div className="page page-narrow">
        <div className="card">
          <h2>Provider not found</h2>
          <p className="muted">They may have removed their profile.</p>
          <Link to="/providers" className="btn btn-primary">Back to all providers</Link>
        </div>
      </div>
    );

  if (!provider)
    return <p className="muted" style={{ textAlign: 'center', marginTop: 60 }}>Loading...</p>;

  return (
    <div className="page">
      <Link to="/providers" className="muted">← Back to all providers</Link>
      <h1>{provider.user.name}</h1>
      {provider.bio && <p>{provider.bio}</p>}
      <p className="cluster muted">
        {provider.address && <span>📍 {provider.address}</span>}
        {provider.phone && <span>📞 {provider.phone}</span>}
      </p>

      <h2>Services</h2>
      {provider.services.length === 0 && (
        <p className="muted">No services listed yet.</p>
      )}
      {provider.services.map((s) => (
        <div className="card" key={s.id}>
          <div>
            <h3>{s.title}</h3>
            <span className="badge">{s.category.replace('_', ' ')}</span>
            {s.description && <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{s.description}</p>}
          </div>
          {s.priceEstimate != null && <span className="price">₪{s.priceEstimate}</span>}
        </div>
      ))}

      <h2>Reviews</h2>
      {provider.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {provider.reviews.map((r) => (
        <div className="card" key={r.id}>
          <div>
            <h3>{r.user.name}</h3>
            <span aria-label={`${r.rating} out of 5 stars`}>{'⭐'.repeat(r.rating)}</span>
            {r.comment && <p className="muted">{r.comment}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProviderDetail;