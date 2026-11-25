import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import type { RouteObject } from 'react-router';
import { routes } from '../app/routes';

/** Renders the real application route table at `path` using an in-memory router. */
export function renderRoute(path: string, routeTable: RouteObject[] = routes) {
  const router = createMemoryRouter(routeTable, { initialEntries: [path] });
  const user = userEvent.setup();
  const utils = render(<RouterProvider router={router} />);
  return { ...utils, router, user };
}
