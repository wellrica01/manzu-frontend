import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      hero: {
        trusted_platform: 'Trusted Medication Platform',
        title: 'Discover Medications with',
        subtitle: 'Find the best prices, nearest pharmacies, or upload your prescription effortlessly across Nigeria’s 774 LGAs.',
        find_medications: 'Find Medications',
        upload_prescription: 'Upload Prescription',
        whatsapp_search: 'Search via WhatsApp',
        ussd_search: 'Search via USSD',
        other_access_methods: 'Other Access Methods'
      },
      services: {
        search_medications: 'Search Medications',
        upload_prescription: 'Upload Prescription',
        for_pharmacies: 'For Pharmacies',
        pharmacy_benefits: 'Join Manzu to reach millions of customers, manage inventory easily, and grow your business with low 3–5% fees.',
        register_pharmacy: 'Register Pharmacy',
        pharmacy_login: 'Pharmacy Login',
        pharmacy_onboarding: 'Sign up in minutes with free onboarding support and real-time inventory tools.'
      },
      search: {
        no_results: 'No medications found for "{searchTerm}"',
        enter_medication: 'Enter a medicine name in the search input'
      },
      upload: {
        form_title: 'Upload Your Prescription',
        contact_label: 'Email or Phone',
        contact_placeholder: 'Enter your email or phone number',
        file_label: 'Prescription File',
        drag_drop_label: 'Drag and drop prescription file',
        drop_file: 'Drop your file here or',
        browse: 'browse',
        file_types: 'Supports .pdf, .jpg, .jpeg, .png',
        success_title: 'Prescription Uploaded!',
        success_message: 'Your prescription has been successfully submitted. We’ll notify you at',
        success_message_end: 'once it’s processed.',
        verification_info: 'Processing take a few minutes. You can also',
        check_status: 'check your status here',
        upload_another: 'Upload Another',
        track_order: 'Track Order',
        uploading: 'Uploading...',
        upload_button: 'Upload Prescription',
        errors: {
          file_required: 'Please select a prescription file',
          contact_required: 'Please provide an email or phone number',
          invalid_contact: 'Please enter a valid email or phone number (10-15 digits)',
          invalid_file: 'Please upload a PDF, JPG, or PNG file',
          fix_errors: 'Please fix the errors before submitting',
          upload_failed: 'Upload failed. Please try again.'
        }
      },
      nav: {
        medication_navigation: 'Medication navigation',
        homepage: 'Manzu Homepage',
        home: 'Home',
        check_status: 'Check Prescription Status',
        track_order: 'Track Order',
        cart: 'Cart',
        with: 'with',
        items: 'items',
        open_menu: 'Open menu',
        close_menu: 'Close menu'
      },
      footer: {
        description: 'Manzu: Your trusted platform for medications across Nigeria.',
        ussd: 'Search via USSD:',
        whatsapp: 'Search via WhatsApp:',
        quick_links: 'Quick Links',
        about: 'About',
        contact: 'Contact',
        privacy_policy: 'Privacy Policy',
        connect: 'Connect With Us',
        powered_by: 'Powered by WellRica'
      },
      errors: {
        geo_data: 'Failed to load location filters',
        location_fetch: 'Unable to fetch location. Showing all pharmacies.',
        suggestions_failed: 'Failed to load suggestions. Please try again.',
        search_failed: 'Search failed',
        invalid_selection: 'Invalid medication or pharmacy',
        add_to_cart_failed: 'Failed to add to cart'
      }
    }
  },
  ha: {
    translation: {
      hero: {
        trusted_platform: 'Dandalin Magunguna Mai Aminci',
        title: 'Gano Magunguna da',
        subtitle: 'Nemo mafi kyawun farashi, kantin magani mafi kusa, ko loda takardar sayan magani cikin sauƙi a dukkan LGAs 774 na Najeriya.',
        find_medications: 'Nemo Magunguna',
        upload_prescription: 'Loda Takardar Magani',
        whatsapp_search: 'Nema ta WhatsApp',
        ussd_search: 'Nema ta USSD',
        other_access_methods: 'Sauran Hanyoyin Shiga'
      },
      services: {
        search_medications: 'Nemo Magunguna',
        upload_prescription: 'Loda Takardar Magani',
        for_pharmacies: 'Ga Kantunan Magunguna',
        pharmacy_benefits: 'Shiga Manzu don isa ga miliyoyin abokan ciniki, sarrafa kaya cikin sauƙi, da haɓaka kasuwancinka tare da ƙananan kuɗaɗen 3–5%.',
        register_pharmacy: 'Rijista Kantin Magani',
        pharmacy_login: 'Shiga Kantin Magani',
        pharmacy_onboarding: 'Yi rajista cikin mintuna tare da tallafin shiga kyauta da kayan aikin kaya na ainihi.'
      },
      search: {
        no_results: 'Ba a sami magunguna ba ga "{searchTerm}"',
        enter_medication: 'Shigar da sunan magani don kwatanta kantunan magani'
      },
      upload: {
        form_title: 'Loda Takardar Maganinka',
        contact_label: 'Imel ko Lambar Waya',
        contact_placeholder: 'Shigar da imel ko lambar waya',
        file_label: 'Fayil ɗin Takardar Magani',
        drag_drop_label: 'Jawo kuma sauke fayil ɗin takardar magani',
        drop_file: 'Sauke fayil ɗinka anan ko',
        browse: 'bincika',
        file_types: 'Yana goyan bayan .pdf, .jpg, .jpeg, .png',
        success_title: 'An Loda Takardar Magani!',
        success_message: 'An ƙaddamar da takardar maganinka cikin nasara. Za mu sanar da kai a',
        success_message_end: 'sai an gama sarrafawa.',
        verification_info: 'Tabbatarwa na iya ɗaukar mintuna kaɗan. Hakanan zaka iya',
        check_status: 'duba matsayinka anan',
        upload_another: 'Loda Wani',
        track_order: 'Biyo Bayani',
        uploading: 'Ana Lodawa...',
        upload_button: 'Loda Takardar Magani',
        errors: {
          file_required: 'Da fatan za a zaɓi fayil ɗin takardar magani',
          contact_required: 'Da fatan za a ba da imel ko lambar waya',
          invalid_contact: 'Da fatan za a shigar da imel mai inganci ko lambar waya (dijits 10-15)',
          invalid_file: 'Da fatan za a loda fayil ɗin PDF, JPG, ko PNG',
          fix_errors: 'Da fatan za a gyara kurakurai kafin ƙaddamarwa',
          upload_failed: 'Lodawa ya kasa. Da fatan a sake gwadawa.'
        }
      },
      nav: {
        medication_navigation: 'Kewayawa Magunguna',
        homepage: 'Shafin Farko na Manzu',
        home: 'Gida',
        check_status: 'Duba Matsayin Takardar Magani',
        track_order: 'Biyo Bayani',
        cart: 'Keken Siyayya',
        with: 'tare da',
        items: 'abubuwa',
        open_menu: 'Buɗe menu',
        close_menu: 'Rufe menu'
      },
      footer: {
        description: 'Manzu: Dandalin amincinku don magunguna a duk Najeriya.',
        ussd: 'Nema ta USSD:',
        whatsapp: 'Nema ta WhatsApp:',
        quick_links: 'Mahaɗai Masu Sauri',
        about: 'Game da Mu',
        contact: 'Tuntuɓa',
        privacy_policy: 'Manufofin Sirri',
        connect: 'Haɗa da Mu',
        powered_by: 'Ƙarfafa ta WellRica'
      },
      errors: {
        geo_data: 'Kasa loda matattun wuri',
        location_fetch: 'Ba a iya ɗaukar wuri ba. Ana nuna dukkan kantunan magani.',
        suggestions_failed: 'Kasa loda shawarwari. Da fatan a sake gwadawa.',
        search_failed: 'Nema ya kasa',
        invalid_selection: 'Magani ko kantin magani mara inganci',
        add_to_cart_failed: 'Kasa ƙara zuwa keken siyayya'
      }
    }
  },
  yo: {
    translation: {
      hero: {
        trusted_platform: 'Ipele Oogun Tiotọ',
        title: 'Ṣe awari Oogun pẹlu',
        subtitle: 'Wa awọn idiyele ti o dara julọ, awọn ile-itaja oogun ti o sunmọ, tabi gbe iwe oogun rẹ soke laisi wahala kọja awọn LGA 774 ti Nigeria.',
        find_medications: 'Wa Oogun',
        upload_prescription: 'Gbe Iwe Oogun Soke',
        whatsapp_search: 'Wa nipasẹ WhatsApp',
        ussd_search: 'Wa nipasẹ USSD',
        other_access_methods: 'Awọn Ọna Miiran Lati Wọle'
      },
      services: {
        search_medications: 'Wa Oogun',
        upload_prescription: 'Gbe Iwe Oogun Soke',
        for_pharmacies: 'Fun Awọn Ile-itaja Oogun',
        pharmacy_benefits: 'Darapọ mọ Manzu lati de ọdọ awọn miliọnu ti awọn onibara, ṣakoso awọn ohun elo ni irọrun, ati dagba iṣowo rẹ pẹlu awọn idiyele kekere 3–5%.',
        register_pharmacy: 'Forukọsilẹ Ile-itaja Oogun',
        pharmacy_login: 'Wọle Ile-itaja Oogun',
        pharmacy_onboarding: 'Forukọsilẹ ni iṣẹju pẹlu atilẹyin ọfẹ ati awọn irinṣẹ akojo ọja akoko gidi.'
      },
      search: {
        no_results: 'Ko si oogun ti a rii fun "{searchTerm}"',
        enter_medication: 'Tẹ orukọ oogun kan lati ṣe afiwe awọn ile-itaja oogun'
      },
      upload: {
        form_title: 'Gbe Iwe Oogun Rẹ Soke',
        contact_label: 'Imel tabi Nọmba Foonu',
        contact_placeholder: 'Tẹ imel rẹ tabi nọmba foonu sii',
        file_label: 'Faili Iwe Oogun',
        drag_drop_label: 'Fa ati ju faili iwe oogun sii',
        drop_file: 'Ju faili rẹ sii nibi tabi',
        browse: 'ṣawari',
        file_types: 'Ṣe atilẹyin .pdf, .jpg, .jpeg, .png',
        success_title: 'Iwe Oogun Ti Gbe Soke!',
        success_message: 'Iwe oogun rẹ ti gbe soke ni aṣeyọri. A yoo fi to ọ leti ni',
        success_message_end: 'ni kete ti a ba ti ṣe ilana rẹ.',
        verification_info: 'Idaniloju le gba iṣẹju diẹ. O tun le',
        check_status: 'ṣayẹwo ipo rẹ nibi',
        upload_another: 'Gbe Ọkan Miiran Soke',
        track_order: 'Tẹle Ibeere',
        uploading: 'N gbe soke...',
        upload_button: 'Gbe Iwe Oogun Soke',
        errors: {
          file_required: 'Jọwọ yan faili iwe oogun',
          contact_required: 'Jọwọ pese imel tabi nọmba foonu',
          invalid_contact: 'Jọwọ tẹ imel to wulo tabi nọmba foonu sii (awọn nọmba 10-15)',
          invalid_file: 'Jọwọ gbe faili PDF, JPG, tabi PNG soke',
          fix_errors: 'Jọwọ ṣe atunṣe awọn aṣiṣe ṣaaju ki o to fi silẹ',
          upload_failed: 'Ikuna gbigbe soke. Jọwọ gbiyanju lẹẹkansi.'
        }
      },
      nav: {
        medication_navigation: 'Lilọ kiri Oogun',
        homepage: 'Oju-iwe Akọkọ Manzu',
        home: 'Ile',
        check_status: 'Ṣayẹwo Ipo Iwe Oogun',
        track_order: 'Tẹle Ibeere',
        cart: 'Kẹkẹ Rira',
        with: 'pẹlu',
        items: 'awọn nkan',
        open_menu: 'Ṣi akojọ aṣayan',
        close_menu: 'Tii akojọ aṣayan'
      },
      footer: {
        description: 'Manzu: Ipele ti o ni igbẹkẹle fun awọn oogun kọja Nigeria.',
        ussd: 'Wa nipasẹ USSD:',
        whatsapp: 'Wa nipasẹ WhatsApp:',
        quick_links: 'Awọn Ọna Asopọ Yara',
        about: 'Nipa Wa',
        contact: 'Kan si wa',
        privacy_policy: 'Ilana Ikọkọ',
        connect: 'Sopọ pẹlu Wa',
        powered_by: 'Ṣe agbara nipasẹ WellRica'
      },
      errors: {
        geo_data: 'Ikuna lati gbe awọn matattara ipo',
        location_fetch: 'Ko le gba ipo. Ṣe afihan gbogbo awọn ile-itaja oogun.',
        suggestions_failed: 'Ikuna lati gbe awọn imọran. Jọwọ gbiyanju lẹẹkansi.',
        search_failed: 'Wiwa kuna',
        invalid_selection: 'Oogun tabi ile-itaja oogun ti ko wulo',
        add_to_cart_failed: 'Ikuna lati ṣafikun si kẹkẹ rira'
      }
    }
  },
  ig: {
    translation: {
      hero: {
        trusted_platform: 'Ikpo okwu ọgwụ tụkwasịrị obi',
        title: 'Chọpụta Ọgwụ na',
        subtitle: 'Chọta ọnụ ahịa kacha mma, ụlọ ahịa ọgwụ kacha nso, ma ọ bụ bulie akwụkwọ ọgwụ gị n’enweghị nsogbu n’ofe LGA 774 nke Nigeria.',
        find_medications: 'Chọta Ọgwụ',
        upload_prescription: 'Bulie Akwụkwọ Ọgwụ',
        whatsapp_search: 'Chọọ site na WhatsApp',
        ussd_search: 'Chọọ site na USSD',
        other_access_methods: 'Ụzọ Ndị Ọzọ Iji Banye'
      },
      services: {
        search_medications: 'Chọta Ọgwụ',
        upload_prescription: 'Bulie Akwụkwọ Ọgwụ',
        for_pharmacies: 'Maka Ụlọ Ahịa Ọgwụ',
        pharmacy_benefits: 'Sonụ na Manzu iji rute nde ndị ahịa, jikwaa ngwa ahịa n’ụzọ dị mfe, ma too azụmahịa gị na ọnụ ahịa dị ala nke 3–5%.',
        register_pharmacy: 'Debanye aha Ụlọ Ahịa Ọgwụ',
        pharmacy_login: 'Banye Ụlọ Ahịa Ọgwụ',
        pharmacy_onboarding: 'Debanye aha n’ime nkeji na nkwado nnabata n’efu yana ngwaọrụ ngwa ahịa n’ezie.'
      },
      search: {
        no_results: 'Ọnweghị ọgwụ achọtara maka "{searchTerm}"',
        enter_medication: 'Tinye aha ọgwụ iji tụnyere ụlọ ahịa ọgwụ'
      },
      upload: {
        form_title: 'Bulie Akwụkwọ Ọgwụ Gị',
        contact_label: 'Imel ma ọ bụ Nọmba Ekwe ntị',
        contact_placeholder: 'Tinye imel gị ma ọ bụ nọmba ekwe ntị',
        file_label: 'Faịlụ Akwụkwọ Ọgwụ',
        drag_drop_label: 'Dọrọ ma tụba faịlụ akwụkwọ ọgwụ',
        drop_file: 'Tụba faịlụ gị ebe a ma ọ bụ',
        browse: 'chọgharịa',
        file_types: 'Na-akwado .pdf, .jpg, .jpeg, .png',
        success_title: 'Ebulila Akwụkwọ Ọgwụ!',
        success_message: 'Ebulila akwụkwọ ọgwụ gị nke ọma. Anyị ga-akpọtụrụ gị na',
        success_message_end: 'ozugbo e mechara ya.',
        verification_info: 'Nyocha nwere ike were nkeji ole na ole. Ị nwekwara ike',
        check_status: 'lelee ọkwa gị ebe a',
        upload_another: 'Bulie Ọzọ',
        track_order: 'Soro Iwu',
        uploading: 'Na-ebuli...',
        upload_button: 'Bulie Akwụkwọ Ọgwụ',
        errors: {
          file_required: 'Biko họrọ faịlụ akwụkwọ ọgwụ',
          contact_required: 'Biko nye imel ma ọ bụ nọmba ekwe ntị',
          invalid_contact: 'Biko tinye imel ziri ezi ma ọ bụ nọmba ekwe ntị (nọmba 10-15)',
          invalid_file: 'Biko bulie faịlụ PDF, JPG, ma ọ bụ PNG',
          fix_errors: 'Biko dozie mmejọ tupu itinye',
          upload_failed: 'Ebuli kụrụ afọ n’ala. Biko nwaa ọzọ.'
        }
      },
      nav: {
        medication_navigation: 'Njegharị Ọgwụ',
        homepage: 'Ihu Akwụkwọ Mbụ Manzu',
        home: 'Ụlọ',
        check_status: 'Lelee Ọkwa Akwụkwọ Ọgwụ',
        track_order: 'Soro Iwu',
        cart: 'Ụgbọ Ala Ịzụ Ahịa',
        with: 'na',
        items: 'ihe',
        open_menu: 'Mepee menu',
        close_menu: 'Mechie menu'
      },
      footer: {
        description: 'Manzu: Ikpo okwu tụkwasịrị obi maka ọgwụ n’ofe Nigeria.',
        ussd: 'Chọọ site na USSD:',
        whatsapp: 'Chọọ site na WhatsApp:',
        quick_links: 'Njikọ Ngwa ngwa',
        about: 'Gbasara Anyị',
        contact: 'Kpọtụrụ Anyị',
        privacy_policy: 'Amụma Nzuzo',
        connect: 'Jikọọ na Anyị',
        powered_by: 'Kwadoro site na WellRica'
      },
      errors: {
        geo_data: 'Ọdịda n’ibunye nzacha ebe',
        location_fetch: 'Enweghị ike ịnweta ebe. Na-egosi ụlọ ahịa ọgwụ niile.',
        suggestions_failed: 'Ọdịda n’ibunye aro. Biko nwaa ọzọ.',
        search_failed: 'Ọchụchọ kụrụ afọ n’ala',
        invalid_selection: 'Ọgwụ ma ọ bụ ụlọ ahịa ọgwụ adịghị mma',
        add_to_cart_failed: 'Ọdịda n’itinye n’ụgbọ ala ịzụ ahịa'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;