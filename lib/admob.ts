import Constants from 'expo-constants';

export function initAdMob() {
  if (Constants.appOwnership !== 'expo') {
    try {
      const mobileAds = require('react-native-google-mobile-ads').default;
      mobileAds()
        .initialize()
        .then((adapterStatuses: any) => {
          console.log('AdMob Initialized:', adapterStatuses)
        })
    } catch (e) {
      console.warn('AdMob failed to load:', e)
    }
  }
}
