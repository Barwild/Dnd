import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacter, getClass as getClassApi, updateCharacter, rollDice } from '../api';
import { Save, Dice5, Eye, Shield, ChevronDown, ChevronUp } from 'lucide-react';

/* ── D&D 5E Skills mapped to abilities ── */
const SKILLS = [
  { index: 'acrobatics', name: 'Acrobacias', ability: 'DEX' },
  { index: 'animal-handling', name: 'Trato con Animales', ability: 'WIS' },
  { index: 'arcana', name: 'Arcanos', ability: 'INT' },
  { index: 'athletics', name: 'Atletismo', ability: 'STR' },
  { index: 'deception', name: 'Engaño', ability: 'CHA' },
  { index: 'history', name: 'Historia', ability: 'INT' },
  { index: 'insight', name: 'Perspicacia', ability: 'WIS' },
  { index: 'intimidation', name: 'Intimidación', ability: 'CHA' },
  { index: 'investigation', name: 'Investigación', ability: 'INT' },
  { index: 'medicine', name: 'Medicina', ability: 'WIS' },
  { index: 'nature', name: 'Naturaleza', ability: 'INT' },
  { index: 'perception', name: 'Percepción', ability: 'WIS' },
  { index: 'performance', name: 'Interpretación', ability: 'CHA' },
  { index: 'persuasion', name: 'Persuasión', ability: 'CHA' },
  { index: 'religion', name: 'Religión', ability: 'INT' },
  { index: 'sleight-of-hand', name: 'Juego de Manos', ability: 'DEX' },
  { index: 'stealth', name: 'Sigilo', ability: 'DEX' },
  { index: 'survival', name: 'Supervivencia', ability: 'WIS' },
];

const ABILITY_NAMES = {
  STR: 'Fuerza', DEX: 'Destreza', CON: 'Constitución',
  INT: 'Inteligencia', WIS: 'Sabiduría', CHA: 'Carisma'
};
const ABILITY_SHORT = {
  STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR'
};
const ABILITY_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/* Class → saving throw proficiencies */
const CLASS_SAVES = {
  'bárbaro': ['STR', 'CON'], 'bardo': ['DEX', 'CHA'], 'clérigo': ['WIS', 'CHA'],
  'druida': ['INT', 'WIS'], 'guerrero': ['STR', 'CON'], 'monje': ['STR', 'DEX'],
  'paladín': ['WIS', 'CHA'], 'explorador': ['STR', 'DEX'], 'pícaro': ['DEX', 'INT'],
  'hechicero': ['CON', 'CHA'], 'brujo': ['WIS', 'CHA'], 'mago': ['INT', 'WIS'],
};

const CLASS_SKILL_COUNT = {
  'bárbaro': 2, 'bardo': 3, 'clérigo': 2, 'druida': 2, 'guerrero': 2, 'monje': 2,
  'paladín': 2, 'explorador': 3, 'pícaro': 4, 'hechicero': 2, 'brujo': 2, 'mago': 2
};

const CLASS_SKILL_LIST = {
  'bárbaro': ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
  'bardo': SKILLS.map(s => s.index),
  'clérigo': ['history', 'insight', 'medicine', 'persuasion', 'religion'],
  'druida': ['animal-handling', 'arcana', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
  'guerrero': ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
  'monje': ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
  'paladín': ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
  'explorador': ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
  'pícaro': ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight-of-hand', 'stealth'],
  'hechicero': ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
  'brujo': ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
  'mago': ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion']
};

export default function SkillsSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [stats, setStats] = useState({});
  const [className, setClassName] = useState('');
  const [saving, setSaving] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [showSaves, setShowSaves] = useState(true);
  const [showSkills, setShowSkills] = useState(true);

  useEffect(() => {
    getCharacter(id).then(res => {
      const c = res.data;
      let s = {};
      try { s = JSON.parse(c.stats || '{}'); } catch {}
      if (!s.skillProficiencies) s.skillProficiencies = [];
      if (!s.saveProficiencies) s.saveProficiencies = [];
      if (!s.expertise) s.expertise = [];
      setCharacter(c);
      setStats(s);
      if (c.class_id) getClassApi(c.class_id).then(r => setClassName(r.data.name)).catch(() => {});
    });
  }, [id]);

  const mod = (val) => Math.floor(((val || 10) - 10) / 2);
  const modStr = (val) => { const m = mod(val); return m >= 0 ? `+${m}` : `${m}`; };
  const profBonus = Math.ceil((character?.level || 1) / 4) + 1;

  const toggleSkillProf = (skillIndex) => {
    const cn = className.toLowerCase();
    const limit = CLASS_SKILL_COUNT[cn] || 2;
    const options = CLASS_SKILL_LIST[cn] || [];
    
    // Background skills are locked
    const bgSkills = stats.background_skills || [];
    if (bgSkills.includes(skillIndex)) {
      alert("Esta habilidad proviene de tu trasfondo y no se puede quitar.");
      return;
    }

    setStats(prev => {
      const list = prev.skillProficiencies || [];
      const expertList = prev.expertise || [];
      const isProf = list.includes(skillIndex);
      const isExpert = expertList.includes(skillIndex);

      if (isExpert) {
        // Downgrade to just Prof
        return { ...prev, expertise: expertList.filter(s => s !== skillIndex) };
      }
      
      if (isProf) {
        // Can we upgrade to expertise? (Only Rogue/Bard)
        if (cn === 'pícaro' || cn === 'bardo') {
          const expLimit = cn === 'pícaro' ? (character.level >= 6 ? 4 : 2) : (character.level >= 10 ? 4 : (character.level >= 3 ? 2 : 0));
          if (expertList.length >= expLimit) {
            alert(`Como ${className} de nivel ${character.level}, solo puedes tener ${expLimit} pericias.`);
            return prev;
          }
          return { ...prev, expertise: [...expertList, skillIndex] };
        }
        // Otherwise remove prof
        return { ...prev, skillProficiencies: list.filter(s => s !== skillIndex) };
      }

      // Not proficient → check limit
      const currentFromClass = list.filter(s => options.includes(s) && !bgSkills.includes(SKILLS.find(sk => sk.index === s)?.name)).length;
      if (currentFromClass >= limit) {
        alert(`Ya has alcanzado el límite de habilidades para un ${className} (${limit}).`);
        return prev;
      }
      
      // If not even in class options, alert
      if (!options.includes(skillIndex)) {
        alert("Esta habilidad no está en la lista de opciones de tu clase.");
        return prev;
      }

      return { ...prev, skillProficiencies: [...list, skillIndex] };
    });
  };

  const toggleSaveProf = (ability) => {
    const cn = className.toLowerCase();
    const classSaves = CLASS_SAVES[cn] || [];
    if (classSaves.includes(ability)) {
      alert(`Como ${className}, ya eres competente en salvaciones de ${ABILITY_NAMES[ability]}.`);
      return;
    }

    setStats(prev => {
      const list = prev.saveProficiencies || [];
      if (list.includes(ability)) {
        return { ...prev, saveProficiencies: list.filter(s => s !== ability) };
      }
      return { ...prev, saveProficiencies: [...list, ability] };
    });
  };

  const getSkillMod = (skill) => {
    const abilityMod = mod(stats[skill.ability]);
    const isProf = (stats.skillProficiencies || []).includes(skill.index);
    const isExpert = (stats.expertise || []).includes(skill.index);
    if (isExpert) return abilityMod + profBonus * 2;
    if (isProf) return abilityMod + profBonus;
    
    // Jack of All Trades (Bard level 2+)
    if (className.toLowerCase() === 'bardo' && (character.level || 1) >= 2) {
      return abilityMod + Math.floor(profBonus / 2);
    }
    
    return abilityMod;
  };

  const getSaveMod = (ability) => {
    const abilityMod = mod(stats[ability]);
    const isProf = (stats.saveProficiencies || []).includes(ability);
    const cn = className.toLowerCase();
    const classSaves = CLASS_SAVES[cn] || [];
    if (isProf || classSaves.includes(ability)) return abilityMod + profBonus;
    return abilityMod;
  };

  const isSaveProf = (ability) => {
    const cn = className.toLowerCase();
    const classSaves = CLASS_SAVES[cn] || [];
    return classSaves.includes(ability) || (stats.saveProficiencies || []).includes(ability);
  };

  const passivePerception = 10 + getSkillMod(SKILLS.find(s => s.index === 'perception'));

  const handleRoll = async (formula, desc) => {
    try {
      const res = await rollDice({ dice_formula: formula, character_name: character?.name || '', description: desc, roll_type: 'check' });
      setDiceResult({ ...res.data, description: desc });
      setTimeout(() => setDiceResult(null), 4000);
    } catch {}
  };

  const rollSkill = (skill) => {
    const total = getSkillMod(skill);
    const formula = `1d20${total >= 0 ? '+' : ''}${total}`;
    handleRoll(formula, `${skill.name} (${ABILITY_SHORT[skill.ability]})`);
  };

  const rollSave = (ability) => {
    const total = getSaveMod(ability);
    const formula = `1d20${total >= 0 ? '+' : ''}${total}`;
    handleRoll(formula, `Salvación de ${ABILITY_NAMES[ability]}`);
  };

  const save = async () => {
    setSaving(true);
    await updateCharacter(id, { stats: JSON.stringify(stats) });
    setSaving(false);
  };

  if (!character) return <div className="page-center"><h2>Cargando habilidades...</h2></div>;

  return (
    <div className="container fade-in" style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex-row flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/character/${id}`)}>← Ficha de {character.name}</button>
        <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Dice notification */}
      {diceResult && (
        <div className="glass-panel slide-up" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 999, borderColor: 'var(--accent-gold)', padding: '1rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{diceResult.description}</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{diceResult.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>{diceResult.dice_formula}</div>
        </div>
      )}

      <div className="glass-panel" style={{ textAlign: 'center', borderTop: '3px solid var(--accent-purple)', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--accent-purple)' }}>🎯 Habilidades y Salvaciones</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0' }}>
          {character.name} • Nivel {character.level} • {className}
        </p>
        <div className="flex-row flex-center" style={{ gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-gold">Competencia: +{profBonus}</span>
          <span className="badge badge-blue">
            <Eye size={12} /> Percepción Pasiva: {passivePerception}
          </span>
          {(() => {
             const cn = className.toLowerCase();
             const limit = CLASS_SKILL_COUNT[cn] || 2;
             const options = CLASS_SKILL_LIST[cn] || [];
             const current = (stats.skillProficiencies || []).filter(s => options.includes(s)).length;
             return (
               <span className={`badge ${current > limit ? 'badge-red' : 'badge-gold'}`} title="Habilidades de clase usadas">
                 Libro: {current} / {limit}
               </span>
             );
          })()}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* LEFT: Saving Throws */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div className="glass-panel" style={{ borderLeft: '3px solid var(--accent-red)' }}>
            <div className="flex-row flex-between" style={{ cursor: 'pointer', marginBottom: showSaves ? '1rem' : 0 }}
              onClick={() => setShowSaves(!showSaves)}>
              <h3 style={{ margin: 0, color: 'var(--accent-red-bright)' }}>
                <Shield size={18} /> Tiradas de Salvación
              </h3>
              {showSaves ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {showSaves && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ABILITY_KEYS.map(ability => {
                  const saveMod = getSaveMod(ability);
                  const proficient = isSaveProf(ability);
                  return (
                    <div key={ability} className="skill-row" onClick={() => rollSave(ability)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.8rem',
                        background: 'rgba(0,0,0,0.3)', borderRadius: '8px', cursor: 'pointer',
                        transition: 'all 0.2s ease', border: '1px solid transparent'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-red)'; e.currentTarget.style.background = 'rgba(139,0,0,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}>
                      {/* Proficiency indicator */}
                      <div onClick={e => { e.stopPropagation(); toggleSaveProf(ability); }}
                        style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          border: `2px solid ${proficient ? 'var(--accent-gold)' : '#555'}`,
                          background: proficient ? 'var(--accent-gold)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                        {proficient && <span style={{ fontSize: '10px', color: '#000', fontWeight: 'bold' }}>✓</span>}
                      </div>

                      {/* Modifier */}
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: saveMod >= 0 ? 'var(--accent-green)' : 'var(--accent-red-bright)', minWidth: '35px', textAlign: 'center' }}>
                        {saveMod >= 0 ? '+' : ''}{saveMod}
                      </span>

                      {/* Name */}
                      <span style={{ flex: 1, color: '#ddd' }}>{ABILITY_NAMES[ability]}</span>

                      {/* Ability score */}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{stats[ability] || 10}</span>

                      {/* Dice icon */}
                      <Dice5 size={14} style={{ color: 'var(--text-dim)' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Passive Perception box */}
          <div className="glass-panel" style={{ marginTop: '1rem', textAlign: 'center', borderLeft: '3px solid var(--accent-blue)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Percepción Pasiva</div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{passivePerception}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>10 + mod SAB ({modStr(stats.WIS)}) {(stats.skillProficiencies || []).includes('perception') ? `+ prof (+${profBonus})` : ''}</div>
          </div>

          {/* Legend */}
          <div className="glass-panel" style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--accent-gold)' }}>Leyenda:</strong>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #555', display: 'inline-block' }} /> Sin competencia
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'inline-block' }} /> Competente
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'var(--accent-gold)', display: 'inline-block' }} /> Experto (×2)
              </span>
            </div>
            <p style={{ marginTop: '0.5rem' }}>Haz clic en el círculo para cambiar la competencia. Haz clic en la fila para tirar.</p>
          </div>
        </div>

        {/* RIGHT: Skills */}
        <div style={{ flex: '1.3', minWidth: '340px' }}>
          <div className="glass-panel" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
            <div className="flex-row flex-between" style={{ cursor: 'pointer', marginBottom: showSkills ? '1rem' : 0 }}
              onClick={() => setShowSkills(!showSkills)}>
              <h3 style={{ margin: 0 }}>🎯 Habilidades</h3>
              {showSkills ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {showSkills && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {SKILLS.map(skill => {
                  const skillMod = getSkillMod(skill);
                  const isProf = (stats.skillProficiencies || []).includes(skill.index);
                  const isExpert = (stats.expertise || []).includes(skill.index);
                  return (
                    <div key={skill.index} onClick={() => rollSkill(skill)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.5rem 0.8rem',
                        background: 'rgba(0,0,0,0.25)', borderRadius: '6px', cursor: 'pointer',
                        transition: 'all 0.2s ease', border: '1px solid transparent'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.background = 'rgba(200,155,60,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}>
                      {/* Proficiency indicator */}
                      <div onClick={e => { e.stopPropagation(); toggleSkillProf(skill.index); }}
                        style={{
                          width: '16px', height: '16px',
                          borderRadius: isExpert ? '4px' : '50%',
                          border: `2px solid ${(isProf || isExpert) ? 'var(--accent-gold)' : '#555'}`,
                          background: (isProf || isExpert) ? 'var(--accent-gold)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                        {isExpert && <span style={{ fontSize: '9px', color: '#000', fontWeight: 'bold' }}>★</span>}
                        {isProf && !isExpert && <span style={{ fontSize: '8px', color: '#000', fontWeight: 'bold' }}>✓</span>}
                      </div>

                      {/* Modifier */}
                      <span style={{ fontWeight: 'bold', fontSize: '1rem', color: skillMod >= 0 ? 'var(--accent-green)' : 'var(--accent-red-bright)', minWidth: '32px', textAlign: 'center' }}>
                        {skillMod >= 0 ? '+' : ''}{skillMod}
                      </span>

                      {/* Name */}
                      <span style={{ flex: 1, color: '#ddd', fontSize: '0.9rem' }}>{skill.name}</span>

                      {/* Ability tag */}
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-dim)', border: '1px solid #333', fontSize: '0.65rem', padding: '2px 6px' }}>
                        {ABILITY_SHORT[skill.ability]}
                      </span>

                      <Dice5 size={12} style={{ color: 'var(--text-dim)' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
