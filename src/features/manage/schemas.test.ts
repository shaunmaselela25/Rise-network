import { describe, expect, it } from 'vitest';
import { validate } from '../../lib/validation';
import { careerSchema, learningSchema, slugify } from './schemas';

const learning = {
  title: 'Intro to spreadsheets',
  description: 'Learn the basics.',
  provider_name: 'Example Learning',
  category_code: 'digital_literacy',
  level: 'beginner',
  format: 'online_self_paced',
  cost: 'free',
  duration_text: '',
  requirements: '',
  url: 'https://example.org/course',
  status: 'draft',
};

const career = {
  slug: 'writing-your-cv',
  title: 'Writing your CV',
  summary: 'A practical guide.',
  body: 'Start with your contact details.',
  topic: 'cv',
  external_url: '',
  status: 'published',
};

describe('learningSchema (FR-011)', () => {
  it('accepts valid input and converts blanks to null', () => {
    const result = validate(learningSchema, learning);
    expect(result.errors).toBeNull();
    expect(result.data).toMatchObject({ duration_text: null, requirements: null });
  });

  it.each(['http://example.org', 'javascript:alert(1)', ''])('rejects link %s', (url) => {
    expect(validate(learningSchema, { ...learning, url }).errors?.url).toMatch(/https:\/\//);
  });

  it('only allows the defined cost classifications', () => {
    expect(
      validate(learningSchema, { ...learning, cost: 'accredited' }).errors?.cost,
    ).toBeDefined();
  });
});

describe('careerSchema (FR-012)', () => {
  it('accepts a guide with body text', () => {
    expect(validate(careerSchema, career).errors).toBeNull();
  });

  it('accepts a guide that only links out', () => {
    expect(
      validate(careerSchema, { ...career, body: '', external_url: 'https://example.org/guide' })
        .errors,
    ).toBeNull();
  });

  it('requires either body text or an external link', () => {
    expect(validate(careerSchema, { ...career, body: '' }).errors?.body).toMatch(
      /guide text or a link/,
    );
  });

  it.each(['Writing CV', 'writing--cv', '-cv', 'cv-', 'cv_guide'])('rejects slug %s', (slug) => {
    expect(validate(careerSchema, { ...career, slug }).errors?.slug).toBeDefined();
  });
});

describe('slugify', () => {
  it.each([
    ['Writing your CV!', 'writing-your-cv'],
    ['  Interview  tips — 2027 ', 'interview-tips-2027'],
    ['Café skills', 'cafe-skills'],
  ])('%s → %s', (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });
});
