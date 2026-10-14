const storage = new Map();

const AsyncStorage = {
  getItem: async (key) => {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem: async (key, value) => {
    storage.set(key, String(value));
  },
  removeItem: async (key) => {
    storage.delete(key);
  },
  clear: async () => {
    storage.clear();
  },
  getAllKeys: async () => {
    return Array.from(storage.keys());
  },
};

export default AsyncStorage;
