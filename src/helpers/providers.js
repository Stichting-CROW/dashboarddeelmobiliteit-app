
export const getProviderColor = (providers, providerName) => {
  const found = providers.filter(x => {
    return x.system_id === providerName;
  });
  return found && found[0] ? found[0].color : '#666';
}

export const getUniqueProviderNames = (objects) => {
  // Check if object was given
  if(! objects || ! objects[0]) return [];
  // Get unique provider names
  const uniqueProviderNames = [];
  objects.forEach(x => {
    Object.keys(x).filter((key, val) => {
      if(key !== 'name') {
        if(uniqueProviderNames.indexOf(key) <= -1) {
          uniqueProviderNames.push(key);
        }
      }
    })
  });
  return uniqueProviderNames;
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
    'moveyou': 'MoveYou',
    'keobike': 'KeoBike',
    'lime': 'Lime',
    'tier': 'TIER',
    'dott': 'Dott',
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
    'moveyou': 'https://www.moveyou.com/',
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

export const getProviderColors = () => {
  return  {
    'cykl': '#a5e067',
    'flickbike': '#fe431d',
    'mobike': '#ed5144',
    'donkey': '#ed5144',
    'htm': '#db291e',
    'jump': '#fd3e48',
    'gosharing': '#77b136',
    'check': '#8f3af8',
    'felyx': '#064627',
    'lime': '#1bd831',
    'baqme': '#4bdfbb',
    'bird': '#26ccf0',
    'cargoroo': '#ffcb34',
    'moveyou': '#13D6A6',
    'hely': '#fd645c',
    'tier': '#0d123f',
    'dott': '#00a8e9',
  }
}

// These archived providers will not be included in charts etc
// We should reconsider this.
export const archivedProviders = [
]
