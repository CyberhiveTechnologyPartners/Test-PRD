import { IllustrativeFigure } from './IllustrativeFigure';
import { getFacilities, selectForScope } from './cyberData';
import { useCyberScope } from './cyberScope';

/**
 * The member directory: the member organisations the current scope may see,
 * and the facilities each one runs.
 *
 * The rows are selected from the scope on every render — never copied into
 * component state — so a role, member or facility change swaps them outright.
 */
export function CyberMembers() {
  const { scope } = useCyberScope();
  const { members } = selectForScope(scope);

  return (
    <section className="cyber-screen" data-testid="cyber-members">
      <h1>Members</h1>
      <p className="cyber-screen__lede">
        Member organisations in the programme, with the facilities each one runs.
      </p>

      <table className="cyber-table" data-testid="members-table" data-rows={members.length}>
        <caption>Member organisations</caption>
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Type</th>
            <th scope="col">Province</th>
            <th scope="col">Size</th>
            <th scope="col">Tier</th>
            <th scope="col">Facilities</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const facilities = getFacilities(member.id);
            return (
              <tr key={member.id} data-testid={`member-row-${member.id}`}>
                <th scope="row">{member.name}</th>
                <td>{member.type}</td>
                <td>{member.province}</td>
                <td>{member.size}</td>
                <td>{member.tier}</td>
                <td data-testid={`member-facilities-${member.id}`}>
                  <IllustrativeFigure
                    value={facilities.length}
                    description={`${member.name} facilities`}
                  />{' '}
                  <span className="cyber-table__detail">
                    {facilities.map((facility) => facility.name).join(', ')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default CyberMembers;
