export interface NavItem {
  to: string;
  label: string;
}

/** Primary navigation. Every entry must resolve to a real route (no dead links). */
export const primaryNav: NavItem[] = [
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/learning', label: 'Learning' },
  { to: '/careers', label: 'Careers' },
  { to: '/about', label: 'About' },
];

export const footerNav: NavItem[] = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy notice' },
  { to: '/terms', label: 'Terms of use' },
];
