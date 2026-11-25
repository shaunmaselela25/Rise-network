import type { CareerTopic } from './api';

export const topicLabels: Record<CareerTopic, string> = {
  cv: 'CVs and applications',
  interview: 'Interviews',
  workplace_readiness: 'Workplace readiness',
  communication: 'Professional communication',
  career_exploration: 'Exploring careers',
  career_pathways: 'Career pathways',
  portfolio: 'Portfolios',
  job_search: 'Finding work',
  professional_skills: 'Professional skills',
};

export const topics = Object.keys(topicLabels) as [CareerTopic, ...CareerTopic[]];
