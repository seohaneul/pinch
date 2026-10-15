export const Alert = {
  alert: (title, message, buttons) => {
    // Mock alert for node tests
  },
};

export const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

export const StyleSheet = {
  create: (styles) => styles,
};

export default {
  Alert,
  Platform,
  StyleSheet,
};
