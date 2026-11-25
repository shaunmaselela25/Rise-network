import type { Database } from '../../lib/database.types';

type Enums = Database['public']['Enums'];
export type LearningLevel = Enums['learning_level'];
export type LearningFormat = Enums['learning_format'];
export type CostType = Enums['cost_type'];
export type ResourceStatus = Enums['resource_status'];

export const levelLabels: Record<LearningLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  all_levels: 'All levels',
};

export const formatLabels: Record<LearningFormat, string> = {
  online_self_paced: 'Online, self-paced',
  online_live: 'Online, live sessions',
  in_person: 'In person',
  blended: 'Blended (online and in person)',
};

/** Cost wording must stay factual (FR-011: distinguish free, paid and funded). */
export const costLabels: Record<CostType, string> = {
  free: 'Free',
  paid: 'Paid',
  funded: 'Funding available',
  unknown: 'Cost not confirmed',
};

export const resourceStatusLabels: Record<ResourceStatus, string> = {
  draft: 'Draft (not public)',
  published: 'Published',
  archived: 'Archived (not public)',
};

export const levels = Object.keys(levelLabels) as [LearningLevel, ...LearningLevel[]];
export const formats = Object.keys(formatLabels) as [LearningFormat, ...LearningFormat[]];
export const costs = Object.keys(costLabels) as [CostType, ...CostType[]];
export const resourceStatuses = Object.keys(resourceStatusLabels) as [
  ResourceStatus,
  ...ResourceStatus[],
];
