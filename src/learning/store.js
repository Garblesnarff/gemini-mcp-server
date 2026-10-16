/**
 * JSON persistence for the learning system.
 *
 * Three files under DATA_DIR:
 *   interactions.json — every tool interaction (the evidence)
 *   profile.json      — the distilled user profile (the learning)
 *   sessions.json     — chat session histories (the memory)
 *
 * Writes are atomic (tmp file + rename) so a crash can't corrupt state.
 */
import fs from 'node:fs';
import path from 'node:path';

export function createStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });

  const files = {
    interactions: path.join(dataDir, 'interactions.json'),
    profile: path.join(dataDir, 'profile.json'),
    sessions: path.join(dataDir, 'sessions.json'),
  };

  function read(file, fallback) {
    try {
      if (!fs.existsSync(file)) return fallback;
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return fallback;
    }
  }

  function write(file, value) {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, file);
  }

  return {
    get interactions() { return read(files.interactions, []); },
    set interactions(v) { write(files.interactions, v); },

    get profile() { return read(files.profile, null); },
    set profile(v) { write(files.profile, v); },

    get sessions() { return read(files.sessions, {}); },
    set sessions(v) { write(files.sessions, v); },
  };
}
