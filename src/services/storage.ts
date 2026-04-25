import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

const plannerStorage: StateStorage = {
  getItem: async (name) => AsyncStorage.getItem(name),
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export default plannerStorage;
