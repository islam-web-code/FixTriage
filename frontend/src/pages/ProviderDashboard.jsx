import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AvailabilityEditor from '../components/AvailabilityEditor';

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

function ProviderDashboard() {
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [svcTitle, setSvcTitle] = useState('');
  const [svcCategory, setSvcCategory] = useState('electrical');
  const [svcDescription, setSvcDescription] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [message, setMessage] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const loadProfile = useCallback(() => {
    fetch('http://localhost:3000/providers/me/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          navigate('/login');
          throw new Error();
        }
        if (res.status === 404) {
          setHasProfile(false);
          setProfile(null);
          throw new Error();
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setHasProfile(true);
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
      })
      .catch(() => {});
  }, [token, navigate]);

  const loadReviews = useCallback(() => {
    fetch('http://localhost:3000/providers/me/reviews', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadProfile();
    loadReviews();
  }, [token, navigate, loadProfile, loadReviews]);

  const saveProfile = async () => {
    setMessage(null);
    const method = hasProfile ? 'PUT' : 'POST';
    const res = await fetch('http://localhost:3000/providers/me/profile', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bio, phone, address }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      return;
    }
    setMessage({
      text: hasProfile ? 'Profile updated' : 'Profile created — you are now a provider!',
      ok: true,
    });
    loadProfile();
  };

  const addService = async () => {
    setMessage(null);
    const body = {
      category: svcCategory,
      title: svcTitle,
      description: svcDescription || undefined,
      priceEstimate: svcPrice ? Number(svcPrice) : undefined,
    };
    const res = await fetch('http://localhost:3000/providers/me/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      return;
    }
    setSvcTitle('');
    setSvcDescription('');
    setSvcPrice('');
    setMessage({ text: 'Service added', ok: true });
    loadProfile();
  };

  const deleteService = async (id) => {
    await fetch(`http://localhost:3000/providers/me/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage({ text: 'Service removed', ok: true });
    loadProfile();
  };

  return (
    <div className="page">
      <h1>Provider dashboard</h1>

      <div className="card">
        <div className="stack">
          <h2>{hasProfile ? 'My profile' : 'Become a provider'}</h2>
          {!hasProfile && (
            <p className="muted">
              Fill in your details and you can start listing services right away.
            </p>
          )}
          <textarea
            className="input"
            placeholder="Bio — tell people what you do"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <input
            className="input"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="input"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div>
            <button className="btn btn-primary" onClick={saveProfile}>
              {hasProfile ? 'Save changes' : 'Create provider profile'}
            </button>
          </div>
        </div>
      </div>

      {hasProfile && (
        <>
          <h2>My services</h2>
          {profile?.services?.length === 0 && (
            <p className="muted">Nothing listed yet — add your first service below.</p>
          )}
          {profile?.services?.map((s) => (
            <div className="card" key={s.id}>
              <div className="stack">
                <div>
                  <h3>{s.title}</h3>
                  <span className="badge">{s.category.replace('_', ' ')}</span>{' '}
                  {s.priceEstimate != null && <span className="price">₪{s.priceEstimate}</span>}
                  <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
                    {s.slotMinutes ?? 60}-minute appointments
                  </p>
                </div>

                <div className="cluster">
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      setEditingSchedule(editingSchedule === s.id ? null : s.id)
                    }
                  >
                    {editingSchedule === s.id ? 'Hide schedule' : 'Set schedule'}
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteService(s.id)}>
                    Delete
                  </button>
                </div>

                {editingSchedule === s.id && (
                  <AvailabilityEditor
                    service={s}
                    onClose={() => setEditingSchedule(null)}
                    onSaved={loadProfile}
                  />
                )}
              </div>
            </div>
          ))}

          <div className="card">
            <div className="stack">
              <h2>Add a service</h2>
              <select
                className="input"
                value={svcCategory}
                onChange={(e) => setSvcCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Title"
                value={svcTitle}
                onChange={(e) => setSvcTitle(e.target.value)}
              />
              <textarea
                className="input"
                placeholder="Description (optional)"
                value={svcDescription}
                onChange={(e) => setSvcDescription(e.target.value)}
              />
              <input
                className="input"
                placeholder="Price estimate (optional)"
                type="number"
                value={svcPrice}
                onChange={(e) => setSvcPrice(e.target.value)}
              />
              <div>
                <button className="btn btn-primary" onClick={addService}>
                  Add service
                </button>
              </div>
            </div>
          </div>

          <h2>My reviews</h2>
          {reviews.length === 0 && (
            <p className="muted">
              No reviews yet — they'll appear here after customers rate completed jobs.
            </p>
          )}
          {reviews.length > 0 && (
            <p className="muted">
              Average rating:{' '}
              <strong>
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
              </strong>{' '}
              from {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </p>
          )}
          {reviews.map((r) => (
            <div className="card" key={r.id}>
              <div className="stack">
                <div>
                  <h3>{r.user.name}</h3>
                  {r.booking?.service && (
                    <span className="badge">{r.booking.service.title}</span>
                  )}
                </div>
                <span aria-label={`${r.rating} out of 5 stars`}>{'⭐'.repeat(r.rating)}</span>
                {r.comment && <p className="muted">{r.comment}</p>}
                <p className="muted">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </>
      )}

      {message && (
        <p className={message.ok ? 'msg-ok' : 'msg-error'}>
          {message.ok ? '✅' : '⚠️'} {message.text}
        </p>
      )}
    </div>
  );
}

export default ProviderDashboard;