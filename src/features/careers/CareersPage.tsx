import { InDevelopment } from '../../components/InDevelopment';

export function CareersPage() {
  return (
    <InDevelopment
      title="Careers"
      intro="Practical guidance to help you prepare for work and plan your career."
      phase="delivery phase 4"
      plannedCapabilities={[
        'Guides on writing a CV and preparing for interviews.',
        'Workplace readiness and professional communication.',
        'Exploring career pathways and building a portfolio.',
        'Job-search guidance for entry-level roles.',
      ]}
    />
  );
}
