export interface Translations {
  nav: {
    discover: string
    swipeDiscover: string
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
    yourPostLive: string
    interested: string
    activePostsCount: string
    newCount: string
    contactedCount: string
    pastDate: string
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
    editTitle: string
    editSubtitle: string
    editSubmit: string
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
    interestSent: string
    alreadyInterested: string
    pastDate: string
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
    instagram: string
    instagramPlaceholder: string
    facebook: string
    facebookPlaceholder: string
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
  }
  toasts: {
    interestSent: string
    userBlocked: string
    reportSubmitted: string
    matchAccepted: string
    interestDeclined: string
    requestCancelled: string
    requestCreated: string
    requestUpdated: string
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
    swipeDiscover: 'Discover',
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
    yourPostLive: 'Your post is live',
    interested: 'interested',
    activePostsCount: 'active posts',
    newCount: 'new',
    contactedCount: 'contacted',
    pastDate: 'Past date',
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
    title: 'My Posts',
    subtitle: 'Manage your climbing posts',
    loading: 'Loading...',
    noRequestsTitle: 'No posts yet',
    noRequestsSubtitle: 'Post a climbing request and let partners find you',
    createFirst: 'Post Your First Request',
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
    notes: 'Tell people what you\'re looking for',
    notesPlaceholder: 'Your level, what you\'re working on, what kind of partner you\'re looking for…',
    gearNeeded: 'Gear Needed From Partner',
    carpoolNeeded: 'Need a ride / carpool',
    weightRelevant: 'Weight matching relevant',
    maxWeightDiff: 'Max Weight Difference (kg)',
    maxWeightPlaceholder: 'e.g., 15',
    submit: 'Post Request',
    editTitle: 'Edit Request',
    editSubtitle: 'Update your climbing request',
    editSubmit: 'Save Changes',
    errors: {
      required: 'Date and location are required',
      noTime: 'Set a start time or mark as flexible',
      weightRange: 'Max weight difference must be between 1-100 kg',
      maxRequests: 'Maximum 10 active requests allowed. Cancel an existing one first.',
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
    interestSent: 'Interest Sent',
    alreadyInterested: "You've already shown interest",
    pastDate: 'This date has passed',
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
    instagram: 'Instagram',
    instagramPlaceholder: '@your_username',
    facebook: 'Facebook',
    facebookPlaceholder: 'facebook.com/yourname',
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
  },
  toasts: {
    interestSent: 'Interest sent!',
    userBlocked: 'User blocked',
    reportSubmitted: 'Report submitted. Thank you.',
    matchAccepted: 'Match accepted!',
    interestDeclined: 'Interest declined',
    requestCancelled: 'Request cancelled',
    requestCreated: 'Request created!',
    requestUpdated: 'Request updated!',
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


