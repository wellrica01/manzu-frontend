

export function getUnitLabel(dosageForm) {
  const form = dosageForm?.toUpperCase() || '';
  
  switch (form) {
    // Solid oral forms - use "pack" or "strip"
    case 'TABLET':
    case 'CAPSULE':
    case 'CAPLET':
    case 'LOZENGE':
    case 'EFFERVESCENT':
    case 'ORODISPERSIBLE_FILM':
      return 'Pack';
    
    // Liquids - use "bottle"
    case 'SYRUP':
    case 'SUSPENSION':
    case 'SOLUTION':
    case 'EYE_DROP':
    case 'EAR_DROP':
    case 'DROPS':
    case 'MOUTHWASH':
    case 'LOTION':
    case 'NEBULIZER_SOLUTION':
      return 'Bottle';
    
    // Topical applications - use "tube"
    case 'CREAM':
    case 'OINTMENT':
    case 'GEL':
    case 'PASTE':
    case 'EYE_OINTMENT':
      return 'Tube';
    
    // Sprays - use "bottle" (spray bottles)
    case 'NASAL_SPRAY':
    case 'EAR_SPRAY':
      return 'Bottle';
    
    // Inhalers - use "inhaler"
    case 'INHALER':
      return 'Inhaler';
    
    // Injectables - use "vial" or "ampoule"
    case 'INJECTION':
    case 'INFUSION':
    case 'LYOPHILIZED_POWDER':
      return 'Vial';
    
    // Powders/Granules - use "sachet" or "pack"
    case 'POWDER':
    case 'GRANULES':
      return 'Sachet';
    
    // Suppositories - use "suppository" (the item itself)
    case 'SUPPOSITORY':
      return 'Suppository';
    
    // Patches - use "patch"
    case 'PATCH':
      return 'Patch';
    
    // Foam - use "canister"
    case 'FOAM':
      return 'Canister';
    
    // Implants - use "implant"
    case 'IMPLANT':
      return 'Implant';
    
    // Microspheres - use "vial"
    case 'MICROSPHERES':
      return 'Vial';
    
    // Fallback
    default:
      return 'Unit';
  }
};