/* ============================================================
   PIXPLAY — Storage Module
   localStorage wrapper for high scores & preferences
   ============================================================ */

const PixPlayStorage = (() => {
  const STORAGE_KEY = 'pixplay_data';

  function _getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { scores: {}, preferences: { soundEnabled: true, volume: 0.35 }, stats: {} };
    } catch {
      return { scores: {}, preferences: { soundEnabled: true, volume: 0.35 }, stats: {} };
    }
  }

  function _save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* Storage full or unavailable — fail silently */ }
  }

  return {
    getHighScore(gameId) {
      const data = _getData();
      return data.scores[gameId] || 0;
    },

    setHighScore(gameId, score) {
      const data = _getData();
      const prev = data.scores[gameId] || 0;
      if (score > prev) {
        data.scores[gameId] = score;
        _save(data);
        return true; // new high score
      }
      return false;
    },

    getAllScores() {
      return _getData().scores;
    },

    getPreferences() {
      return _getData().preferences;
    },

    setPreference(key, value) {
      const data = _getData();
      data.preferences[key] = value;
      _save(data);
    },

    // Track total games played per game
    incrementPlayCount(gameId) {
      const data = _getData();
      if (!data.stats[gameId]) data.stats[gameId] = { plays: 0, totalScore: 0 };
      data.stats[gameId].plays++;
      _save(data);
    },

    addToTotalScore(gameId, score) {
      const data = _getData();
      if (!data.stats[gameId]) data.stats[gameId] = { plays: 0, totalScore: 0 };
      data.stats[gameId].totalScore += score;
      _save(data);
    },

    getStats(gameId) {
      const data = _getData();
      return data.stats[gameId] || { plays: 0, totalScore: 0 };
    },

    getTotalGamesPlayed() {
      const data = _getData();
      return Object.values(data.stats).reduce((sum, s) => sum + s.plays, 0);
    }
  };
})();
