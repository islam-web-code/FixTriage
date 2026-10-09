import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;
const TABS = ['users', 'services', 'reviews'];

function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const authFetch = useCallback(
    (path, options = {}) =>
      fetch(`${API}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
      }),
    [token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, rowsRes] = await Promise.all([
        authFetch('/admin/stats'),
        authFetch(`/admin/${tab}`),
      ]);
      if (statsRes.status === 401) {
        navigate('/login');
        return;
      }
      if (statsRes.status === 403) {
        setForbidden(true);
        return;
      }
      setStats(await statsRes.json());
      const data = await rowsRes.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setMessage({ text: 'Could not load admin data', ok: false });
    } finally {
      setLoading(false);
    }
  }, [authFetch, tab, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    load();
  }, [token, navigate, load]);

  const remove = async (kind, id, label, warning) => {
    if (!window.confirm(`Delete ${label}?${warning ? `\n\n${warning}` : ''}\n\nThis cannot be undone.`)) {
      return;
    }
    setMessage(null);
    const res = await authFetch(`/admin/${kind}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      return;
    }
    setMessage({ text: `${label} deleted`, ok: true });
    load();
  };

  if (forbidden) {
    return (
      <div className="page page-narrow">
        <div className="card">
          <div className="stack">
            <h2>Admins only</h2>
            <p className="muted">Your account doesn't have access to this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Admin dashboard</h1>
      <p className="muted">Moderate users, services, and reviews across FixTriage.</p>

      {stats && (
        <div className="slot-grid">
          {Object.entries(stats).map(([key, value]) => (
            <div className="card" key={key} style={{ padding: 'var(--space-3)' }}>
              <span className="price" style={{ fontSize: '1.6rem' }}>{value}</span>
              <span className="muted">{key}</span>
            </div>
          ))}
        </div>
      )}

      <div className="cluster">
        {TABS.map((t) => (
          <button
            key={t}
            className={`slot-chip${tab === t ? ' is-active' : ''}`}
            onClick={() => {
              if (t === tab) return;
              setRows([]);
              setLoading(true);
              setMessage(null);
              setTab(t);
            }}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {message && (
        <p className={message.ok ? 'msg-ok' : 'msg-error'}>
          {message.ok ? '✅' : '⚠️'} {message.text}
        </p>
      )}

      {loading && <p className="muted">Loading...</p>}
      {!loading && rows.length === 0 && <p className="muted">Nothing here.</p>}

      {!loading && tab === 'users' &&
        rows.map((u) => (
          <div className="card" key={u.id}>
            <div>
              <h3>{u.name}</h3>
              <span className="badge">{u.role}</span>
              <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{u.email}</p>
              <p className="muted">
                Joined {new Date(u.createdAt).toLocaleDateString()} · {u._count.bookings} bookings ·{' '}
                {u._count.reviews} reviews
              </p>
            </div>
            {u.role !== 'admin' && (
              <button
                className="btn btn-danger"
                onClick={() =>
                  remove(
                    'users',
                    u.id,
                    u.email,
                    'This also removes their provider profile, services, bookings, reviews and messages.',
                  )
                }
              >
                Delete
              </button>
            )}
          </div>
        ))}

      {!loading && tab === 'services' &&
        rows.map((s) => (
          <div className="card" key={s.id}>
            <div>
              <h3>{s.title}</h3>
              <span className="badge">{s.category.replace('_', ' ')}</span>
              {s.priceEstimate != null && (
                <span className="price" style={{ marginInlineStart: 'var(--space-2)' }}>
                  ₪{s.priceEstimate}
                </span>
              )}
              <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
                by {s.provider.user.name} ({s.provider.user.email}) · {s._count.bookings} bookings
              </p>
            </div>
            <button
              className="btn btn-danger"
              onClick={() =>
                remove('services', s.id, `"${s.title}"`, 'Its bookings, reviews and messages are removed too.')
              }
            >
              Delete
            </button>
          </div>
        ))}

      {!loading && tab === 'reviews' &&
        rows.map((r) => (
          <div className="card" key={r.id}>
            <div>
              <h3>
                {r.user.name} → {r.provider.user.name}
              </h3>
              {r.booking?.service && (
                <span className="badge">{r.booking.service.category.replace('_', ' ')}</span>
              )}
              <p style={{ marginTop: 'var(--space-2)' }}>{'⭐'.repeat(r.rating)}</p>
              {r.comment && <p className="muted">"{r.comment}"</p>}
            </div>
            <button
              className="btn btn-danger"
              onClick={() => remove('reviews', r.id, `review by ${r.user.name}`)}
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );
}

export default AdminDashboard;