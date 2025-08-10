import { useState } from 'react';
import { login } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true); setError(null);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    window.location.href = '/';
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0 }}>Sign in</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
        <button disabled={loading} onClick={onLogin} style={{ padding: '10px 16px' }}>Sign in</button>
        {error && <div style={{ color: 'tomato' }}>{error}</div>}
      </div>
    </div>
  );
}


