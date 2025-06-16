
export const getProviderColor = (providers, providerName) => {
  const found = providers.filter(x => {
    return x.system_id === providerName;
  });
  return found && found[0] ? found[0].color : '#666';
}

export const getProviderColorForProvider = (providerName) => {
  const providerColors = getProviderColors();
  return providerColors[providerName] || '#666';
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
    'check_mdsv2': 'Check MDS v2',
    'cargoroo': 'Cargoroo',
    'deelfietsnederland': 'Deelfiets Nederland',
    'donkey': 'Donkey Republic',
    'felyx': 'Felyx',
    'felyx_mds': 'Felyx MDS (test)',
    'flickbike': 'FlickBike',
    'gosharing': 'GO Sharing',
    'greenwheels': 'Greenwheels (pilot)',
    'hely': 'Hely',
    'htm': 'HTM Fiets',
    'moveyou': 'MoveYou',
    'mywheels': 'MyWheels (pilot)',
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
    'check_mdsv2': 'https://ridecheck.app/',
    'cargoroo': 'https://cargoroo.nl/',
    'deelfietsnederland': 'https://deelfietsnederland.nl/',
    'donkey': 'https://www.donkey.bike/',
    'greenwheels': 'https://www.greenwheels.nl/',
    'moveyou': 'https://www.moveyou.com/',
    'mywheels': 'https://www.mywheels.nl/',
    'felyx': 'https://felyx.com/',
    'felyx_mds': 'https://felyx.com/',
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

export const getProvider = (system_id) => {
  const providerData = {
    'baqme': {
      name: 'BAQME',
      website: 'https://www.baqme.com/',
      logo: 'https://camo.githubusercontent.com/f1e1da06a3102cf130d74d82f8b02ff22e2e5576080aba1f28c86f36021334c3/68747470733a2f2f7777772e6261716d652e636f6d2f77702d636f6e74656e742f75706c6f6164732f323032312f30312f4241514d455f4c6f676f5f426c61636b4033782d312e706e67',
    },
    'bird': {
      name: 'Bird',
      website: 'https://www.bird.co/',
      logo: '',
    },
    'bondi': {
      name: 'Bondi',
      website: 'https://www.bondi.city/',
      logo: '',
    },
    'cykl': {
      name: 'Cykl',
      website: 'https://www.cykl.nl/',
      logo: 'https://camo.githubusercontent.com/e645cbd26691cb03186dd2faabb143cc6dfd89638319dbd0023b93f539e2ba87/68747470733a2f2f7777772e63796b6c2e6e6c2f696d672f63796b6c5f776f72642e706e67',
    },
    'check': {
      name: 'Check',
      website: 'https://ridecheck.app/',
      logo: 'https://camo.githubusercontent.com/39e3d7c677f286540e53f39160985e8cb2a335232fb6ee49f6b0151350d6a8b3/68747470733a2f2f696d616765732e707269736d69632e696f2f72696465636865636b2f32653531303366612d366635312d346535322d383434632d6633356231346165363361655f436865636b5f576f72646d61726b5f426c61636b2e706e673f6175746f3d636f6d70726573732c666f726d6174',
    },
    'check_mdsv2': {
      name: 'Check MDS v2',
      website: 'https://ridecheck.app/',
      logo: 'https://camo.githubusercontent.com/39e3d7c677f286540e53f39160985e8cb2a335232fb6ee49f6b0151350d6a8b3/68747470733a2f2f696d616765732e707269736d69632e696f2f72696465636865636b2f32653531303366612d366635312d346535322d383434632d6633356231346165363361655f436865636b5f576f72646d61726b5f426c61636b2e706e673f6175746f3d636f6d70726573732c666f726d6174',
    },
    'cargoroo': {
      name: 'Cargoroo',
      website: 'https://cargoroo.nl/',
      logo: 'https://camo.githubusercontent.com/2a17811221fff90384f763b9e68dc43b16b2cbba3652ff2ba7c496d12c8fcca9/68747470733a2f2f636172676f726f6f2e6e6c2f77702d636f6e74656e742f75706c6f6164732f323032312f31312f436172676f726f6f2d7765622d6c6f676f2d312e706e67',
    },
    'deelfietsnederland': {
      name: 'Deelfiets Nederland',
      website: 'https://deelfietsnederland.nl/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/deelfietsnederland.png',
    },
    'donkey': {
      name: 'Donkey Republic',
      website: 'https://www.donkey.bike/',
      logo: 'https://camo.githubusercontent.com/397b66481d445f520c5f37ae6535ad55505b0048780b23a42751caa317e6a174/68747470733a2f2f63646e2e646f6e6b65792e62696b652f77702d636f6e74656e742f75706c6f6164732f323031362f30342f31363132313235352f4e65772d6c6f676f2d736d616c6c2e706e67',
    },
    'greenwheels': {
      name: 'Greenwheels',
      website: 'https://www.greenwheels.nl/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/greenwheels.png',
    },
    'moveyou': {
      name: 'MoveYou',
      website: 'https://www.moveyou.com/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/moveyou.png',
    },
    'mywheels': {
      name: 'MyWheels',
      website: 'https://www.mywheels.nl/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/mywheels.png',
    },
    'felyx': {
      name: 'Felyx',
      website: 'https://felyx.com/',
      logo: 'https://camo.githubusercontent.com/5b7de903d8efee99601d7b704b54516858c769c8ae482683b5f45e475079a334/68747470733a2f2f696d616765732e6372756e6368626173652e636f6d2f696d6167652f75706c6f61642f635f7061642c685f3137302c775f3137302c665f6175746f2c625f77686974652c715f6175746f3a65636f2c6470725f322f6969676e6b346d736e666e787a6f6d62696e3467',
    },
    'felyx_mds': {
      name: 'Felyx MDS',
      website: 'https://felyx.com/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/felyx.png',
    },
    'gosharing': {
      name: 'GO Sharing',
      website: 'https://go-sharing.com/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/gosharing.png',
    },
    'hely': {
      name: 'Hely',
      website: 'https://hely.com/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/hely.png',
    },
    'htm': {
      name: 'HTM Fiets',
      website: 'https://www.htm.nl/ons-vervoer/htm-fiets',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/htm.png',
    },
    'keobike': {
      name: 'KeoBike',
      website: 'https://keobike.nl/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/keobike.png',
    },
    'lime': {
      name: 'Lime',
      website: 'https://www.li.me/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/lime.png',
    },
    'tier': {
      name: 'TIER',
      website: 'https://www.tier.app/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/tier.png',
    },
    'dott': {
      name: 'Dott',
      website: 'https://ridedott.com/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/dott.png',
    },
    'uwdeelfiets': {
      name: 'Uw Deelfiets',
      website: 'https://www.uwdeelfiets.nl/',
      logo: 'https://raw.githubusercontent.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/main/logos/uwdeelfiets.png',
    },
  }
  return providerData[system_id]
    ? providerData[system_id]
    : null;
}

export const getProviderColors = () => {
  return  {
    'cykl': '#a5e067',
    'flickbike': '#fe431d',
    'mobike': '#ed5144',
    'mywheels': '#1b70de',
    'donkey': '#ed5144',
    'htm': '#db291e',
    'jump': '#fd3e48',
    'gosharing': '#77b136',
    'greenwheels': '#32ab52',
    'check': '#8f3af8',
    'check_mdsv2': '#8f3af8',
    'felyx': '#064627',
    'felyx_mds': '#064627',
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
