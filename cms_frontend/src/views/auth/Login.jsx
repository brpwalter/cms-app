import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Absenden der Credentials an den öffentlichen Auth-Endpunkt
      const response = await API.post('/public/auth/login', { username, password });
      
      // Daten aus der Backend-Antwort extrahieren
      const { token, username: loggedInUser, roles } = response.data;

      // Im globalen Context & LocalStorage speichern
      login(token, loggedInUser, roles);

      navigate(roles.includes('ROLE_READER') ? '/reader' : '/admin');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Falscher Benutzername oder Passwort.');
      } else {
        setError('Verbindung zum Server fehlgeschlagen.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>CMS Login</h2>
        {searchParams.get('registered') === 'true' && (
          <div role="status" style={styles.success}>
            Konto erstellt. Du kannst dich jetzt anmelden.
          </div>
        )}
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Benutzername</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Passwort</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Anmeldung...' : 'Einloggen'}
        </button>
        <p style={styles.footer}>
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </form>
    </div>
  );
}

// Minimales Inline-Styling für eine saubere Optik
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7fb' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { textAlign: 'center', marginBottom: '24px', color: '#333' },
  error: { backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' },
  success: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' },
  button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  footer: { textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' },
};

export default Login;
