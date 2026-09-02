import { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Providers from './pages/Providers';
import ProviderDetail from './pages/ProviderDetail';
import ProviderDashboard from './pages/ProviderDashboard';
import MyBookings from './pages/MyBookings';
import ProviderBookings from './pages/ProviderBookings';
import MessageToasts from './components/MessageToasts';
import AccountMenu from './components/AccountMenu';

function NavBar({ theme, setTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    fetch('http://localhost:3000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, [token, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const isProvider = user?.role === 'provider';

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">🔧 FixTriage</Link>
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/providers">Browse Providers</NavLink>
      {user && <NavLink to="/bookings">My Bookings</NavLink>}
      {isProvider && <NavLink to="/dashboard/bookings">Incoming</NavLink>}

      {user ? (
        <AccountMenu
          user={user}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
        />
      ) : (
        <button
          className="theme-toggle"
          style={{ marginInlineStart: 'auto' }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      )}
    </nav>
  );
}

function App() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <NavBar theme={theme} setTheme={setTheme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/providers/:id" element={<ProviderDetail />} />
        <Route path="/dashboard" element={<ProviderDashboard />} />
        <Route path="/dashboard/bookings" element={<ProviderBookings />} />
        <Route path="/bookings" element={<MyBookings />} />
      </Routes>
      <MessageToasts />
    </BrowserRouter>
  );
}

export default App;