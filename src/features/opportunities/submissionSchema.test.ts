import { describe, expect, it } from 'vitest';
import { validate } from '../../lib/validation';
import { submissionSchema } from './submissionSchema';

const base = {
  title: 'Engineering bursary 2027',
  summary: 'Full bursary for engineering students.',
  description: 'Covers tuition and accommodation.',
  opportunity_type: 'bursary',
  category_code: 'engineering',
  provider_name: 'Example Foundation',
  provider_url: '',
  source_url: 'https://example.org/bursary',
  application_url: '',
  application_instructions: '',
  province: '',
  location_text: '',
  delivery_mode: '',
  eligibility: '',
  required_documents: '',
  required_skills: '',
  min_qualification: '',
  age_min: '',
  age_max: '',
  opens_at: '',
  closes_at: '',
  duration_text: '',
  financial_details: '',
  contact_info: '',
};

describe('submissionSchema', () => {
  it('accepts a minimal valid submission and turns blanks into nulls', () => {
    const result = validate(submissionSchema, base);
    expect(result.errors).toBeNull();
    expect(result.data).toMatchObject({ province: null, application_url: null, age_min: null });
  });

  it('requires a traceable https source (BR-05)', () => {
    expect(validate(submissionSchema, { ...base, source_url: '' }).errors?.source_url).toMatch(
      /https:\/\//,
    );
    expect(
      validate(submissionSchema, { ...base, source_url: 'http://example.org' }).errors?.source_url,
    ).toMatch(/https:\/\//);
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'https:// spaces.example'])(
    'rejects unsafe application link %s',
    (url) => {
      expect(
        validate(submissionSchema, { ...base, application_url: url }).errors?.application_url,
      ).toBeDefined();
    },
  );

  it('rejects a closing date before the opening date', () => {
    const result = validate(submissionSchema, {
      ...base,
      opens_at: '2027-02-01',
      closes_at: '2027-01-01',
    });
    expect(result.errors?.closes_at).toMatch(/on or after/);
  });

  it('rejects an inverted age range', () => {
    const result = validate(submissionSchema, { ...base, age_min: '30', age_max: '18' });
    expect(result.errors?.age_max).toMatch(/at least the minimum/);
  });

  it('rejects an unknown opportunity type', () => {
    expect(
      validate(submissionSchema, { ...base, opportunity_type: 'pyramid_scheme' }).errors
        ?.opportunity_type,
    ).toBeDefined();
  });
});
