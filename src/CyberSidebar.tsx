import type { ChangeEvent } from 'react';

import { CyberLink } from './CyberRoutes';
import { setCyberScope, useCyberScope } from './cyberScope';
import { ALL_CYBER_ROLES, getMembers, isMemberRole, normaliseRole, scopeMemberId } from './cyberData';
import type { CyberRole } from './cyberData';

export type SidebarItem = { label: string; path: string };

/** What the Program Lead sees, in order. Exactly these five, and nothing else. */
export const PROGRAM_LEAD_ITEMS: SidebarItem[] = [
  { label: 'Portfolio', path: '/cyber/portfolio' },
  { label: 'Members', path: '/cyber/members' },
  { label: 'Service performance', path: '/cyber/service-performance' },
  { label: 'Catalogue', path: '/cyber/catalogue' },
  { label: 'Sector advisories', path: '/cyber/advisories' },
];

/** The member executive's own item set: the incident and report view. */
export const MEMBER_EXEC_ITEMS: SidebarItem[] = [
  { label: 'Incidents', path: '/cyber/member/incidents' },
  { label: 'Reports', path: '/cyber/member/reports' },
];

/** The member IT lead's own item set: incidents, plus the remediation backlog. */
export const MEMBER_IT_ITEMS: SidebarItem[] = [
  { label: 'Incidents', path: '/cyber/member/incidents' },
  { label: 'Findings', path: '/cyber/member/findings' },
  { label: 'Reports', path: '/cyber/member/reports' },
];

/** The member security lead: the IT lead's screens, plus sector advisories. */
export const MEMBER_SEC_LEAD_ITEMS: SidebarItem[] = [
  ...MEMBER_IT_ITEMS,
  { label: 'Sector advisories', path: '/cyber/advisories' },
];

/** Member operations: the open work, without the reporting pack. */
export const MEMBER_OPS_ITEMS: SidebarItem[] = [
  { label: 'Incidents', path: '/cyber/member/incidents' },
  { label: 'Findings', path: '/cyber/member/findings' },
];

/**
 * The "Cybersecurity" sidebar items a role may see.
 *
 * The role is the only input: a member role never sees a portfolio-wide item,
 * and a HealthPRO role never sees a facility-scoped one.
 */
export function sidebarItemsForRole(role: CyberRole): SidebarItem[] {
  if (role === 'member-exec') return [...MEMBER_EXEC_ITEMS];
  if (role === 'member-it') return [...MEMBER_IT_ITEMS];
  if (role === 'member-sec-lead') return [...MEMBER_SEC_LEAD_ITEMS];
  if (role === 'member-ops') return [...MEMBER_OPS_ITEMS];
  return [...PROGRAM_LEAD_ITEMS];
}

/** The first screen of a role's section — where bare `/cyber` lands. */
export function landingPathForRole(role: CyberRole): string {
  return sidebarItemsForRole(role)[0]?.path ?? '/cyber/portfolio';
}

/**
 * Select a role: what the role switcher does on change.
 *
 * It writes the role into the URL scope and nothing else, so the facility and
 * the member are re-derived for the new role — a member the new role cannot
 * act for, or a facility it cannot see, is dropped rather than carried over.
 */
export function selectRole(value: string): void {
  setCyberScope({ role: normaliseRole(value) ?? 'program-lead' });
}

/** Select the member a member role is acting for: what the member switcher does. */
export function selectMember(value: string): void {
  setCyberScope({ memberId: value });
}

/**
 * The sidebar's role switcher: every demo role, reading and writing the role
 * through the URL scope.
 */
export function RoleSwitcher() {
  const { role } = useCyberScope();

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    selectRole(event.target.value);
  }

  return (
    <label className="shell-header__role" data-testid="cyber-role-switcher">
      <span className="shell-header__label">Demo role</span>
      <select
        aria-label="Demo role"
        data-testid="cyber-role-select"
        value={role}
        onChange={handleChange}
      >
        {ALL_CYBER_ROLES.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The sidebar's member switcher, offered to member roles: which member
 * organisation the demo is acting for. Choosing one rewrites `memberId` in the
 * URL and re-scopes the facility to that member.
 */
export function MemberSwitcher() {
  const { scope } = useCyberScope();
  const memberId = scopeMemberId(scope);

  if (memberId === undefined) return null;

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    selectMember(event.target.value);
  }

  return (
    <label className="shell-header__facility" data-testid="cyber-member-switcher">
      <span className="shell-header__label">Member</span>
      <select
        aria-label="Member"
        data-testid="cyber-member-select"
        value={memberId}
        onChange={handleChange}
      >
        {getMembers().map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The "Cybersecurity" section of the existing left sidebar, filtered by role,
 * with the role and member the whole shell is scoped by above it.
 */
export function CyberSidebar() {
  const { role } = useCyberScope();
  const items = sidebarItemsForRole(role);

  return (
    <nav className="sidebar__section" aria-labelledby="cyber-sidebar-heading">
      <h2 className="sidebar__heading" id="cyber-sidebar-heading" data-testid="cyber-sidebar-heading">
        Cybersecurity
      </h2>
      <RoleSwitcher />
      {isMemberRole(role) ? <MemberSwitcher /> : null}
      <ul className="sidebar__items" data-testid="cyber-sidebar" data-role={role}>
        {items.map((item) => (
          <li key={item.path} className="sidebar__item">
            <CyberLink
              to={item.path}
              className="sidebar__link"
              data-testid={`cyber-sidebar-item-${item.label.toLowerCase().replace(/\s+/gu, '-')}`}
            >
              {item.label}
            </CyberLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default CyberSidebar;
