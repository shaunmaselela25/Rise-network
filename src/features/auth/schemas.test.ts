import { describe, expect, it } from 'vitest';
import { validate } from '../../lib/validation';
import { newPasswordSchema, registrationSchema, safeNextPath, signInSchema } from './schemas';

const validRegistration = {
  displayName: 'Thandi',
  email: 'thandi@example.com',
  password: 'abcdefghi1',
  ageConfirmed: true,
  policiesAccepted: true,
};

describe('registrationSchema', () => {
  it('accepts valid input and trims text', () => {
    const result = validate(registrationSchema, {
      ...validRegistration,
      displayName: '  Thandi  ',
      email: ' thandi@example.com ',
    });
    expect(result.errors).toBeNull();
    expect(result.data).toMatchObject({ displayName: 'Thandi', email: 'thandi@example.com' });
  });

  it('requires 18+ confirmation (D-01)', () => {
    const result = validate(registrationSchema, { ...validRegistration, ageConfirmed: false });
    expect(result.errors?.ageConfirmed).toMatch(/18 or older/);
  });

  it('requires acceptance of the terms and privacy notice', () => {
    const result = validate(registrationSchema, { ...validRegistration, policiesAccepted: false });
    expect(result.errors?.policiesAccepted).toMatch(/terms of use and privacy notice/);
  });

  it.each([
    ['too short', 'abc12', /at least 10/],
    ['no digit', 'abcdefghijk', /letter and one number/],
    ['no letter', '12345678901', /letter and one number/],
  ])('rejects a password that is %s', (_label, password, message) => {
    const result = validate(registrationSchema, { ...validRegistration, password });
    expect(result.errors?.password).toMatch(message);
  });

  it('rejects an invalid email address', () => {
    const result = validate(registrationSchema, { ...validRegistration, email: 'not-an-email' });
    expect(result.errors?.email).toMatch(/valid email/);
  });

  it('reports an empty email as missing rather than invalid', () => {
    const result = validate(registrationSchema, { ...validRegistration, email: '' });
    expect(result.errors?.email).toBe('Enter your email address.');
  });
});

describe('signInSchema', () => {
  it('requires a password', () => {
    expect(validate(signInSchema, { email: 'a@b.co', password: '' }).errors?.password).toBe(
      'Enter your password.',
    );
  });
});

describe('newPasswordSchema', () => {
  it('requires the confirmation to match', () => {
    const result = validate(newPasswordSchema, {
      password: 'abcdefghi1',
      confirmPassword: 'abcdefghi2',
    });
    expect(result.errors?.confirmPassword).toBe('The passwords do not match.');
  });
});

describe('safeNextPath (open-redirect protection)', () => {
  it.each([
    ['/account', '/account'],
    ['/opportunities?q=bursary', '/opportunities?q=bursary'],
    [null, '/account'],
    ['', '/account'],
    ['https://evil.example', '/account'],
    ['//evil.example', '/account'],
    ['/\\evil.example', '/account'],
    ['javascript:alert(1)', '/account'],
  ])('maps %s to %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
