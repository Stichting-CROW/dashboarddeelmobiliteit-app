
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

export const getPrettyProviderName = (system_id) => {
  const providerPrettyNames = {
    'baqme': 'BAQME',
    'bird': 'Bird',
    'bondi': 'bondi',
    'cykl': 'Cykl',
    'check': 'Check',
    'cargoroo': 'Cargoroo',
    'deelfietsnederland': 'Deelfiets Nederland',
    'donkey': 'Donkey Republic',
    'felyx': 'Felyx',
    'flickbike': 'FlickBike',
    'gosharing': 'GO Sharing',
    'hely': 'Hely',
    'htm': 'HTM Fiets',
    'keobike': 'KeoBike',
    'lime': 'Lime',
    'tier': 'TIER',
    'dott': 'Dorr',
    'uwdeelfiets': 'Uw Deelfiets'
  }
  return providerPrettyNames[system_id]
    ? providerPrettyNames[system_id]
    : system_id;
}

export const getProviderWebsiteUrl = (system_id) => {
  const providerWebsiteUrls = {
    'baqme': 'https://www.baqme.com/',
    'bird': 'https://www.bird.co/',
    'bondi': 'https://www.bondi.city/',
    'cykl': 'https://www.cykl.nl/',
    'check': 'https://ridecheck.app/',
    'cargoroo': 'https://cargoroo.nl/',
    'deelfietsnederland': 'https://deelfietsnederland.nl/',
    'donkey': 'https://www.donkey.bike/',
    'felyx': 'https://felyx.com/',
    'flickbike': 'https://www.flickbike.nl/',
    'gosharing': 'https://go-sharing.com/',
    'hely': 'https://hely.com/',
    'htm': 'https://www.htm.nl/ons-vervoer/htm-fiets',
    'keobike': 'https://keobike.nl/',
    'lime': 'https://www.li.me/',
    'tier': 'https://www.tier.app/',
    'dott': 'https://ridedott.com/',
    'uwdeelfiets': 'https://www.uwdeelfiets.nl/',
  }
  return providerWebsiteUrls[system_id]
    ? providerWebsiteUrls[system_id]
    : null;
}
