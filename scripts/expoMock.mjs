export const createURL = (path = '') => `pinch://${path}`;
export const addEventListener = () => ({ remove: () => {} });
export const getInitialURL = async () => null;
export const maybeCompleteAuthSession = () => ({ type: 'failed' });
export const openAuthSessionAsync = async () => ({ type: 'cancel' });
export const dismissBrowser = () => {};

export default {
  createURL,
  addEventListener,
  getInitialURL,
  maybeCompleteAuthSession,
  openAuthSessionAsync,
  dismissBrowser,
};
