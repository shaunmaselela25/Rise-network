import type { Database } from '../../lib/database.types';

type Enums = Database['public']['Enums'];
export type OpportunityType = Enums['opportunity_type'];
export type VerificationStatus = Enums['verification_status'];
export type OpportunityStatus = Enums['opportunity_status'];
export type DeliveryMode = Enums['delivery_mode'];
export type TrackingStatus = Enums['tracking_status'];
export type ReportReason = Enums['report_reason'];

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  scholarship: 'Scholarship',
  bursary: 'Bursary',
  internship: 'Internship',
  learnership: 'Learnership',
  graduate_programme: 'Graduate programme',
  entry_level_job: 'Entry-level job',
  training: 'Training programme',
  skills_programme: 'Skills-development programme',
  apprenticeship: 'Apprenticeship',
  education_programme: 'Educational programme',
  competition: 'Competition',
  entrepreneurship: 'Entrepreneurship opportunity',
  grant: 'Grant or funding',
  volunteering: 'Volunteering',
  event: 'Event',
  other: 'Other',
};

export const deliveryModeLabels: Record<DeliveryMode, string> = {
  in_person: 'In person',
  remote: 'Remote / online',
  hybrid: 'Hybrid',
};

/**
 * Verification labels shown to the public. Wording must never overstate what was checked
 * (docs/CONTENT_GOVERNANCE.md §3).
 */
export const verificationInfo: Record<
  VerificationStatus,
  { label: string; description: string; tone: 'good' | 'neutral' | 'warning' }
> = {
  provider_confirmed: {
    label: 'Provider confirmed',
    description: 'The organisation offering this opportunity confirmed these details to us.',
    tone: 'good',
  },
  source_checked: {
    label: 'Source checked',
    description: 'A reviewer checked these details against the provider’s official source.',
    tone: 'good',
  },
  needs_recheck: {
    label: 'Needs rechecking',
    description:
      'These details have not been checked recently and may be out of date. Confirm them with the provider.',
    tone: 'warning',
  },
  disputed: {
    label: 'Under review',
    description:
      'Someone has reported a problem with this listing and we are looking into it. Take extra care.',
    tone: 'warning',
  },
  unverified: {
    label: 'Not yet checked',
    description: 'These details have not been checked by RISE NETWORK.',
    tone: 'neutral',
  },
};

export const statusLabels: Record<OpportunityStatus, string> = {
  draft: 'Draft',
  pending_review: 'Waiting for review',
  changes_requested: 'Changes requested',
  rejected: 'Not accepted',
  published: 'Published',
  archived: 'Archived',
};

export const trackingLabels: Record<TrackingStatus, string> = {
  interested: 'Interested',
  applying: 'Preparing application',
  applied: 'Applied',
  not_proceeding: 'Not proceeding',
};

export const reportReasonLabels: Record<ReportReason, string> = {
  suspicious: 'It looks suspicious or like a scam',
  incorrect: 'Some details are wrong',
  expired: 'It has closed or no longer exists',
  other: 'Something else',
};

export const opportunityTypes = Object.keys(opportunityTypeLabels) as [
  OpportunityType,
  ...OpportunityType[],
];
export const deliveryModes = Object.keys(deliveryModeLabels) as [DeliveryMode, ...DeliveryMode[]];
export const trackingStatuses = Object.keys(trackingLabels) as [
  TrackingStatus,
  ...TrackingStatus[],
];
export const reportReasons = Object.keys(reportReasonLabels) as [ReportReason, ...ReportReason[]];
