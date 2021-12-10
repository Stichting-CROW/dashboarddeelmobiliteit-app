
export const getProviderColor = (providers, providerName) => {
  const found = providers.filter(x => {
    return x.system_id === providerName;
  });
  return found && found[0] ? found[0].color : '#666';
}
