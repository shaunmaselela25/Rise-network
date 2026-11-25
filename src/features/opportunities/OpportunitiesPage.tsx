import { InDevelopment } from '../../components/InDevelopment';

export function OpportunitiesPage() {
  return (
    <InDevelopment
      title="Opportunities"
      intro="A reviewed directory of bursaries, scholarships, internships, learnerships, graduate programmes, training and other opportunities in South Africa."
      phase="delivery phase 3"
      plannedCapabilities={[
        'Search by keyword and filter by opportunity type, category, province and closing date.',
        'See each opportunity’s eligibility, required documents, costs and deadline.',
        'Check where the information came from and when it was last checked.',
        'Go directly to the provider’s official application page.',
        'Save opportunities and track your progress (with a free account).',
        'Report listings that look suspicious or incorrect.',
      ]}
    />
  );
}
