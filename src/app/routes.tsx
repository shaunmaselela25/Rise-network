import type { RouteObject } from 'react-router';
import { Layout } from './Layout';
import { RouteErrorPage } from './RouteErrorPage';
import { HomePage } from '../features/home/HomePage';
import { AboutPage } from '../features/info/AboutPage';
import { ContactPage } from '../features/info/ContactPage';
import { PrivacyPage } from '../features/info/PrivacyPage';
import { TermsPage } from '../features/info/TermsPage';
import { NotFoundPage } from '../features/info/NotFoundPage';
import { AccountDeletedPage } from '../features/profile/AccountDeletedPage';

/**
 * Application route table. Exported so tests can mount it with a memory router.
 * Public information pages are bundled eagerly. Pages that need the Supabase client
 * are loaded on demand so public pages stay light (NFR-001).
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: (
      <p className="container" role="status">
        Loading…
      </p>
    ),
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'opportunities',
        lazy: () =>
          import('../features/opportunities/OpportunitiesPage').then((m) => ({
            Component: m.OpportunitiesPage,
          })),
      },
      {
        path: 'opportunities/:slug',
        lazy: () =>
          import('../features/opportunities/OpportunityDetailPage').then((m) => ({
            Component: m.OpportunityDetailPage,
          })),
      },
      {
        path: 'submit',
        lazy: () =>
          import('../features/opportunities/memberRoutes').then((m) => ({
            Component: m.SubmitRoute,
          })),
      },
      {
        path: 'my-submissions',
        lazy: () =>
          import('../features/opportunities/memberRoutes').then((m) => ({
            Component: m.MySubmissionsRoute,
          })),
      },
      {
        path: 'my-submissions/:id',
        lazy: () =>
          import('../features/opportunities/memberRoutes').then((m) => ({
            Component: m.EditSubmissionRoute,
          })),
      },
      {
        path: 'saved',
        lazy: () =>
          import('../features/opportunities/memberRoutes').then((m) => ({
            Component: m.SavedRoute,
          })),
      },
      {
        path: 'moderation',
        lazy: () =>
          import('../features/moderation/staffRoutes').then((m) => ({
            Component: m.ModerationRoute,
          })),
      },
      {
        path: 'moderation/:id',
        lazy: () =>
          import('../features/moderation/staffRoutes').then((m) => ({ Component: m.ReviewRoute })),
      },
      {
        path: 'learning',
        lazy: () =>
          import('../features/learning/LearningPage').then((m) => ({ Component: m.LearningPage })),
      },
      {
        path: 'careers',
        lazy: () =>
          import('../features/careers/CareersPage').then((m) => ({ Component: m.CareersPage })),
      },
      {
        path: 'careers/:slug',
        lazy: () =>
          import('../features/careers/CareerGuidePage').then((m) => ({
            Component: m.CareerGuidePage,
          })),
      },
      {
        path: 'staff',
        lazy: () =>
          import('../features/manage/staffRoutes').then((m) => ({ Component: m.StaffHomeRoute })),
      },
      {
        path: 'staff/learning',
        lazy: () =>
          import('../features/manage/staffRoutes').then((m) => ({
            Component: m.ManageLearningRoute,
          })),
      },
      {
        path: 'staff/learning/new',
        lazy: () =>
          import('../features/manage/staffRoutes').then((m) => ({
            Component: m.LearningEditorRoute,
          })),
      },
      {
        path: 'staff/learning/:id',
        lazy: () =>
          import('../features/manage/staffRoutes').then((m) => ({
            Component: m.LearningEditorRoute,
          })),
      },
      {
        path: 'staff/careers',
        lazy: () =>
          import('../features/manage/staffRoutes').then((m) => ({
            Component: m.ManageCareersRoute,
          })),
      },
      {
        path: 'staff/careers/new',
        lazy: () =>
          import('../features/manage/staffRoutes').then((m) => ({
            Component: m.CareerEditorRoute,
          })),
      },
      {
        path: 'staff/careers/:id',
        lazy: () =>
          import('../features/manage/staffRoutes').then((m) => ({
            Component: m.CareerEditorRoute,
          })),
      },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      {
        path: 'register',
        lazy: () =>
          import('../features/auth/RegisterPage').then((m) => ({ Component: m.RegisterPage })),
      },
      {
        path: 'sign-in',
        lazy: () =>
          import('../features/auth/SignInPage').then((m) => ({ Component: m.SignInPage })),
      },
      {
        path: 'forgot-password',
        lazy: () =>
          import('../features/auth/ForgotPasswordPage').then((m) => ({
            Component: m.ForgotPasswordPage,
          })),
      },
      {
        path: 'reset-password',
        lazy: () =>
          import('../features/auth/ResetPasswordPage').then((m) => ({
            Component: m.ResetPasswordPage,
          })),
      },
      {
        path: 'account',
        lazy: () =>
          import('../features/profile/AccountRoute').then((m) => ({ Component: m.AccountRoute })),
      },
      { path: 'account-deleted', element: <AccountDeletedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
