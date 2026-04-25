import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacter, updateCharacter, getRace, getClass as getClassApi, getItems, rollDice, getCharacters } from '../api';
import { Save, BookOpen, Heart, Shield, Swords, ArrowUp, Moon, Sunrise, Plus, Minus, Dice5, Target, UserCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

const STAT_NAMES = { STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR' };
const STAT_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const FULL_NAMES = { STR: 'Fuerza', DEX: 'Destreza', CON: 'Constitución', INT: 'Inteligencia', WIS: 'Sabiduría', CHA: 'Carisma' };

// HP per level (beyond lvl 1): avg or roll
const CLASS_HIT_DICE = { 'bárbaro': 12, 'guerrero': 10, 'paladín': 10, 'explorador': 10, 'bardo': 8, 'clérigo': 8, 'druida': 8, 'monje': 8, 'brujo': 8, 'pícaro': 8, 'hechicero': 6, 'mago': 6 };

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [stats, setStats] = useState({});
  const [raceName, setRaceName] = useState('');
  const [className, setClassName] = useState('');
  const [hitDie, setHitDie] = useState(8);
  const [equipment, setEquipment] = useState([]);
  const [saving, setSaving] = useState(false);
  const [diceResult, setDiceResult] = useState(null);

  const load = async () => {
    try {
      const res = await getCharacter(id);
      const char = res.data;
      let statsObj = {};
      try { statsObj = JSON.parse(char.stats || '{}'); } catch {}
      let eq = [];
      try { eq = JSON.parse(char.equipment || '[]'); } catch {}
      setCharacter(char);
      setStats(statsObj);
      setEquipment(eq);

      if (char.race_id) getRace(char.race_id).then(r => setRaceName(r.data.name)).catch(() => {});
      if (char.class_id) getClassApi(char.class_id).then(c => { setClassName(c.data.name); setHitDie(c.data.hit_die); }).catch(() => {});
      
      if (char.campaign_id) {
        getCharacters(char.campaign_id).then(res => {
          const myChars = (res.data || []).filter(c => c.user_id === user?.id);
          setCampaignCharacters(myChars);
        }).catch(() => {});
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    await updateCharacter(id, {
      stats: JSON.stringify(stats),
      equipment: JSON.stringify(equipment),
      level: character.level,
      notes: character.notes
    });
    setSaving(false);
  };

  const mod = (val) => Math.floor(((val || 10) - 10) / 2);
  const modStr = (val) => { const m = mod(val); return m >= 0 ? `+${m}` : `${m}`; };
  const profBonus = Math.ceil((character?.level || 1) / 4) + 1;

  const adjustHP = (delta) => {
    setStats(prev => ({
      ...prev,
      currHP: Math.max(0, Math.min(prev.maxHP || 1, (prev.currHP || 0) + delta))
    }));
  };

  const shortRest = () => {
    const hitDiceAvail = (character?.level || 1) - (stats.hitDiceUsed || 0);
    if (hitDiceAvail <= 0) { alert('No te quedan dados de golpe.'); return; }
    const roll = Math.floor(Math.random() * hitDie) + 1 + mod(stats.CON || 10);
    const healed = Math.max(0, roll);
    setStats(prev => ({
      ...prev,
      currHP: Math.min(prev.maxHP, (prev.currHP || 0) + healed),
      hitDiceUsed: (prev.hitDiceUsed || 0) + 1
    }));
    alert(`Descanso Corto: Recuperas ${healed} PG (tiraste ${roll} con d${hitDie})`);
  };

  const longRest = () => {
    const halfDice = Math.max(1, Math.floor((character?.level || 1) / 2));
    setStats(prev => ({
      ...prev,
      currHP: prev.maxHP || 1,
      hitDiceUsed: Math.max(0, (prev.hitDiceUsed || 0) - halfDice),
      spellSlots: Object.fromEntries(
        Object.entries(prev.spellSlots || {}).map(([k, v]) => [k, { ...v, used: 0 }])
      )
    }));
    alert('Descanso Largo: PG máximos restaurados, espacios de conjuro restaurados.');
  };

  const levelUp = () => {
    const cn = className.toLowerCase();
    const hd = CLASS_HIT_DICE[cn] || hitDie;
    const avg = Math.floor(hd / 2) + 1;
    const hpGain = avg + mod(stats.CON || 10);
    setStats(prev => ({ ...prev, maxHP: (prev.maxHP || 1) + Math.max(1, hpGain), currHP: (prev.currHP || 0) + Math.max(1, hpGain) }));
    setCharacter(prev => ({ ...prev, level: (prev.level || 1) + 1 }));
  };

  const handleRoll = async (formula, desc) => {
    try {
      const res = await rollDice({ dice_formula: formula, character_name: character?.name || '', description: desc, roll_type: 'check' });
      setDiceResult({ ...res.data, description: desc });
      setTimeout(() => setDiceResult(null), 5000);
    } catch { /* silent */ }
  };

  if (!character) return <div className="page-center"><h2>Cargando ficha...</h2></div>;

  const hpPercent = stats.maxHP ? (stats.currHP / stats.maxHP) * 100 : 100;
  const hpColor = hpPercent > 60 ? '#4a4' : hpPercent > 30 ? '#e84' : '#d44';
  const ac = 10 + mod(stats.DEX);
  const initiative = mod(stats.DEX);
  const speed = 30;

  return (
    <div className="container fade-in" style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex-row flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex-row" style={{ gap: '0.8rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/player-lobby')}>← Lobby</button>
          {campaignCharacters.length > 1 && (
            <div className="flex-row" style={{ gap: '0.5rem', alignItems: 'center', background: 'rgba(200,155,60,0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid var(--accent-gold)' }}>
              <UserCircle size={16} style={{ color: 'var(--accent-gold)' }} />
              <select 
                value={id} 
                onChange={e => navigate(`/character/${e.target.value}`)}
                style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
              >
                {campaignCharacters.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1a1a24' }}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex-row" style={{ gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/skills`)}><Target size={16} /> Habilidades</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/spells`)}><BookOpen size={16} /> Grimorio</button>
          <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>

      {/* Dice notification */}
      {diceResult && (
        <div className="glass-panel slide-up" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 999, borderColor: 'var(--accent-gold)', padding: '1rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{diceResult.description}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{diceResult.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>{diceResult.dice_formula}</div>
        </div>
      )}

      {/* Character Name & Identity */}
      <div className="glass-panel" style={{ textAlign: 'center', borderTop: '3px solid var(--accent-gold)', marginBottom: '1.5rem', position: 'relative' }}>
        <h1 style={{ fontSize: '2.2rem', margin: 0, color: '#fff' }}>{character.name}</h1>
        <p style={{ color: 'var(--accent-gold)', fontSize: '1rem', margin: '0.3rem 0' }}>
          Nivel {character.level} {raceName ? `• ${raceName}` : ''} {className ? `• ${className}` : ''} {!raceName && !className && '• Monstruo'}
        </p>
        <span className="badge badge-gold">Competencia: +{profBonus}</span>
      </div>

      {/* Combat row */}
      <div className="combat-row" style={{ marginBottom: '1.5rem' }}>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-blue)' }}>
          <span className="label">Clase de Armadura</span>
          <span className="value" style={{ color: 'var(--accent-blue)' }}>{ac}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>10 + DES ({modStr(stats.DEX)})</span>
        </div>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-green)' }}>
          <span className="label">Iniciativa</span>
          <span className="value" style={{ color: 'var(--accent-green)', cursor: 'pointer' }}
            onClick={() => handleRoll('1d20' + (initiative >= 0 ? `+${initiative}` : initiative), 'Tirada de Iniciativa')}>
            {initiative >= 0 ? '+' : ''}{initiative}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>Clic para tirar</span>
        </div>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-purple)' }}>
          <span className="label">Velocidad</span>
          <span className="value" style={{ color: 'var(--accent-purple)' }}>{speed}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>ft (9 m)</span>
        </div>
      </div>

      {/* HP Block */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}><Heart size={18} style={{ color: hpColor }} /> Puntos de Golpe</h3>
          <div className="flex-row" style={{ gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={shortRest}><Moon size={14} /> Descanso Corto</button>
            <button className="btn btn-ghost btn-sm" onClick={longRest}><Sunrise size={14} /> Descanso Largo</button>
            <button className="btn btn-secondary btn-sm" onClick={levelUp}><ArrowUp size={14} /> Subir Nivel</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-danger btn-icon" onClick={() => adjustHP(-1)}><Minus size={16} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', height: '30px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ background: hpColor, height: '100%', width: `${hpPercent}%`, transition: 'width 0.3s ease', borderRadius: '8px' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>
                {stats.currHP || 0} / {stats.maxHP || 0}
              </span>
            </div>
          </div>
          <button className="btn btn-icon" onClick={() => adjustHP(1)} style={{ background: 'rgba(0,100,0,0.5)', border: '1px solid #4a4', color: '#fff' }}><Plus size={16} /></button>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Dados de golpe restantes: {(character.level || 1) - (stats.hitDiceUsed || 0)}d{hitDie} de {character.level}d{hitDie}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Características</h3>
        <div className="stats-grid" style={{ marginBottom: '0.5rem' }}>
          {STAT_KEYS.map(stat => (
            <div key={stat} className="stat-block" style={{ cursor: 'pointer' }}
              onClick={() => handleRoll(`1d20${mod(stats[stat]) >= 0 ? '+' : ''}${mod(stats[stat])}`, `Chequeo de ${FULL_NAMES[stat]}`)}>
              <span className="stat-label">{STAT_NAMES[stat]}</span>
              <span className="stat-mod">{modStr(stats[stat])}</span>
              <span className="stat-score">{stats[stat] || 10}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
          Haz clic en un atributo para tirar un chequeo (1d20 + mod)
        </p>
      </div>

      {/* Notes */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Notas del Personaje</h3>
        <textarea value={character.notes || ''} onChange={e => setCharacter(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Escribe notas, rasgos, ideales, vínculos, defectos..."
          rows={4} style={{ width: '100%', resize: 'vertical' }} />
      </div>

      {/* Equipment */}
      <div className="glass-panel">
        <h3>Equipo e Inventario</h3>
        {equipment.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Inventario vacío. Añade objetos desde el Bestiario.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {equipment.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '6px' }}>
                <span>{item.name || item}</span>
                <button className="btn btn-danger btn-sm" onClick={() => setEquipment(prev => prev.filter((_, j) => j !== i))} style={{ padding: '0.2rem 0.5rem' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
