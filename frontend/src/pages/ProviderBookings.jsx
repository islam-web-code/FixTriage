import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingChat from '../components/BookingChat';

const STATUS_LABEL = {
  pending: '⏳ Awaiting your response',
  accepted: '✅ Accepted',
  declined: '❌ Declined',
  completed: '🎉 Completed',
};

function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [me, setMe] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const load = useCallback(() => {
    fetch('http://localhost:3000/bookings/received', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          navigate('/login');
          throw new Error();
        }
        if (res.status === 404) {
          setBookings([]);
          throw new Error();
        }
        return res.json();
      })
      .then((data) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    load();
    fetch('http://localhost:3000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data))
      .catch(() => {});
  }, [token, navigate, load]);

  const changeStatus = async (id, status) => {
    setMessage(null);
    const res = await fetch(`http://localhost:3000/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      return;
    }
    setMessage({ text: `Booking marked as ${status}`, ok: true });
    load();
  };

  return (
    <div className="page">
      <h1>Incoming bookings</h1>
      <p className="muted">Requests customers have sent you.</p>

      {message && (
        <p className={message.ok ? 'msg-ok' : 'msg-error'}>
          {message.ok ? '✅' : '⚠️'} {message.text}
        </p>
      )}

      {loading && <p className="muted">Loading...</p>}
      {!loading && bookings.length === 0 && (
        <div className="card">
          <h3>No bookings yet</h3>
          <p className="muted">
            When customers book your services, their requests appear here.
          </p>
        </div>
      )}

      {bookings.map((b) => (
        <div className="card" key={b.id}>
          <div className="stack">
            <div>
              <h3>{b.service.title}</h3>
              <span className="badge">{b.service.category.replace('_', ' ')}</span>
            </div>
            <p className="muted">
              Customer: <strong>{b.user.name}</strong>
            </p>
            <p className="muted">🗓 {new Date(b.scheduledAt).toLocaleString()}</p>
            {b.problemText && <p className="muted">"{b.problemText}"</p>}
            <p className="price" style={{ fontSize: '0.95rem' }}>
              {STATUS_LABEL[b.status] ?? b.status}
            </p>

            {(b.status === 'accepted' || b.status === 'completed') && (
              <div>
                <button
                  className="btn btn-primary"
                  onClick={() => setOpenChat(openChat === b.id ? null : b.id)}
                >
                  {openChat === b.id ? 'Hide conversation' : '💬 Conversation'}
                </button>
              </div>
            )}

            {openChat === b.id && me && (
              <BookingChat bookingId={b.id} myUserId={me.userId} />
            )}

            {b.status === 'pending' && (
              <div className="cluster">
                <button className="btn btn-primary" onClick={() => changeStatus(b.id, 'accepted')}>
                  Accept
                </button>
                <button className="btn btn-danger" onClick={() => changeStatus(b.id, 'declined')}>
                  Decline
                </button>
              </div>
            )}

            {b.status === 'accepted' && (
              <div>
                <button className="btn btn-primary" onClick={() => changeStatus(b.id, 'completed')}>
                  Mark as completed
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProviderBookings;