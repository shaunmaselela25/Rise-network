import type { Database } from './database.types';

export type Province = Database['public']['Enums']['province'];
export type QualificationLevel = Database['public']['Enums']['qualification_level'];

export const provinceLabels: Record<Province, string> = {
  eastern_cape: 'Eastern Cape',
  free_state: 'Free State',
  gauteng: 'Gauteng',
  kwazulu_natal: 'KwaZulu-Natal',
  limpopo: 'Limpopo',
  mpumalanga: 'Mpumalanga',
  north_west: 'North West',
  northern_cape: 'Northern Cape',
  western_cape: 'Western Cape',
  national: 'National (anywhere in South Africa)',
  online: 'Online / remote',
};

export const qualificationLabels: Record<QualificationLevel, string> = {
  none: 'No formal qualification',
  grade_9: 'Grade 9',
  matric: 'Matric (Grade 12 / NSC)',
  certificate: 'Certificate',
  diploma: 'Diploma',
  degree: 'Degree',
  postgraduate: 'Postgraduate',
};
