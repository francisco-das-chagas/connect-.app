import { describe, it, expect } from 'vitest';
import { cleanCPF, formatCPF, isValidCPF, maskCPF } from '@/lib/cpf';

describe('cleanCPF', () => {
  it('removes dots and dashes from formatted CPF', () => {
    expect(cleanCPF('123.456.789-09')).toBe('12345678909');
  });

  it('removes any non-digit character', () => {
    expect(cleanCPF('abc123def456')).toBe('123456');
  });

  it('returns empty string for non-numeric input', () => {
    expect(cleanCPF('abcdef')).toBe('');
  });

  it('returns digits unchanged when already clean', () => {
    expect(cleanCPF('12345678909')).toBe('12345678909');
  });

  it('handles empty string', () => {
    expect(cleanCPF('')).toBe('');
  });
});

describe('formatCPF', () => {
  it('formats 11-digit string to XXX.XXX.XXX-XX', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
  });

  it('formats already formatted CPF (strips and reformats)', () => {
    expect(formatCPF('123.456.789-09')).toBe('123.456.789-09');
  });

  it('returns original input if cleaned length is not 11', () => {
    expect(formatCPF('12345')).toBe('12345');
    expect(formatCPF('123456789012')).toBe('123456789012');
  });

  it('handles empty string', () => {
    expect(formatCPF('')).toBe('');
  });
});

describe('isValidCPF', () => {
  // Known valid CPFs (generated with valid check digits)
  it('accepts valid CPF: 529.982.247-25', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('accepts valid CPF without formatting: 52998224725', () => {
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('accepts valid CPF: 111.444.777-35', () => {
    expect(isValidCPF('11144477735')).toBe(true);
  });

  // All same digits should fail
  it('rejects all-same-digit CPFs', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('000.000.000-00')).toBe(false);
    expect(isValidCPF('222.222.222-22')).toBe(false);
    expect(isValidCPF('333.333.333-33')).toBe(false);
    expect(isValidCPF('444.444.444-44')).toBe(false);
    expect(isValidCPF('555.555.555-55')).toBe(false);
    expect(isValidCPF('666.666.666-66')).toBe(false);
    expect(isValidCPF('777.777.777-77')).toBe(false);
    expect(isValidCPF('888.888.888-88')).toBe(false);
    expect(isValidCPF('999.999.999-99')).toBe(false);
  });

  // Wrong check digits
  it('rejects CPF with wrong first check digit', () => {
    expect(isValidCPF('529.982.247-35')).toBe(false);
  });

  it('rejects CPF with wrong second check digit', () => {
    expect(isValidCPF('529.982.247-26')).toBe(false);
  });

  // Too short / too long
  it('rejects CPF that is too short', () => {
    expect(isValidCPF('1234567890')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
  });

  it('rejects CPF that is too long', () => {
    expect(isValidCPF('123456789012')).toBe(false);
  });

  // Empty
  it('rejects empty string', () => {
    expect(isValidCPF('')).toBe(false);
  });
});

describe('maskCPF', () => {
  it('returns digits as-is for 3 or fewer', () => {
    expect(maskCPF('1')).toBe('1');
    expect(maskCPF('12')).toBe('12');
    expect(maskCPF('123')).toBe('123');
  });

  it('adds first dot after 3 digits', () => {
    expect(maskCPF('1234')).toBe('123.4');
    expect(maskCPF('123456')).toBe('123.456');
  });

  it('adds second dot after 6 digits', () => {
    expect(maskCPF('1234567')).toBe('123.456.7');
    expect(maskCPF('123456789')).toBe('123.456.789');
  });

  it('adds dash after 9 digits', () => {
    expect(maskCPF('12345678901')).toBe('123.456.789-01');
  });

  it('handles already formatted input by stripping and remasking', () => {
    expect(maskCPF('123.456.789-01')).toBe('123.456.789-01');
  });

  it('handles empty string', () => {
    expect(maskCPF('')).toBe('');
  });

  it('limits to 11 digits', () => {
    expect(maskCPF('123456789012345')).toBe('123.456.789-01');
  });
});
