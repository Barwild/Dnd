import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiceRollingOverlay from '../components/DiceRollingOverlay';
import { getCharacter, updateCharacter, getRace, getClass as getClassApi, getItems, rollDice, getCharacters, getCharacterEquipment, getCharacterWeapons, getCharacterArmor, equipItem, unequipItem, getSubclasses, getLevelingEntry, getSpells, getBackgrounds, exportCharacterPdf, getImageUrl, levelUpCharacter } from '../api';
import { Save, BookOpen, Heart, Shield, Swords, ArrowUp, Moon, Sunrise, Plus, Minus, Dice5, Target, UserCircle, Flame, Activity, Brain, Eye, Hammer, ShieldPlus, Printer } from 'lucide-react';
import { useAuth } from '../AuthContext';

const STAT_NAMES = { STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR' };
const STAT_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

const FIGHTING_STYLES = [
  { index: 'arqueria', name: 'Arquería', description: 'Obtienes un bonificador de +2 a las tiradas de ataque que hagas con armas a distancia.' },
  { index: 'defensa', name: 'Defensa', description: 'Mientras lleves puesta una armadura, obtienes un bonificador de +1 a la CA.' },
  { index: 'duelista', name: 'Duelista', description: 'Cuando lleves un arma cuerpo a cuerpo en una mano y ninguna otra arma, obtienes un bonificador de +2 a las tiradas de daño con ese arma.' },
  { index: 'combate-con-grandes-armas', name: 'Combate con Grandes Armas', description: 'Cuando obtengas un 1 o un 2 en un dado de daño para un ataque con un arma a dos manos, puedes volver a tirar el dado.' },
  { index: 'proteccion', name: 'Protección', description: 'Cuando una criatura que puedas ver ataque a un objetivo que no seas tú y que esté a 5 pies o menos de ti, puedes usar tu reacción para imponer desventaja en la tirada de ataque (debes estar empuñando un escudo).' },
  { index: 'combate-con-dos-armas', name: 'Combate con dos Armas', description: 'Cuando combatas con dos armas, puedes añadir tu modificador de característica al daño del segundo ataque.' }
];

const cleanIndex = (name) => {
  if (!name) return '';
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
};

const STAT_ICONS = { 
  STR: Swords, 
  DEX: Activity, 
  CON: Heart, 
  INT: Brain, 
  WIS: Eye, 
  CHA: UserCircle 
};
const FULL_NAMES = { STR: 'Fuerza', DEX: 'Destreza', CON: 'Constitución', INT: 'Inteligencia', WIS: 'Sabiduría', CHA: 'Carisma' };

const PROFIENCY_TRANS = {
  'light armor': 'Armadura Ligera', 'medium armor': 'Armadura Mediana', 'heavy armor': 'Armadura Pesada',
  'all armor': 'Todas las Armaduras', 'shields': 'Escudos', 'shield': 'Escudos',
  'simple weapons': 'Armas Simples', 'martial weapons': 'Armas Marciales',
  'longswords': 'Espadas Largas', 'rapiers': 'Espadas Rostro', 'shortswords': 'Espadas Cortas',
  'hand crossbows': 'Ballestas de Mano', 'clubs': 'Clavas', 'daggers': 'Dagas', 'javelins': 'Jabalinas',
  'maces': 'Mazas', 'quarterstaffs': 'Bastones', 'sickles': 'Hoces', 'spears': 'Lanzas',
  'darts': 'Dardos', 'slings': 'Hondas', 'scimitars': 'Cimitarras',
  "thieves' tools": 'Herramientas de Ladrón', 'herbalism kit': 'Kit de Herborista',
  'crossbows, light': 'Ballestas Ligeras',
  'saving throw: str': '', 'saving throw: dex': '', 'saving throw: con': '',
  'saving throw: int': '', 'saving throw: wis': '', 'saving throw: cha': '',
  'armadura no plateada, blindaje +1': 'Armadura No Plateada (blindaje +1)',
  'herramientas de artífice': 'Herramientas de Artífice',
  'instrumento musical': 'Instrumento Musical',
  'armas simples': 'Armas Simples', 'armas de manopla': 'Armas de Manopla',
  'dispositivos de exploración y de viaje': 'Dispositivos de Exploración y Viaje',
};
const translateProf = (p) => PROFIENCY_TRANS[p.toLowerCase().trim()] || p;

// HP per level (beyond lvl 1): avg or roll
const CLASS_HIT_DICE = { 'bárbaro': 12, 'guerrero': 10, 'paladín': 10, 'explorador': 10, 'bardo': 8, 'clérigo': 8, 'druida': 8, 'monje': 8, 'brujo': 8, 'pícaro': 8, 'hechicero': 6, 'mago': 6, 'artífice': 8 };

const FULL_CASTERS = ['bardo', 'clérigo', 'druida', 'hechicero', 'mago'];
const HALF_CASTERS = ['paladín', 'explorador', 'artífice'];

const SPELL_SLOTS_TABLE = [
  [0,0,0,0,0,0,0,0,0], // Lvl 0
  [2,0,0,0,0,0,0,0,0], // Lvl 1
  [3,0,0,0,0,0,0,0,0], // Lvl 2
  [4,2,0,0,0,0,0,0,0], // Lvl 3
  [4,3,0,0,0,0,0,0,0], // Lvl 4
  [4,3,2,0,0,0,0,0,0], // Lvl 5
  [4,3,3,0,0,0,0,0,0], // Lvl 6
  [4,3,3,1,0,0,0,0,0], // Lvl 7
  [4,3,3,2,0,0,0,0,0], // Lvl 8
  [4,3,3,3,1,0,0,0,0], // Lvl 9
  [4,3,3,3,2,0,0,0,0], // Lvl 10
  [4,3,3,3,2,1,0,0,0], // Lvl 11
  [4,3,3,3,2,1,0,0,0], // Lvl 12
  [4,3,3,3,2,1,1,0,0], // Lvl 13
  [4,3,3,3,2,1,1,0,0], // Lvl 14
  [4,3,3,3,2,1,1,1,0], // Lvl 15
  [4,3,3,3,2,1,1,1,0], // Lvl 16
  [4,3,3,3,2,1,1,1,1], // Lvl 17
  [4,3,3,3,3,1,1,1,1], // Lvl 18
  [4,3,3,3,3,2,1,1,1], // Lvl 19
  [4,3,3,3,3,2,2,1,1], // Lvl 20
];

const WARLOCK_SLOTS = [
  { count: 0, level: 0 },
  { count: 1, level: 1 }, { count: 2, level: 1 }, { count: 2, level: 2 }, { count: 2, level: 2 },
  { count: 2, level: 3 }, { count: 2, level: 3 }, { count: 2, level: 4 }, { count: 2, level: 4 },
  { count: 2, level: 5 }, { count: 2, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 },
];

const SUBCLASS_LEVELS = {
  'clérigo': 1, 'hechicero': 1, 'brujo': 1,
  'druida': 2, 'mago': 2,
  'bárbaro': 3, 'bardo': 3, 'guerrero': 3, 'monje': 3,
  'paladín': 3, 'explorador': 3, 'pícaro': 3, 'artífice': 3,
};

const SKILLS_MASTER = [
  { index: 'acrobatics', name: 'Acrobacias' }, { index: 'animal-handling', name: 'Trato con Animales' },
  { index: 'arcana', name: 'Arcanos' }, { index: 'athletics', name: 'Atletismo' },
  { index: 'deception', name: 'Engaño' }, { index: 'history', name: 'Historia' },
  { index: 'insight', name: 'Perspicacia' }, { index: 'intimidation', name: 'Intimidación' },
  { index: 'investigation', name: 'Investigación' }, { index: 'medicine', name: 'Medicina' },
  { index: 'nature', name: 'Naturaleza' }, { index: 'perception', name: 'Percepción' },
  { index: 'performance', name: 'Interpretación' }, { index: 'persuasion', name: 'Persuasión' },
  { index: 'religion', name: 'Religión' }, { index: 'sleight-of-hand', name: 'Juego de Manos' },
  { index: 'stealth', name: 'Sigilo' }, { index: 'survival', name: 'Supervivencia' }
];
const SKILL_STAT_MAP = {
  acrobatics: 'DEX', 'animal-handling': 'WIS', arcana: 'INT', athletics: 'STR',
  deception: 'CHA', history: 'INT', insight: 'WIS', intimidation: 'CHA',
  investigation: 'INT', medicine: 'WIS', nature: 'INT', perception: 'WIS',
  performance: 'CHA', persuasion: 'CHA', religion: 'INT', 'sleight-of-hand': 'DEX',
  stealth: 'DEX', survival: 'WIS'
};
const SPELL_ABILITY = {
  bardo: 'CHA', clérigo: 'WIS', druida: 'WIS', hechicero: 'CHA',
  brujo: 'CHA', mago: 'INT', paladín: 'WIS', explorador: 'WIS', artífice: 'INT'
};
const COIN_VALUES = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000 };

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [stats, setStats] = useState({});
  const [raceName, setRaceName] = useState('');
  const [className, setClassName] = useState('');
  const [classIndex, setClassIndex] = useState('');
  const [hitDie, setHitDie] = useState(8);
  const [equipment, setEquipment] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [shopPage, setShopPage] = useState(0);
  const [shopSearch, setShopSearch] = useState('');
  const [shopLoading, setShopLoading] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(null);
  const [equipmentStats, setEquipmentStats] = useState(null);
  const [weapons, setWeapons] = useState([]);
  const [armor, setArmor] = useState([]);
  const [saving, setSaving] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [rollingDice, setRollingDice] = useState(null);
  const [levelUpModal, setLevelUpModal] = useState(null); // {newLevel, hpGain}
  const [subclassList, setSubclassList] = useState([]);
  const [subclassName, setSubclassName] = useState('');
  const [allSpells, setAllSpells] = useState([]);
  const [expandedSpell, setExpandedSpell] = useState(null);
  const [raceObject, setRaceObject] = useState(null);
  const [classObject, setClassObject] = useState(null);
  const [backgroundObject, setBackgroundObject] = useState(null);


  const normalizeCoins = (coins) => ({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, ...coins });
  const parseCoins = (coins) => {
    if (typeof coins === 'string') {
      try { return JSON.parse(coins || '{}'); } catch { return {}; }
    }
    return coins || {};
  };
  const totalCopper = (coins) => Object.entries(normalizeCoins(parseCoins(coins)))
    .reduce((sum, [k, v]) => sum + (Number(v) || 0) * (COIN_VALUES[k] || 0), 0);
  const copperToCoins = (copper) => {
    let remaining = Math.max(0, Math.floor(copper));
    const result = { pp: 0, ep: 0 };
    result.gp = Math.floor(remaining / COIN_VALUES.gp); remaining %= COIN_VALUES.gp;
    result.sp = Math.floor(remaining / COIN_VALUES.sp); remaining %= COIN_VALUES.sp;
    result.cp = remaining;
    return result;
  };
  const formatCoins = (coins) => {
    const normalized = normalizeCoins(parseCoins(coins));
    return Object.entries(normalized)
      .filter(([, value]) => value !== undefined && value !== null && value !== 0)
      .map(([coin, value]) => `${value}${coin}`)
      .join(' ') || '0cp';
  };
  const setCoinValue = (coin, value) => {
    const amount = Math.max(0, parseInt(value, 10) || 0);
    setStats(prev => ({
      ...prev,
      coins: { ...normalizeCoins(prev.coins), [coin]: amount }
    }));
  };
  const totalValueSummary = copperToCoins(totalCopper(stats.coins));
  const renderCost = (item) => {
    if (!item.cost_quantity) return 'Gratis';
    return `${item.cost_quantity} ${item.cost_unit || 'gp'}`;
  };

  const normalizeStats = (stats) => {
    const normalized = { ...stats };
    if (normalized.spell_slots && !normalized.spellSlots) normalized.spellSlots = normalized.spell_slots;
    if (normalized.spellSlots && !normalized.spell_slots) normalized.spell_slots = normalized.spellSlots;
    return normalized;
  };

  const load = async () => {
    try {
      const res = await getCharacter(id);
      const char = res.data;
      let statsObj = {};
      try { statsObj = normalizeStats(JSON.parse(char.stats || '{}')); } catch {}
      statsObj.coins = normalizeCoins(parseCoins(statsObj.coins));

      let eq = [];
      try { 
        const parsed = JSON.parse(char.equipment || '[]'); 
        if (Array.isArray(parsed)) eq = parsed;
      } catch {}
      
      if (eq.length === 0 && char.starting_equipment) {
        try { 
          const parsedStart = JSON.parse(char.starting_equipment || '[]'); 
          if (Array.isArray(parsedStart)) eq = parsedStart;
        } catch {}
      }

      setCharacter(char);
      setStats(statsObj);
      setEquipment(Array.isArray(eq) ? eq : []);

      // Load spells for print layout
      getSpells({ limit: 500 }).then(r => setAllSpells(r.data || [])).catch(() => {});

      // Cargar equipo específico
      loadEquipmentData(id);

      if (char.race_id) getRace(char.race_id).then(r => { setRaceName(r.data.name); setRaceObject(r.data); }).catch(() => {});
      if (char.class_id) getClassApi(char.class_id).then(c => { setClassName(c.data.name); setClassIndex(c.data.index); setHitDie(c.data.hit_die); setClassObject(c.data); }).catch(() => {});
      if (char.background_id) getBackgrounds().then(res => {
        const bg = (res.data || []).find(b => b.id === char.background_id);
        if (bg) setBackgroundObject(bg);
      }).catch(() => {});
      if (char.subclass_id) getSubclasses().then(res => {
        const found = (res.data || []).find(s => s.id === char.subclass_id);
        if (found) setSubclassName(found.name);
      }).catch(() => {});
      
      getCharacters().then(res => {
        const myChars = (res.data || []).filter(c => c.user_id === user?.id);
        setCampaignCharacters(myChars);
      }).catch(() => {});
    } catch (e) { console.error(e); }
  };

  const loadEquipmentData = async (characterId) => {
    try {
      // Cargar estadísticas de equipo
      const equipRes = await getCharacterEquipment(characterId);
      setEquipmentStats(equipRes.data.equipment_stats);
      
      // Cargar armas
      const weaponsRes = await getCharacterWeapons(characterId);
      setWeapons(Array.isArray(weaponsRes.data) ? weaponsRes.data : []);
      
      // Cargar armaduras
      const armorRes = await getCharacterArmor(characterId);
      setArmor(Array.isArray(armorRes.data) ? armorRes.data : []);
    } catch (e) {
      console.error('Error cargando datos de equipo:', e);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!classObject || !character) return;
    const cn = classObject.name?.toLowerCase() || '';
    if (['guerrero', 'bárbaro', 'monje', 'pícaro'].includes(cn)) return;
    
    // Auto-sanado si todos los slots de conjuro son cero
    const allZero = [1,2,3,4,5,6,7,8,9].every(lvl => (stats.spellSlots?.[lvl]?.max || 0) === 0);
    if (allZero) {
      const newSlots = {};
      const lvl = character.level || 1;
      if (cn === 'brujo') {
        const warlockInfo = WARLOCK_SLOTS[lvl] || { count: 1, level: 1 };
        for (let i = 1; i <= 9; i++) {
          newSlots[i] = { max: i === warlockInfo.level ? warlockInfo.count : 0, used: 0 };
        }
      } else if (HALF_CASTERS.includes(cn)) {
        const halfLvl = Math.ceil(lvl / 2);
        const slots = SPELL_SLOTS_TABLE[halfLvl] || [0,0,0,0,0,0,0,0,0];
        for (let i = 1; i <= 9; i++) {
          newSlots[i] = { max: slots[i-1] || 0, used: 0 };
        }
      } else if (FULL_CASTERS.includes(cn)) {
        const slots = SPELL_SLOTS_TABLE[lvl] || [0,0,0,0,0,0,0,0,0];
        for (let i = 1; i <= 9; i++) {
          newSlots[i] = { max: slots[i-1] || 0, used: 0 };
        }
      }
      if (Object.keys(newSlots).length > 0) {
        setStats(prev => ({ ...prev, spellSlots: newSlots }));
      }
    }
  }, [classObject, character, stats.spellSlots]);

  const loadShopItems = async () => {
    setShopLoading(true);
    try {
      const params = { skip: shopPage * 20, limit: 20 };
      if (shopSearch) params.search = shopSearch;
      const res = await getItems(params);
      setShopItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => { loadShopItems(); }, [shopPage, shopSearch]);

  const buyItem = async (item) => {
    const costCopper = (Number(item.cost_quantity) || 0) * (COIN_VALUES[(item.cost_unit || 'gp').toLowerCase()] || COIN_VALUES.gp);
    const currentCopper = totalCopper(stats.coins);
    if (costCopper <= 0) {
      alert('Este objeto no tiene un precio válido.');
      return;
    }
    if (costCopper > currentCopper) {
      alert('No tienes suficiente dinero para comprar este objeto.');
      return;
    }

    const remaining = copperToCoins(currentCopper - costCopper);
    const newStats = { ...stats, coins: remaining };
    setStats(newStats);
    
    // Añadir item al inventario con ID
    const newItem = { 
      id: item.id, 
      name: item.name, 
      cost: renderCost(item),
      category: item.category,
      damage_dice: item.damage_dice,
      damage_type: item.damage_type,
      weapon_range: item.weapon_range,
      armor_class_base: item.armor_class_base,
      armor_class_dex_bonus: item.armor_class_dex_bonus,
      stealth_disadvantage: item.stealth_disadvantage,
      properties: item.properties || []
    };
    
    const newEq = [...equipment, newItem];
    setEquipment(newEq);
    
    // Persistir compra al backend
    await updateCharacter(id, { stats: JSON.stringify(newStats), equipment: JSON.stringify(newEq) });
    await loadEquipmentData(id);
    alert(`Comprado ${item.name}. Te quedan ${formatCoins(remaining)}.`);
    
    // Si es arma o armadura, ofrecer equipar automáticamente
    if (item.category === 'Weapon' || item.category === 'Armor' || item.category === 'Arma' || item.category === 'Armadura' || item.category === 'Shield' || item.category === 'Escudo') {
      const shouldEquip = window.confirm(`¿Quieres equipar ${item.name} ahora?`);
      if (shouldEquip) {
        const isWeapon = item.category === 'Weapon' || item.category === 'Arma';
        const slot = isWeapon ? 'weapon' : 'armor';
        equipItemToCharacter(item.id, slot);
      }
    }
  };

  const equipItemToCharacter = async (itemId, slot) => {
    try {
      const result = await equipItem(id, itemId, slot);
      if (result.data.success) {
        alert(`${result.data.equipped_item.name} equipado en ranura ${slot}`);
        // Recargar datos de equipo
        await loadEquipmentData(id);
      } else {
        alert('Error al equipar item: ' + (result.data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error equipando item:', e);
      alert('Error al equipar item');
    }
  };

  const unequipItemFromCharacter = async (slot) => {
    try {
      const result = await unequipItem(id, slot);
      if (result.data.success) {
        alert(`Item desequipado de ranura ${slot}`);
        // Recargar datos de equipo
        await loadEquipmentData(id);
      } else {
        alert('Error al desequipar item: ' + (result.data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error desequipando item:', e);
      alert('Error al desequipar item');
    }
  };

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

  const handleExportPdf = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Error: No se encontró sesión activa. Vuelve a iniciar sesión.');
        return;
      }
      const downloadUrl = getImageUrl(`/characters/${id}/export-pdf?token=${token}`);
      window.open(downloadUrl, '_blank');
    } catch (e) {
      console.error('Error exportando PDF:', e);
      alert('Error al exportar el PDF del personaje.');
    }
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
    if (hitDiceAvail <= 0) {
      alert('No te quedan dados de golpe. No puedes recuperar vida en este descanso corto.');
      return;
    }
    const diceToSpend = parseInt(window.prompt(
      `Tienes ${hitDiceAvail} d${hitDie} disponibles. ¿Cuántos quieres gastar? (1-${hitDiceAvail})`, '1'), 10);
    if (!diceToSpend || diceToSpend < 1 || diceToSpend > hitDiceAvail) {
      alert('Número inválido. No se gastaron dados de golpe.');
      return;
    }
    
    let totalHealed = 0;
    for (let i = 0; i < diceToSpend; i++) {
      totalHealed += Math.floor(Math.random() * hitDie) + 1 + mod(stats.CON || 10);
    }
    totalHealed = Math.max(0, totalHealed);
    
    setStats(prev => {
      const newState = {
        ...prev,
        currHP: Math.min(prev.maxHP, (prev.currHP || 0) + totalHealed),
        hitDiceUsed: Math.min(character?.level || 1, (prev.hitDiceUsed || 0) + diceToSpend)
      };
      
      // Warlocks restore spell slots on short rest
      if (className.toLowerCase() === 'brujo') {
        const slots = prev.spellSlots || {};
        const newSlots = {};
        Object.keys(slots).forEach(k => {
          newSlots[k] = { ...slots[k], used: 0 };
        });
        newState.spellSlots = newSlots;
      }
      return newState;
    });
    alert(`Descanso Corto: Gastas ${diceToSpend}d${hitDie}. Recuperas ${totalHealed} PG. ${className.toLowerCase() === 'brujo' ? 'Espacios de pacto restaurados.' : ''}`);
  };

  const longRest = () => {
    const halfDice = Math.max(1, Math.floor((character?.level || 1) / 2));
    setStats(prev => {
      const slots = prev.spellSlots || {};
      const newSlots = {};
      Object.keys(slots).forEach(k => {
        newSlots[k] = { ...slots[k], used: 0 };
      });
      
      return {
        ...prev,
        currHP: prev.maxHP || 1,
        hitDiceUsed: Math.max(0, (prev.hitDiceUsed || 0) - halfDice),
        spellSlots: newSlots
      };
    });
    alert('Descanso Largo: PG y todos los Espacios de Conjuro restaurados.');
  };

  const toggleSpellSlot = (level, used) => {
    setStats(prev => {
      const slots = prev.spellSlots || {};
      const slot = slots[level] || { max: 0, used: 0 };
      const newUsed = used ? Math.max(0, slot.used - 1) : Math.min(slot.max, slot.used + 1);
      return {
        ...prev,
        spellSlots: { ...slots, [level]: { ...slot, used: newUsed } }
      };
    });
  };

  const rollBackgroundTrait = async (key) => {
    if (!backgroundObject) return;
    try {
      let options = [];
      const dbKey = key === 'personality' ? 'personality_traits' : (key === 'ideals' ? 'ideals' : (key === 'bonds' ? 'bonds' : 'flaws'));
      const raw = JSON.parse(backgroundObject[dbKey] || '[]');
      options = dbKey === 'ideals' ? raw.map(i => i.desc) : raw;
      if (options.length === 0) return;
      
      const rolledValue = options[Math.floor(Math.random() * options.length)];
      
      // Update local state first
      setCharacter(prev => ({
        ...prev,
        [key]: rolledValue
      }));
      
      // Persist to backend
      await updateCharacter(id, {
        [key]: rolledValue
      });
    } catch (e) {
      console.error("Error rolling background trait:", e);
      alert("Error al guardar el rasgo del trasfondo.");
    }
  };

  const handleLevelUpClick = async () => {
    try {
      const res = await levelUpCharacter(id);
      const data = res.data;

      // Update local level and HP stats
      setCharacter(prev => ({ ...prev, level: data.new_level }));
      setStats(prev => ({
        ...prev,
        maxHP: data.new_max_hp,
        currHP: prev.currHP + data.hp_gained
      }));

      const newLevel = data.new_level;
      const cn = className.toLowerCase();
      const hd = CLASS_HIT_DICE[cn] || hitDie;
      const avg = Math.floor(hd / 2) + 1;
      const conMod = mod(stats.CON || 10);

      let levelUpData = {
        newLevel,
        hd,
        avg,
        conMod,
        cn,
        hpGain: data.hp_gained,
        requiresChoice: data.requires_choice,
        choiceType: data.choice_type,
        addedFeatures: data.added_features || [],
        subclassList: [],
        featsList: [],
        selectedSubclassId: null,
        selectedFeatIndex: '',
        selectedFightingStyle: '',
        asiOrFeatMode: 'asi',
        asiChanges: {}
      };

      if (data.requires_choice && data.choice_type === 'SUBCLASS') {
        const subRes = await getSubclasses();
        levelUpData.subclassList = (subRes.data || []).filter(s => s.class_index === classIndex);
      }

      if (data.requires_choice && data.choice_type === 'ASI_OR_FEAT') {
        const featsRes = await getFeats();
        levelUpData.featsList = featsRes.data || [];
      }

      setLevelUpModal(levelUpData);
    } catch (e) {
      console.error('Error al subir de nivel:', e);
      alert('Error al subir de nivel: ' + (e.response?.data?.detail || e.message));
    }
  };

  const confirmLevelUp = async () => {
    try {
      const { choiceType, selectedSubclassId, subclassList, selectedFeatIndex, selectedFightingStyle, asiOrFeatMode, asiChanges } = levelUpModal;

      const updatePayload = {};

      if (choiceType === 'SUBCLASS' && selectedSubclassId) {
        updatePayload.subclass_id = selectedSubclassId;
        const found = (subclassList || []).find(s => s.id === selectedSubclassId);
        if (found) setSubclassName(found.name);
      }

      if (choiceType === 'FIGHTING_STYLE' && selectedFightingStyle) {
        const currentFeatures = character.features || [];
        const newStyleIndex = cleanIndex(selectedFightingStyle);
        if (!currentFeatures.includes(newStyleIndex)) {
          updatePayload.features = [...currentFeatures, newStyleIndex];
        }
      }

      if (choiceType === 'ASI_OR_FEAT') {
        if (asiOrFeatMode === 'asi') {
          const updatedStats = { ...stats };
          STAT_KEYS.forEach(k => {
            if (asiChanges[k]) {
              updatedStats[k] = (updatedStats[k] || 10) + asiChanges[k];
            }
          });
          updatePayload.stats = JSON.stringify(updatedStats);
          setStats(updatedStats);
        } else if (asiOrFeatMode === 'feat' && selectedFeatIndex) {
          const currentFeats = character.feats || [];
          if (!currentFeats.includes(selectedFeatIndex)) {
            updatePayload.feats = [...currentFeats, selectedFeatIndex];
          }
        }
      }

      // Update character with choices in backend
      if (Object.keys(updatePayload).length > 0) {
        await updateCharacter(id, updatePayload);
      }

      setLevelUpModal(null);

      // Reload character sheet to ensure everything is synchronized correctly
      await load();

      const cn = className.toLowerCase();
      const isCaster = FULL_CASTERS.includes(cn) || HALF_CASTERS.includes(cn) || cn === 'brujo';
      if (isCaster) {
        navigate(`/character/${id}/spells`);
      }
    } catch (e) {
      console.error('Error al confirmar subida de nivel:', e);
      alert('Error al confirmar subida de nivel: ' + (e.response?.data?.detail || e.message));
    }
  };

  // ── Print layout computed values ──
  const spellAbility = SPELL_ABILITY[className.toLowerCase()] || 'INT';
  const spellMod = mod(stats[spellAbility] || 10);
  const saveDC = 8 + spellMod + profBonus;
  const spellAtk = spellMod + profBonus;
  const printSkills = SKILLS_MASTER.map(sk => {
    const skStat = SKILL_STAT_MAP[sk.index];
    const statVal = mod(stats[skStat] || 10);
    const isProf = (stats.skillProficiencies || []).includes(sk.index);
    const isExpert = (stats.expertise || []).includes(sk.index);
    const total = statVal + (isExpert ? profBonus * 2 : isProf ? profBonus : 0);
    return { ...sk, stat: skStat, total, prof: isExpert ? 'expertise' : isProf ? 'proficient' : '' };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  // ── Otras Competencias e Idiomas ──
  const getOtherProficienciesAndLanguages = () => {
    const lines = [];
    
    // 1. Languages
    let langs = [];
    if (raceObject?.languages) {
      try {
        const parsed = JSON.parse(raceObject.languages);
        if (Array.isArray(parsed)) langs = [...langs, ...parsed];
      } catch {}
    }
    if (backgroundObject?.languages) {
      try {
        const parsed = JSON.parse(backgroundObject.languages);
        if (Array.isArray(parsed)) langs = [...langs, ...parsed];
      } catch {}
    }
    const uniqueLangs = Array.from(new Set(langs)).filter(Boolean);
    if (uniqueLangs.length > 0) {
      lines.push(`IDIOMAS: ${uniqueLangs.join(', ')}`);
    }

    // 2. Class Proficiencies (Armas, Armaduras)
    let classProfs = [];
    if (classObject?.proficiencies) {
      try {
        const parsed = JSON.parse(classObject.proficiencies);
        if (Array.isArray(parsed)) classProfs = parsed;
      } catch {}
    }
    
    const weapons = classProfs.filter(p => p.toLowerCase().includes('arma') || p.toLowerCase().includes('weapon') || p.toLowerCase().includes('sencillas') || p.toLowerCase().includes('marciales') || p.toLowerCase().includes('espada') || p.toLowerCase().includes('dagger') || p.toLowerCase().includes('crossbow') || p.toLowerCase().includes('clubs') || p.toLowerCase().includes('mace') || p.toLowerCase().includes('staff') || p.toLowerCase().includes('sickle') || p.toLowerCase().includes('spear') || p.toLowerCase().includes('dart') || p.toLowerCase().includes('sling') || p.toLowerCase().includes('scimitar'));
    const armor = classProfs.filter(p => p.toLowerCase().includes('armadura') || p.toLowerCase().includes('escudo') || p.toLowerCase().includes('armor') || p.toLowerCase().includes('shield') || p.toLowerCase().includes('ligeras') || p.toLowerCase().includes('medianas') || p.toLowerCase().includes('pesadas') || p.toLowerCase().includes('all armor'));
    const tools = classProfs.filter(p => !weapons.includes(p) && !armor.includes(p) && !p.toLowerCase().includes('salvación') && !p.toLowerCase().includes('saving'));
    
    let bgTools = [];
    if (backgroundObject?.tool_proficiencies) {
      try {
        const parsed = JSON.parse(backgroundObject.tool_proficiencies);
        if (Array.isArray(parsed)) bgTools = parsed;
      } catch {}
    }
    const allTools = Array.from(new Set([...tools, ...bgTools])).filter(Boolean);

    if (armor.length > 0) {
      lines.push(`ARMADURAS: ${armor.map(translateProf).join(', ')}`);
    }
    if (weapons.length > 0) {
      lines.push(`ARMAS: ${weapons.map(translateProf).join(', ')}`);
    }
    if (allTools.length > 0) {
      lines.push(`HERRAMIENTAS: ${allTools.map(translateProf).join(', ')}`);
    }

    return lines.join('\n');
  };

  const knownSpells = (stats.spells || []).map(sIdx => allSpells.find(s => s.index === sIdx)).filter(Boolean);
  const knownByLevel = {};
  for (let i = 0; i <= 9; i++) { knownByLevel[i] = knownSpells.filter(s => (s.level || 0) === i); }

  const handleRoll = async (formula, desc) => {
    const parseDieType = (form) => {
      const match = form.toLowerCase().match(/d(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if ([4, 6, 8, 10, 12, 20].includes(num)) return `d${num}`;
      }
      return 'd20';
    };

    const dieType = parseDieType(formula);
    const startTime = Date.now();

    setRollingDice({
      description: desc,
      formula: formula,
      dieType: dieType,
      stage: 'rolling',
      total: null
    });

    try {
      const res = await rollDice({ dice_formula: formula, character_name: character?.name || '', description: desc, roll_type: 'check' });
      
      const elapsed = Date.now() - startTime;
      const remaining = 1300 - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      // Parse results to extract die values and modifier
      let parsedResults = [];
      try { parsedResults = JSON.parse(res.data.results || '[]'); } catch(_) {}
      const dieRolls = parsedResults.filter(r => r.die !== 'mod');
      const modifiers = parsedResults.filter(r => r.die === 'mod');
      const dieValue = dieRolls.length > 0 ? dieRolls.reduce((s, r) => s + r.result, 0) : res.data.total;
      const modifier = modifiers.reduce((s, r) => s + r.result, 0);

      setRollingDice(prev => prev ? { ...prev, stage: 'result', total: res.data.total, dieValue, modifier } : null);
      
      setDiceResult({ ...res.data, description: desc });
      setTimeout(() => setDiceResult(null), 5000);

      setTimeout(() => {
        setRollingDice(null);
      }, 2500);
    } catch (e) {
      setRollingDice(null);
    }
  };

  if (!character) return <div className="page-center"><h2>Cargando ficha...</h2></div>;

  const hpPercent = stats.maxHP ? (stats.currHP / stats.maxHP) * 100 : 100;
  const hpColor = hpPercent > 60 ? '#4a4' : hpPercent > 30 ? '#e84' : '#d44';
  
  // Use equipped armor CA if available, then monster/natural ac, otherwise 10 + DEX
  const ac = equipmentStats?.armor_class || stats.ac || (10 + mod(stats.DEX));
  const initiative = mod(stats.DEX);
  const speed = stats.speed || 30;

  return (
    <>
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
        <div className="flex-row char-header-buttons" style={{ gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/skills`)}><Target size={16} /> Habilidades</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/spells`)}><BookOpen size={16} /> Grimorio</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/character/${id}/inventory`)}><Shield size={16} /> Inventario</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}><Printer size={16} /> Exportar Plantilla PDF</button>
          <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}</button>
          <button className="btn btn-ghost btn-sm print-trigger" onClick={() => window.print()}><Printer size={16} /> PDF Navegador</button>
        </div>
      </div>

      {/* Dice notification */}
      {diceResult && (
        <div className="glass-panel slide-up dice-notification" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 999, borderColor: 'var(--accent-gold)', padding: '1rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{diceResult.description}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{diceResult.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>{diceResult.dice_formula}</div>
        </div>
      )}

      <DiceRollingOverlay rolling={rollingDice} onClose={() => setRollingDice(null)} />

      {/* Character Name & Identity */}
      <div className="glass-panel" style={{ textAlign: 'center', borderTop: '3px solid var(--accent-gold)', marginBottom: '1.5rem', position: 'relative' }}>
        <h1 style={{ fontSize: '2.2rem', margin: 0, color: '#fff' }}>{character.name}</h1>
        <p style={{ color: 'var(--accent-gold)', fontSize: '1rem', margin: '0.3rem 0' }}>
          Nivel {character.level} {raceName ? `• ${raceName}` : ''} {className ? `• ${className}` : ''}{subclassName ? ` → ${subclassName}` : ''} {!raceName && !className && '• Monstruo'}
          {character.level < 20 && (
            <button className="btn btn-ghost btn-sm" onClick={handleLevelUpClick} style={{ marginLeft: '10px', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
              <ArrowUp size={12} style={{marginRight: '3px'}}/> Subir de Nivel
            </button>
          )}
        </p>
        <span className="badge badge-gold">Competencia: +{profBonus}</span>
      </div>

      {/* Combat row */}
      <div className="combat-row" style={{ marginBottom: '1.5rem' }}>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-blue)' }}>
          <span className="label">Clase de Armadura</span>
          <span className="value" style={{ color: 'var(--accent-blue)' }}>{ac}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>{equipmentStats?.armor_class ? 'Armadura Equipada' : (stats.ac ? 'Armadura Natural / Fija' : `10 + DES (${modStr(stats.DEX)})`)}</span>
        </div>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-green)' }}>
          <span className="label">Iniciativa</span>
          <span className="value" style={{ color: 'var(--accent-green)', cursor: 'pointer' }}
            onClick={() => handleRoll('1d20' + (initiative >= 0 ? `+${initiative}` : initiative), 'Tirada de Iniciativa')}>
            {initiative >= 0 ? '+' : ''}{initiative}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>Clic para tirar</span>
        </div>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-gold)' }}>
          <span className="label">Inspiración</span>
          <span className="value" style={{ color: stats.inspiration ? 'var(--accent-gold)' : '#555', cursor: 'pointer' }}
            onClick={() => setStats(prev => ({ ...prev, inspiration: !prev.inspiration }))}>
            {stats.inspiration ? '★' : '☆'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>Clic para alternar</span>
        </div>
        <div className="combat-badge" style={{ borderColor: 'var(--accent-purple)' }}>
          <span className="label">Velocidad</span>
          <span className="value" style={{ color: 'var(--accent-purple)' }}>{speed}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>ft (9 m)</span>
        </div>
      </div>

      {equipmentStats?.armor_proficiency_issue && (
        <div style={{ background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', padding: '0.8rem 1.2rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <strong style={{ color: '#ff6c6c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Penalización por Armadura Inexperta
          </strong>
          <span style={{ fontSize: '0.85rem', color: '#eee' }}>{equipmentStats.armor_proficiency_issue}</span>
        </div>
      )}

      {/* HP & Spell Slots Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* HP Block */}
        <div className="glass-panel" style={{ height: '100%' }}>
          <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}><Heart size={18} style={{ color: hpColor }} /> Vida</h3>
            <div className="flex-row" style={{ gap: '0.4rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={shortRest} title="Restaurar vida y pactos"><Moon size={14} /> Corto</button>
              <button className="btn btn-ghost btn-sm" onClick={longRest} title="Restaurar todo"><Sunrise size={14} /> Largo</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button className="btn btn-danger btn-sm" onClick={() => adjustHP(-1)} style={{ width: '35px', padding: '0.3rem' }}><Minus size={14} /></button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', height: '24px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ background: hpColor, height: '100%', width: `${hpPercent}%`, transition: 'width 0.3s ease' }} />
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>
                  {stats.currHP || 0} / {stats.maxHP || 1}
                </span>
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => adjustHP(1)} style={{ width: '35px', padding: '0.3rem', background: 'rgba(0,100,0,0.5)', border: '1px solid #4a4', color: '#fff' }}><Plus size={14} /></button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Dados de Golpe: {(character?.level || 1) - (stats.hitDiceUsed || 0)}d{hitDie}
          </div>
        </div>

        {/* Spell Slots Block */}
        {!['guerrero', 'bárbaro', 'monje', 'pícaro'].includes(className.toLowerCase()) && (
          <div className="glass-panel" style={{ borderLeft: '3px solid var(--accent-red)', height: '100%' }}>
            <h3 style={{ margin: '0 0 1rem' }}><Flame size={18} style={{ color: 'var(--accent-red)' }} /> Espacios de Conjuro</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1,2,3,4,5,6,7,8,9].map(lvl => {
                const slot = stats.spellSlots?.[lvl] || { max: 0, used: 0 };
                if (slot.max <= 0) return null;
                return (
                  <div key={lvl} className="flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>Nv {lvl}</span>
                    <div className="flex-row" style={{ gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {Array.from({ length: slot.max }).map((_, i) => (
                        <div key={i} 
                          onClick={() => toggleSpellSlot(lvl, i < slot.used)}
                          style={{ 
                            width: '16px', height: '16px', borderRadius: '3px',
                            border: '2px solid var(--accent-red)',
                            background: i < slot.used ? 'var(--accent-red)' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {(!stats.spellSlots || Object.values(stats.spellSlots).every(s => s.max === 0)) && (
                <p style={{ color: '#555', fontSize: '0.75rem', fontStyle: 'italic', margin: 0 }}>Define tus espacios en el Grimorio.</p>
              )}
            </div>
          </div>
        )}
      </div>



      {/* Stats Grid */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Características</h3>
        <div className="stats-grid" style={{ marginBottom: '0.5rem' }}>
          {STAT_KEYS.map(stat => {
            const Icon = STAT_ICONS[stat];
            return (
              <div key={stat} className="stat-block" style={{ cursor: 'pointer' }}
                onClick={() => handleRoll(`1d20${mod(stats[stat]) >= 0 ? '+' : ''}${mod(stats[stat])}`, `Chequeo de ${FULL_NAMES[stat]}`)}>
                <Icon size={24} className="stat-icon" />
                <span className="stat-label">{STAT_NAMES[stat]}</span>
                <span className="stat-mod">{modStr(stats[stat])}</span>
                <span className="stat-score">{stats[stat] || 10}</span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
          Haz clic en un atributo para tirar un chequeo (1d20 + mod)
        </p>
        {/* Objetos Atunados */}
        <div style={{ marginTop: '0.8rem', textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>
          Objetos Atunados: {Array.isArray(stats.attunedItems) ? stats.attunedItems.length : 0} / 3
        </div>
      </div>

        {backgroundObject && (
          <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
            <h3>📜 Trasfondo</h3>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>{backgroundObject.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.8rem', fontStyle: 'italic' }}>{backgroundObject.description}</div>
            <div style={{ background: 'rgba(200,155,60,0.08)', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.8rem' }}>
              <strong style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>{backgroundObject.feature_name}:</strong>
              <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '0.3rem 0 0' }}>{backgroundObject.feature_desc}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>Personalidad:</strong>
                  <button className="btn btn-ghost btn-xs" title="Tirar al azar" onClick={() => rollBackgroundTrait('personality')} style={{ padding: '0 4px', minHeight: 'auto', height: '18px', fontSize: '0.75rem', border: '1px solid rgba(200,155,60,0.3)', background: 'rgba(200,155,60,0.05)' }}>🎲</button>
                </div>
                <div style={{ color: '#ccc', minHeight: '1.2rem', paddingLeft: '0.2rem' }}>{character?.personality || '—'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>Ideal:</strong>
                  <button className="btn btn-ghost btn-xs" title="Tirar al azar" onClick={() => rollBackgroundTrait('ideals')} style={{ padding: '0 4px', minHeight: 'auto', height: '18px', fontSize: '0.75rem', border: '1px solid rgba(200,155,60,0.3)', background: 'rgba(200,155,60,0.05)' }}>🎲</button>
                </div>
                <div style={{ color: '#ccc', minHeight: '1.2rem', paddingLeft: '0.2rem' }}>{character?.ideals || '—'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>Vínculo:</strong>
                  <button className="btn btn-ghost btn-xs" title="Tirar al azar" onClick={() => rollBackgroundTrait('bonds')} style={{ padding: '0 4px', minHeight: 'auto', height: '18px', fontSize: '0.75rem', border: '1px solid rgba(200,155,60,0.3)', background: 'rgba(200,155,60,0.05)' }}>🎲</button>
                </div>
                <div style={{ color: '#ccc', minHeight: '1.2rem', paddingLeft: '0.2rem' }}>{character?.bonds || '—'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>Defecto:</strong>
                  <button className="btn btn-ghost btn-xs" title="Tirar al azar" onClick={() => rollBackgroundTrait('flaws')} style={{ padding: '0 4px', minHeight: 'auto', height: '18px', fontSize: '0.75rem', border: '1px solid rgba(200,155,60,0.3)', background: 'rgba(200,155,60,0.05)' }}>🎲</button>
                </div>
                <div style={{ color: '#ccc', minHeight: '1.2rem', paddingLeft: '0.2rem' }}>{character?.flaws || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Competencias */}
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <h3>⚔️ Competencias</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', fontSize: '0.85rem' }}>
            {(() => {
              let classProfs = [];
              if (classObject?.proficiencies) {
                try { const parsed = JSON.parse(classObject.proficiencies); if (Array.isArray(parsed)) classProfs = parsed; } catch {}
              }
              const weapons = classProfs.filter(p => p.toLowerCase().includes('arma') || p.toLowerCase().includes('weapon') || p.toLowerCase().includes('sencillas') || p.toLowerCase().includes('marciales') || p.toLowerCase().includes('espada') || p.toLowerCase().includes('dagger') || p.toLowerCase().includes('crossbow') || p.toLowerCase().includes('clubs') || p.toLowerCase().includes('mace') || p.toLowerCase().includes('staff') || p.toLowerCase().includes('sickle') || p.toLowerCase().includes('spear') || p.toLowerCase().includes('dart') || p.toLowerCase().includes('sling') || p.toLowerCase().includes('scimitar'));
              const armor = classProfs.filter(p => p.toLowerCase().includes('armadura') || p.toLowerCase().includes('escudo') || p.toLowerCase().includes('armor') || p.toLowerCase().includes('shield') || p.toLowerCase().includes('ligeras') || p.toLowerCase().includes('medianas') || p.toLowerCase().includes('pesadas') || p.toLowerCase().includes('all armor'));
              const tools = classProfs.filter(p => !weapons.includes(p) && !armor.includes(p) && !p.toLowerCase().includes('salvación') && !p.toLowerCase().includes('saving'));
              let bgTools = [];
              if (backgroundObject?.tool_proficiencies) {
                try { const parsed = JSON.parse(backgroundObject.tool_proficiencies); if (Array.isArray(parsed)) bgTools = parsed; } catch {}
              }
              const allTools = Array.from(new Set([...tools, ...bgTools])).filter(Boolean);
              let langs = [];
              if (raceObject?.languages) { try { const p = JSON.parse(raceObject.languages); if (Array.isArray(p)) langs = [...langs, ...p]; } catch {} }
              if (backgroundObject?.languages) { try { const p = JSON.parse(backgroundObject.languages); if (Array.isArray(p)) langs = [...langs, ...p]; } catch {} }
              const uniqueLangs = Array.from(new Set(langs)).filter(Boolean);
              return (
                <>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>Armaduras:</strong><br /><span style={{ color: '#ccc' }}>{armor.length ? armor.map(translateProf).join(', ') : '—'}</span></div>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>Armas:</strong><br /><span style={{ color: '#ccc' }}>{weapons.length ? weapons.map(translateProf).join(', ') : '—'}</span></div>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>Herramientas:</strong><br /><span style={{ color: '#ccc' }}>{allTools.length ? allTools.map(translateProf).join(', ') : '—'}</span></div>
                  <div><strong style={{ color: 'var(--accent-gold)' }}>Idiomas:</strong><br /><span style={{ color: '#ccc' }}>{uniqueLangs.length ? uniqueLangs.join(', ') : '—'}</span></div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Weapons & Armor */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Armas */}
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)' }}>
              <Swords size={18} /> Ataques y Armas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Ataque sin armas (siempre disponible) */}
              {(() => {
                const strMod = mod(stats.STR);
                const unarmedAtk = `1d20${strMod >= 0 ? '+' : ''}${strMod}`;
                const unarmedDmg = `1${strMod >= 0 ? '+' : ''}${strMod}`;
                return (
                  <div className="weapon-armor-item flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px', opacity: 0.8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#888' }}>Ataque sin Armas</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>1 contundente • Cuerpo a cuerpo</div>
                    </div>
                    <div className="flex-row btn-group" style={{ gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(unarmedAtk, 'Ataque sin Armas')} title="Tirar Ataque" style={{ color: 'var(--accent-blue)', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Atq {strMod >= 0 ? '+' : ''}{strMod}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(unarmedDmg, 'Daño sin Armas')} title="Tirar Daño" style={{ color: 'var(--accent-red)', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Daño {strMod >= 0 ? '+' : ''}{strMod}
                      </button>
                    </div>
                  </div>
                );
              })()}
              {weapons.map((w, idx) => {
                const propsArr = Array.isArray(w.properties) ? w.properties : (() => { try { return JSON.parse(w.properties || '[]'); } catch { return []; } })();
                const isFinesse = propsArr.some(p => p?.index === 'finesse' || p?.name?.toLowerCase().includes('sutil'));
                const isRanged = w.weapon_range === 'Ranged';
                const baseStat = isRanged ? 'DEX' : (isFinesse ? (stats.DEX > stats.STR ? 'DEX' : 'STR') : 'STR');
                const attackMod = mod(stats[baseStat]) + profBonus;
                const dmgMod = mod(stats[baseStat]);
                
                return (
                  <div key={idx} className="weapon-armor-item flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>{w.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{w.damage_dice || '1'} {w.damage_type?.name || w.damage_type || ''} • {w.weapon_range}</div>
                    </div>
                    <div className="flex-row btn-group" style={{ gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(`1d20+${attackMod}`, `Ataque con ${w.name}`)} title="Tirar Ataque" style={{ color: 'var(--accent-blue)', padding: '0.2rem 0.5rem' }}>
                        Atq {attackMod >= 0 ? '+' : ''}{attackMod}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRoll(`${w.damage_dice || '1'}${dmgMod >= 0 ? '+' : ''}${dmgMod}`, `Daño con ${w.name}`)} title="Tirar Daño" style={{ color: 'var(--accent-red)', padding: '0.2rem 0.5rem' }}>
                        Daño {dmgMod >= 0 ? '+' : ''}{dmgMod}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Armaduras */}
          <div style={{ flex: '1 1 200px' }}>
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
              <Shield size={18} /> Armadura Equipada
            </h3>
            {armor.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin armadura (Base 10 + DES).</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {armor.map((a, idx) => (
                  <div key={idx} className="weapon-armor-item flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        CA Base: {a.armor_class_base || 10}
                        {a.armor_class_dex_bonus ? ' (+DES)' : ''}
                      </div>
                    </div>
                    {a.stealth_disadvantage && (
                      <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>Sigilo Desv.</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Known Spells */}
      {knownSpells.length > 0 && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-red)' }}>
          <h3 style={{ marginBottom: '1rem' }}><BookOpen size={18} style={{ color: 'var(--accent-red)' }} /> Conjuros Conocidos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[0,1,2,3,4,5,6,7,8,9].map(lvl => {
              const spellsAtLevel = knownByLevel[lvl] || [];
              const slot = (stats.spellSlots || {})[lvl] || { max: 0, used: 0 };
              if (lvl > 1 && slot.max <= 0 && spellsAtLevel.length === 0) return null;
              return (
                <div key={lvl}>
                  <div className="flex-row flex-between" style={{ background: 'rgba(139,0,0,0.15)', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.3rem' }}>
                    <strong style={{ color: '#e88', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                      {lvl === 0 ? 'Trucos' : `Nivel ${lvl}`}
                    </strong>
                    {lvl > 0 && slot.max > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                        Espacios: {slot.used}/{slot.max}
                      </span>
                    )}
                  </div>
                  {spellsAtLevel.map(sp => (
                    <div key={sp.id || sp.index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem' }}>
                      <div className="flex-row flex-between" style={{ cursor: 'pointer', flexWrap: 'wrap', gap: '0.4rem' }} onClick={() => setExpandedSpell(expandedSpell === sp.id ? null : sp.id)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: 0 }}>
                          <span style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 'bold' }}>{sp.name}</span>
                          <span style={{ fontSize: '0.65rem', color: '#888' }}>
                            {sp.school} {sp.concentration ? '• Concentración' : ''} {sp.ritual ? '• Ritual' : ''}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#666', alignSelf: 'center' }}>{expandedSpell === sp.id ? '▲' : '▼'}</span>
                      </div>
                      {expandedSpell === sp.id && (
                        <div style={{ marginTop: '0.3rem', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#ccc' }}>
                          <div style={{ color: '#999', marginBottom: '0.2rem' }}>
                            Tiempo: {sp.casting_time} • Rango: {sp.range} • Duración: {sp.duration}
                          </div>
                          {sp.components && <div style={{ color: '#999', marginBottom: '0.2rem' }}>Componentes: {sp.components}</div>}
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4', margin: 0 }}>{sp.description || 'Sin descripción'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Notas del Personaje</h3>
        <textarea value={character.notes || ''} onChange={e => setCharacter(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Escribe notas, rasgos, ideales, vínculos, defectos..."
          rows={4} style={{ width: '100%', resize: 'vertical' }} />
      </div>

      {/* Level Up Modal */}
      {levelUpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div className="glass-panel" style={{ backgroundColor: '#15151e', maxWidth: '520px', width: '90%', padding: '1.5rem', borderTop: '4px solid var(--accent-gold)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--accent-gold)' }}>
              <ArrowUp size={24} /> ¡Nivel {levelUpModal.newLevel}!
            </h2>

            {/* HP */}
            <div style={{ background: 'rgba(0,100,0,0.15)', border: '1px solid rgba(0,100,0,0.3)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center', margin: '0.8rem 0' }}>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Puntos de Golpe Máximos Incrementados</div>
              <div style={{ fontSize: '1.2rem', color: '#6c6', fontWeight: 'bold' }}>+{levelUpModal.hpGain} PG</div>
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>Aumentado automáticamente usando el promedio oficial de la clase + mod de CON.</div>
            </div>

            {/* Features */}
            {levelUpModal.addedFeatures?.length > 0 && (
              <div style={{ background: 'rgba(100,200,100,0.08)', border: '1px solid rgba(100,200,100,0.2)', padding: '0.8rem', borderRadius: '8px', margin: '0.5rem 0' }}>
                <div style={{ fontSize: '0.8rem', color: '#8c8', marginBottom: '0.4rem' }}>Nuevas características de nivel</div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#ccc' }}>
                  {levelUpModal.addedFeatures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Choices */}
            {levelUpModal.requiresChoice && (
              <>
                {/* SUBCLASS */}
                {levelUpModal.choiceType === 'SUBCLASS' && (
                  <div style={{ background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.3)', padding: '0.8rem', borderRadius: '8px', margin: '0.5rem 0' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textAlign: 'center', marginBottom: '0.4rem' }}>
                      Elige tu subclase (nivel {levelUpModal.newLevel})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {levelUpModal.subclassList.map(sc => {
                        const sel = levelUpModal.selectedSubclassId === sc.id;
                        return (
                          <div key={sc.id} className="glass-panel clickable"
                            onClick={() => setLevelUpModal(prev => ({ ...prev, selectedSubclassId: sc.id }))}
                            style={{
                              cursor: 'pointer', padding: '0.5rem',
                              borderColor: sel ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)',
                              background: sel ? 'rgba(200,155,60,0.1)' : ''
                            }}>
                            <strong style={{ color: sel ? '#fff' : 'var(--text-main)', fontSize: '0.85rem' }}>{sc.name}</strong>
                            <p style={{ fontSize: '0.65rem', color: '#aaa', margin: '0.15rem 0 0' }}>
                              {(sc.description || '').substring(0, 100)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* FIGHTING STYLE */}
                {levelUpModal.choiceType === 'FIGHTING_STYLE' && (
                  <div style={{ background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.3)', padding: '0.8rem', borderRadius: '8px', margin: '0.5rem 0' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textAlign: 'center', marginBottom: '0.4rem' }}>
                      Elige tu Estilo de Combate
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {FIGHTING_STYLES.map(style => {
                        const sel = levelUpModal.selectedFightingStyle === style.name;
                        return (
                          <div key={style.index} className="glass-panel clickable"
                            onClick={() => setLevelUpModal(prev => ({ ...prev, selectedFightingStyle: style.name }))}
                            style={{
                              cursor: 'pointer', padding: '0.5rem',
                              borderColor: sel ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)',
                              background: sel ? 'rgba(200,155,60,0.1)' : ''
                            }}>
                            <strong style={{ color: sel ? '#fff' : 'var(--text-main)', fontSize: '0.85rem' }}>{style.name}</strong>
                            <p style={{ fontSize: '0.65rem', color: '#aaa', margin: '0.15rem 0 0' }}>
                              {style.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ASI OR FEAT */}
                {levelUpModal.choiceType === 'ASI_OR_FEAT' && (
                  <div style={{ background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.3)', padding: '0.8rem', borderRadius: '8px', margin: '0.5rem 0' }}>
                    <div className="flex-row" style={{ justifyContent: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                      <button className={`btn btn-xs ${levelUpModal.asiOrFeatMode === 'asi' ? 'btn-gold' : 'btn-ghost'}`}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => setLevelUpModal(prev => ({ ...prev, asiOrFeatMode: 'asi' }))}>
                        Mejora de Características
                      </button>
                      <button className={`btn btn-xs ${levelUpModal.asiOrFeatMode === 'feat' ? 'btn-gold' : 'btn-ghost'}`}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => setLevelUpModal(prev => ({ ...prev, asiOrFeatMode: 'feat' }))}>
                        Elegir una Dote
                      </button>
                    </div>

                    {levelUpModal.asiOrFeatMode === 'asi' ? (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#fd0', marginBottom: '0.4rem', textAlign: 'center' }}>
                          Incrementa un atributo en +2 o dos atributos en +1
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                          {STAT_KEYS.map(k => {
                            const change = levelUpModal.asiChanges?.[k] || 0;
                            const totalUsed = Object.values(levelUpModal.asiChanges || {}).reduce((s, v) => s + v, 0);
                            return (
                              <div key={k} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '6px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#aaa' }}>{STAT_NAMES[k] || k}</div>
                                <div style={{ fontSize: '1rem', color: '#fff' }}>{(stats[k] || 10) + change}</div>
                                <div className="flex-row" style={{ justifyContent: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                  <button className="btn btn-ghost btn-sm"
                                    style={{ padding: '0 0.3rem', fontSize: '0.7rem', minWidth: '22px', lineHeight: '20px' }}
                                    disabled={change <= 0}
                                    onClick={() => setLevelUpModal(prev => ({
                                      ...prev,
                                      asiChanges: { ...prev.asiChanges, [k]: change - 1 }
                                    }))}>-</button>
                                  <span style={{ fontSize: '0.8rem', minWidth: '16px', textAlign: 'center', color: change > 0 ? '#fd0' : '#666' }}>{change || ''}</span>
                                  <button className="btn btn-ghost btn-sm"
                                    style={{ padding: '0 0.3rem', fontSize: '0.7rem', minWidth: '22px', lineHeight: '20px' }}
                                    disabled={totalUsed >= 2 || change >= 2 || (stats[k] || 10) + change >= 20}
                                    onClick={() => setLevelUpModal(prev => ({
                                      ...prev,
                                      asiChanges: { ...prev.asiChanges, [k]: change + 1 }
                                    }))}>+</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#fd0', marginBottom: '0.4rem', textAlign: 'center' }}>
                          Elige una dote del compendio
                        </div>
                        <select className="input-field" style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: '#1c1c24', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                          value={levelUpModal.selectedFeatIndex}
                          onChange={(e) => setLevelUpModal(prev => ({ ...prev, selectedFeatIndex: e.target.value }))}>
                          <option value="">-- Selecciona una Dote --</option>
                          {(levelUpModal.featsList || []).map(feat => (
                            <option key={feat.index} value={feat.index}>{feat.name}</option>
                          ))}
                        </select>
                        {levelUpModal.selectedFeatIndex && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.75rem', color: '#ccc' }}>
                            <strong>Descripción:</strong>
                            <p style={{ margin: '0.2rem 0 0', lineHeight: '1.3' }}>
                              {((levelUpModal.featsList || []).find(f => f.index === levelUpModal.selectedFeatIndex)?.description) || 'Sin descripción.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex-row" style={{ justifyContent: 'center', marginTop: '1rem', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setLevelUpModal(null)}>Cancelar</button>
              <button className="btn btn-gold" onClick={confirmLevelUp}
                disabled={
                  levelUpModal.requiresChoice && (
                    (levelUpModal.choiceType === 'SUBCLASS' && !levelUpModal.selectedSubclassId) ||
                    (levelUpModal.choiceType === 'FIGHTING_STYLE' && !levelUpModal.selectedFightingStyle) ||
                    (levelUpModal.choiceType === 'ASI_OR_FEAT' && (
                      levelUpModal.asiOrFeatMode === 'asi'
                        ? Object.values(levelUpModal.asiChanges || {}).reduce((s, v) => s + v, 0) < 2
                        : !levelUpModal.selectedFeatIndex
                    ))
                  )
                }>
                Confirmar Elección
              </button>
            </div>
          </div>
        </div>
      )}

            {/* ═══════ PRINT LAYOUT — Official D&D 5E Spanish Sheet ═══════ */}
      {(() => {
        const CLASS_SAVES = {
          'bárbaro': ['STR', 'CON'], 'bardo': ['DEX', 'CHA'], 'clérigo': ['WIS', 'CHA'],
          'druida': ['INT', 'WIS'], 'guerrero': ['STR', 'CON'], 'monje': ['STR', 'DEX'],
          'paladín': ['WIS', 'CHA'], 'explorador': ['STR', 'DEX'], 'pícaro': ['DEX', 'INT'],
          'hechicero': ['CON', 'CHA'], 'brujo': ['WIS', 'CHA'], 'mago': ['INT', 'WIS'],
          'artífice': ['INT', 'WIS']
        };
        const isSavingThrowProficient = (k) => {
          const cn = (className || '').toLowerCase();
          const classSaves = CLASS_SAVES[cn] || [];
          const customSaves = stats.saveProficiencies || stats.savingThrows || [];
          return classSaves.includes(k) || (Array.isArray(customSaves) && customSaves.includes(k));
        };
        const SKILL_STAT_MAP_ES = {
          STR: 'Fue', DEX: 'Des', CON: 'Con', INT: 'Int', WIS: 'Sab', CHA: 'Car'
        };

        return (
          <div className="print-sheet">

            {/* ───── PAGE 1: Stats, Skills, Combat, Personality ───── */}
            <div className="print-page">
              {/* Header */}
              <div className="ps-header">
                <div className="ps-header-left">
                  <div className="ps-header-logo">DUNGEONS & DRAGONS</div>
                  <div className="ps-header-charname">
                    <span className="ps-header-val">{character?.name || ''}</span>
                    <label>NOMBRE DEL PERSONAJE</label>
                  </div>
                </div>
                <div className="ps-header-right">
                  <div className="ps-header-grid">
                    <div className="ps-field"><label>Clase y Nivel</label><span>{className}{subclassName ? ` (${subclassName})` : ''} {character?.level}</span></div>
                    <div className="ps-field"><label>Trasfondo</label><span>{backgroundObject?.name || character?.background_name || ''}</span></div>
                    <div className="ps-field"><label>Nombre del Jugador</label><span>{character?.user_name || ''}</span></div>
                    <div className="ps-field"><label>Raza</label><span>{raceName}</span></div>
                    <div className="ps-field"><label>Alineamiento</label><span>{stats.alignment || character?.alignment || ''}</span></div>
                    <div className="ps-field"><label>Puntos de Experiencia</label><span>{stats.xp || character?.xp || ''}</span></div>
                  </div>
                </div>
              </div>

              <div className="ps-body-page1">
                {/* COLUMN 1: Stats, Passive, Otras Competencias */}
                <div className="ps-col-1">
                  <div className="ps-stats-list">
                    {STAT_KEYS.map(k => {
                      const val = stats[k] || 10;
                      const m = mod(val);
                      return (
                        <div key={k} className="ps-stat-card">
                          <span className="ps-stat-label">{FULL_NAMES[k] || STAT_NAMES[k]}</span>
                          <span className="ps-stat-mod">{m >= 0 ? '+' : ''}{m}</span>
                          <div className="ps-stat-score-bubble">{val}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="ps-passive-box">
                    <div className="ps-passive-val">
                      {10 + mod(stats.WIS || 10) + (printSkills.find(s => s.index === 'perception')?.prof ? profBonus : 0)}
                    </div>
                    <span className="ps-passive-label">SABIDURÍA PASIVA (PERCEPCIÓN)</span>
                  </div>

                  <div className="ps-other-profs-box">
                    <label className="ps-box-title-lbl">OTRAS COMPETENCIAS E IDIOMAS</label>
                    <div className="ps-other-profs-content">
                      {getOtherProficienciesAndLanguages()}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Inspiration, Prof Bonus, Saving Throws, Skills */}
                <div className="ps-col-2">
                  <div className="ps-inspiration-box">
                    <div className={`ps-check-circle ${stats.inspiration ? 'checked' : ''}`}>
                      {stats.inspiration ? '✓' : ''}
                    </div>
                    <span className="ps-ins-lbl">INSPIRACIÓN</span>
                  </div>

                  <div className="ps-prof-bonus-box">
                    <div className="ps-prof-val">+{profBonus}</div>
                    <span className="ps-prof-lbl">BONIFICADOR DE COMPETENCIA</span>
                  </div>

                  <div className="ps-saves-box">
                    <label className="ps-box-title-lbl">TIRADAS DE SALVACIÓN</label>
                    <div className="ps-saves-list">
                      {STAT_KEYS.map(k => {
                        const val = stats[k] || 10;
                        const m = mod(val);
                        const proficient = isSavingThrowProficient(k);
                        const saveVal = m + (proficient ? profBonus : 0);
                        return (
                          <div key={k} className="ps-save-row">
                            <span className={`ps-dot ${proficient ? 'filled' : ''}`}></span>
                            <span className="ps-save-mod-val">{saveVal >= 0 ? '+' : ''}{saveVal}</span>
                            <span className="ps-save-name">{FULL_NAMES[k] || STAT_NAMES[k]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ps-skills-box">
                    <label className="ps-box-title-lbl">HABILIDADES</label>
                    <div className="ps-skills-list-print">
                      {printSkills.map(sk => {
                        const isProf = sk.prof === 'proficient' || sk.prof === 'expertise';
                        const isExpert = sk.prof === 'expertise';
                        return (
                          <div key={sk.index} className="ps-skill-row-print">
                            <span className={`ps-dot ${isExpert ? 'double-dot' : isProf ? 'filled' : ''}`}></span>
                            <span className="ps-skill-mod-val">{sk.total >= 0 ? '+' : ''}{sk.total}</span>
                            <span className="ps-skill-name-lbl">{sk.name} <span className="ps-skill-stat-lbl">({SKILL_STAT_MAP_ES[sk.stat] || sk.stat})</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: Combat, HP, Attacks, Equipment */}
                <div className="ps-col-3">
                  {/* AC, Initiative, Speed */}
                  <div className="ps-combat-header">
                    <div className="ps-combat-box-ac">
                      <div className="ps-combat-val">{ac}</div>
                      <label>CLASE DE ARMADURA</label>
                    </div>
                    <div className="ps-combat-box-init">
                      <div className="ps-combat-val">{initiative >= 0 ? '+' : ''}{initiative}</div>
                      <label>INICIATIVA</label>
                    </div>
                    <div className="ps-combat-box-speed">
                      <div className="ps-combat-val">{speed}</div>
                      <label>VELOCIDAD</label>
                    </div>
                  </div>

                  {/* Hit Points Box */}
                  <div className="ps-hp-container">
                    <div className="ps-hp-max">
                      <span>Puntos de Golpe Máximos</span>
                      <span className="ps-hp-max-val">{stats.maxHP || 1}</span>
                    </div>
                    <div className="ps-hp-current">
                      <span className="ps-hp-curr-val">{stats.currHP || 0}</span>
                      <label>PUNTOS DE GOLPE ACTUALES</label>
                    </div>
                  </div>

                  {/* Temporary Hit Points */}
                  <div className="ps-temp-hp-box">
                    <span className="ps-temp-hp-val">{stats.tempHP || 0}</span>
                    <label>PUNTOS DE GOLPE TEMPORALES</label>
                  </div>

                  {/* Hit Dice and Death Saves */}
                  <div className="ps-dice-saves-row">
                    <div className="ps-hit-dice-box">
                      <div className="ps-hd-max">Total <span>{character?.level || 1}d{hitDie}</span></div>
                      <div className="ps-hd-val">{(character?.level || 1) - (stats.hitDiceUsed || 0)}</div>
                      <label>DADOS DE GOLPE</label>
                    </div>
                    <div className="ps-death-saves-box">
                      <div className="ps-ds-row">
                        <span>ÉXITOS</span>
                        <span className="ps-ds-dots">〇 〇 〇</span>
                      </div>
                      <div className="ps-ds-row">
                        <span>FALLOS</span>
                        <span className="ps-ds-dots">〇 〇 〇</span>
                      </div>
                      <label>SALVACIONES CONTRA LA MUERTE</label>
                    </div>
                  </div>

                  {/* Attacks & Spellcasting */}
                  <div className="ps-attacks-box-print">
                    <label className="ps-box-title-lbl">ATAQUES Y LANZAMIENTO DE CONJUROS</label>
                    <div className="ps-attacks-content-print">
                      <table className="ps-attacks-table-print">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Bono</th>
                            <th>Daño/Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Ataque sin Armas</td>
                            <td>{mod(stats.STR) >= 0 ? '+' : ''}{mod(stats.STR)}</td>
                            <td>1 + {mod(stats.STR)} cont.</td>
                          </tr>
                          {weapons.slice(0, 3).map((w, idx) => {
                            const propsArr = Array.isArray(w.properties) ? w.properties : (() => { try { return JSON.parse(w.properties || '[]'); } catch { return []; } })();
                            const isFinesse = propsArr.some(p => p?.index === 'finesse' || p?.name?.toLowerCase().includes('sutil'));
                            const isRanged = w.weapon_range === 'Ranged';
                            const baseStat = isRanged ? 'DEX' : (isFinesse ? (stats.DEX > stats.STR ? 'DEX' : 'STR') : 'STR');
                            const atkMod = mod(stats[baseStat]) + profBonus;
                            const dmgMod = mod(stats[baseStat]);
                            return (
                              <tr key={idx}>
                                <td className="truncate-text">{w.name}</td>
                                <td>{atkMod >= 0 ? '+' : ''}{atkMod}</td>
                                <td className="truncate-text">{w.damage_dice || '1'}{dmgMod >= 0 ? '+' : ''}{dmgMod} {w.damage_type?.name || w.damage_type || ''}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="ps-attacks-notes-print">
                        {weapons.length > 3 && (
                          <div className="ps-attacks-overflow-text">
                            Ataques adicionales: {weapons.slice(3).map(w => w.name).join(', ')}
                          </div>
                        )}
                        {armor.map((a, i) => (
                          <div key={i} className="ps-armor-note-print">
                            🛡️ {a.name} (CA {a.armor_class_base || 10}{a.armor_class_dex_bonus ? ' +DES' : ''}{a.stealth_disadvantage ? ', sigilo desv.' : ''})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Equipment Box */}
                  <div className="ps-equipment-box-print">
                    <label className="ps-box-title-lbl">EQUIPO</label>
                    <div className="ps-equipment-content-print">
                      <div className="ps-coins-col-print">
                        <div className="ps-coin-row-print"><span className="ps-coin-lbl">cp</span><span className="ps-coin-val-box">{parseCoins(stats.coins).cp || 0}</span></div>
                        <div className="ps-coin-row-print"><span className="ps-coin-lbl">sp</span><span className="ps-coin-val-box">{parseCoins(stats.coins).sp || 0}</span></div>
                        <div className="ps-coin-row-print"><span className="ps-coin-lbl">ep</span><span className="ps-coin-val-box">{parseCoins(stats.coins).ep || 0}</span></div>
                        <div className="ps-coin-row-print"><span className="ps-coin-lbl">gp</span><span className="ps-coin-val-box">{parseCoins(stats.coins).gp || 0}</span></div>
                        <div className="ps-coin-row-print"><span className="ps-coin-lbl">pp</span><span className="ps-coin-val-box">{parseCoins(stats.coins).pp || 0}</span></div>
                      </div>
                      <div className="ps-eq-list-print">
                        {equipment.map((eq, i) => (
                          <div key={i} className="ps-eq-item-print">{eq.name || eq}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 4: Personality Traits, Ideals, Bonds, Flaws, Features & Traits */}
                <div className="ps-col-4">
                  <div className="ps-personality-group">
                    <div className="ps-personality-box-print">
                      <span className="ps-pers-lbl">RASGOS DE PERSONALIDAD</span>
                      <div className="ps-pers-content-print">{character?.personality || ''}</div>
                    </div>
                    <div className="ps-personality-box-print">
                      <span className="ps-pers-lbl">IDEALES</span>
                      <div className="ps-pers-content-print">{character?.ideals || ''}</div>
                    </div>
                    <div className="ps-personality-box-print">
                      <span className="ps-pers-lbl">VÍNCULOS</span>
                      <div className="ps-pers-content-print">{character?.bonds || ''}</div>
                    </div>
                    <div className="ps-personality-box-print">
                      <span className="ps-pers-lbl">DEFECTOS</span>
                      <div className="ps-pers-content-print">{character?.flaws || ''}</div>
                    </div>
                  </div>

                  <div className="ps-features-box-print">
                    <label className="ps-box-title-lbl">RASGOS Y CARACTERÍSTICAS</label>
                    <div className="ps-features-content-print">
                      {character?.features ? (
                        Array.isArray(character.features) ? character.features.join('\n') : character.features
                      ) : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ───── PAGE 2: Backstory, Appearance, Allies, Treasure ───── */}
            <div className="print-page">
              <div className="ps-header">
                <div className="ps-header-left">
                  <div className="ps-header-logo">DUNGEONS & DRAGONS</div>
                  <div className="ps-header-charname">
                    <span className="ps-header-val">{character?.name || ''}</span>
                    <label>NOMBRE DEL PERSONAJE</label>
                  </div>
                </div>
                <div className="ps-header-right">
                  <div className="ps-header-grid">
                    <div className="ps-field"><label>Edad</label><span>{stats.age || character?.age || '—'}</span></div>
                    <div className="ps-field"><label>Altura</label><span>{stats.height || character?.height || '—'}</span></div>
                    <div className="ps-field"><label>Peso</label><span>{stats.weight || character?.weight || '—'}</span></div>
                    <div className="ps-field"><label>Ojos</label><span>{stats.eyes || character?.eyes || '—'}</span></div>
                    <div className="ps-field"><label>Piel</label><span>{stats.skin || character?.skin || '—'}</span></div>
                    <div className="ps-field"><label>Cabello</label><span>{stats.hair || character?.hair || '—'}</span></div>
                  </div>
                </div>
              </div>

              <div className="ps-body-page2">
                <div className="ps-page2-left-col">
                  <div className="ps-portrait-box-print">
                    <label className="ps-box-title-lbl">ASPECTO DEL PERSONAJE</label>
                    <div className="ps-portrait-content-print">
                      {character?.portrait_url ? (
                        <img src={character.portrait_url} alt="Retrato" className="ps-portrait-img-print" />
                      ) : (
                        <div className="ps-portrait-placeholder-print">RETRATO DEL PERSONAJE</div>
                      )}
                    </div>
                  </div>

                  <div className="ps-backstory-box-print">
                    <label className="ps-box-title-lbl">HISTORIA DEL PERSONAJE</label>
                    <div className="ps-backstory-content-print">
                      {character?.notes || ''}
                    </div>
                  </div>
                </div>

                <div className="ps-page2-right-col">
                  <div className="ps-allies-box-print">
                    <label className="ps-box-title-lbl">ALIADOS Y ORGANIZACIONES</label>
                    <div className="ps-allies-content-print">
                      <div className="ps-org-symbol-placeholder-print">SÍMBOLO DE LA ORGANIZACIÓN</div>
                      <div className="ps-allies-text-print">
                        {stats.allies || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="ps-treasure-box-print">
                    <label className="ps-box-title-lbl">TESORO</label>
                    <div className="ps-treasure-content-print">
                      {stats.treasure || '—'}
                    </div>
                  </div>

                  <div className="ps-additional-traits-box-print">
                    <label className="ps-box-title-lbl">RASGOS Y CARACTERÍSTICAS ADICIONALES</label>
                    <div className="ps-additional-traits-content-print">
                      {stats.additionalTraits || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ───── PAGE 3: Spellcasting ───── */}
            <div className="print-page">
              <div className="ps-spell-header">
                <div className="ps-spell-field"><label>Clase de Conjurador</label><span>{className}</span></div>
                <div className="ps-spell-field"><label>Habilidad de Conjuración</label><span>{spellAbility || '—'}</span></div>
                <div className="ps-spell-field"><label>CD de Salvación de Conjuros</label><span>{saveDC || '—'}</span></div>
                <div className="ps-spell-field"><label>Bonificador de Ataque de Conjuros</label><span>{spellAtk >= 0 ? `+${spellAtk}` : spellAtk || '—'}</span></div>
              </div>

              <div className="ps-spell-grid-print">
                <div className="ps-spell-col-print">
                  <div className="ps-spell-section-print">
                    <div className="ps-spell-section-title-print">TRUCOS (NIVEL 0)</div>
                    <div className="ps-spell-list-print-page">
                      {(knownSpells || []).filter(s => s.level === 0).map((sp, i) => (
                        <div key={i} className="ps-spell-entry-print">〇 {sp.name}</div>
                      ))}
                    </div>
                  </div>

                  {[1, 2, 3].map(lvl => {
                    const slot = (stats.spellSlots || {})[lvl] || { max: 0, used: 0 };
                    const lvlSpells = knownByLevel?.[lvl] || [];
                    if (slot.max === 0 && lvlSpells.length === 0) return null;
                    return (
                      <div key={lvl} className="ps-spell-section-print">
                        <div className="ps-spell-section-title-print">
                          <span>NIVEL {lvl}</span>
                          <span className="ps-spell-slots-print">Espacios: {slot.max}</span>
                        </div>
                        <div className="ps-spell-list-print-page">
                          {lvlSpells.map((sp, i) => (
                            <div key={i} className="ps-spell-entry-print">〇 {sp.name}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ps-spell-col-print">
                  {[4, 5, 6].map(lvl => {
                    const slot = (stats.spellSlots || {})[lvl] || { max: 0, used: 0 };
                    const lvlSpells = knownByLevel?.[lvl] || [];
                    if (slot.max === 0 && lvlSpells.length === 0) return null;
                    return (
                      <div key={lvl} className="ps-spell-section-print">
                        <div className="ps-spell-section-title-print">
                          <span>NIVEL {lvl}</span>
                          <span className="ps-spell-slots-print">Espacios: {slot.max}</span>
                        </div>
                        <div className="ps-spell-list-print-page">
                          {lvlSpells.map((sp, i) => (
                            <div key={i} className="ps-spell-entry-print">〇 {sp.name}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ps-spell-col-print">
                  {[7, 8, 9].map(lvl => {
                    const slot = (stats.spellSlots || {})[lvl] || { max: 0, used: 0 };
                    const lvlSpells = knownByLevel?.[lvl] || [];
                    if (slot.max === 0 && lvlSpells.length === 0) return null;
                    return (
                      <div key={lvl} className="ps-spell-section-print">
                        <div className="ps-spell-section-title-print">
                          <span>NIVEL {lvl}</span>
                          <span className="ps-spell-slots-print">Espacios: {slot.max}</span>
                        </div>
                        <div className="ps-spell-list-print-page">
                          {lvlSpells.map((sp, i) => (
                            <div key={i} className="ps-spell-entry-print">〇 {sp.name}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      </div>
    </>
  );
}

