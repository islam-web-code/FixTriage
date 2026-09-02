import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SlotPicker from '../components/SlotPicker';

function ProviderDetail() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [openService, setOpenService] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
        const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/providers/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setProvider(data))
      .catch(() => setError('Provider not found'));
  }, [id]);

  const book = async (serviceId, scheduledAt, problemText, reloadSlots) => {
    setMessage(null);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setBusy(true);
    const res = await fetch('http://localhost:3000/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        serviceId,
        scheduledAt,
        problemText: problemText || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      reloadSlots?.();
      return;
    }
    setOpenService(null);
    setMessage({
      text: 'Booking requested — check "My bookings" for updates',
      ok: true,
    });
  };

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

      {message && (
        <p className={message.ok ? 'msg-ok' : 'msg-error'}>
          {message.ok ? '✅' : '⚠️'} {message.text}
        </p>
      )}

      <h2>Services</h2>
      {provider.services.length === 0 && <p className="muted">No services listed yet.</p>}
      {provider.services.map((s) => (
        <div className="card" key={s.id}>
          <div className="stack">
            <div>
              <h3>{s.title}</h3>
              <span className="badge">{s.category.replace('_', ' ')}</span>{' '}
              {s.priceEstimate != null && <span className="price">₪{s.priceEstimate}</span>}
              {s.description && (
                <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{s.description}</p>
              )}
              <p className="muted">{s.slotMinutes ?? 60}-minute appointments</p>
            </div>

            <div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setOpenService(openService === s.id ? null : s.id);
                  setMessage(null);
                }}
              >
                {openService === s.id ? 'Close' : 'Book this'}
              </button>
            </div>

            {openService === s.id && (
              <SlotPicker
                service={s}
                busy={busy}
                onBook={(scheduledAt, problemText, reloadSlots) =>
                  book(s.id, scheduledAt, problemText, reloadSlots)
                }
              />
            )}
          </div>
        </div>
      ))}

      <h2>Reviews</h2>
      {provider.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {provider.reviews.map((r) => (
        <div className="card" key={r.id}>
          <div className="stack">
            <div>
              <h3>{r.user.name}</h3>
              {r.booking?.service && (
                <span className="badge">{r.booking.service.category.replace('_', ' ')}</span>
              )}
            </div>
            <span aria-label={`${r.rating} out of 5 stars`}>{'⭐'.repeat(r.rating)}</span>
            {r.comment && <p className="muted">{r.comment}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProviderDetail;