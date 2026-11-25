import { InDevelopment } from '../../components/InDevelopment';

export function LearningPage() {
  return (
    <InDevelopment
      title="Learning"
      intro="A directory of courses and skills-development resources to help you build knowledge and qualifications."
      phase="delivery phase 4"
      plannedCapabilities={[
        'Browse online courses, short courses, digital-literacy and technical-skills resources.',
        'Filter by level, format and cost — free, paid or funding-supported.',
        'See the provider, duration and entry requirements before you start.',
      ]}
    />
  );
}
