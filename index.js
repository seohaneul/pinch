/**
 * 앱 진입점 (expo-router/entry 보다 먼저 실행됨)
 *
 * NativeWind(react-native-css-interop)가 초기화 시점에 react-native의
 * `ImageBackground` getter에 접근하면서, React Native 0.88의
 * "ImageBackground is deprecated" 경고가 매 실행마다 출력된다.
 * 앱 코드에서는 ImageBackground를 사용하지 않으므로 해당 경고만 걸러낸다.
 *
 * NOTE: ES import는 호이스팅되므로 require 순서로 실행 순서를 보장한다.
 */
const SUPPRESSED_WARNINGS = ['ImageBackground is deprecated'];

const originalWarn = console.warn;
console.warn = (...args) => {
  const first = args[0];
  if (typeof first === 'string' && SUPPRESSED_WARNINGS.some((msg) => first.includes(msg))) {
    return;
  }
  originalWarn(...args);
};

require('expo-router/entry');

