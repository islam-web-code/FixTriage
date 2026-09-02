import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookingChat from '../components/BookingChat';

const STATUS_LABEL = {
  pending: '⏳ Waiting for provider',
  accepted: '✅ Accepted',
  declined: '❌ Declined',
  completed: '🎉 Completed',
};

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null); // booking id
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
const [openChat, setOpenChat] = useState(null);
  const [me, setMe] = useState(null);

  const load = useCallback(() => {
    fetch('http://localhost:3000/bookings/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          navigate('/login');
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

  const submitReview = async (bookingId) => {
    setMessage(null);
    const res = await fetch(`http://localhost:3000/bookings/${bookingId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, comment: comment || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      return;
    }
    setReviewing(null);
    setRating(5);
    setComment('');
    setMessage({ text: 'Thanks — your review is live', ok: true });
    load();
  };

  return (
    <div className="page">
      <h1>My bookings</h1>
      <p className="muted">Services you've requested and their current status.</p>

      {message && (
        <p className={message.ok ? 'msg-ok' : 'msg-error'}>
          {message.ok ? '✅' : '⚠️'} {message.text}
        </p>
      )}

      {loading && <p className="muted">Loading...</p>}
      {!loading && bookings.length === 0 && (
        <div className="card">
          <div className="stack">
            <h3>No bookings yet</h3>
            <p className="muted">Find a provider and book a service to get started.</p>
            <div>
              <Link to="/providers" className="btn btn-primary">Browse providers</Link>
            </div>
          </div>
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
              Provider: <strong>{b.provider.user.name}</strong>
            </p>
            <p className="muted">🗓 {new Date(b.scheduledAt).toLocaleString()}</p>
            {b.problemText && <p className="muted">"{b.problemText}"</p>}
            <p className="price" style={{ fontSize: '0.95rem' }}>
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
              {STATUS_LABEL[b.status] ?? b.status}
            </p>

            {b.status === 'completed' && b.review && (
              <p className="muted">
                Your review: {'⭐'.repeat(b.review.rating)}
                {b.review.comment && ` — "${b.review.comment}"`}
              </p>
            )}

            {b.status === 'completed' && !b.review && reviewing !== b.id && (
              <div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setReviewing(b.id);
                    setMessage(null);
                  }}
                >
                  Leave a review
                </button>
              </div>
            )}

            {reviewing === b.id && (
              <div className="stack">
                <div className="cluster">
                  <span className="muted">Rating</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={`slot-chip${rating === n ? ' is-active' : ''}`}
                      style={{ minInlineSize: '3rem' }}
                      onClick={() => setRating(n)}
                    >
                      {n}⭐
                    </button>
                  ))}
                </div>
                <textarea
                  className="input"
                  placeholder="How did it go? (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="cluster">
                  <button className="btn btn-primary" onClick={() => submitReview(b.id)}>
                    Submit review
                  </button>
                  <button className="btn btn-danger" onClick={() => setReviewing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyBookings;