import axios from 'axios';

// Dev detection: Vite dev ports are 5173-5179
const port = parseInt(window.location.port);
const isDev = port >= 5173 && port <= 5179;
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? `http://${window.location.hostname}:8000` : '');

const api = axios.create({ baseURL: API_BASE });

// ── JWT Interceptor ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect if already on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// ── Campaigns ──────────────────────────────────────────
export const getCampaigns = () => api.get('/campaigns');
export const createCampaign = (data) => api.post('/campaigns', data);
export const getCampaign = (id) => api.get(`/campaigns/${id}`);
export const joinCampaign = (code) => api.post('/campaigns/join', { code });
export const leaveCampaign = (id) => api.post(`/campaigns/${id}/leave`);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);
export const getCampaignMembers = (id) => api.get(`/campaigns/${id}/members`);

// ── Characters ─────────────────────────────────────────
export const getCharacters = (campaignId) =>
  api.get(`/characters${campaignId ? `?campaign_id=${campaignId}` : ''}`);
export const getCharacter = (id) => api.get(`/characters/${id}`);
export const createCharacter = (data) => api.post('/characters', data);
export const updateCharacter = (id, data) => api.put(`/characters/${id}`, data);
export const deleteCharacter = (id) => api.delete(`/characters/${id}`);

// ── Equipment: Mounts, Vehicles, Trade Goods, Tools, Packs ─────────────────────────────────────────
export const getMounts = () => api.get('/compendium/mounts');
export const getMount = (id) => api.get(`/compendium/mounts/${id}`);
export const getVehicles = () => api.get('/compendium/vehicles');
export const getVehicle = (id) => api.get(`/compendium/vehicles/${id}`);
export const getTradeGoods = () => api.get('/compendium/trade-goods');
export const getTradeGood = (id) => api.get(`/compendium/trade-goods/${id}`);
export const getTools = () => api.get('/compendium/tools');
export const getTool = (id) => api.get(`/compendium/tools/${id}`);
export const getEquipmentPacks = () => api.get('/compendium/equipment-packs');
export const getEquipmentPack = (id) => api.get(`/compendium/equipment-packs/${id}`);

// ── Rules Mechanics: Advantage, Inspiration, Multiclass, Leveling ─────────────────────────────────────────
export const getAdvantageRules = () => api.get('/compendium/rules/advantage');
export const getInspirationRules = () => api.get('/compendium/rules/inspiration');
export const getMulticlassRules = () => api.get('/compendium/rules/multiclass');
export const getLevelingTable = (className) => api.get(`/compendium/rules/leveling/${className}`);
export const getProficiencyBonusTable = () => api.get('/compendium/rules/proficiency-bonus');

// ── Compendium ─────────────────────────────────────────
export const getRaces = () => api.get('/compendium/races');
export const getRace = (id) => api.get(`/compendium/races/${id}`);
export const getClasses = () => api.get('/compendium/classes');
export const getClass = (id) => api.get(`/compendium/classes/${id}`);
export const getSubclasses = (classId) =>
  api.get(`/compendium/subclasses${classId ? `?class_id=${classId}` : ''}`);
export const getBackgrounds = () => api.get('/compendium/backgrounds');

export const getMonsters = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/compendium/monsters?${qs}`);
};
export const getMonster = (id) => api.get(`/compendium/monsters/${id}`);
export const getMonstersCount = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/compendium/monsters/count?${qs}`);
};

export const getSpells = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/compendium/spells?${qs}`);
};
export const getSpell = (id) => api.get(`/compendium/spells/${id}`);

export const getItems = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/compendium/items?${qs}`);
};

export const getMagicItems = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/compendium/magic-items?${qs}`);
};

export const getSkills = () => api.get('/compendium/skills');
export const getConditions = () => api.get('/compendium/conditions');
export const getFeats = () => api.get('/compendium/feats');

// ── DM Tools ───────────────────────────────────────────
export const createEncounter = (data) => api.post('/encounters', data);
export const getEncounters = (campaignId) => api.get(`/encounters?campaign_id=${campaignId}`);
export const getEncounter = (id) => api.get(`/encounters/${id}`);
export const updateEncounter = (id, data) => api.put(`/encounters/${id}`, data);
export const deleteEncounter = (id) => api.delete(`/encounters/${id}`);

export const createSessionNote = (data) => api.post('/sessions', data);
export const getSessionNotes = (campaignId) => api.get(`/sessions?campaign_id=${campaignId}`);
export const updateSessionNote = (id, data) => api.put(`/sessions/${id}`, data);
export const deleteSessionNote = (id) => api.delete(`/sessions/${id}`);

export const rollDice = (data) => api.post('/dice/roll', data);
export const getDiceLog = (campaignId, limit = 50) =>
  api.get(`/dice/log?${campaignId ? `campaign_id=${campaignId}&` : ''}limit=${limit}`);

export const getImageUrl = (path) => path?.startsWith('http') ? path : `${API_BASE}${path}`;

export default api;
