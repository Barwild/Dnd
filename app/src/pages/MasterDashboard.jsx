import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getCampaign, getCharacters, getMonsters, getMonster,
  getEncounters, createEncounter, updateEncounter, deleteEncounter,
  getSessionNotes, createSessionNote, updateSessionNote, deleteSessionNote,
  rollDice, getDiceLog, getCampaignMembers, updateCharacter, createCharacter
} from '../api';
import { Users, Sword, BookOpen, Plus, Trash2, Play, Pause, SkipForward, Dice5, ScrollText, ChevronDown, ChevronUp, Search, Shield, Heart, Zap, AlertTriangle, Hammer, X, UserCog } from 'lucide-react';

const CONDITIONS_LIST = [
  'Cegado', 'Encantado', 'Ensordecido', 'Asustado', 'Agarrado',
  'Incapacitado', 'Invisible', 'Paralizado', 'Petrificado',
  'Envenenado', 'Tumbado', 'Inmovilizado', 'Aturdido', 'Inconsciente'
];

const TRANSLATIONS = {
  // Types
  'humanoid': 'humanoide', 'beast': 'bestia', 'dragon': 'dragón', 'undead': 'no-muerto', 'monstrosity': 'monstruosidad',
  'fiend': 'fiel', 'fey': 'hada', 'celestial': 'celestial', 'construct': 'autómata', 'elemental': 'elemental',
  'aberration': 'aberración', 'ooze': 'limo', 'plant': 'planta', 'giant': 'gigante', 'swarm of tiny beasts': 'enjambre de bestias pequeñas',
  // Sizes
  'Tiny': 'Diminuto', 'Small': 'Pequeño', 'Medium': 'Mediano', 'Large': 'Grande', 'Huge': 'Enorme', 'Gargantuan': 'Gargantuesco',
  // Common Actions
  'Multiattack': 'Multiataque', 'Bite': 'Mordisco', 'Claw': 'Garra', 'Shortbow': 'Arco corto', 'Longbow': 'Arco largo',
  'Scimitar': 'Cimitarra', 'Greatsword': 'Espadón', 'Longsword': 'Espada larga', 'Dagger': 'Daga', 'Club': 'Porra',
  'Mace': 'Maza', 'Greataxe': 'Gran hacha', 'Tail': 'Cola', 'Breath Weapon': 'Arma de aliento', 'Fire Breath': 'Aliento de fuego',
  'Spear': 'Lanza', 'Javelin': 'Jabalina', 'Slam': 'Golpetazo', 'Tentacle': 'Tentáculo', 'Sting': 'Aguijón',
  'Web': 'Telaraña', 'Reactions': 'Reacciones', 'Legendary Actions': 'Acciones Legendarias', 'Special Abilities': 'Habilidades Especiales',
  'Melee Weapon Attack': 'Ataque de arma cuerpo a cuerpo', 'Ranged Weapon Attack': 'Ataque de arma a distancia',
  'Hit': 'Impacto', 'damage': 'daño', 'reach': 'alcance', 'range': 'rango', 'target': 'objetivo',
  'str': 'fue', 'dex': 'des', 'con': 'con', 'int': 'int', 'wis': 'sab', 'cha': 'car'
};

const t = (term) => {
  if (!term) return '';
  const clean = term.toLowerCase().trim();
  return TRANSLATIONS[clean] || TRANSLATIONS[term] || term;
};

export default function MasterDashboard() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [campaignMembers, setCampaignMembers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [tab, setTab] = useState('combat');

  // Combat state
  const [encounters, setEncounters] = useState([]);
  const [activeEnc, setActiveEnc] = useState(null);
  const [combatants, setCombatants] = useState([]);
  const [round, setRound] = useState(0);
  const [turn, setTurn] = useState(0);

  // Monster search
  const [monsterSearch, setMonsterSearch] = useState('');
  const [monsterCR, setMonsterCR] = useState('');
  const [monsterResults, setMonsterResults] = useState([]);
  const [expandedMonster, setExpandedMonster] = useState(null);
  const [monsterDetail, setMonsterDetail] = useState(null);

  // Notes
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Dice
  const [diceFormula, setDiceFormula] = useState('1d20');
  const [diceLog, setDiceLog] = useState([]);
  const [lastRoll, setLastRoll] = useState(null);

  // Combat log & damage
  const [combatLog, setCombatLog] = useState([]);
  const [damageInput, setDamageInput] = useState({});
  const [conditionPicker, setConditionPicker] = useState(null);
  
  // Expanded Monster stats in combat tracker
  const [expandedCombatant, setExpandedCombatant] = useState(null);
  const [combatantDetails, setCombatantDetails] = useState({});
  const [expandedAction, setExpandedAction] = useState(null);

  const toggleCombatantDetail = async (c) => {
    if (expandedCombatant === c.id) {
      setExpandedCombatant(null);
      return;
    }
    if (!combatantDetails[c.id] && c.monsterId) {
      try {
        const res = await getMonster(c.monsterId);
        setCombatantDetails(prev => ({...prev, [c.id]: res.data}));
      } catch (e) { console.error(e); }
    }
    setExpandedCombatant(c.id);
    setExpandedAction(null);
  };

  useEffect(() => {
    getCampaign(campaignId).then(r => setCampaign(r.data));
    getCampaignMembers(campaignId).then(r => setCampaignMembers(r.data || []));
    getCharacters(campaignId).then(r => setCharacters(r.data || []));
    getEncounters(campaignId).then(r => setEncounters(r.data || []));
    getSessionNotes(campaignId).then(r => setNotes(r.data || []));
    getDiceLog(campaignId, 20).then(r => setDiceLog(r.data || [])).catch(() => {});
  }, [campaignId]);

  const assignCharacter = async (charId, userId) => {
    await updateCharacter(charId, { user_id: parseInt(userId) });
    getCharacters(campaignId).then(r => setCharacters(r.data || []));
  };

  const unlinkCharacter = async (charId) => {
    if (window.confirm('¿Desvincular este personaje de la campaña?')) {
      await updateCharacter(charId, { campaign_id: null });
      getCharacters(campaignId).then(r => setCharacters(r.data || []));
    }
  };

  const createMonsterCharacter = async (monster) => {
    const detailRes = await getMonster(monster.index);
    const detail = detailRes.data;
    const name = window.prompt(`¿Nombre para el personaje basado en ${detail.name}?`, detail.name);
    if (!name) return;

    let notes = `*Tipo: ${detail.type} | Tamaño: ${detail.size} | Alineamiento: ${detail.alignment}*\n`;
    notes += `**AC:** ${detail.armor_class} | **Velocidad:** ${JSON.stringify(detail.speed)}\n\n`;

    const addSection = (title, jsonStr) => {
      try {
        const arr = JSON.parse(jsonStr || '[]');
        if (arr.length > 0) {
          notes += `### ${title}\n`;
          arr.forEach(a => { notes += `- **${t(a.name)}:** ${a.desc}\n`; });
          notes += '\n';
        }
      } catch {}
    };

    addSection('Habilidades Especiales', detail.special_abilities);
    addSection('Acciones', detail.actions);
    addSection('Acciones Legendarias', detail.legendary_actions);

    const stats = {
      STR: detail.strength, DEX: detail.dexterity, CON: detail.constitution,
      INT: detail.intelligence, WIS: detail.wisdom, CHA: detail.charisma,
      maxHP: detail.hit_points, currHP: detail.hit_points, ac: detail.armor_class,
      skillProficiencies: [], saveProficiencies: [], expertise: []
    };

    await createCharacter({
      name,
      level: parseInt(detail.challenge_rating) || 1,
      campaign_id: parseInt(campaignId),
      stats: JSON.stringify(stats),
      notes: notes.trim()
    });

    getCharacters(campaignId).then(r => setCharacters(r.data || []));
    alert(`${name} creado exitosamente y añadido a la mesa.`);
  };

  // Load encounter from EncounterBuilder
  useEffect(() => {
    if (location.state?.launchEncounter) {
      const monsters = location.state.launchEncounter;
      const newCombatants = [];
      monsters.forEach(m => {
        for (let i = 0; i < m.count; i++) {
          const dexMod = 0; // default
          newCombatants.push({
            id: Date.now() + Math.random(),
            name: `${m.name} #${i + 1}`,
            baseName: m.name,
            type: 'monster',
            hp: m.hp, maxHp: m.hp, ac: m.ac,
            initiative: Math.floor(Math.random() * 20) + 1 + dexMod,
            dex: 10, monsterId: m.id, conditions: []
          });
        }
      });
      setCombatants(newCombatants.sort((a, b) => b.initiative - a.initiative));
      setCombatLog(prev => [...prev, `⚔️ Encuentro "${location.state.encounterName || 'Nuevo'}" cargado con ${newCombatants.length} monstruos`]);
      window.history.replaceState({}, document.title); // Clear state
    }
  }, [location.state]);

  // ═══ COMBAT ═══
  const searchMonsters = async () => {
    const params = { limit: 20 };
    if (monsterSearch) params.search = monsterSearch;
    if (monsterCR) params.cr = monsterCR;
    const res = await getMonsters(params);
    setMonsterResults(res.data || []);
  };

  useEffect(() => { if (monsterSearch.length > 1 || monsterCR) searchMonsters(); }, [monsterSearch, monsterCR]);

  const loadMonsterDetail = async (monsterId) => {
    if (expandedMonster === monsterId) { setExpandedMonster(null); return; }
    const res = await getMonster(monsterId);
    setMonsterDetail(res.data);
    setExpandedMonster(monsterId);
  };

  const addCombatant = (entity, type = 'monster') => {
    const mod = (v) => Math.floor(((v || 10) - 10) / 2);
    const newC = {
      id: Date.now() + Math.random(),
      name: entity.name + (type === 'monster' ? ` #${combatants.filter(c => c.baseName === entity.name).length + 1}` : ''),
      baseName: entity.name,
      type,
      hp: type === 'monster' ? entity.hit_points : 0,
      maxHp: type === 'monster' ? entity.hit_points : 0,
      ac: type === 'monster' ? entity.armor_class : 10,
      initiative: Math.floor(Math.random() * 20) + 1 + mod(entity.dexterity || 10),
      dex: entity.dexterity || 10,
      monsterId: type === 'monster' ? entity.id : null,
      conditions: [],
    };
    if (type === 'player') {
      try {
        const stats = JSON.parse(entity.stats || '{}');
        newC.hp = stats.currHP || stats.maxHP || 1;
        newC.maxHp = stats.maxHP || 1;
        newC.ac = 10 + mod(stats.DEX || 10);
        newC.initiative = Math.floor(Math.random() * 20) + 1 + mod(stats.DEX || 10);
        newC.dex = stats.DEX || 10;
      } catch {}
    }
    setCombatants(prev => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
    setCombatLog(prev => [...prev, `➕ ${newC.name} añadido (Init: ${newC.initiative})`]);
  };

  const removeCombatant = (id) => {
    const c = combatants.find(x => x.id === id);
    setCombatants(prev => prev.filter(x => x.id !== id));
    if (c) setCombatLog(prev => [...prev, `❌ ${c.name} eliminado del combate`]);
  };

  const updateCombatantHP = (id, delta) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
      return { ...c, hp: newHp };
    }));
  };

  const applyDamage = (id) => {
    const amount = parseInt(damageInput[id]) || 0;
    if (amount === 0) return;
    const c = combatants.find(x => x.id === id);
    if (!c) return;
    const actual = Math.min(amount, c.hp);
    updateCombatantHP(id, -amount);
    setCombatLog(prev => [...prev, `💥 ${c.name} recibe ${actual} de daño (${Math.max(0, c.hp - amount)}/${c.maxHp} PG)`]);
    if (c.hp - amount <= 0) setCombatLog(prev => [...prev, `💀 ${c.name} ha caído!`]);
    setDamageInput(prev => ({ ...prev, [id]: '' }));
  };

  const applyHealing = (id) => {
    const amount = parseInt(damageInput[id]) || 0;
    if (amount === 0) return;
    const c = combatants.find(x => x.id === id);
    if (!c) return;
    updateCombatantHP(id, amount);
    setCombatLog(prev => [...prev, `💚 ${c.name} recupera ${amount} PG`]);
    setDamageInput(prev => ({ ...prev, [id]: '' }));
  };

  const toggleCondition = (id, condition) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== id) return c;
      const conds = c.conditions || [];
      if (conds.includes(condition)) {
        setCombatLog(p => [...p, `✅ ${c.name}: ${condition} eliminado`]);
        return { ...c, conditions: conds.filter(x => x !== condition) };
      }
      setCombatLog(p => [...p, `⚠️ ${c.name}: ${condition} aplicado`]);
      return { ...c, conditions: [...conds, condition] };
    }));
    setConditionPicker(null);
  };

  const updateInitiative = (id, val) => {
    const num = parseInt(val) || 0;
    setCombatants(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, initiative: num } : c);
      return [...updated].sort((a, b) => b.initiative - a.initiative);
    });
  };

  const nextTurn = () => {
    if (combatants.length === 0) return;
    let newTurn = turn + 1;
    let newRound = round;
    if (newTurn >= combatants.length) { newTurn = 0; newRound++; }
    if (round === 0) newRound = 1;
    setTurn(newTurn);
    setRound(newRound);
    const next = combatants[newTurn];
    if (next) setCombatLog(prev => [...prev, `🔄 Turno de ${next.name} (Ronda ${newRound})`]);
  };

  const startCombat = () => {
    setRound(1); setTurn(0);
    setCombatLog(prev => [...prev, `⚔️ ¡COMBATE INICIADO! Ronda 1`]);
  };

  // ═══ DICE ═══
  const handleRoll = async () => {
    try {
      const res = await rollDice({ campaign_id: parseInt(campaignId), dice_formula: diceFormula, character_name: 'DM', roll_type: 'custom', description: `DM: ${diceFormula}` });
      setLastRoll(res.data);
      setDiceLog(prev => [res.data, ...prev].slice(0, 20));
    } catch {}
  };

  // ═══ NOTES ═══
  const saveNote = async () => {
    if (editingNote) {
      await updateSessionNote(editingNote.id, { title: noteTitle, content: noteContent });
    } else {
      await createSessionNote({ campaign_id: parseInt(campaignId), title: noteTitle || 'Sin título', content: noteContent, session_number: notes.length + 1 });
    }
    setEditingNote(null); setNoteTitle(''); setNoteContent('');
    getSessionNotes(campaignId).then(r => setNotes(r.data || []));
  };

  const deleteNote = async (id) => {
    if (window.confirm('¿Eliminar esta nota?')) {
      await deleteSessionNote(id);
      getSessionNotes(campaignId).then(r => setNotes(r.data || []));
    }
  };

  if (!campaign) return <div className="page-center"><h2>Cargando campaña...</h2></div>;

  const tabs = [
    { id: 'combat', label: 'Combate', icon: <Sword size={16} /> },
    { id: 'notes', label: 'Notas', icon: <ScrollText size={16} /> },
    { id: 'dice', label: 'Dados', icon: <Dice5 size={16} /> },
    { id: 'log', label: 'Log', icon: <ScrollText size={16} /> },
  ];

  return (
    <div className="container fade-in" style={{ maxWidth: '1400px' }}>
      <div className="flex-row flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/campaigns')}>← Campañas</button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent-red)' }}>{campaign.name}</h1>
        <div className="flex-row" style={{ gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/master/${campaignId}/encounter-builder`)}>
            <Hammer size={14} /> Constructor
          </button>
          <span className="badge badge-gold" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>Código: {campaign.code}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} className={`btn ${tab === t.id ? 'btn-gold' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ COMBAT TAB ═══ */}
      {tab === 'combat' && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left: Party + Monsters */}
          <div style={{ flex: '1', minWidth: '280px' }}>
            {/* Party */}
            <div className="glass-panel" style={{ marginBottom: '1rem', borderTop: '3px solid var(--accent-gold)' }}>
              <h3><Users size={16} /> Mesa de Juego ({characters.length})</h3>
              {characters.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay personajes en esta campaña.</p>
              ) : characters.map(ch => (
                <div key={ch.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid #222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#ddd', fontWeight: 'bold' }}>{ch.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'normal' }}>{ch.class_name ? `Nv${ch.level} ${ch.class_name}` : '(Monstruo)'}</span></span>
                    <button className="btn btn-secondary btn-sm" onClick={() => addCombatant(ch, 'player')} style={{ padding: '0.2rem 0.5rem' }}>
                      <Plus size={12} /> Inic
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#888' }}>
                      <UserCog size={12} /> Dueño:
                      <select value={ch.user_id} onChange={(e) => assignCharacter(ch.id, e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'var(--accent-gold)', borderRadius: '4px', padding: '0.1rem 0.3rem', fontSize: '0.75rem' }}>
                        {campaignMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.display_name}</option>
                        ))}
                      </select>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#d44', padding: '0.2rem', fontSize: '0.7rem' }} onClick={() => unlinkCharacter(ch.id)}>
                      Expulsar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Monster Search */}
            <div className="glass-panel" style={{ borderTop: '3px solid var(--accent-red)' }}>
              <h3><BookOpen size={16} /> Buscar Monstruos</h3>
              <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.8rem' }}>
                <input type="text" placeholder="Nombre..." value={monsterSearch} onChange={e => setMonsterSearch(e.target.value)} style={{ flex: 1 }} />
                <select value={monsterCR} onChange={e => setMonsterCR(e.target.value)} style={{ width: '70px' }}>
                  <option value="">CR</option>
                  {['0', '0.125', '0.25', '0.5', ...Array.from({ length: 30 }, (_, i) => String(i + 1))].map(cr => (
                    <option key={cr} value={cr}>{cr === '0.125' ? '1/8' : cr === '0.25' ? '1/4' : cr === '0.5' ? '1/2' : cr}</option>
                  ))}
                </select>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {monsterResults.map(m => (
                  <div key={m.index} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
                    <div className="flex-row flex-between">
                      <div style={{ cursor: 'pointer' }} onClick={() => loadMonsterDetail(m.index)}>
                        <strong style={{ color: 'var(--accent-gold)' }}>{m.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>
                          CR {m.challenge_rating} • CA {m.armor_class} • PG {m.hit_points} • {t(m.type)}
                        </div>
                      </div>
                      <div className="flex-row" style={{ gap: '0.3rem' }}>
                        <button className="btn btn-gold btn-sm" onClick={() => createMonsterCharacter(m)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} title="Crear como Personaje">
                          <UserCog size={12} /> A Ficha
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => {
                          getMonster(m.index).then(res => addCombatant(res.data, 'monster'));
                        }} style={{ padding: '0.2rem 0.5rem' }}>
                          <Plus size={12} /> Añadir
                        </button>
                      </div>
                    </div>
                    {expandedMonster === m.index && monsterDetail && (
                      <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <div className="stats-grid" style={{ marginBottom: '0.5rem', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem' }}>
                          {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(stat => (
                            <div key={stat} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>{t(stat.substring(0, 3))}</div>
                              <div style={{ fontWeight: 'bold', color: '#fff' }}>{monsterDetail[stat]}</div>
                            </div>
                          ))}
                        </div>
                        {(() => { try { const acts = JSON.parse(monsterDetail.actions || '[]'); return acts.map((a, i) => (
                          <div key={i} style={{ marginBottom: '0.4rem' }}>
                            <strong style={{ color: 'var(--accent-red-bright)' }}>{t(a.name)}:</strong>
                            <span style={{ color: '#ccc' }}> {a.desc?.substring(0, 200)}</span>
                          </div>
                        )); } catch { return null; } })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Initiative Tracker */}
          <div className="glass-panel" style={{ flex: '1.3', minWidth: '350px', borderTop: '3px solid var(--accent-red)' }}>
            <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}><Sword size={18} /> Rastreador de Iniciativa</h3>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                {round === 0 ? (
                  <button className="btn btn-gold btn-sm" onClick={startCombat} disabled={combatants.length === 0}>
                    <Play size={14} /> ¡Combatir!
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={nextTurn}>
                    <SkipForward size={14} /> Siguiente
                  </button>
                )}
                <span className="badge badge-red">Ronda {round}</span>
              </div>
            </div>

            {combatants.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                Añade combatientes desde la mesa de juego o el bestiario.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {combatants.map((c, idx) => {
                  const isActive = round > 0 && idx === turn;
                  const hpPct = c.maxHp ? (c.hp / c.maxHp) * 100 : 100;
                  const hpColor = hpPct > 60 ? '#4a4' : hpPct > 30 ? '#e84' : '#d44';
                  return (
                    <div key={c.id} style={{
                      padding: '0.6rem 0.8rem', borderRadius: '8px',
                      background: isActive ? 'rgba(200,155,60,0.15)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${isActive ? 'var(--accent-gold)' : '#222'}`,
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        {isActive && <div style={{ width: '4px', height: '36px', background: 'var(--accent-gold)', borderRadius: '2px' }} />}
                        
                        <div style={{ width: '45px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>INIC</div>
                          <input 
                            type="number" 
                            defaultValue={c.initiative} 
                            onBlur={(e) => updateInitiative(c.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateInitiative(c.id, e.target.value)}
                            style={{ 
                              width: '100%', 
                              background: 'transparent', 
                              border: 'none', 
                              color: isActive ? 'var(--accent-gold)' : '#fff', 
                              fontWeight: 'bold', 
                              textAlign: 'center',
                              fontSize: '1rem',
                              padding: 0
                            }} 
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div 
                            style={{ fontWeight: 600, color: c.hp <= 0 ? '#666' : '#fff', textDecoration: c.hp <= 0 ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            onClick={() => toggleCombatantDetail(c)}
                          >
                            {c.name} {expandedCombatant === c.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <span style={{ color: 'var(--accent-blue)' }}><Shield size={10} /> {c.ac}</span>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '4px', height: '8px', overflow: 'hidden', maxWidth: '120px' }}>
                              <div style={{ background: hpColor, height: '100%', width: `${hpPct}%`, transition: 'width 0.2s' }} />
                            </div>
                            <span style={{ color: hpColor }}>{c.hp}/{c.maxHp}</span>
                          </div>
                        </div>

                        <div className="flex-row" style={{ gap: '0.3rem' }}>
                          <input type="number" value={damageInput[c.id] || ''}
                            onChange={e => setDamageInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && applyDamage(c.id)}
                            placeholder="#" style={{ width: '40px', padding: '0.2rem', textAlign: 'center', fontSize: '0.75rem' }} />
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => applyDamage(c.id)}
                            style={{ width: '24px', height: '24px', padding: 0, fontSize: '0.7rem' }} title="Daño">💥</button>
                          <button className="btn btn-sm btn-icon" onClick={() => applyHealing(c.id)}
                            style={{ width: '24px', height: '24px', padding: 0, fontSize: '0.7rem', background: 'rgba(0,80,0,0.5)', border: '1px solid #3a3', color: '#fff' }} title="Curar">💚</button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConditionPicker(conditionPicker === c.id ? null : c.id)}
                            style={{ width: '24px', height: '24px', padding: 0, fontSize: '0.7rem' }} title="Condiciones">
                            <AlertTriangle size={12} />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeCombatant(c.id)} style={{ width: '24px', height: '24px', padding: 0, fontSize: '0.7rem' }}>×</button>
                        </div>
                      </div>

                      {/* Expanded Combatant Details */}
                      {expandedCombatant === c.id && combatantDetails[c.id] && (
                        <div className="fade-in" style={{ marginTop: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="stats-grid" style={{ marginBottom: '0.8rem', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem' }}>
                            {['fue', 'des', 'con', 'int', 'sab', 'car'].map((s, idx) => {
                              const v = combatantDetails[c.id][['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'][idx]];
                              const m = Math.floor(((v || 10) - 10) / 2);
                              return (
                                <div key={s} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', padding: '0.3rem' }}>
                                  <div style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>{s}</div>
                                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.8rem' }}>{v} <span style={{ fontSize: '0.65rem', color: m >= 0 ? '#4a4' : '#d44' }}>{m >= 0 ? `+${m}` : m}</span></div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {(() => {
                            try {
                              const actions = JSON.parse(combatantDetails[c.id].actions || '[]');
                              if (!actions.length) return null;
                              return (
                                <div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-red-bright)', marginBottom: '0.4rem', borderBottom: '1px solid var(--accent-red)', paddingBottom: '0.2rem' }}>ACCIONES & HECHIZOS</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {actions.map((act, idx) => {
                                      const isExp = expandedAction === `${c.id}-${idx}`;
                                      let desc = act.desc || '';
                                      // Bonus: Translate some keywords inside the description
                                      Object.keys(TRANSLATIONS).forEach(k => {
                                        if (k.length > 3) { // skip short ones like 'hit' to avoid mess
                                          const regex = new RegExp(`\\b${k}\\b`, 'gi');
                                          desc = desc.replace(regex, TRANSLATIONS[k]);
                                        }
                                      });
                                      return (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '4px' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{t(act.name)}</strong>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setExpandedAction(isExp ? null : `${c.id}-${idx}`)}
                                              style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', color: 'var(--accent-gold)', border: '1px solid rgba(200,155,60,0.5)' }}>
                                              {isExp ? 'Ocultar info' : 'Info'}
                                            </button>
                                          </div>
                                          {isExp && (
                                            <div style={{ fontSize: '0.75rem', color: '#bbb', marginTop: '0.4rem', lineHeight: '1.4' }}>
                                              {desc}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            } catch { return null; }
                          })()}
                        </div>
                      )}

                      {/* Conditions tags */}
                      {(c.conditions || []).length > 0 && (
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem', marginLeft: '43px' }}>
                          {c.conditions.map(cond => (
                            <span key={cond} className="badge badge-red" style={{ cursor: 'pointer', fontSize: '0.65rem' }}
                              onClick={() => toggleCondition(c.id, cond)} title="Clic para quitar">
                              {cond} ×
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Condition picker */}
                      {conditionPicker === c.id && (
                        <div className="fade-in" style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {CONDITIONS_LIST.map(cond => (
                            <button key={cond} className={`btn btn-sm ${(c.conditions || []).includes(cond) ? 'btn-danger' : 'btn-ghost'}`}
                              onClick={() => toggleCondition(c.id, cond)}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                              {cond}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ NOTES TAB ═══ */}
      {tab === 'notes' && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ marginBottom: '1.5rem', borderTop: '3px solid var(--accent-gold)' }}>
            <h3>{editingNote ? 'Editar Nota' : 'Nueva Nota de Sesión'}</h3>
            <input type="text" placeholder="Título..." value={noteTitle} onChange={e => setNoteTitle(e.target.value)} style={{ marginBottom: '0.8rem' }} />
            <textarea placeholder="Escribe tus notas de la sesión..." value={noteContent} onChange={e => setNoteContent(e.target.value)} rows={6} style={{ marginBottom: '0.8rem' }} />
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <button className="btn btn-gold" onClick={saveNote} disabled={!noteTitle.trim()}>
                {editingNote ? 'Actualizar' : 'Guardar Nota'}
              </button>
              {editingNote && <button className="btn btn-ghost" onClick={() => { setEditingNote(null); setNoteTitle(''); setNoteContent(''); }}>Cancelar</button>}
            </div>
          </div>

          <div className="flex-col">
            {notes.map(n => (
              <div key={n.id} className="glass-panel" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
                <div className="flex-row flex-between">
                  <div>
                    <h3 style={{ margin: 0 }}>{n.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Sesión #{n.session_number}</span>
                  </div>
                  <div className="flex-row" style={{ gap: '0.3rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingNote(n); setNoteTitle(n.title); setNoteContent(n.content); }}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteNote(n.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: '#ccc', fontSize: '0.9rem' }}>{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ DICE TAB ═══ */}
      {tab === 'dice' && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ textAlign: 'center', borderTop: '3px solid var(--accent-gold)' }}>
            <h2>🎲 Tirador de Dados</h2>

            {lastRoll && (
              <div className="slide-up" style={{ margin: '1rem 0' }}>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{lastRoll.total}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{lastRoll.dice_formula}</div>
              </div>
            )}

            <div className="flex-row flex-center" style={{ gap: '0.5rem', marginTop: '1rem' }}>
              <input type="text" value={diceFormula} onChange={e => setDiceFormula(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRoll()}
                style={{ width: '150px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 'bold' }} />
              <button className="btn btn-gold btn-lg" onClick={handleRoll}>
                <Dice5 size={18} /> ¡Tirar!
              </button>
            </div>

            <div className="flex-row flex-center" style={{ gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '1d100'].map(d => (
                <button key={d} className="btn btn-ghost btn-sm" onClick={() => { setDiceFormula(d); }}>{d}</button>
              ))}
            </div>
          </div>

          {diceLog.length > 0 && (
            <div className="glass-panel" style={{ marginTop: '1rem' }}>
              <h3>Historial de Tiradas</h3>
              {diceLog.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #222', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r.roller_name || 'DM'}: {r.dice_formula}</span>
                  <strong style={{ color: 'var(--accent-gold)' }}>{r.total}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ═══ COMBAT LOG TAB ═══ */}
      {tab === 'log' && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ borderTop: '3px solid var(--accent-red)' }}>
            <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}><ScrollText size={16} /> Registro de Combate</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setCombatLog([])}>Limpiar</button>
            </div>
            {combatLog.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>El registro de combate aparecerá aquí.</p>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '0.3rem' }}>
                {combatLog.slice().reverse().map((entry, i) => (
                  <div key={i} style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.85rem', color: '#ccc', borderLeft: '3px solid var(--accent-red)' }}>
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
