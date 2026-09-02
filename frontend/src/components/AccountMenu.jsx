import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { hashPassword } from '../lib/hashPassword';

function AccountMenu({ user, theme, setTheme, onLogout }) {
  const [open, setOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setShowPasswordForm(false);
        setMessage(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const isProvider = user?.role === 'provider';

  const submitPassword = async () => {
    setMessage(null);
    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters', ok: false });
      return;
    }
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/auth/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: await hashPassword(currentPassword),
        newPassword: await hashPassword(newPassword),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setShowPasswordForm(false);
    setMessage({ text: 'Password updated', ok: true });
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="avatar-btn"
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className="account-dropdown">
          <div className="account-header">
            <strong>{user?.email}</strong>
            <span className="badge">{user?.role}</span>
          </div>

          <button
            className="account-item"
            onClick={() => {
              setOpen(false);
              navigate('/dashboard');
            }}
          >
            🧰 {isProvider ? 'Provider dashboard' : 'Become a provider'}
          </button>

          <button
            className="account-item"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setMessage(null);
            }}
          >
            🔑 Change password
          </button>

          {showPasswordForm && (
            <div className="account-form">
              <input
                className="input"
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                className="input"
                type="password"
                placeholder="New password (min 8)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className="btn btn-primary" onClick={submitPassword}>
                Update password
              </button>
            </div>
          )}

          {message && (
            <p className={message.ok ? 'msg-ok' : 'msg-error'} style={{ padding: '0 var(--space-3)' }}>
              {message.ok ? '✅' : '⚠️'} {message.text}
            </p>
          )}

          <button
            className="account-item"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>

          <button className="account-item is-danger" onClick={onLogout}>
            🚪 Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;