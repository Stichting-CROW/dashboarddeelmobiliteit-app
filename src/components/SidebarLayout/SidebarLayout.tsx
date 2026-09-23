import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  KeyRound,
  BookOpen,
  Download,
  Rss,
  Sparkles,
  Info,
  Users,
  Share2,
  Building2,
  Receipt,
  Mail,
  LucideIcon
} from 'lucide-react';

import { StateType } from '../../types/StateType';
import { IconButtonClose } from '../IconButtons.jsx';
import LogoDashboardDeelmobiliteit from '../Logo/LogoDashboardDeelmobiliteit';

import './SidebarLayout.css';

interface SidebarMenuItem {
  title: string;
  link: string;
  icon: LucideIcon;
  /** Only mark active on an exact path match (used for parent routes like /profile) */
  end?: boolean;
  /** Additional exact paths for which this item should be shown as active */
  alsoActiveOn?: string[];
}

interface SidebarMenuSection {
  title: string;
  items: SidebarMenuItem[];
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  /** Title shown in the header bar above the content */
  title: string;
  contentWidth?: string;
}

const loggedInSections: SidebarMenuSection[] = [
  {
    title: 'Account',
    items: [
      { title: 'Start', link: '/profile', icon: Home, end: true },
      { title: 'API keys', link: '/profile/api', icon: KeyRound },
    ],
  },
  {
    title: 'Data',
    items: [
      { title: 'Exporteer', link: '/export', icon: Download },
      { title: 'Datafeeds', link: '/active_feeds', icon: Rss },
    ],
  },
  {
    title: 'Help',
    items: [
      { title: 'Documentatie', link: '/docs', icon: BookOpen },
      { title: 'Functies', link: '/features', icon: Sparkles },
      { title: 'Over', link: '/over', icon: Info },
    ],
  },
];

/**
 * Path prefixes of the pages in the logged-in left menu. The bottom settings
 * icon stays active on any of these pages, including nested routes such as a
 * documentation article or an admin detail page.
 */
export const sidebarMenuPathPrefixes = [
  ...loggedInSections.flatMap((section) => section.items.map((item) => item.link)),
  '/admin',
];

const guestSections: SidebarMenuSection[] = [
  {
    title: 'Menu',
    items: [
      { title: 'Functies', link: '/features', icon: Sparkles },
      { title: 'Over', link: '/over', icon: Info },
      { title: 'Documentatie', link: '/docs', icon: BookOpen },
      { title: 'Datafeeds', link: '/active_feeds', icon: Rss },
    ],
  },
];

/**
 * Builds the admin ("Beheer") section based on the user's ACL.
 * Returns null when the user has no admin privileges.
 */
const getAdminSection = (acl: any): SidebarMenuSection | null => {
  const isAdmin = Boolean(acl?.is_admin);
  const isOrganisationAdmin = Boolean(
    acl?.privileges && acl.privileges.indexOf('ORGANISATION_ADMIN') > -1
  );

  if (!isAdmin && !isOrganisationAdmin) return null;

  const items: SidebarMenuItem[] = [
    { title: 'Gebruikers', link: '/admin/users', icon: Users, alsoActiveOn: ['/admin'] },
    { title: 'Data delen', link: '/admin/shared', icon: Share2 },
  ];
  if (isAdmin) {
    items.push({ title: 'Organisaties', link: '/admin/organisations', icon: Building2 });
    items.push({ title: 'Jaarbijdrage', link: '/admin/yearly-costs', icon: Receipt });
    items.push({ title: 'E-mail gebruikers', link: '/admin/email', icon: Mail });
  }

  return { title: 'Beheer', items };
};

/**
 * Page layout with a dark sidebar menu on the left and a header bar with the
 * page title above the content. Used for the profile, data and admin pages.
 */
export default function SidebarLayout({
  children,
  title,
  contentWidth = '600px',
}: SidebarLayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });
  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);

  const adminSection = isLoggedIn ? getAdminSection(acl) : null;
  const sections = isLoggedIn
    ? (adminSection ? [...loggedInSections, adminSection] : loggedInSections)
    : guestSections;

  return (
    <div className="SidebarLayout flex flex-col md:flex-row min-h-full">

      {/* Sidebar */}
      <aside className="SidebarLayout-sidebar md:w-56 md:flex-shrink-0 text-white">
        <div className="px-5 pt-6 pb-2">
          <LogoDashboardDeelmobiliteit color="#FFFFFF" />
        </div>

        <nav className="px-3 pb-3 md:pb-6 flex md:block overflow-x-auto" aria-label="Hoofdmenu">
          {sections.map((section) => (
            <div key={section.title} className="md:mt-5 flex md:block flex-shrink-0">
              <div className="hidden md:block px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                {section.title}
              </div>
              <ul className="flex md:block">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isAlsoActive = item.alsoActiveOn?.includes(pathname) ?? false;
                  return (
                    <li key={item.link} className="whitespace-nowrap">
                      <NavLink
                        to={item.link}
                        end={item.end}
                        className={({ isActive }) => (isActive || isAlsoActive) ? 'active' : ''}
                      >
                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                        <span>{item.title}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="SidebarLayout-header flex items-center justify-between px-6 border-b border-gray-200"
          style={{ minHeight: '64px' }}
        >
          <h1 className="text-gray-900">
            {title}
          </h1>
          <IconButtonClose onClick={() => navigate('/')} style={{}} />
        </header>

        <main className="px-6 pt-8 pb-24">
          <div style={{ width: contentWidth, maxWidth: '100%' }}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
