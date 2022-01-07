
export const getProviderColor = (providers, providerName) => {
  const found = providers.filter(x => {
    return x.system_id === providerName;
  });
  return found && found[0] ? found[0].color : '#666';
}

export const getUniqueProviderNames = (object) => {
  if(! object) return [];
  return Object.keys(object).filter((key, val) => {
    return key !== 'name' ? key : false;
  })
}
