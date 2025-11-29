/**
 * 테마 관리 유틸리티
 */

const THEME_KEY = 'fitTable-theme';
const THEME_SYSTEM = 'system';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

/**
 * 시스템 다크 모드 감지
 */
const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEME_LIGHT;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT;
};

/**
 * 저장된 테마 가져오기
 */
export const getStoredTheme = () => {
  if (typeof window === 'undefined') return THEME_SYSTEM;
  return localStorage.getItem(THEME_KEY) || THEME_SYSTEM;
};

/**
 * 테마 저장
 */
export const setStoredTheme = (theme) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
};

/**
 * 실제 적용할 테마 가져오기 (시스템 설정인 경우 시스템 테마 반환)
 */
export const getEffectiveTheme = () => {
  const stored = getStoredTheme();
  if (stored === THEME_SYSTEM) {
    return getSystemTheme();
  }
  return stored;
};

/**
 * HTML 요소에 다크 모드 클래스 적용
 */
export const applyTheme = (theme) => {
  if (typeof window === 'undefined') return;
  
  const effectiveTheme = theme === THEME_SYSTEM ? getSystemTheme() : theme;
  const root = document.documentElement;
  const body = document.body;
  
  // 명시적으로 모든 테마 클래스 제거
  root.classList.remove('dark', 'light');
  body.classList.remove('dark', 'light');
  
  // 다크 모드인 경우에만 dark 클래스 추가
  if (effectiveTheme === THEME_DARK) {
    root.classList.add('dark');
    body.classList.add('dark');
  }
  // 라이트 모드인 경우 클래스를 추가하지 않음 (기본값)
  
  // 디버깅을 위한 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Theme] Applied theme:', theme, 'Effective:', effectiveTheme);
    console.log('[Theme] Root classes:', root.className);
    console.log('[Theme] Body classes:', body.className);
  }
};

// 시스템 테마 변경 감지 리스너 저장
let systemThemeListener = null;

/**
 * 시스템 테마 변경 감지 설정
 */
const setupSystemThemeListener = () => {
  if (typeof window === 'undefined') return;
  
  // 기존 리스너 제거
  if (systemThemeListener) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.removeEventListener('change', systemThemeListener);
  }
  
  // 새 리스너 추가
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeListener = () => {
    const stored = getStoredTheme();
    if (stored === THEME_SYSTEM) {
      applyTheme(THEME_SYSTEM);
    }
  };
  mediaQuery.addEventListener('change', systemThemeListener);
};

/**
 * 초기 테마 적용
 */
export const initTheme = () => {
  if (typeof window === 'undefined') return;
  
  const stored = getStoredTheme();
  applyTheme(stored);
  
  // 시스템 테마 변경 감지 설정
  setupSystemThemeListener();
};

/**
 * 테마 변경 시 호출 (시스템 테마 리스너 재설정)
 */
export const updateTheme = (theme) => {
  setStoredTheme(theme);
  applyTheme(theme);
  setupSystemThemeListener(); // 리스너 재설정
};

export { THEME_SYSTEM, THEME_DARK, THEME_LIGHT };

