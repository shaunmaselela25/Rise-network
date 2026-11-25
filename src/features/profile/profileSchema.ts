import { z } from 'zod';
import {
  provinceLabels,
  qualificationLabels,
  type Province,
  type QualificationLevel,
} from '../../lib/reference';

export const provinces = Object.keys(provinceLabels) as [Province, ...Province[]];
export const qualifications = Object.keys(qualificationLabels) as [
  QualificationLevel,
  ...QualificationLevel[],
];

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Enter the name you would like to use.' })
    .max(80, { error: 'Use 80 characters or fewer.' }),
  province: z.union([z.literal(''), z.enum(provinces)]),
  educationLevel: z.union([z.literal(''), z.enum(qualifications)]),
});
