import { describe, it, expect } from 'vitest';
import { classifyLogLevel } from '../logLevel';

describe('classifyLogLevel', () => {
  describe('JSON log format', () => {
    it('returns error for level:error', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 'error', msg: 'oops' }))).toBe('error');
    });

    it('returns error for level:fatal', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 'fatal', msg: 'crash' }))).toBe('error');
    });

    it('returns error for level:panic', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 'panic', msg: 'crash' }))).toBe('error');
    });

    it('returns warn for level:warn', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 'warn', msg: 'heads up' }))).toBe('warn');
    });

    it('returns warn for level:warning', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 'warning', msg: 'heads up' }))).toBe('warn');
    });

    it('returns info for level:info', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 'info', msg: 'ok' }))).toBe('info');
    });

    it('returns info for level:debug (treated as info in UI)', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 'debug', msg: 'trace' }))).toBe('info');
    });

    it('handles non-string level gracefully (falls back to default)', () => {
      expect(classifyLogLevel(JSON.stringify({ level: 123 }))).toBe('default');
    });
  });

  describe('plain text format', () => {
    it('returns error for "error:" keyword', () => {
      expect(classifyLogLevel('error: transaction failed')).toBe('error');
    });

    it('returns error for "failed" keyword', () => {
      expect(classifyLogLevel('step 5 failed: gas too low')).toBe('error');
    });

    it('returns error for "ERR" in deployer output', () => {
      expect(classifyLogLevel('[deployer] ERR: nonce too low')).toBe('error');
    });

    it('returns warn for "warn:" keyword', () => {
      expect(classifyLogLevel('warn: retrying with lower gas')).toBe('warn');
    });

    it('returns warn for "warning" keyword', () => {
      expect(classifyLogLevel('warning: gas estimate exceeded')).toBe('warn');
    });

    it('returns info for "info:" prefix', () => {
      expect(classifyLogLevel('info: step 13/51 complete')).toBe('info');
    });

    it('returns default for unrecognized deployer lines', () => {
      expect(classifyLogLevel('[deployer] Step 12/51: Deploying ContractName')).toBe('default');
    });

    it('returns default for empty string', () => {
      expect(classifyLogLevel('')).toBe('default');
    });

    it('strips ANSI codes before keyword matching', () => {
      expect(classifyLogLevel('\x1b[31merror: something\x1b[0m')).toBe('error');
    });
  });
});
