import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { register } from '../api';
import { UserPlus, Eye, EyeOff, Shield, Sword } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', display_name: '', role: 'player' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Client-side validation
    if (!form.display_name.trim()) {
      setError('El nombre para mostrar es obligatorio');
      setLoading(false);
      return;
    }
    
    if (form.display_name.trim().length < 2) {
      setError('El nombre para mostrar debe tener al menos 2 caracteres');
      setLoading(false);
      return;
    }
    
    if (!form.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      setLoading(false);
      return;
    }
    
    if (form.username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      setLoading(false);
      return;
    }
    
    if (!form.password.trim()) {
      setError('La contraseña es obligatoria');
      setLoading(false);
      return;
    }
    
    if (form.password.trim().length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      setLoading(false);
      return;
    }
    
    if (!form.role) {
      setError('Debes seleccionar un rol');
      setLoading(false);
      return;
    }
    
    try {
      const res = await register(form);
      loginUser(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      
      // More specific error handling
      if (err.response?.status === 400) {
        if (err.response?.data?.detail?.includes('nombre de usuario ya está en uso')) {
          setError('Ese nombre de usuario ya está registrado. Prueba con otro.');
        } else if (err.response?.data?.detail?.includes('caracteres')) {
          setError('Error en el formato: ' + err.response.data.detail);
        } else {
          setError(err.response?.data?.detail || 'Error al registrarse. Intenta de nuevo.');
        }
      } else if (err.response?.status >= 500) {
        setError('Error del servidor. Intenta más tarde.');
      } else {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="glass-panel fade-in" style={{ maxWidth: '450px', width: '100%', borderTop: '3px solid var(--accent-gold)' }}>
        <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.3rem' }}>⚔️ Crear Cuenta</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Únete a la aventura de D&D 5E</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Nombre para mostrar {!form.display_name.trim() && <span style={{ color: 'var(--accent-red-bright)' }}>*</span>}
            </label>
            <input type="text" value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Ej: Gandalf, Ana..." required autoFocus />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Usuario {!form.username.trim() && <span style={{ color: 'var(--accent-red-bright)' }}>*</span>}
            </label>
            <input type="text" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Mínimo 3 caracteres" required />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Contraseña {!form.password.trim() && <span style={{ color: 'var(--accent-red-bright)' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 4 caracteres" required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              ¿Qué rol tendrás? {!form.role && <span style={{ color: 'var(--accent-red-bright)' }}>*</span>}
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className={`glass-panel ${form.role === 'player' ? 'clickable' : ''}`}
                onClick={() => setForm({ ...form, role: 'player' })}
                style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', borderColor: form.role === 'player' ? 'var(--accent-gold)' : 'var(--glass-border)', background: form.role === 'player' ? 'rgba(200,155,60,0.1)' : '' }}>
                <Sword size={24} style={{ color: form.role === 'player' ? 'var(--accent-gold)' : 'var(--text-muted)', marginBottom: '0.3rem' }} />
                <div style={{ fontWeight: 600, color: form.role === 'player' ? '#fff' : 'var(--text-muted)' }}>Jugador</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Crea personajes y juega</div>
              </button>

              <button type="button" className={`glass-panel ${form.role === 'dm' ? 'clickable' : ''}`}
                onClick={() => setForm({ ...form, role: 'dm' })}
                style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', borderColor: form.role === 'dm' ? 'var(--accent-red)' : 'var(--glass-border)', background: form.role === 'dm' ? 'rgba(139,0,0,0.1)' : '' }}>
                <Shield size={24} style={{ color: form.role === 'dm' ? 'var(--accent-red-bright)' : 'var(--text-muted)', marginBottom: '0.3rem' }} />
                <div style={{ fontWeight: 600, color: form.role === 'dm' ? '#fff' : 'var(--text-muted)' }}>Dungeon Master</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Crea y dirige campañas</div>
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(139,0,0,0.4)', borderRadius: '6px', padding: '0.6rem', color: '#f88', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-gold btn-lg" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            <UserPlus size={18} /> {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
