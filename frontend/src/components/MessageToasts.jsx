import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function MessageToasts({ openBookingId }) {
  const [toasts, setToasts] = useState([]);
  const lastCheck = useRef(new Date().toISOString());
  const seen = useRef(new Set());
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    const poll = () => {
      fetch(
        `http://localhost:3000/bookings/messages/recent?since=${encodeURIComponent(
          lastCheck.current,
        )}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((msgs) => {
          if (!Array.isArray(msgs) || msgs.length === 0) return;
          lastCheck.current = new Date().toISOString();

          const fresh = msgs.filter(
            (m) =>
              !seen.current.has(m.id) &&
              m.booking.id !== openBookingId, // don't notify for the open chat
          );
          fresh.forEach((m) => seen.current.add(m.id));
          if (fresh.length === 0) return;

          setToasts((prev) => [...prev, ...fresh]);
          fresh.forEach((m) => {
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== m.id));
            }, 3000);
          });
        })
        .catch(() => {});
    };

    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [token, openBookingId]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <button
          key={t.id}
          className="toast"
          onClick={() => {
            setToasts((prev) => prev.filter((x) => x.id !== t.id));
            navigate('/bookings');
          }}
        >
          <strong>💬 {t.sender.name}</strong>
          <span className="toast-body">{t.content}</span>
          <span className="toast-meta">{t.booking.service.title}</span>
        </button>
      ))}
    </div>
  );
}

export default MessageToasts;