export const getFetchOptions = (token?) => {
    if(token) {
      return {
        headers: {
          // "authorization": `Bearer ${token}`,
          "authorization": `Bearer ${process.env.REACT_APP_MDS_TEST_TOKEN}`,
          "Content-Type": "application/json",
          "charset": "utf-8"
        }
      }
    }
    return {
      headers: {
        "Content-Type": "application/json",
        "charset": "utf-8"
      }
    }
}

export const readable_geotype = (name: string) => {
  if(name === 'stop') return 'Hub';
  if(name === 'no_parking') return 'Verbodsgebied';
  if(name === 'monitoring') return 'Analysegebied';
  return '';
}

export const readable_phase = (name: string) => {
  if(name === 'concept') return 'Concept';
  else if(name === 'active') return 'Actief';
  else if(name === 'retirement_concept') return 'Concept';
  else if(name === 'committed_concept') return 'Voorgesteld concept';
  else if(name === 'retirement_committed_concept') return 'Voorgesteld concept';
  else if(name === 'published') return 'Definitief gepland';
  else if(name === 'active') return 'Definitief Actief';
  return name;
}
