import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await API.post('/public/auth/register', { username, email, password });
      navigate('/login?registered=true');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Benutzername oder E-Mail-Adresse ist bereits vergeben.');
      } else if (err.response?.status === 400) {
        setError('Bitte prüfe deine Eingaben. Das Passwort muss mindestens 8 Zeichen lang sein.');
      } else {
        setError('Registrierung fehlgeschlagen. Bitte prüfe die Serververbindung.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Konto erstellen</h2>
        {error && <div role="alert" style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <label htmlFor="username" style={styles.label}>Benutzername</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={50}
            autoComplete="username"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>E-Mail-Adresse</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={100}
            autoComplete="email"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>Passwort (mindestens 8 Zeichen)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Konto wird erstellt...' : 'Registrieren'}
        </button>
        <p style={styles.footer}>
          Bereits registriert? <Link to="/login">Zum Login</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f7fb', padding: '20px' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { textAlign: 'center', marginBottom: '24px', color: '#333' },
  error: { backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' },
  button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  footer: { textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' },
};

export default Register;
