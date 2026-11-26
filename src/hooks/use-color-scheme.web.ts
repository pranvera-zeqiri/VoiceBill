import { Appearance } from 'react-native';
import { useSyncExternalStore } from 'react';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  return useSyncExternalStore(
    (callback) => {
      const subscription = Appearance.addChangeListener(callback);
      return () => subscription.remove();
    },
    () => Appearance.getColorScheme() ?? 'light',
    () => 'light'
  );
}
