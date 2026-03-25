export type Language = 'en' | 'he'

export interface Translations {
  nav: {
    discover: string
    post: string
    inbox: string
    myPosts: string
    profile: string
    settings: string
  }
  discover: {
    title: string
    subtitle: string
    dateFrom: string
    dateTo: string
    location: string
    locationPlaceholder: string
    advancedFilters: string
    timeOfDay: string
    searchPartners: string
    filters: string
    noClimbersTitle: string
    noClimbersSubtitle: string
    postRequest: string
    gradeMatch: string
    canOfferRide: string
  }
  timeChips: {
    anyTime: string
    morning: string
    afternoon: string
    evening: string
    flexible: string
  }
  inbox: {
    title: string
    subtitle: string
    received: string
    sent: string
    loading: string
    noReceivedTitle: string
    noReceivedSubtitle: string
    discoverPartners: string
    noSentTitle: string
    noSentSubtitle: string
    startSwiping: string
    accept: string
    decline: string
    pending: string
    matched: string
    declined: string
    whatsapp: string
    sms: string
    at: string
    applicants: string
    myApplications: string
    accepted: string
    backToInbox: string
    noApplicantsTitle: string
    noApplicantsSubtitle: string
    noApplicationsTitle: string
    noApplicationsSubtitle: string
  }
  requests: {
    title: string
    subtitle: string
    loading: string
    noRequestsTitle: string
    noRequestsSubtitle: string
    createFirst: string
    flexible: string
    grade: string
    areYouSure: string
    yesCancel: string
    no: string
    cancel: string
    applicant: string
    applicants: string
    status: {
      active: string
      matched: string
      cancelled: string
      expired: string
    }
  }
  newRequest: {
    title: string
    subtitle: string
    date: string
    flexibleTime: string
    startTime: string
    endTime: string
    locationType: string
    locationName: string
    locationPlaceholder: string
    goal: string
    gradeRange: string
    gradePlaceholder: string
    notes: string
    notesPlaceholder: string
    gearNeeded: string
    carpoolNeeded: string
    weightRelevant: string
    maxWeightDiff: string
    maxWeightPlaceholder: string
    submit: string
    errors: {
      required: string
      noTime: string
      weightRange: string
      maxRequests: string
    }
  }
  cardDetails: {
    level: string
    area: string
    sport: string
    boulder: string
    gear: string
    languages: string
    compatibility: string
    gradeMatches: string
    canOfferRide: string
    theyNeedRide: string
    requestDetails: string
    date: string
    time: string
    location: string
    goal: string
    grade: string
    flexibleTime: string
    needsGear: string
    pass: string
    interested: string
    blockUser: string
    reportUser: string
    areYouSure: string
    yesBlock: string
    cancel: string
    reportPlaceholder: string
    submitReport: string
    youHave: string
  }
  profile: {
    editTitle: string
    createTitle: string
    editSubtitle: string
    createSubtitle: string
    changePhoto: string
    uploadPhoto: string
    required: string
    displayName: string
    displayNamePlaceholder: string
    phone: string
    phonePlaceholder: string
    homeArea: string
    homeAreaPlaceholder: string
    sportGrade: string
    sportGradePlaceholder: string
    boulderGrade: string
    boulderGradePlaceholder: string
    weightPrivate: string
    weightPlaceholder: string
    showWeight: string
    weightVisible: string
    weightHidden: string
    gearIHave: string
    hasCar: string
    bio: string
    bioPlaceholder: string
    languages: string
    languagesPlaceholder: string
    save: string
    create: string
    signedInAs: string
    signOut: string
    errors: {
      displayName: string
      photo: string
      phone: string
      weight: string
    }
  }
  settings: {
    title: string
    subtitle: string
    language: string
    english: string
    hebrew: string
  }
  toasts: {
    interestSent: string
    userBlocked: string
    reportSubmitted: string
    matchAccepted: string
    interestDeclined: string
    requestCancelled: string
    requestCreated: string
  }
  goalTypes: {
    project: string
    mileage: string
    easyDay: string
    training: string
    any: string
  }
  gearLabels: {
    rope: string
    quickdraws: string
    belayDevice: string
    crashPad: string
    helmet: string
  }
  locationTypes: {
    gym: string
    crag: string
  }
}

export const en: Translations = {
  nav: {
    discover: 'Find',
    post: 'Post',
    inbox: 'Inbox',
    myPosts: 'My Posts',
    profile: 'Profile',
    settings: 'Settings',
  },
  discover: {
    title: 'Find a Partner',
    subtitle: 'Browse open climbing requests',
    dateFrom: 'From',
    dateTo: 'To',
    location: 'Location',
    locationPlaceholder: 'Search gyms, crags...',
    advancedFilters: 'Advanced Filters',
    timeOfDay: 'Time of Day',
    searchPartners: 'Search Partners',
    filters: 'Filters',
    noClimbersTitle: 'No climbers found',
    noClimbersSubtitle: 'Try adjusting your filters or check back later for new climbing partners',
    postRequest: 'Post a Request',
    gradeMatch: 'Grade match',
    canOfferRide: 'Can offer ride',
  },
  timeChips: {
    anyTime: 'Any Time',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    flexible: 'Flexible',
  },
  inbox: {
    title: 'Inbox',
    subtitle: 'Manage your connections',
    received: 'Received',
    sent: 'Sent',
    loading: 'Loading...',
    noReceivedTitle: 'No interests received yet',
    noReceivedSubtitle: "When climbers want to partner with you, they'll appear here",
    discoverPartners: 'Discover Partners',
    noSentTitle: 'No interests sent yet',
    noSentSubtitle: "Swipe right on climbers you'd like to partner with",
    startSwiping: 'Start Swiping',
    accept: 'Accept',
    decline: 'Decline',
    pending: 'Pending',
    matched: 'Matched',
    declined: 'Declined',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    at: 'at',
    applicants: 'Applicants',
    myApplications: 'My Applications',
    accepted: 'Accepted',
    backToInbox: 'Back to Inbox',
    noApplicantsTitle: 'No applicants yet',
    noApplicantsSubtitle: "When climbers want to partner with you, they'll appear here",
    noApplicationsTitle: 'No applications yet',
    noApplicationsSubtitle: 'Browse requests and tap Interested to apply',
  },
  requests: {
    title: 'My Requests',
    subtitle: 'Manage your partner requests',
    loading: 'Loading...',
    noRequestsTitle: 'No climbing requests yet',
    noRequestsSubtitle: 'Post a request and let climbers find you',
    createFirst: 'Create Your First Request',
    flexible: 'Flexible',
    grade: 'Grade',
    areYouSure: 'Are you sure?',
    yesCancel: 'Yes, Cancel',
    no: 'No',
    cancel: 'Cancel',
    applicant: 'applicant',
    applicants: 'applicants',
    status: {
      active: 'Active',
      matched: 'Matched',
      cancelled: 'Cancelled',
      expired: 'Expired',
    },
  },
  newRequest: {
    title: 'Post Request',
    subtitle: 'Find a climbing partner',
    date: 'Date *',
    flexibleTime: 'Flexible time',
    startTime: 'Start Time *',
    endTime: 'End Time',
    locationType: 'Location Type *',
    locationName: 'Location Name *',
    locationPlaceholder: 'e.g., Vertical Playground, Ein Prat',
    goal: 'Goal',
    gradeRange: 'Desired Grade Range',
    gradePlaceholder: 'e.g., 6a-6c',
    notes: 'Notes',
    notesPlaceholder: 'Any additional info...',
    gearNeeded: 'Gear Needed From Partner',
    carpoolNeeded: 'Need a ride / carpool',
    weightRelevant: 'Weight matching relevant',
    maxWeightDiff: 'Max Weight Difference (kg)',
    maxWeightPlaceholder: 'e.g., 15',
    submit: 'Post Request',
    errors: {
      required: 'Date and location are required',
      noTime: 'Set a start time or mark as flexible',
      weightRange: 'Max weight difference must be between 1-100 kg',
      maxRequests: 'Maximum 2 active requests allowed. Cancel an existing one first.',
    },
  },
  cardDetails: {
    level: 'Level',
    area: 'Area',
    sport: 'Sport',
    boulder: 'Boulder',
    gear: 'Gear',
    languages: 'Languages',
    compatibility: 'Compatibility',
    gradeMatches: 'Grade range matches',
    canOfferRide: 'You can offer a ride',
    theyNeedRide: 'They need a ride',
    requestDetails: 'Request Details',
    date: 'Date',
    time: 'Time',
    location: 'Location',
    goal: 'Goal',
    grade: 'Grade',
    flexibleTime: 'Flexible',
    needsGear: 'Needs gear',
    pass: 'Pass',
    interested: 'Interested',
    blockUser: 'Block User',
    reportUser: 'Report User',
    areYouSure: 'Are you sure?',
    yesBlock: 'Yes, Block',
    cancel: 'Cancel',
    reportPlaceholder: 'Why are you reporting this user?',
    submitReport: 'Submit Report',
    youHave: 'You have',
  },
  profile: {
    editTitle: 'Edit Profile',
    createTitle: 'Create Profile',
    editSubtitle: 'Update your climbing profile',
    createSubtitle: 'Set up your profile to start matching',
    changePhoto: 'Change Photo',
    uploadPhoto: 'Upload Photo',
    required: 'Required',
    displayName: 'Display Name *',
    displayNamePlaceholder: 'Your climbing name',
    phone: 'Phone (WhatsApp) *',
    phonePlaceholder: '+972...',
    homeArea: 'Home Area',
    homeAreaPlaceholder: 'e.g., Tel Aviv',
    sportGrade: 'Sport Grade',
    sportGradePlaceholder: 'e.g., 6a-7a',
    boulderGrade: 'Boulder Grade',
    boulderGradePlaceholder: 'e.g., V3-V6',
    weightPrivate: 'Weight (Private)',
    weightPlaceholder: 'Your weight in kg',
    showWeight: 'Show weight on my profile',
    weightVisible: 'Visible to potential partners for belay matching',
    weightHidden: 'Hidden from everyone — only used for compatibility scoring',
    gearIHave: 'Gear I Have',
    hasCar: 'I have a car',
    bio: 'Bio',
    bioPlaceholder: 'Tell others about yourself...',
    languages: 'Languages',
    languagesPlaceholder: 'English, Hebrew',
    save: 'Save Profile',
    create: 'Create Profile',
    signedInAs: 'Signed in as',
    signOut: 'Sign Out',
    errors: {
      displayName: 'Display name is required',
      photo: 'Photo is required',
      phone: 'Phone number is required for matching',
      weight: 'Weight must be between 30-200 kg',
    },
  },
  settings: {
    title: 'Settings',
    subtitle: 'App preferences',
    language: 'Language',
    english: 'English',
    hebrew: 'עברית',
  },
  toasts: {
    interestSent: 'Interest sent!',
    userBlocked: 'User blocked',
    reportSubmitted: 'Report submitted. Thank you.',
    matchAccepted: 'Match accepted!',
    interestDeclined: 'Interest declined',
    requestCancelled: 'Request cancelled',
    requestCreated: 'Request created!',
  },
  goalTypes: {
    project: 'Project',
    mileage: 'Mileage',
    easyDay: 'Easy Day',
    training: 'Training',
    any: 'Any',
  },
  gearLabels: {
    rope: 'Rope',
    quickdraws: 'Quickdraws',
    belayDevice: 'Belay Device',
    crashPad: 'Crash Pad',
    helmet: 'Helmet',
  },
  locationTypes: {
    gym: 'Gym',
    crag: 'Crag',
  },
}

export const he: Translations = {
  nav: {
    discover: 'גלה',
    post: 'פרסם',
    inbox: 'תיבת דואר',
    myPosts: 'הפרסומים',
    profile: 'פרופיל',
    settings: 'הגדרות',
  },
  discover: {
    title: 'גלה',
    subtitle: 'מצא את שותף הטיפוס שלך',
    dateFrom: 'מתאריך',
    dateTo: 'עד תאריך',
    location: 'מיקום',
    locationPlaceholder: 'חפש חדרי כושר, סלעים...',
    advancedFilters: 'סינון מתקדם',
    timeOfDay: 'שעת היום',
    searchPartners: 'חפש שותפים',
    filters: 'סינון',
    noClimbersTitle: 'לא נמצאו מטפסים',
    noClimbersSubtitle: 'נסה לשנות את הסינון או בדוק שוב מאוחר יותר',
    postRequest: 'פרסם בקשה',
    gradeMatch: 'התאמת רמה',
    canOfferRide: 'יכול להסיע',
  },
  timeChips: {
    anyTime: 'כל שעה',
    morning: 'בוקר',
    afternoon: 'צהריים',
    evening: 'ערב',
    flexible: 'גמיש',
  },
  inbox: {
    title: 'תיבת דואר',
    subtitle: 'נהל את החיבורים שלך',
    received: 'נכנס',
    sent: 'יוצא',
    loading: 'טוען...',
    noReceivedTitle: 'אין עניין שהתקבל עדיין',
    noReceivedSubtitle: 'כשמטפסים ירצו להתאים לך שותף, הם יופיעו כאן',
    discoverPartners: 'גלה שותפים',
    noSentTitle: 'לא נשלח עניין עדיין',
    noSentSubtitle: 'החלק ימינה על מטפסים שתרצה לשתף פעולה איתם',
    startSwiping: 'התחל להחליק',
    accept: 'קבל',
    decline: 'דחה',
    pending: 'ממתין',
    matched: 'הותאם',
    declined: 'נדחה',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    at: 'ב',
    applicants: 'מועמדים',
    myApplications: 'הגשות שלי',
    accepted: 'אושר',
    backToInbox: 'חזרה לתיבת הדואר',
    noApplicantsTitle: 'אין מועמדים עדיין',
    noApplicantsSubtitle: 'כשמטפסים יירצו להצטרף אליך, הם יופיעו כאן',
    noApplicationsTitle: 'לא הגשת בקשות עדיין',
    noApplicationsSubtitle: 'עיין בבקשות ולחץ על מעוניין כדי להגיש',
  },
  requests: {
    title: 'הבקשות שלי',
    subtitle: 'נהל את בקשות השותף שלך',
    loading: 'טוען...',
    noRequestsTitle: 'אין עדיין בקשות טיפוס',
    noRequestsSubtitle: 'פרסם בקשה ותן למטפסים למצוא אותך',
    createFirst: 'צור את הבקשה הראשונה שלך',
    flexible: 'גמיש',
    grade: 'רמה',
    areYouSure: 'אתה בטוח?',
    yesCancel: 'כן, בטל',
    no: 'לא',
    cancel: 'ביטול',
    applicant: 'מועמד',
    applicants: 'מועמדים',
    status: {
      active: 'פעיל',
      matched: 'הותאם',
      cancelled: 'בוטל',
      expired: 'פג תוקף',
    },
  },
  newRequest: {
    title: 'פרסם בקשה',
    subtitle: 'מצא שותף טיפוס',
    date: 'תאריך *',
    flexibleTime: 'זמן גמיש',
    startTime: 'שעת התחלה *',
    endTime: 'שעת סיום',
    locationType: 'סוג מיקום *',
    locationName: 'שם מיקום *',
    locationPlaceholder: 'לדוגמה, גן הורד, עין פרת',
    goal: 'מטרה',
    gradeRange: 'טווח רמה רצוי',
    gradePlaceholder: 'לדוגמה, 6a-6c',
    notes: 'הערות',
    notesPlaceholder: 'מידע נוסף...',
    gearNeeded: 'ציוד נדרש מהשותף',
    carpoolNeeded: 'צריך הסעה / שיתוף נסיעות',
    weightRelevant: 'התאמת משקל רלוונטית',
    maxWeightDiff: 'הפרש משקל מקסימלי (ק"ג)',
    maxWeightPlaceholder: 'לדוגמה, 15',
    submit: 'פרסם בקשה',
    errors: {
      required: 'תאריך ומיקום הם שדות חובה',
      noTime: 'הגדר שעת התחלה או סמן כגמיש',
      weightRange: 'הפרש המשקל חייב להיות בין 1-100 ק"ג',
      maxRequests: 'מותרות עד 2 בקשות פעילות. בטל בקשה קיימת תחילה.',
    },
  },
  cardDetails: {
    level: 'רמה',
    area: 'אזור',
    sport: 'ספורט',
    boulder: 'בולדר',
    gear: 'ציוד',
    languages: 'שפות',
    compatibility: 'התאמה',
    gradeMatches: 'טווח הרמה תואם',
    canOfferRide: 'יכול להסיע',
    theyNeedRide: 'צריך הסעה',
    requestDetails: 'פרטי הבקשה',
    date: 'תאריך',
    time: 'שעה',
    location: 'מיקום',
    goal: 'מטרה',
    grade: 'רמה',
    flexibleTime: 'גמיש',
    needsGear: 'דרוש ציוד',
    pass: 'דלג',
    interested: 'מעוניין',
    blockUser: 'חסום משתמש',
    reportUser: 'דווח על משתמש',
    areYouSure: 'אתה בטוח?',
    yesBlock: 'כן, חסום',
    cancel: 'ביטול',
    reportPlaceholder: 'למה אתה מדווח על משתמש זה?',
    submitReport: 'שלח דיווח',
    youHave: 'יש לך',
  },
  profile: {
    editTitle: 'ערוך פרופיל',
    createTitle: 'צור פרופיל',
    editSubtitle: 'עדכן את פרופיל הטיפוס שלך',
    createSubtitle: 'הגדר את הפרופיל שלך כדי להתחיל להתאים',
    changePhoto: 'שנה תמונה',
    uploadPhoto: 'העלה תמונה',
    required: 'חובה',
    displayName: 'שם תצוגה *',
    displayNamePlaceholder: 'שם הטיפוס שלך',
    phone: 'טלפון (WhatsApp) *',
    phonePlaceholder: '+972...',
    homeArea: 'אזור מגורים',
    homeAreaPlaceholder: 'לדוגמה, תל אביב',
    sportGrade: 'רמת ספורט',
    sportGradePlaceholder: 'לדוגמה, 6a-7a',
    boulderGrade: 'רמת בולדר',
    boulderGradePlaceholder: 'לדוגמה, V3-V6',
    weightPrivate: 'משקל (פרטי)',
    weightPlaceholder: 'משקלך בק"ג',
    showWeight: 'הצג משקל בפרופיל שלי',
    weightVisible: 'גלוי לשותפים פוטנציאליים להתאמת עיגון',
    weightHidden: 'מוסתר מכולם — משמש רק לניקוד התאמה',
    gearIHave: 'ציוד שיש לי',
    hasCar: 'יש לי מכונית',
    bio: 'ביוגרפיה',
    bioPlaceholder: 'ספר לאחרים על עצמך...',
    languages: 'שפות',
    languagesPlaceholder: 'אנגלית, עברית',
    save: 'שמור פרופיל',
    create: 'צור פרופיל',
    signedInAs: 'מחובר כ',
    signOut: 'התנתק',
    errors: {
      displayName: 'שם תצוגה הוא שדה חובה',
      photo: 'תמונה היא שדה חובה',
      phone: 'מספר טלפון נדרש להתאמה',
      weight: 'המשקל חייב להיות בין 30-200 ק"ג',
    },
  },
  settings: {
    title: 'הגדרות',
    subtitle: 'העדפות אפליקציה',
    language: 'שפה',
    english: 'English',
    hebrew: 'עברית',
  },
  toasts: {
    interestSent: 'עניין נשלח!',
    userBlocked: 'משתמש נחסם',
    reportSubmitted: 'הדיווח נשלח. תודה.',
    matchAccepted: 'התאמה אושרה!',
    interestDeclined: 'עניין נדחה',
    requestCancelled: 'הבקשה בוטלה',
    requestCreated: 'הבקשה נוצרה!',
  },
  goalTypes: {
    project: 'פרויקט',
    mileage: 'מרחק',
    easyDay: 'יום קל',
    training: 'אימון',
    any: 'כל',
  },
  gearLabels: {
    rope: 'חבל',
    quickdraws: 'אקספרסים',
    belayDevice: 'מכשיר עיגון',
    crashPad: 'מזרן',
    helmet: 'קסדה',
  },
  locationTypes: {
    gym: 'חדר כושר',
    crag: 'סלע',
  },
}

export const translations: Record<Language, Translations> = { en, he }
