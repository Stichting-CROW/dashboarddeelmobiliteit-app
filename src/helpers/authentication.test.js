import { isOperatorAccount, isOperatorUser } from './authentication';

describe('isOperatorAccount', () => {
  it('returns true for OPERATOR organisation type', () => {
    expect(isOperatorAccount({ organisation_type: 'OPERATOR' })).toBe(true);
    expect(isOperatorAccount({ type_of_organisation: 'OPERATOR' })).toBe(true);
  });

  it('returns false for a municipality account scoped to a single operator', () => {
    const acl = {
      organisation_type: 'MUNICIPALITY',
      operators: [{ system_id: 'check', name: 'Check' }],
    };
    expect(isOperatorAccount(acl)).toBe(false);
  });

  it('falls back to the single-operator heuristic when organisation type is unknown', () => {
    const acl = { operators: [{ system_id: 'check', name: 'Check' }] };
    expect(isOperatorAccount(acl)).toBe(true);
  });

  it('does not apply the heuristic to admins or multi-operator ACLs', () => {
    expect(isOperatorAccount({ operators: [{ system_id: 'check' }], is_admin: true })).toBe(false);
    expect(isOperatorAccount({ operators: [{ system_id: 'check' }, { system_id: 'felyx' }] })).toBe(false);
    expect(isOperatorAccount(null)).toBe(false);
  });
});

describe('isOperatorUser', () => {
  it('returns true for OPERATOR organisation type', () => {
    expect(isOperatorUser({ organisation_type: 'OPERATOR' }, [])).toBe(true);
  });

  it('returns false for a municipality account even with a single operator in scope', () => {
    const acl = {
      organisation_type: 'MUNICIPALITY',
      operators: [{ system_id: 'check', name: 'Check' }],
    };
    expect(isOperatorUser(acl, [{ system_id: 'check', name: 'Check' }])).toBe(false);
  });

  it('falls back to the aclOperators heuristic when organisation type is unknown', () => {
    expect(isOperatorUser({}, [{ system_id: 'check', name: 'Check' }])).toBe(true);
    expect(isOperatorUser({}, [{ system_id: 'check' }, { system_id: 'felyx' }])).toBe(false);
  });
});
