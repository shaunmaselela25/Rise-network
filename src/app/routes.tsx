import type { RouteObject } from 'react-router';
import { Layout } from './Layout';
import { RouteErrorPage } from './RouteErrorPage';
import { HomePage } from '../features/home/HomePage';
import { AboutPage } from '../features/info/AboutPage';
import { ContactPage } from '../features/info/ContactPage';
import { PrivacyPage } from '../features/info/PrivacyPage';
import { TermsPage } from '../features/info/TermsPage';
import { NotFoundPage } from '../features/info/NotFoundPage';
import { OpportunitiesPage } from '../features/opportunities/OpportunitiesPage';
import { LearningPage } from '../features/learning/LearningPage';
import { CareersPage } from '../features/careers/CareersPage';

/**
 * Application route table. Exported so tests can mount it with a memory router.
 * Routes are eagerly imported while pages are small; switch to `lazy` per route
 * when a feature's bundle grows (tracked against NFR-001).
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'opportunities', element: <OpportunitiesPage /> },
      { path: 'learning', element: <LearningPage /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
