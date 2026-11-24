import type { ChangeEvent } from 'react';

import { getFacilities, getMembers, scopeMemberId } from './cyberData';
import { setCyberScope, useCyberScope } from './cyberScope';

export type FacilitySelectorProps = {
  /**
   * The member whose facilities the selector opens on. Optional: the scope
   * already names the member, and the selector reads it from there.
   */
  memberId?: string;
};

/**
 * Select a facility: what the facility selector does on change, and the same
 * write `useCyberScope().setScope` makes, exported so a test can drive the
 * control's own path.
 *
 * The facility is written into the URL scope, and the member follows it — a
 * facility of another member re-scopes the whole shell to that member rather
 * than leaving a member selected that does not own what is on screen.
 */
export function selectFacility(value: string): void {
  setCyberScope({ facilityId: value });
}

/**
 * The header's facility selector, shown for member roles only.
 *
 * Choosing a facility writes it into the URL scope, and every member screen
 * reads its rows back out of that scope, so one change here re-scopes all of
 * them at once. The member's own facilities come first; the other members'
 * are grouped under their names, so the demo can move between members here as
 * well as in the sidebar.
 */
export function FacilitySelector({ memberId }: FacilitySelectorProps = {}) {
  const { scope } = useCyberScope();
  const activeMember = memberId ?? scopeMemberId(scope);
  const own = activeMember === undefined ? [] : getFacilities(activeMember);
  const selected = own.some((facility) => facility.id === scope.facilityId)
    ? (scope.facilityId as string)
    : (own[0]?.id ?? '');
  const others = getMembers().filter((member) => member.id !== activeMember);

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    selectFacility(event.target.value);
  }

  return (
    <label className="shell-header__facility" data-testid="facility-selector">
      <span className="shell-header__label">Facility</span>
      <select
        aria-label="Facility"
        data-testid="facility-select"
        value={selected}
        onChange={handleChange}
      >
        {own.map((facility) => (
          <option key={facility.id} value={facility.id}>
            {facility.name}
          </option>
        ))}
        {others.map((member) => (
          <optgroup key={member.id} label={member.name}>
            {getFacilities(member.id).map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export default FacilitySelector;
