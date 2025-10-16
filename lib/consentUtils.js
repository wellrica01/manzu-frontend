export const checkUserConsent = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('manzu_consent') === 'granted';
};

export const requireConsent = (onConsentMissing) => {
  if (!checkUserConsent()) {
    if (onConsentMissing) {
      onConsentMissing();
    }
    return false;
  }
  return true;
};
