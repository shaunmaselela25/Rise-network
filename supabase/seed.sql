-- =============================================================================
-- RISE NETWORK — DEVELOPMENT FIXTURES ONLY. NEVER LOAD INTO PRODUCTION.
-- Every record is marked [SAMPLE] and points to example.org so it cannot be
-- mistaken for a real opportunity (docs/DATA_MODEL.md §6).
-- =============================================================================

insert into public.opportunities (
  title, summary, description, opportunity_type, category_code, provider_name,
  source_url, application_url, province, delivery_mode, eligibility, min_qualification,
  opens_at, closes_at, status, verification_status, verification_notes, last_checked_at,
  published_at, submitted_by
) values
  ('[SAMPLE] Engineering bursary for first-year students',
   'Development fixture. Not a real opportunity.',
   'This is sample data used for local development and testing only.',
   'bursary', 'engineering', '[SAMPLE] Example Foundation',
   'https://example.org/sample/engineering-bursary', 'https://example.org/sample/apply',
   'gauteng', 'in_person', 'Sample eligibility text.', 'matric',
   current_date - 10, current_date + 30,
   'published', 'source_checked', 'Development fixture — not a real opportunity.', now(), now(), null),
  ('[SAMPLE] Remote ICT learnership',
   'Development fixture. Not a real opportunity.',
   'This is sample data used for local development and testing only.',
   'learnership', 'ict', '[SAMPLE] Example Skills Academy',
   'https://example.org/sample/ict-learnership', 'https://example.org/sample/apply',
   'online', 'remote', 'Sample eligibility text.', 'matric',
   null, null,
   'published', 'provider_confirmed', 'Development fixture — not a real opportunity.', now(), now(), null),
  ('[SAMPLE] Closed graduate programme',
   'Development fixture. Not a real opportunity. Its closing date has passed.',
   'This is sample data used for local development and testing only.',
   'graduate_programme', 'business_commerce', '[SAMPLE] Example Holdings',
   'https://example.org/sample/graduate-programme', 'https://example.org/sample/apply',
   'western_cape', 'hybrid', 'Sample eligibility text.', 'degree',
   current_date - 60, current_date - 1,
   'published', 'source_checked', 'Development fixture — not a real opportunity.', now(), now(), null),
  ('[SAMPLE] Pending community volunteering programme',
   'Development fixture awaiting review.',
   'This is sample data used for local development and testing only.',
   'volunteering', 'social_development', '[SAMPLE] Example Community Trust',
   'https://example.org/sample/volunteering', null,
   'kwazulu_natal', 'in_person', null, null,
   null, current_date + 45,
   'pending_review', 'unverified', null, null, null, null);

insert into public.learning_resources (title, description, provider_name, category_code, level, format, cost, url, status, last_reviewed_at) values
  ('[SAMPLE] Introduction to spreadsheets', 'Development fixture. Not a real course.', '[SAMPLE] Example Learning', 'digital_literacy', 'beginner', 'online_self_paced', 'free', 'https://example.org/sample/spreadsheets', 'published', now()),
  ('[SAMPLE] Draft course (not public)', 'Development fixture in draft.', '[SAMPLE] Example Learning', 'technical_skills', 'intermediate', 'online_live', 'paid', 'https://example.org/sample/draft', 'draft', null);

insert into public.career_resources (slug, title, summary, body, topic, status, last_reviewed_at) values
  ('sample-writing-your-first-cv', '[SAMPLE] Writing your first CV', 'Development fixture. Placeholder guidance.', 'Sample body text for local development.', 'cv', 'published', now());
