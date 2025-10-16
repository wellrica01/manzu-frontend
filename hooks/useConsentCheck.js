import { useState, useCallback } from "react";

import { checkUserConsent } from "@/lib/consentUtils";


export const useConsentCheck = () => {
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  
  const checkConsent = useCallback(() => {
    const hasConsent = checkUserConsent();
    if (!hasConsent) {
      setIsConsentOpen(true);
    }
    return hasConsent;
  }, []);
  
  const handleConsentClose = useCallback((accepted = false) => {
    setIsConsentOpen(false);
    if (accepted) {
      localStorage.setItem('manzu_consent', 'granted');
    }
  }, []);
  
  return { isConsentOpen, checkConsent, handleConsentClose, setIsConsentOpen };
};