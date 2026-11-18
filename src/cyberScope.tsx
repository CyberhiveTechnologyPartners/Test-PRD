import {
  CyberScopeProvider as ScopeProvider,
  currentCyberQuery,
  getCyberScope,
  getCyberScopeShellState,
  scopeFromQuery,
  scopeToQuery,
  setCyberScope,
  setCyberScopeSearch,
  useCyberScope,
} from './CyberScopeContext';
import {
  DEFAULT_CYBER_SCOPE,
  DEFAULT_MEMBER_ID,
  getDefaultFacilityId,
  getFacilityById,
  isMemberRole,
  normaliseRole,
} from './cyberData';
import type { CyberRole, CyberRoleName, CyberScope } from './cyberData';

export type { CyberRole, CyberRoleName, CyberScope };

/**
 * The shell's view of the demo scope.
 *
 * The scope itself — role, facility and member — lives in
 * `CyberScopeContext.tsx`, in the URL query string. This module is the shell's
 * own door onto it: the role and facility pair the header, the sidebar and the
 * /cyber screens were written against, and the setters they call, all reading
 * and writing that one store so no two of them can disagree.
 */
export type CyberScopeState = {
  role: CyberRole;
  facilityId?: string;
};

export type { CyberScopeValue } from './CyberScopeContext';

/** The scope a fresh load starts in: the Program Lead, no facility. */
export const INITIAL_CYBER_SCOPE: CyberScopeState = { role: 'program-lead', facilityId: undefined };

/**
 * The facility a role should hold after a switch.
 *
 * Switching between a HealthPRO role and a member role resets the facility:
 * a HealthPRO role is not scoped to one, and a member role must land on a
 * facility of its own member rather than keep whatever was selected before.
 */
export function facilityAfterRoleChange(
  nextRole: CyberRole,
  currentFacilityId?: string,
): string | undefined {
  if (!isMemberRole(nextRole)) return undefined;

  const memberId = getFacilityById(currentFacilityId)?.memberId;
  if (memberId === undefined) return getDefaultFacilityId(DEFAULT_MEMBER_ID);
  return currentFacilityId;
}

/**
 * The role and facility a link asks for: `?role=member-it&facility=fac-002`.
 *
 * The whole scope a link may carry — the member included — is
 * `scopeFromQuery`; this is the pair the shell shipped with, kept so the
 * header and its specs read the same shape they always did.
 */
export function scopeFromSearch(search: string): CyberScopeState {
  const scope = scopeFromQuery(search);
  return { role: scope.role, facilityId: scope.facilityId ?? undefined };
}

/** The current role and facility, outside React. */
export function getCyberScopeState(): CyberScopeState {
  return getCyberScopeShellState();
}

/** Select a role. Resets the facility and member when the role cannot see them. */
export function setCyberRole(role: CyberRole): void {
  setCyberScope({ role: normaliseRole(role) ?? DEFAULT_CYBER_SCOPE.role });
}

/** Choose a facility. This is what the header's facility selector calls. */
export function setCyberFacility(id: string): void {
  setCyberScope({ facilityId: id });
}

/** Put the scope back to a fresh load. Used by tests between cases. */
export function resetCyberScope(): void {
  setCyberScope({ ...DEFAULT_CYBER_SCOPE });
}

export {
  currentCyberQuery,
  getCyberScope,
  scopeFromQuery,
  scopeToQuery,
  setCyberScope,
  setCyberScopeSearch,
  useCyberScope,
};

export type { CyberScopeProviderProps } from './CyberScopeContext';

/**
 * Makes the scope available to the tree. Mounted once, around the whole app
 * shell, so the header, the sidebar and the screens cannot disagree.
 */
export const CyberScopeProvider = ScopeProvider;

export default CyberScopeProvider;
