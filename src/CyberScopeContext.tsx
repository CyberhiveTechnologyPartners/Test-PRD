import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import {
  DEFAULT_CYBER_SCOPE,
  DEFAULT_MEMBER_ID,
  cyberFacilityById,
  cyberRoles,
  defaultCyberFacilityId,
  facilitiesForRole,
  getDefaultFacilityId,
  getFacilityById,
  getMemberById,
  isMemberRole,
  normaliseRole,
} from './cyberData';
import type { CyberRole, CyberScope } from './cyberData';

export type { CyberRole, CyberScope };

/**
 * Who is looking at the cyber screens, at which facility, and for which
 * member — held in the URL query string rather than in component state.
 *
 * The query string is the source of truth. It is parsed on load and on every
 * history change, validated against the bundled fixtures, and written back by
 * the setters, so:
 *
 * - any screen can be deep-linked in a role and a member's context
 *   (`/cyber/member/findings?role=MemberSecLead&memberId=mem-riverbend`);
 * - the header, the sidebar and every screen read one value, so switching the
 *   role, the member or the facility re-scopes all of them at once and no
 *   screen can keep a slice of the previous context;
 * - back and forward move the scope with the page.
 *
 * The store is module-level so a test can drive the same setters the controls
 * call. The provider puts a snapshot of it on the React context; the hooks
 * read it, falling back to the store itself when a screen is rendered outside
 * the provider.
 */

/** The query parameters the scope is carried in. */
export const CYBER_SCOPE_PARAMS = {
  role: 'role',
  facility: 'facility',
  member: 'memberId',
} as const;

/* ------------------------------------------------------------------ *
 * Parsing, validating and writing the query string.
 * ------------------------------------------------------------------ */

/** Whether an id names one of the posture data set's own facilities. */
function isPostureFacility(id: string | null | undefined): boolean {
  return id !== null && id !== undefined && cyberFacilityById(id) !== undefined;
}

/** The member that owns a facility, or `undefined` for anything else. */
function memberOfFacility(id: string | null | undefined): string | undefined {
  return getFacilityById(id ?? undefined)?.memberId;
}

/**
 * The scope a role, a facility and a member add up to.
 *
 * Every value is validated against the bundled fixtures and an unknown one is
 * dropped rather than obeyed, so neither a hand-edited link nor a stale
 * history entry can put the shell in a scope its own controls could not reach:
 *
 * - a role that is not a demo role falls back to the default scope's role;
 * - a HealthPRO role is scoped to no member, and keeps only a posture facility;
 * - a member role is always on a member — the one named, else the owner of the
 *   facility named, else the demo member login;
 * - a facility of another member is dropped, and the member's own first
 *   facility is used instead;
 * - when a patch names both a member and a facility, the member wins and a
 *   facility that is not the member's is dropped.
 */
export function resolveCyberScope(
  patch: Partial<CyberScope>,
  previous: CyberScope = DEFAULT_CYBER_SCOPE,
): CyberScope {
  const role = normaliseRole(patch.role ?? previous.role) ?? DEFAULT_CYBER_SCOPE.role;
  const namesFacility = patch.facilityId !== undefined;
  const namesMember = patch.memberId !== undefined;
  const facilityCandidate = namesFacility ? patch.facilityId : previous.facilityId;
  const memberCandidate = namesMember ? patch.memberId : previous.memberId;

  // A HealthPRO role acts for no member. It keeps a posture facility — that is
  // the posture screens' own scope — and nothing else.
  if (!isMemberRole(role)) {
    return {
      role,
      facilityId: isPostureFacility(facilityCandidate) ? (facilityCandidate as string) : null,
      memberId: null,
    };
  }

  const named =
    memberCandidate !== null && memberCandidate !== undefined && getMemberById(memberCandidate)
      ? memberCandidate
      : undefined;

  // The member: the one named, else the owner of the facility named, else the
  // member the demo signs a member role in as.
  const memberId =
    namesMember && named !== undefined
      ? named
      : namesFacility && memberOfFacility(facilityCandidate) !== undefined
        ? (memberOfFacility(facilityCandidate) as string)
        : (named ?? memberOfFacility(facilityCandidate) ?? DEFAULT_MEMBER_ID);

  // The facility: the one named while it belongs to that member, the posture
  // facility the posture screens' own filter just asked for, else the
  // member's first facility — never another member's, and never a posture
  // facility carried over from the role the scope has just left.
  const facilityId =
    namesFacility && isPostureFacility(patch.facilityId)
      ? (patch.facilityId as string)
      : memberOfFacility(facilityCandidate) === memberId
        ? (facilityCandidate as string)
        : (getDefaultFacilityId(memberId) ?? null);

  return { role, facilityId, memberId };
}

/** The scope a query string asks for, validated and completed. */
export function scopeFromQuery(search: string): CyberScope {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const role = params.get(CYBER_SCOPE_PARAMS.role);
  const facility = params.get(CYBER_SCOPE_PARAMS.facility);
  const member = params.get(CYBER_SCOPE_PARAMS.member);

  return resolveCyberScope(
    {
      role: normaliseRole(role) ?? DEFAULT_CYBER_SCOPE.role,
      facilityId: facility,
      memberId: member,
    },
    DEFAULT_CYBER_SCOPE,
  );
}

/** The query string a scope is shareable as, leading `?` included. */
export function scopeToQuery(scope: CyberScope): string {
  const params = new URLSearchParams();
  params.set(CYBER_SCOPE_PARAMS.role, scope.role);
  if (scope.facilityId !== null) params.set(CYBER_SCOPE_PARAMS.facility, scope.facilityId);
  if (scope.memberId !== null) params.set(CYBER_SCOPE_PARAMS.member, scope.memberId);
  return `?${params.toString()}`;
}

/* ------------------------------------------------------------------ *
 * The store: the URL, and the snapshots React reads from it.
 * ------------------------------------------------------------------ */

/**
 * The query string when there is no browser to ask — how a test deep-links a
 * screen, exactly as `setCurrentPath` stands in for the path.
 */
let standInSearch = '';

/** The query string the scope is currently written in. */
export function currentCyberQuery(): string {
  if (typeof window !== 'undefined') return window.location.search;
  return standInSearch;
}

export type CyberScopeContextState = { role: CyberRole; facilityId: string };
export type CyberScopeShellState = { role: CyberRole; facilityId?: string };

let scope: CyberScope = scopeFromQuery(currentCyberQuery());

/** The posture screens' view of the scope: always one posture facility. */
function derivePostureState(current: CyberScope): CyberScopeContextState {
  return {
    role: current.role,
    facilityId: isPostureFacility(current.facilityId)
      ? (current.facilityId as string)
      : defaultCyberFacilityId(),
  };
}

/** The shell's view of the scope: the role and the selected facility. */
function deriveShellState(current: CyberScope): CyberScopeShellState {
  return { role: current.role, facilityId: current.facilityId ?? undefined };
}

let postureSnapshot = derivePostureState(scope);
let shellSnapshot = deriveShellState(scope);

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Subscribe to scope changes outside React. */
export const subscribeCyberScope = subscribe;

function sameScope(left: CyberScope, right: CyberScope): boolean {
  return (
    left.role === right.role &&
    left.facilityId === right.facilityId &&
    left.memberId === right.memberId
  );
}

function commit(next: CyberScope): void {
  if (sameScope(next, scope)) return;
  scope = next;
  postureSnapshot = derivePostureState(scope);
  shellSnapshot = deriveShellState(scope);
  emit();
}

/** Write the scope into the URL: the one place the scope is held. */
function writeQuery(next: CyberScope, mode: 'replace' | 'push'): void {
  const query = scopeToQuery(next);

  if (typeof window === 'undefined') {
    standInSearch = query;
    return;
  }

  const url = `${window.location.pathname}${query}${window.location.hash}`;
  if (mode === 'push') window.history.pushState({}, '', url);
  else window.history.replaceState({}, '', url);
}

/** The current scope, outside React. */
export function getCyberScope(): CyberScope {
  return scope;
}

/**
 * Move the scope: the URL is rewritten and every screen re-reads it. This is
 * what the role switcher, the member switcher and the facility selector call.
 */
export function setCyberScope(
  patch: Partial<CyberScope>,
  mode: 'replace' | 'push' = 'replace',
): void {
  const next = resolveCyberScope(patch, scope);
  writeQuery(next, mode);
  commit(next);
}

/**
 * Read the scope back out of the URL: on load, on a history move, and — with
 * no browser to ask — when a test deep-links a screen.
 */
export function readCyberScopeFromUrl(search?: string): CyberScope {
  if (search !== undefined && typeof window === 'undefined') standInSearch = search;
  const next = scopeFromQuery(search ?? currentCyberQuery());
  commit(next);
  return next;
}

/**
 * Put the shell on a deep link without a browser — how a test renders a
 * screen at a query string, and the only way the query moves when `window`
 * is absent. `null` clears it back to no query at all.
 */
export function setCyberScopeSearch(search: string | null): void {
  standInSearch = search ?? '';
  commit(scopeFromQuery(typeof window === 'undefined' ? standInSearch : currentCyberQuery()));
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    commit(scopeFromQuery(window.location.search));
  });
}

/* ------------------------------------------------------------------ *
 * The compatibility surface the shell shipped with.
 * ------------------------------------------------------------------ */

/** The role a fresh load starts in: the first role the fixture declares. */
export const INITIAL_CYBER_ROLE: string = cyberRoles()[0]?.id ?? 'program-lead';

/** The scope the posture screens start in. */
export const INITIAL_CYBER_SCOPE: CyberScopeContextState = {
  role: (normaliseRole(INITIAL_CYBER_ROLE) ?? 'program-lead') as CyberRole,
  facilityId: defaultCyberFacilityId(),
};

/**
 * The facility a role should hold after a switch: the one already chosen when
 * the new role may see it, and otherwise the first facility it may see. A role
 * can never be left scoped to a facility its own controls could not reach.
 */
export function facilityForRole(role: string, currentFacilityId?: string): string {
  const allowed = facilitiesForRole(role);
  if (currentFacilityId !== undefined && allowed.some((f) => f.id === currentFacilityId)) {
    return currentFacilityId;
  }
  return allowed[0]?.id ?? defaultCyberFacilityId();
}

/** The posture screens' view of the scope, outside React. */
export function getCyberScopeContextState(): CyberScopeContextState {
  return postureSnapshot;
}

/** The shell's view of the scope, outside React. */
export function getCyberScopeShellState(): CyberScopeShellState {
  return shellSnapshot;
}

/** Select a role. Re-scopes the facility and the member to one it may see. */
export function setCyberScopeRole(role: string): void {
  setCyberScope({ role: normaliseRole(role) ?? DEFAULT_CYBER_SCOPE.role });
}

/** Choose a facility. This is what the findings screen's selector calls. */
export function setCyberScopeFacility(id: string): void {
  setCyberScope({ facilityId: id });
}

/** Put the posture screens' scope back to a fresh load. Used by tests. */
export function resetCyberScopeContext(): void {
  setCyberScope(
    {
      role: INITIAL_CYBER_SCOPE.role,
      facilityId: INITIAL_CYBER_SCOPE.facilityId,
      memberId: null,
    },
    'replace',
  );
}

/* ------------------------------------------------------------------ *
 * React.
 * ------------------------------------------------------------------ */

const ScopeContext = createContext<CyberScope | null>(null);

export type CyberScopeProviderProps = { children: ReactNode };

/**
 * Makes the cyber scope available to the tree. Mounted once, around the cyber
 * route group, so the screens and their controls cannot disagree.
 *
 * On mount it re-reads the URL, so a cold load of a deep link renders in the
 * scope the link asked for even when the store was built before it.
 */
export function CyberScopeProvider({ children }: CyberScopeProviderProps) {
  const snapshot = useSyncExternalStore(subscribe, getCyberScope, getCyberScope);

  useEffect(() => {
    readCyberScopeFromUrl();
  }, []);

  return <ScopeContext.Provider value={snapshot}>{children}</ScopeContext.Provider>;
}

export type CyberScopeValue = {
  /** The whole scope: role, facility and member. */
  scope: CyberScope;
  /** Move any part of the scope. The URL is rewritten and every screen follows. */
  setScope(patch: Partial<CyberScope>): void;
  role: CyberRole;
  facilityId?: string;
  memberId?: string;
  setRole(role: CyberRole): void;
  setFacility(id: string): void;
  setMember(id: string): void;
};

/** The active scope, with the setters the controls use. */
export function useCyberScope(): CyberScopeValue {
  const fromContext = useContext(ScopeContext);
  const fallback = useSyncExternalStore(subscribe, getCyberScope, getCyberScope);
  const current = fromContext ?? fallback;

  return {
    scope: current,
    setScope: (patch) => setCyberScope(patch),
    role: current.role,
    facilityId: current.facilityId ?? undefined,
    memberId: current.memberId ?? undefined,
    setRole: (role) => setCyberScope({ role }),
    setFacility: (id) => setCyberScope({ facilityId: id }),
    setMember: (id) => setCyberScope({ memberId: id }),
  };
}

export type CyberScopeContextValue = CyberScopeContextState & {
  setRole(role: string): void;
  setFacility(id: string): void;
};

/** The posture screens' view of the scope, with the two setters they use. */
export function useCyberScopeContext(): CyberScopeContextValue {
  const fromContext = useContext(ScopeContext);
  const fallback = useSyncExternalStore(subscribe, getCyberScope, getCyberScope);
  const current = derivePostureState(fromContext ?? fallback);

  return {
    role: current.role,
    facilityId: current.facilityId,
    setRole: setCyberScopeRole,
    setFacility: setCyberScopeFacility,
  };
}

export default CyberScopeProvider;
