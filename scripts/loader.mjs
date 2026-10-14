import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  // Mock React Native AsyncStorage for node testing
  if (specifier === '@react-native-async-storage/async-storage') {
    return {
      format: 'module',
      shortCircuit: true,
      url: pathToFileURL('./scripts/asyncStorageMock.mjs').href,
    };
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    // Try file extensions
    for (const ext of ['.ts', '.tsx', '.js', '.json', '/index.ts', '/index.tsx', '/index.js']) {
      try {
        return await nextResolve(specifier + ext, context);
      } catch (e) {}
    }
    throw err;
  }
}

register(pathToFileURL('./scripts/loader.mjs'), import.meta.url);
