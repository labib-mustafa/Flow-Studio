import { useSettingsContext } from '../context/SettingsContext';

export type { Settings } from '../context/SettingsContext';

export const useSettings = () => {
  return useSettingsContext();
};
