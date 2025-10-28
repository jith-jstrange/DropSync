import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';

function useAuthToken() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const login = (t: string) => { localStorage.setItem('token', t); setToken(t); };
  const logout = () => { localStorage.removeItem('token'); setToken(null); };
  return { token, login, logout };
}

function Login() {
  const { token, login } = useAuthToken();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Login failed');
      login(body.token);
    } catch (e: any) {
      setError(e.message);
    }
  };
  if (token) return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input className="border rounded px-3 py-2 w-full" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-2 rounded w-full">Continue</button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { token, logout } = useAuthToken();
  const [connections, setConnections] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const res = await fetch('/api/connections', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setConnections(data);
      } catch (e: any) { setError(e.message); }
    };
    if (token) load();
  }, [token]);

  if (!token) return <Navigate to="/" replace />;
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={logout} className="text-sm text-red-700">Logout</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectWordPress token={token!} onConnected={() => window.location.reload()} />
        <ConnectShopify token={token!} />
      </div>
      <h2 className="mt-6 font-medium">Connections</h2>
      <ul className="mt-2 space-y-2">
        {connections.map(c => (
          <li key={c.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.displayName}</div>
              <div className="text-xs text-gray-500">{c.type}</div>
            </div>
            <form method="post" onSubmit={async (e) => {
              e.preventDefault();
              await fetch(`/api/connections/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
              window.location.reload();
            }}>
              <button className="text-sm text-red-700">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConnectWordPress({ token, onConnected }: { token: string; onConnected: () => void }) {
  const [siteUrl, setSiteUrl] = useState('');
  const [appUsername, setAppUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-2">Connect WordPress</h3>
      <input className="border rounded px-2 py-1 w-full mb-2" placeholder="Site URL" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} />
      <input className="border rounded px-2 py-1 w-full mb-2" placeholder="Display name (optional)" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      <input className="border rounded px-2 py-1 w-full mb-2" placeholder="WP Username" value={appUsername} onChange={e => setAppUsername(e.target.value)} />
      <input className="border rounded px-2 py-1 w-full mb-2" placeholder="WP Application Password" value={appPassword} onChange={e => setAppPassword(e.target.value)} />
      <button className="bg-gray-800 text-white px-3 py-1 rounded" onClick={async () => {
        setMsg('');
        const res = await fetch('/api/connections/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ siteUrl, displayName, appUsername, appPassword })});
        const data = await res.json();
        if (res.ok) { setMsg('Connected'); onConnected(); } else { setMsg(data.error || 'Failed'); }
      }}>Connect</button>
      {msg && <div className="text-xs text-gray-500 mt-1">{msg}</div>}
    </div>
  );
}

function ConnectShopify({ token }: { token: string }) {
  const [shop, setShop] = useState('');
  const openOAuth = () => {
    const url = `/api/shopify/oauth/start?shop=${encodeURIComponent(shop)}`;
    const w = window.open(url, 'shopify_oauth', 'width=600,height=700');
    const listener = (e: MessageEvent) => {
      if (e.data?.type === 'SHOPIFY_OAUTH_SUCCESS') {
        const { shopDomain, accessToken } = e.data.data;
        fetch('/api/connections/shopify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ shopDomain, accessToken }) });
        window.removeEventListener('message', listener);
        w?.close();
        setTimeout(() => window.location.reload(), 1000);
      }
    };
    window.addEventListener('message', listener);
  };
  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-2">Connect Shopify</h3>
      <input className="border rounded px-2 py-1 w-full mb-2" placeholder="your-store.myshopify.com" value={shop} onChange={e => setShop(e.target.value)} />
      <button className="bg-green-700 text-white px-3 py-1 rounded" onClick={openOAuth}>Install App</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-3 border-b bg-white"><Link to="/">Home</Link></nav>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
