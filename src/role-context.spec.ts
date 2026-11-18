/**
 * Deep-linkable role and member context via the URL query string.
 *
 * The demo scope — role, facility and member — is held in the query string
 * rather than in component state, so any screen can be opened directly in the
 * context a demo needs, and switching any part of it re-scopes every screen at
 * once.
 *
 * The suite runs in the `node` environment, so a screen is exercised the way
 * the rest of this repository exercises one: render the app shell to static
 * markup at a deep link and read the markup back. `renderAtQuery` is that
 * entry point — it puts the shell on a path and a query string and mounts the
 * cyber route group inside the shell, exactly as a cold load of that URL does.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { setCurrentPath } from './CyberRoutes';
import { selectMember, selectRole, sidebarItemsForRole } from './CyberSidebar';
import { selectFacility } from './FacilitySelector';
import {
  getFacilities,
  getFacilityById,
  getMemberById,
  getMembers,
  selectForScope,
  selectReportsForScope,
} from './cyberData';
import type { CyberScope } from './cyberData';
import {
  currentCyberQuery,
  getCyberScope,
  resetCyberScope,
  setCyberScopeSearch,
} from './cyberScope';

/* ------------------------------------------------------------------ *
 * Helpers.
 * ------------------------------------------------------------------ */

/** What a render gives a test back: the markup, and the scope it rendered in. */
export type RenderResult = {
  /** The path the shell was put on. */
  path: string;
  /** The query string the scope is written in, after the render. */
  query: string;
  /** The scope the shell rendered in. */
  scope: CyberScope;
  /** The whole document markup. */
  markup: string;
  /**
   * The content container's markup: the screen, without the chrome. The
   * header's and the sidebar's switchers list every role, member and facility
   * the demo can move to, so what is or is not on screen is read from here.
   */
  content: string;
  /** Whether an element with this `data-testid` was rendered. */
  has(testId: string): boolean;
  /** The markup of the element with this `data-testid`. */
  element(testId: string): string;
  /** The visible text of the element with this `data-testid`. */
  text(testId: string): string;
  /** The ids of the rows of a kind: `finding-row-fnd-001` → `fnd-001`. */
  rowIds(prefix: string): string[];
  /** Whether the markup carries a given element id anywhere. */
  carries(testId: string): boolean;
};

/** The content container's inner markup: the screen, without the chrome. */
function mainOf(markup: string): string {
  const open = markup.indexOf('<main class="app-shell__main"');
  expect(open, 'no app-shell__main content container').toBeGreaterThan(-1);
  return markup.slice(markup.indexOf('>', open) + 1, markup.lastIndexOf('</main>'));
}

function elementByTestId(markup: string, testId: string): string {
  const start = markup.indexOf(`data-testid="${testId}"`);
  expect(start, `no element with data-testid="${testId}"`).toBeGreaterThan(-1);

  const tagStart = markup.lastIndexOf('<', start);
  const tagName = /^<([a-zA-Z0-9]+)/.exec(markup.slice(tagStart))?.[1] as string;

  let cursor = markup.indexOf('>', start) + 1;
  let depth = 1;
  const opening = new RegExp(`<${tagName}[\\s>]`, 'g');
  const closing = `</${tagName}>`;

  while (depth > 0) {
    opening.lastIndex = cursor;
    const next = opening.exec(markup);
    const close = markup.indexOf(closing, cursor);
    expect(close, `unterminated <${tagName}> for data-testid="${testId}"`).toBeGreaterThan(-1);
    if (next && next.index < close) {
      depth += 1;
      cursor = next.index + 1;
    } else {
      depth -= 1;
      cursor = close + closing.length;
    }
  }

  return markup.slice(tagStart, cursor);
}

function textOf(markup: string): string {
  return markup
    .replace(/<[^>]*>/gu, ' ')
    .replace(/&#x27;/gu, "'")
    .replace(/&quot;/gu, '"')
    .replace(/&amp;/gu, '&')
    .replace(/&#x2014;/gu, '—')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** The path and the query string of a deep link, either part optional. */
function splitLink(link: string): { path: string; search: string } {
  const index = link.indexOf('?');
  if (index === -1) return { path: link === '' ? '/cyber' : link, search: '' };
  const path = link.slice(0, index);
  return { path: path === '' ? '/cyber' : path, search: link.slice(index) };
}

/** The result of a render: the markup, and the scope it rendered in. */
function resultOf(path: string): RenderResult {
  const markup = renderToStaticMarkup(createElement(App));
  const content = mainOf(markup);

  return {
    path,
    query: currentCyberQuery(),
    scope: getCyberScope(),
    markup,
    content,
    has: (testId) => markup.includes(`data-testid="${testId}"`),
    element: (testId) => elementByTestId(markup, testId),
    text: (testId) => textOf(elementByTestId(markup, testId)),
    rowIds: (prefix) =>
      [...content.matchAll(new RegExp(`data-testid="${prefix}-([^"]+)"`, 'gu'))].map(
        (match) => match[1] as string,
      ),
    carries: (testId) => content.includes(`data-testid="${testId}"`),
  };
}

/**
 * Mount the cyber route group, inside the app shell, at a deep link.
 *
 * `renderAtQuery('/cyber/member/findings?role=MemberSecLead&memberId=mem-riverbend')`
 * is the cold load of that URL: the query string is read as the scope, and
 * every part of the shell renders from it.
 */
export function renderAtQuery(query: string): RenderResult {
  const { path, search } = splitLink(query);
  setCurrentPath(path);
  setCyberScopeSearch(search);
  return resultOf(path);
}

/** Render the shell again at a path, in the scope it is in now. */
function rerender(path: string): RenderResult {
  setCurrentPath(path);
  return resultOf(path);
}

/** Every screen a reviewer can reach in the current scope, by path. */
function visibleScreens(scope: CyberScope): string[] {
  return [
    ...sidebarItemsForRole(scope.role).map((item) => item.path),
    '/cyber/members',
    '/cyber/portfolio',
    '/cyber-poc/overview',
    '/cyber-poc/findings',
  ];
}

/** Everything one scope shows, as the row test ids the screens render. */
function rowTestIds(scope: CyberScope): string[] {
  const { findings, incidents, members } = selectForScope(scope);
  return [
    ...findings.map((row) => `finding-row-${row.id}`),
    ...incidents.map((row) => `incident-row-${row.id}`),
    ...selectReportsForScope(scope).map((row) => `report-row-${row.id}`),
    ...members.map((row) => `member-row-${row.id}`),
  ];
}

const LAKESHORE = 'mem-lakeshore';
const RIVERBEND = 'mem-riverbend';
const MAPLE_GROVE = 'mem-maple-grove';

beforeEach(() => {
  resetCyberScope();
});

afterEach(() => {
  resetCyberScope();
  setCyberScopeSearch(null);
  setCurrentPath(null);
});

describe('deep linking', () => {
  it('loads correct role and member from URL query', () => {
    /* -------------------------------------------------------------- *
     * 1. A link carrying a role and a memberId renders in that role
     *    and that member's context, on a cold load, with no click.
     * -------------------------------------------------------------- */
    const riverbendFacility = getFacilities(RIVERBEND)[1] as { id: string; name: string; site: string };
    const deepLink = `/cyber/member/findings?role=MemberSecLead&memberId=${RIVERBEND}&facility=${riverbendFacility.id}`;
    const view = renderAtQuery(deepLink);

    expect(view.scope).toEqual({
      role: 'member-sec-lead',
      facilityId: riverbendFacility.id,
      memberId: RIVERBEND,
    });

    // The shell is in that role: its own marker, its own sidebar items.
    expect(view.element('app-shell')).toContain('data-role="member-sec-lead"');
    expect(view.text('cyber-sidebar')).toBe(
      sidebarItemsForRole('member-sec-lead')
        .map((item) => item.label)
        .join(' '),
    );
    expect(view.has('cyber-sidebar-item-findings')).toBe(true);
    expect(view.has('cyber-sidebar-item-portfolio')).toBe(false);
    // The role switchers hold the deep-linked role rather than a default.
    expect(view.element('cyber-role-switcher')).toContain('value="member-sec-lead" selected=""');
    expect(view.element('role-switcher')).toContain('value="member-sec-lead" selected=""');

    // And in that member's context: the member, its facility, its rows.
    const screen = view.element('cyber-member-findings');
    expect(screen).toContain(`data-member="${RIVERBEND}"`);
    expect(screen).toContain(`data-facility="${riverbendFacility.id}"`);
    expect(view.text('cyber-member-findings-member')).toBe(
      getMemberById(RIVERBEND)?.name as string,
    );
    expect(view.text('cyber-member-findings-facility')).toBe(riverbendFacility.site);
    expect(view.element('cyber-member-switcher')).toContain(`value="${RIVERBEND}" selected=""`);
    expect(view.element('facility-selector')).toContain(
      `value="${riverbendFacility.id}" selected=""`,
    );

    const expected = selectForScope(view.scope).findings.map((finding) => finding.id);
    expect(expected.length, 'the deep link shows nothing at all').toBeGreaterThan(0);
    expect(view.rowIds('finding-row')).toEqual(expected);
    // Nothing of any other member is on the screen.
    for (const member of getMembers()) {
      if (member.id === RIVERBEND) continue;
      expect(view.content, `${member.name} leaked into the deep link`).not.toContain(
        member.name,
      );
    }

    /* -------------------------------------------------------------- *
     * 2. The role's id spells the same link as its public name, and
     *    the member's own screens all open in that context.
     * -------------------------------------------------------------- */
    const byId = renderAtQuery(
      `/cyber/member/findings?role=member-sec-lead&memberId=${RIVERBEND}&facility=${riverbendFacility.id}`,
    );
    expect(byId.scope).toEqual(view.scope);
    expect(byId.rowIds('finding-row')).toEqual(expected);

    /* -------------------------------------------------------------- *
     * 3. A link with a role and a member but no facility opens on
     *    that member's first facility, in that role.
     * -------------------------------------------------------------- */
    const ops = renderAtQuery(`/cyber/member/incidents?role=MemberOps&memberId=${MAPLE_GROVE}`);
    expect(ops.scope).toEqual({
      role: 'member-ops',
      facilityId: getFacilities(MAPLE_GROVE)[0]?.id ?? null,
      memberId: MAPLE_GROVE,
    });
    expect(ops.element('cyber-member-incidents')).toContain(`data-member="${MAPLE_GROVE}"`);
    expect(ops.rowIds('incident-row')).toEqual(
      selectForScope(ops.scope).incidents.map((incident) => incident.id),
    );
    expect(ops.text('cyber-member-incidents-member')).toBe(
      getMemberById(MAPLE_GROVE)?.name as string,
    );

    /* -------------------------------------------------------------- *
     * 4. The posture screens are deep-linkable in the same scope.
     * -------------------------------------------------------------- */
    const posture = renderAtQuery(`/cyber-poc/overview?role=MemberOps&memberId=${MAPLE_GROVE}`);
    expect(posture.element('cyber-poc-overview')).toContain('data-role="member-ops"');
    expect(posture.scope.memberId).toBe(MAPLE_GROVE);

    /* -------------------------------------------------------------- *
     * 5. An unknown or missing parameter falls back to the default
     *    scope rather than being obeyed.
     * -------------------------------------------------------------- */
    const unknown = renderAtQuery('/cyber/portfolio?role=auditor&memberId=mem-nowhere');
    expect(unknown.scope).toEqual({ role: 'program-lead', facilityId: null, memberId: null });
    expect(unknown.element('app-shell')).toContain('data-role="program-lead"');
    expect(unknown.has('facility-selector')).toBe(false);
    expect(unknown.rowIds('portfolio-row')).toEqual(getMembers().map((member) => member.id));

    const bare = renderAtQuery('/cyber/portfolio');
    expect(bare.scope).toEqual({ role: 'program-lead', facilityId: null, memberId: null });
    expect(bare.rowIds('portfolio-row')).toEqual(getMembers().map((member) => member.id));

    const roleOnly = renderAtQuery('/cyber/member/reports?role=MemberExec');
    expect(roleOnly.scope).toEqual({
      role: 'member-exec',
      facilityId: getFacilities(LAKESHORE)[0]?.id ?? null,
      memberId: LAKESHORE,
    });

    /* -------------------------------------------------------------- *
     * 6. A facility that is not the named member's is dropped: the
     *    member the link names is the context that is honoured.
     * -------------------------------------------------------------- */
    const mismatched = renderAtQuery(
      `/cyber/member/findings?role=MemberExec&memberId=${RIVERBEND}&facility=${getFacilities(LAKESHORE)[0]?.id as string}`,
    );
    expect(mismatched.scope).toEqual({
      role: 'member-exec',
      facilityId: getFacilities(RIVERBEND)[0]?.id ?? null,
      memberId: RIVERBEND,
    });
    expect(mismatched.content).not.toContain(getMemberById(LAKESHORE)?.name as string);
  });
});

describe('role switching', () => {
  it('clears stale data on role or facility change', () => {
    /* -------------------------------------------------------------- *
     * 1. A screen rendered for one role at one facility.
     * -------------------------------------------------------------- */
    const first = getFacilities(LAKESHORE)[0] as { id: string; name: string; site: string };
    const second = getFacilities(LAKESHORE)[1] as { id: string; name: string; site: string };

    const before = renderAtQuery(
      `/cyber/member/findings?role=member-it&memberId=${LAKESHORE}&facility=${first.id}`,
    );
    const beforeRows = rowTestIds(before.scope);
    expect(before.rowIds('finding-row').length, 'nothing to go stale').toBeGreaterThan(0);
    expect(before.content).toContain(first.name);

    /* -------------------------------------------------------------- *
     * 2. The facility is switched, through the facility selector's own
     *    handler. Every visible screen re-scopes, and nothing of the
     *    previous facility is left anywhere in the document.
     * -------------------------------------------------------------- */
    selectFacility(second.id);

    expect(getCyberScope()).toEqual({
      role: 'member-it',
      facilityId: second.id,
      memberId: LAKESHORE,
    });
    expect(currentCyberQuery()).toBe(
      `?role=member-it&facility=${second.id}&memberId=${LAKESHORE}`,
    );

    const goneWithFacility = beforeRows.filter(
      (testId) => !rowTestIds(getCyberScope()).includes(testId),
    );
    expect(goneWithFacility.length, 'the two facilities show the same rows').toBeGreaterThan(0);

    for (const path of visibleScreens(getCyberScope())) {
      const view = rerender(path);
      for (const testId of goneWithFacility) {
        expect(view.carries(testId), `${path} still shows ${testId} from ${first.name}`).toBe(
          false,
        );
      }
      // A facility-scoped screen must not name the facility it has left.
      // The member directory lists the member's facilities whatever one is
      // selected, so the check is of the screens the facility scopes.
      if (path.startsWith('/cyber/member/')) {
        expect(view.content, `${path} still names ${first.name}`).not.toContain(first.name);
      }
    }

    const afterFacility = rerender('/cyber/member/findings');
    expect(afterFacility.rowIds('finding-row')).toEqual(
      selectForScope(getCyberScope()).findings.map((finding) => finding.id),
    );
    expect(afterFacility.element('cyber-member-findings')).toContain(
      `data-facility="${second.id}"`,
    );
    expect(afterFacility.content).toContain(second.name);

    /* -------------------------------------------------------------- *
     * 3. A facility of another member: the member context follows the
     *    facility, and the previous member's rows and name are gone
     *    from every visible screen — the member panel included.
     * -------------------------------------------------------------- */
    const lakeshoreRows = rowTestIds(getCyberScope());
    const riverbendFacility = getFacilities(RIVERBEND)[0] as { id: string; site: string };
    const lakeshoreName = getMemberById(LAKESHORE)?.name as string;

    selectFacility(riverbendFacility.id);

    expect(getCyberScope()).toEqual({
      role: 'member-it',
      facilityId: riverbendFacility.id,
      memberId: RIVERBEND,
    });
    expect(currentCyberQuery()).toContain(`memberId=${RIVERBEND}`);
    expect(getFacilityById(riverbendFacility.id)?.memberId).toBe(RIVERBEND);

    for (const path of visibleScreens(getCyberScope())) {
      const view = rerender(path);
      for (const testId of lakeshoreRows) {
        expect(view.carries(testId), `${path} still shows ${testId} from ${lakeshoreName}`).toBe(
          false,
        );
      }
      expect(view.content, `${path} still names ${lakeshoreName}`).not.toContain(lakeshoreName);
    }

    const afterMember = rerender('/cyber/member/findings');
    expect(afterMember.element('cyber-member-findings')).toContain(`data-member="${RIVERBEND}"`);
    expect(afterMember.text('cyber-member-findings-member')).toBe(
      getMemberById(RIVERBEND)?.name as string,
    );
    expect(afterMember.rowIds('finding-row')).toEqual(
      selectForScope(getCyberScope()).findings.map((finding) => finding.id),
    );

    /* -------------------------------------------------------------- *
     * 4. The role is switched, through the sidebar switcher's own
     *    handler. The member scope it had is dropped: the URL, the
     *    controls and every screen move together.
     * -------------------------------------------------------------- */
    const memberRows = rowTestIds(getCyberScope());
    const riverbendName = getMemberById(RIVERBEND)?.name as string;

    selectRole('ProgramLead');

    expect(getCyberScope()).toEqual({ role: 'program-lead', facilityId: null, memberId: null });
    expect(currentCyberQuery()).toBe('?role=program-lead');

    const asProgramLead = rerender('/cyber/members');
    expect(asProgramLead.element('app-shell')).toContain('data-role="program-lead"');
    expect(asProgramLead.has('facility-selector'), 'a member facility selector survived').toBe(
      false,
    );
    expect(asProgramLead.has('cyber-member-switcher'), 'a member switcher survived').toBe(false);
    expect(asProgramLead.text('cyber-sidebar')).toBe(
      sidebarItemsForRole('program-lead')
        .map((item) => item.label)
        .join(' '),
    );
    // The member-only screens are no longer offered, and the directory is the
    // whole programme again rather than the one member left over.
    expect(asProgramLead.has('cyber-sidebar-item-findings')).toBe(false);
    expect(asProgramLead.rowIds('member-row')).toEqual(getMembers().map((member) => member.id));

    /* -------------------------------------------------------------- *
     * 5. Back to a member role: the member the demo signs in as, and
     *    none of the previous member's rows, on any visible screen.
     * -------------------------------------------------------------- */
    selectRole('MemberOps');

    expect(getCyberScope()).toEqual({
      role: 'member-ops',
      facilityId: getFacilities(LAKESHORE)[0]?.id ?? null,
      memberId: LAKESHORE,
    });

    for (const path of visibleScreens(getCyberScope())) {
      const view = rerender(path);
      for (const testId of memberRows.filter((id) => id.startsWith('finding-row'))) {
        expect(view.carries(testId), `${path} still shows ${testId} from ${riverbendName}`).toBe(
          false,
        );
      }
      expect(view.element('app-shell')).toContain('data-role="member-ops"');
    }

    /* -------------------------------------------------------------- *
     * 6. And the member switcher moves the same scope: choosing a
     *    member re-scopes the facility with it.
     * -------------------------------------------------------------- */
    selectMember(MAPLE_GROVE);

    expect(getCyberScope()).toEqual({
      role: 'member-ops',
      facilityId: getFacilities(MAPLE_GROVE)[0]?.id ?? null,
      memberId: MAPLE_GROVE,
    });
    expect(currentCyberQuery()).toBe(
      `?role=member-ops&facility=${getFacilities(MAPLE_GROVE)[0]?.id as string}&memberId=${MAPLE_GROVE}`,
    );

    const lakeshoreAgain = rowTestIds({
      role: 'member-ops',
      facilityId: getFacilities(LAKESHORE)[0]?.id ?? null,
      memberId: LAKESHORE,
    }).filter((id) => !rowTestIds(getCyberScope()).includes(id));

    for (const path of visibleScreens(getCyberScope())) {
      const view = rerender(path);
      for (const testId of lakeshoreAgain) {
        expect(view.carries(testId), `${path} still shows ${testId} from ${lakeshoreName}`).toBe(
          false,
        );
      }
      expect(view.content, `${path} still names ${lakeshoreName}`).not.toContain(lakeshoreName);
    }
  });
});
