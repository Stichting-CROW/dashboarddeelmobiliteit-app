import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { StateType } from '../../types/StateType';
import { UserType } from '../../types/UserType';

// API methods
import { getMunicipalityList } from '../../api/municipalities';
import { getDataAccessGrantedToUser } from '../../api/dataAccess';

// Components
import FormLabel from '../FormLabel/FormLabel';
import H4Title from '../H4Title/H4Title';

type SelectableList = string[];

interface DataOwnerOrganisation {
  organisation_id: number;
  name: string;
}

// Simple in-memory cache so re-opening the same user (e.g. while browsing the
// user list) does not refetch the received data access. Lives for the lifetime
// of the page; keyed by user email.
const sharedDataCache = new Map<string, any[]>();

const ORG_TYPE_EXPLANATION = (typeOfOrganisation: string): string => {
  switch (typeOfOrganisation) {
    case 'MUNICIPALITY':
    case 'OTHER_GOVERNMENT':
      return 'Deze gebruiker ziet de data van alle aanbieders binnen de hieronder genoemde gemeente(n).';
    case 'OPERATOR':
      return 'Deze gebruiker ziet de eigen aanbiederdata (in heel Nederland).';
    case 'ADMIN':
      return 'Deze gebruiker is onderdeel van een admin-organisatie en ziet alle data.';
    default:
      return 'Deze gebruiker ziet de data die aan de organisatie is toegekend.';
  }
};

const UserDataAccess = ({
  user,
  organisations: organisationsProp = []
}: {
  user?: UserType
  organisations?: any[]
}) => {
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token) || null);
  const aanbieders = useSelector((state: StateType) => (state.metadata && (state.metadata as any).aanbieders) ? (state.metadata as any).aanbieders : []);

  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [isMunicipalitiesLoading, setIsMunicipalitiesLoading] = useState(true);

  const organisations = organisationsProp;
  const isOrganisationLoading = !organisations || organisations.length === 0;

  const cachedForUser = (user && user.user_id) ? sharedDataCache.get(user.user_id) : undefined;

  const [sharedData, setSharedData] = useState<any[]>(cachedForUser || []);
  const [isSharedDataLoaded, setIsSharedDataLoaded] = useState(Boolean(cachedForUser));
  const [sharedDataError, setSharedDataError] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    (async () => {
      const muns = await getMunicipalityList(token);
      if (!isMounted) return;
      setMunicipalities(Array.isArray(muns) ? muns : []);
      setIsMunicipalitiesLoading(false);
    })();
    return () => { isMounted = false; };
  }, [token]);

  const getMunicipalityName = useCallback((gmCode: string): string => {
    const found = municipalities.find((x: any) => x.municipality === gmCode || x.gm_code === gmCode);
    return found ? found.name : gmCode;
  }, [municipalities]);

  const getOperatorName = useCallback((systemId: string): string => {
    const found = aanbieders.find((x: any) => x.system_id === systemId);
    return found ? found.name : systemId;
  }, [aanbieders]);

  const getOrganisation = useCallback((organisationId: number): any => {
    return organisations.find((x: any) => x.organisation_id === organisationId);
  }, [organisations]);

  const municipalityNames = (list: SelectableList): string[] => {
    if (!list || !list.length) return [];
    return list.filter(Boolean).map(getMunicipalityName);
  };

  const operatorNames = (list: SelectableList): string[] => {
    if (!list || !list.length) return [];
    return list.filter(Boolean).map(getOperatorName);
  };

  const userOrganisation = user ? getOrganisation(user.organisation_id) : null;
  const ownedMunicipalities = userOrganisation ? municipalityNames(userOrganisation.data_owner_of_municipalities) : [];
  const ownedOperators = userOrganisation ? operatorNames(userOrganisation.data_owner_of_operators) : [];

  const getDataOwnerOrganisations = useCallback((): DataOwnerOrganisation[] => {
    return organisations.filter((org: any) => (
      org.type_of_organisation === 'OPERATOR'
      || org.type_of_organisation === 'MUNICIPALITY'
      || org.type_of_organisation === 'OTHER_GOVERNMENT'
      || (org.data_owner_of_operators && org.data_owner_of_operators.length > 0)
      || (org.data_owner_of_municipalities && org.data_owner_of_municipalities.length > 0)
    ));
  }, [organisations]);

  const loadSharedData = useCallback(async () => {
    if (!token || !user || !user.user_id || !organisations || organisations.length === 0) return;
    setSharedDataError('');
    try {
      const dataOwnerOrganisations = getDataOwnerOrganisations();
      const result = await getDataAccessGrantedToUser(
        token,
        user.user_id,
        user.organisation_id,
        dataOwnerOrganisations
      );
      sharedDataCache.set(user.user_id, result);
      setSharedData(result);
      setIsSharedDataLoaded(true);
    } catch (err: any) {
      if (err && err.status === 404) {
        setSharedDataError('Deze gebruiker kon niet gevonden worden in de rechten-database.');
      } else {
        setSharedDataError('De gedeelde data kon niet geladen worden. Mogelijk ondersteunt de API dit nog niet.');
      }
    }
  }, [token, user, organisations, getDataOwnerOrganisations]);

  // Auto-load shared data once organisations are available.
  useEffect(() => {
    if (!token || !user || !user.user_id) return;
    if (!organisations || organisations.length === 0) return;
    loadSharedData();
  }, [token, user, organisations, loadSharedData]);

  const renderChips = (items: string[]) => {
    if (!items || items.length === 0) {
      return <span className="text-sm" style={{ color: '#B2B2B2' }}>Geen</span>;
    }
    return (
      <div className="flex flex-wrap" style={{ gap: '0.25rem' }}>
        {items.map((label) => (
          <span
            key={label}
            className="text-sm inline-block px-2 py-1 rounded-lg"
            style={{ backgroundColor: '#F2F2F2' }}
          >
            {label}
          </span>
        ))}
      </div>
    );
  };

  // Skeleton placeholders sized like the final content, so the layout doesn't
  // jump when loading finishes.
  const renderSkeletonLine = (width: string) => (
    <div
      className="animate-pulse rounded"
      style={{ backgroundColor: '#F2F2F2', height: '1.25rem', width }}
    />
  );

  const renderSkeletonChip = (width: string) => (
    <div
      className="animate-pulse rounded-lg"
      style={{ backgroundColor: '#F2F2F2', height: '1.75rem', width }}
    />
  );

  if (!user || !user.user_id) return null;

  const organisationName = userOrganisation ? userOrganisation.name : user.organisation_name;
  const isOperatorOrg = userOrganisation && userOrganisation.type_of_organisation === 'OPERATOR';
  const isMunicipalityOrg = userOrganisation && (
    userOrganisation.type_of_organisation === 'MUNICIPALITY'
    || userOrganisation.type_of_organisation === 'OTHER_GOVERNMENT'
  );
  const isBaseDataLoading = isOrganisationLoading || isMunicipalitiesLoading;
  const dataScopeLabel = isOperatorOrg ? 'Aanbieders' : 'Gemeenten';
  const dataScopeItems = isOperatorOrg ? ownedOperators : ownedMunicipalities;
  const showDataScope = isBaseDataLoading || isOperatorOrg || isMunicipalityOrg;

  return (
    <div className="UserDataAccess mt-6" style={{ borderTop: '1px solid #E5E5E5', paddingTop: '1rem' }}>
      <H4Title>Toegang tot data</H4Title>

      <div className="mt-2">
        <FormLabel classes="font-bold">
          Via organisatie{organisationName ? ` ${organisationName}` : ''}
        </FormLabel>

        <p
          className="text-sm my-2"
          style={{ color: '#4B4B4B', minHeight: '2.5rem' }}
        >
          {isBaseDataLoading
            ? <span className="inline-block w-full">{renderSkeletonLine('80%')}</span>
            : (userOrganisation
              ? ORG_TYPE_EXPLANATION(userOrganisation.type_of_organisation)
              : 'De organisatie van deze gebruiker kon niet geladen worden.')}
        </p>

        {showDataScope && (
          <div className="my-2">
            <div style={{ minHeight: '1.25rem' }}>
              {isBaseDataLoading
                ? renderSkeletonLine('6rem')
                : <FormLabel classes="text-sm">{dataScopeLabel}</FormLabel>}
            </div>
            <div className="mt-1" style={{ minHeight: '1.75rem' }}>
              {isBaseDataLoading
                ? renderSkeletonChip('5rem')
                : renderChips(dataScopeItems)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <FormLabel classes="font-bold">
          Gedeelde data
        </FormLabel>
        <p className="text-sm my-2" style={{ color: '#4B4B4B' }}>
          Data die andere organisaties via <a className="underline" href="/admin/shared" onClick={(e) => { e.preventDefault(); console.log('/admin/shared'); }}>Data delen</a> met deze gebruiker of diens organisatie hebben gedeeld.
        </p>

        <div className="my-2" style={{ minHeight: '1.25rem' }}>
          {!isSharedDataLoaded && !sharedDataError && renderSkeletonLine('60%')}

          {sharedDataError && (
            <p className="text-sm" style={{ color: '#B00020' }}>{sharedDataError}</p>
          )}

          {isSharedDataLoaded && !sharedDataError && sharedData.length === 0 && (
            <p className="text-sm" style={{ color: '#B2B2B2' }}>
              Er is geen extra data met deze gebruiker gedeeld.
            </p>
          )}
        </div>

        {isSharedDataLoaded && !sharedDataError && sharedData.length > 0 && (
          <div className="mt-2">
            {sharedData.map((entry: any) => {
              const ownerOrg = getOrganisation(entry.owner_organisation_id);
              const sharedWithWholeOrg = Boolean(entry.granted_organisation_id);
              const munNames = ownerOrg ? municipalityNames(ownerOrg.data_owner_of_municipalities) : [];
              const opNames = ownerOrg ? operatorNames(ownerOrg.data_owner_of_operators) : [];
              return (
                <div
                  key={entry.grant_view_data_id}
                  className="my-2 p-3 rounded-lg"
                  style={{ border: '1px solid #E5E5E5' }}
                >
                  <div className="text-sm font-bold">
                    {entry.owner_organisation_name || (ownerOrg ? ownerOrg.name : `Organisatie ${entry.owner_organisation_id}`)}
                  </div>
                  <div className="text-sm" style={{ color: '#4B4B4B' }}>
                    {sharedWithWholeOrg
                      ? 'Gedeeld met de hele organisatie van deze gebruiker.'
                      : 'Rechtstreeks met deze gebruiker gedeeld.'}
                  </div>
                  {munNames.length > 0 && (
                    <div className="mt-2">
                      <FormLabel classes="text-sm">Gemeenten</FormLabel>
                      <div className="mt-1">{renderChips(munNames)}</div>
                    </div>
                  )}
                  {opNames.length > 0 && (
                    <div className="mt-2">
                      <FormLabel classes="text-sm">Aanbieders</FormLabel>
                      <div className="mt-1">{renderChips(opNames)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDataAccess;
