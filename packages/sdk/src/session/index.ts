/**
 * Sign in with Ethos SDK - Session Module
 * 
 * @module session
 */

export { SessionManager } from './manager';
export type { SessionManagerConfig } from './manager';

export {
  MemoryStorage,
  BrowserStorage,
  createStorage,
  saveSession,
  clearSession,
  deserializeSession,
  serializeSession,
} from './storage';
