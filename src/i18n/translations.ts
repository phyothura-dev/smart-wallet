export type Language = 'mm' | 'en';

export interface Translations {
  common: {
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    confirm: string;
    search: string;
    filter: string;
    clearFilters: string;
    all: string;
    date: string;
    amount: string;
    category: string;
    wallet: string;
    note: string;
    title: string;
    actions: string;
    noData: string;
    loading: string;
    total: string;
    optional: string;
    required: string;
    viewAll: string;
    exportCsv: string;
    recordsCount: string;
  };
  nav: {
    dashboard: string;
    incomes: string;
    expenses: string;
    loans: string;
    wallets: string;
    categories: string;
    transactions: string;
    profile: string;
    installApp: string;
    signOut: string;
    financeHub: string;
  };
  header: {
    offline: string;
    updateAvailable: string;
    switchToLight: string;
    switchToDark: string;
    switchLanguage: string;
  };
  auth: {
    signInTitle: string;
    signUpTitle: string;
    forgotTitle: string;
    orText: string;
    createAccountLink: string;
    alreadyHaveAccount: string;
    signInLink: string;
    backToSignIn: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    forgotPasswordLink: string;
    signInBtn: string;
    signUpBtn: string;
    sendResetBtn: string;
    orContinueWith: string;
    googleSignIn: string;
    checkEmailTitle: string;
    checkEmailDesc: string;
    fillAllFields: string;
    invalidEmail: string;
    passwordMinLength: string;
    welcomeBack: string;
    signUpSuccess: string;
    resetSentSuccess: string;
    resetFailed: string;
    invalidCredential: string;
    userNotFound: string;
    wrongPassword: string;
    emailInUse: string;
    operationNotAllowed: string;
    signUpError: string;
    googleError: string;
  };
  profile: {
    tabProfile: string;
    tabPreferences: string;
    languageTitle: string;
    languageDesc: string;
    langMyanmar: string;
    langEnglish: string;
    themeTitle: string;
    themeDesc: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    currencyTitle: string;
    baseCurrency: string;
    displayCurrency: string;
    exchangeRates: string;
    saveCurrency: string;
    currencySaved: string;
    resetRates: string;
    avatarLabel: string;
    randomAvatar: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    monthlyGoalLabel: string;
    monthlyGoalPlaceholder: string;
    saveProfile: string;
    nameRequired: string;
    goalPositiveError: string;
    updateSuccess: string;
    updateError: string;
  };
  telegram: {
    title: string;
    connectedBadge: string;
    notConnectedBadge: string;
    subtitle: string;
    connectedAccount: string;
    availableCommands: string;
    disconnectBtn: string;
    codeTitle: string;
    codeSubtitle: string;
    copyCode: string;
    copyCommand: string;
    openBot: string;
    newCode: string;
    connectBtn: string;
    loginRequired: string;
    apiNotFound: string;
    codeFailed: string;
    codeGenerated: string;
    disconnectFailed: string;
    disconnectSuccess: string;
    copyFailed: string;
  };
  pagination: {
    firstPage: string;
    prevPage: string;
    nextPage: string;
    lastPage: string;
  };
  dashboard: {
    totalBalance: string;
    monthlyIncome: string;
    monthlyExpense: string;
    netCashflow: string;
    monthlyGoal: string;
    goalAchieved: string;
    setGoalPrompt: string;
    walletBalances: string;
    noWallets: string;
    manageWallets: string;
    incomeVsExpense: string;
    expenseByCategory: string;
    noExpenseThisMonth: string;
    recentTransactions: string;
    noTransactions: string;
    loansOverview: string;
    toReceive: string;
    toPay: string;
    overdueLoans: string;
    viewLoans: string;
    incomeLabel: string;
    expenseLabel: string;
  };
  records: {
    addIncome: string;
    addExpense: string;
    editIncome: string;
    editExpense: string;
    searchPlaceholder: string;
    allCategories: string;
    allWallets: string;
    dateFrom: string;
    dateTo: string;
    allDates: string;
    thisMonth: string;
    lastMonth: string;
    thisWeek: string;
    customRange: string;
    titlePlaceholderIncome: string;
    titlePlaceholderExpense: string;
    amountPlaceholder: string;
    notePlaceholder: string;
    noIncomes: string;
    noExpenses: string;
    noFilteredResults: string;
    deleteConfirm: string;
    addSuccess: string;
    editSuccess: string;
    deleteSuccess: string;
    actionError: string;
    fillRequired: string;
    invalidAmount: string;
    selectCategory: string;
    selectWallet: string;
    totalFiltered: string;
  };
  transactions: {
    title: string;
    allTypes: string;
    incomeOnly: string;
    expenseOnly: string;
    searchPlaceholder: string;
    noTransactions: string;
    typeLabel: string;
    incomeBadge: string;
    expenseBadge: string;
    exportSuccess: string;
  };
  wallets: {
    addWallet: string;
    editWallet: string;
    transferBtn: string;
    totalBalanceAll: string;
    walletType: string;
    customName: string;
    customNamePlaceholder: string;
    initialBalance: string;
    currentBalance: string;
    transactionsCount: string;
    incomeTotal: string;
    expenseTotal: string;
    noWallets: string;
    deleteConfirm: string;
    addSuccess: string;
    editSuccess: string;
    deleteSuccess: string;
    transferTitle: string;
    fromWallet: string;
    toWallet: string;
    transferAmount: string;
    transferDate: string;
    transferSubmit: string;
    sameWalletError: string;
    transferSuccess: string;
    transferHistory: string;
    noTransfers: string;
  };
  categories: {
    incomeCategories: string;
    expenseCategories: string;
    addCategory: string;
    newCategoryPlaceholder: string;
    renameCategory: string;
    noCategories: string;
    deleteConfirm: string;
    addSuccess: string;
    renameSuccess: string;
    deleteSuccess: string;
    duplicateError: string;
  };
  loans: {
    addLoan: string;
    editLoan: string;
    lentTab: string;
    borrowedTab: string;
    allTab: string;
    lentLabel: string;
    borrowedLabel: string;
    totalToReceive: string;
    totalToPay: string;
    netLoanPosition: string;
    activeLoansCount: string;
    personName: string;
    personPlaceholder: string;
    principalAmount: string;
    paidAmount: string;
    remainingAmount: string;
    startDate: string;
    dueDate: string;
    statusPending: string;
    statusPartial: string;
    statusCompleted: string;
    overdue: string;
    addRepayment: string;
    repaymentHistory: string;
    repaymentAmount: string;
    repaymentDate: string;
    repaymentWallet: string;
    noLoans: string;
    deleteConfirm: string;
    addSuccess: string;
    editSuccess: string;
    deleteSuccess: string;
    repaymentSuccess: string;
    repaymentExceedsError: string;
  };
  app: {
    loadingPage: string;
    loadingData: string;
    dbErrorTitle: string;
    dbErrorSubtitle: string;
    reloadBtn: string;
    signOutBtn: string;
    signOutSuccess: string;
    signOutError: string;
  };
}

export const translations: Record<Language, Translations> = {
  mm: {
    common: {
      save: 'သိမ်းဆည်းမည်',
      saving: 'သိမ်းဆည်းနေသည်...',
      cancel: 'မလုပ်တော့ပါ',
      delete: 'ဖျက်မည်',
      edit: 'ပြင်ဆင်မည်',
      add: 'ထည့်သွင်းမည်',
      close: 'ပိတ်မည်',
      confirm: 'အတည်ပြုမည်',
      search: 'ရှာဖွေရန်...',
      filter: 'စစ်ထုတ်ရန်',
      clearFilters: 'Filter ရှင်းမည်',
      all: 'အားလုံး',
      date: 'ရက်စွဲ',
      amount: 'ပမာဏ',
      category: 'အမျိုးအစား',
      wallet: 'ပိုက်ဆံအိတ်',
      note: 'မှတ်ချက်',
      title: 'ခေါင်းစဉ်',
      actions: 'လုပ်ဆောင်ချက်',
      noData: 'မှတ်တမ်း မရှိသေးပါ',
      loading: 'ခဏစောင့်ပါ...',
      total: 'စုစုပေါင်း',
      optional: 'မထည့်လည်းရသည်',
      required: 'လိုအပ်သည်',
      viewAll: 'အားလုံးကြည့်ရန်',
      exportCsv: 'CSV ထုတ်မည်',
      recordsCount: 'ခု',
    },
    nav: {
      dashboard: 'ပင်မစာမျက်နှာ',
      incomes: 'ဝင်ငွေ',
      expenses: 'ထွက်ငွေ',
      loans: 'ချေးငွေနှင့် အကြွေးများ',
      wallets: 'ပိုက်ဆံအိတ်များ',
      categories: 'အမျိုးအစားများ',
      transactions: 'မှတ်တမ်း',
      profile: 'ဆက်တင်',
      installApp: 'App သွင်းမည်',
      signOut: 'အကောင့်မှ ထွက်မည်',
      financeHub: 'Finance Hub',
    },
    header: {
      offline: 'Offline',
      updateAvailable: 'Update ရပြီ',
      switchToLight: 'အလင်းပုံစံ (Light Mode) သို့ပြောင်းမည်',
      switchToDark: 'အမှောင်ပုံစံ (Dark Mode) သို့ပြောင်းမည်',
      switchLanguage: 'Change language (MM / EN)',
    },
    auth: {
      signInTitle: 'အကောင့်ဝင်ရောက်ပါ',
      signUpTitle: 'အကောင့်အသစ်ဖွင့်ပါ',
      forgotTitle: 'စကားဝှက် ပြန်ယူပါ',
      orText: 'သို့မဟုတ်',
      createAccountLink: 'အကောင့်အသစ်ဖွင့်မည်',
      alreadyHaveAccount: 'အကောင့်ရှိပြီးသားဖြစ်ပါက',
      signInLink: 'အကောင့်ဝင်ပါ',
      backToSignIn: 'အကောင့်ဝင်ရန် ပြန်သွားမည်',
      fullNameLabel: 'အမည် အပြည့်အစုံ',
      fullNamePlaceholder: 'ဦးမောင်မောင်',
      emailLabel: 'အီးမေးလ် လိပ်စာ',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'စကားဝှက်',
      forgotPasswordLink: 'စကားဝှက် မေ့နေပါသလား?',
      signInBtn: 'အကောင့်ဝင်မည်',
      signUpBtn: 'အကောင့်ဖွင့်မည်',
      sendResetBtn: 'လင့်ခ်ပေးပို့မည်',
      orContinueWith: 'သို့မဟုတ်',
      googleSignIn: 'Google ဖြင့် ဝင်ရောက်မည်',
      checkEmailTitle: 'အီးမေးလ်ကို စစ်ဆေးပါ',
      checkEmailDesc: 'စကားဝှက် ပြန်လည်သတ်မှတ်ရန် လင့်ခ်ကို အီးမေးလ်သို့ ပေးပို့လိုက်ပါပြီ။',
      fillAllFields: 'ကျေးဇူးပြု၍ အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ။',
      invalidEmail: 'မှန်ကန်သော အီးမေးလ်လိပ်စာ ရိုက်ထည့်ပေးပါ။',
      passwordMinLength: 'စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။',
      welcomeBack: 'ပြန်လည်ကြိုဆိုပါသည်!',
      signUpSuccess: 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ကြိုဆိုပါသည်!',
      resetSentSuccess: 'စကားဝှက်ပြန်လည်သတ်မှတ်ရန် လင့်ခ်ကို အီးမေးလ်သို့ ပေးပို့ပြီးပါပြီ။',
      resetFailed: 'စကားဝှက်ပြန်လည်သတ်မှတ်ခြင်း မအောင်မြင်ပါ။',
      invalidCredential: 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။',
      userNotFound: 'ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ထားခြင်း မရှိပါ။',
      wrongPassword: 'စကားဝှက် မှားယွင်းနေပါသည်။',
      emailInUse: 'ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပြီးသားဖြစ်ပါသည်။',
      operationNotAllowed: 'အကောင့်ဝင်ရောက်ခွင့် ပိတ်ထားပါသည်။',
      signUpError: 'အကောင့်ဖွင့်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။',
      googleError: 'Google အကောင့်ဖြင့် ဝင်ရောက်ခြင်း မအောင်မြင်ပါ',
    },
    profile: {
      tabProfile: 'ကိုယ်ရေးအချက်အလက်',
      tabPreferences: 'အပြင်အဆင်နှင့် ချိတ်ဆက်မှု',
      languageTitle: 'ဘာသာစကား (Language)',
      languageDesc: 'App တွင် အသုံးပြုလိုသော ဘာသာစကားကို ရွေးချယ်ပါ',
      langMyanmar: 'မြန်မာ (MM)',
      langEnglish: 'English (EN)',
      themeTitle: 'အသွင်အပြင် (Theme)',
      themeDesc: 'သင့်စိတ်ကြိုက် အလင်း သို့မဟုတ် အမှောင်ပုံစံကို ရွေးချယ်ပါ',
      themeLight: 'အလင်း (Light)',
      themeDark: 'အမှောင် (Dark)',
      themeSystem: 'စနစ်အတိုင်း',
      currencyTitle: 'ငွေကြေး (Currency)',
      baseCurrency: 'ပင်မငွေကြေး',
      displayCurrency: 'ပြသမည့်ငွေကြေး',
      exchangeRates: 'ငွေလဲနှုန်း (1 ယူနစ် = MMK)',
      saveCurrency: 'ငွေကြေးသိမ်းမည်',
      currencySaved: 'ငွေကြေးသတ်မှတ်ချက် သိမ်းဆည်းပြီးပါပြီ။',
      resetRates: 'မူလနှုန်းထား',
      avatarLabel: 'ပရိုဖိုင်ပုံ',
      randomAvatar: 'ကျပန်းပုံစံ',
      fullNameLabel: 'အမည်',
      fullNamePlaceholder: 'ဦးမောင်မောင်',
      monthlyGoalLabel: 'လစဉ် ရည်မှန်းချက် (Ks)',
      monthlyGoalPlaceholder: 'ဥပမာ - ၁,၀၀၀,၀၀၀',
      saveProfile: 'သိမ်းဆည်းမည်',
      nameRequired: 'အမည်ထည့်သွင်းရန် လိုအပ်ပါသည်။',
      goalPositiveError: 'လစဉ်ဝင်ငွေ ရည်မှန်းချက်သည် အပေါင်းကိန်း ဖြစ်ရပါမည်။',
      updateSuccess: 'ပရိုဖိုင် အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။',
      updateError: 'ပရိုဖိုင် ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။',
    },
    telegram: {
      title: 'Telegram Bot ချိတ်ဆက်မှု',
      connectedBadge: 'ချိတ်ဆက်ပြီး',
      notConnectedBadge: 'မချိတ်ဆက်ရသေးပါ',
      subtitle: 'Telegram မှတဆင့် ဝင်ငွေ/အသုံးစရိတ် အမြန်မှတ်တမ်းတင်ပြီး လက်ကျန်ငွေများ စစ်ဆေးနိုင်ပါသည်',
      connectedAccount: 'ချိတ်ဆက်ထားသော Telegram',
      availableCommands: 'အသုံးပြုနိုင်သော Commands များ:',
      disconnectBtn: 'ချိတ်ဆက်မှု ဖြုတ်မည်',
      codeTitle: 'သင့် Telegram ချိတ်ဆက်ရန် Code (၁၀ မိနစ် သက်တမ်း)',
      codeSubtitle: 'Telegram Bot ထဲသို့ အောက်ပါ command ကို ပို့ပေးပါ:',
      copyCode: 'Code ကူးယူရန်',
      copyCommand: 'ကူးယူမည်',
      openBot: 'Telegram Bot ဖွင့်မည်',
      newCode: 'Code အသစ်ထုတ်မည်',
      connectBtn: 'Connect Telegram',
      loginRequired: 'အကောင့်ဝင်ထားရန် လိုအပ်ပါသည်။',
      apiNotFound: 'API endpoint မတွေ့ပါ (Vercel သို့မဟုတ် vercel dev ဖြင့် run ရန်လိုအပ်ပါသည်)။',
      codeFailed: 'Link code ထုတ်ယူခြင်း မအောင်မြင်ပါ။',
      codeGenerated: 'Telegram ချိတ်ဆက်ရန် Code ထုတ်ပြီးပါပြီ (၁၀ မိနစ်အတွင်း အသုံးပြုပါ)။',
      disconnectFailed: 'ချိတ်ဆက်မှု ဖြုတ်ခြင်း မအောင်မြင်ပါ။',
      disconnectSuccess: 'Telegram ချိတ်ဆက်မှု ဖြုတ်ပြီးပါပြီ။',
      copyFailed: 'Copy ကူးယူခြင်း မအောင်မြင်ပါ။',
    },
    pagination: {
      firstPage: 'ပထမဆုံး စာမျက်နှာ',
      prevPage: 'ရှေ့စာမျက်နှာ',
      nextPage: 'နောက်စာမျက်နှာ',
      lastPage: 'နောက်ဆုံး စာမျက်နှာ',
    },
    dashboard: {
      totalBalance: 'စုစုပေါင်း လက်ကျန်ငွေ',
      monthlyIncome: 'ယခုလ ဝင်ငွေ',
      monthlyExpense: 'ယခုလ ထွက်ငွေ',
      netCashflow: 'ယခုလ အသားတင်လက်ကျန်',
      monthlyGoal: 'လစဉ် ဝင်ငွေရည်မှန်းချက်',
      goalAchieved: 'ပြည့်မီမှု',
      setGoalPrompt: 'ပရိုဖိုင်တွင် ရည်မှန်းချက် သတ်မှတ်နိုင်ပါသည်',
      walletBalances: 'ပိုက်ဆံအိတ် လက်ကျန်များ',
      noWallets: 'ပိုက်ဆံအိတ် မရှိသေးပါ',
      manageWallets: 'စီမံခန့်ခွဲရန်',
      incomeVsExpense: 'ဝင်ငွေ နှင့် ထွက်ငွေ နှိုင်းယှဉ်ချက်',
      expenseByCategory: 'အမျိုးအစားအလိုက် အသုံးစရိတ်',
      noExpenseThisMonth: 'ယခုလ အသုံးစရိတ် မှတ်တမ်းမရှိသေးပါ',
      recentTransactions: 'မကြာသေးမီ မှတ်တမ်းများ',
      noTransactions: 'မှတ်တမ်းများ မရှိသေးပါ',
      loansOverview: 'ချေးငွေနှင့် အကြွေး အနှစ်ချုပ်',
      toReceive: 'ရရန်ရှိ',
      toPay: 'ပေးရန်ရှိ',
      overdueLoans: 'ရက်ကျော်ချေးငွေ',
      viewLoans: 'အသေးစိတ်ကြည့်ရန်',
      incomeLabel: 'ဝင်ငွေ',
      expenseLabel: 'ထွက်ငွေ',
    },
    records: {
      addIncome: 'ဝင်ငွေအသစ် ထည့်မည်',
      addExpense: 'ထွက်ငွေအသစ် ထည့်မည်',
      editIncome: 'ဝင်ငွေ ပြင်ဆင်မည်',
      editExpense: 'ထွက်ငွေ ပြင်ဆင်မည်',
      searchPlaceholder: 'ခေါင်းစဉ် သို့မဟုတ် မှတ်ချက်ဖြင့် ရှာမည်...',
      allCategories: 'အမျိုးအစား အားလုံး',
      allWallets: 'ပိုက်ဆံအိတ် အားလုံး',
      dateFrom: 'မှ',
      dateTo: 'ထိ',
      allDates: 'ရက်စွဲ အားလုံး',
      thisMonth: 'ယခုလ',
      lastMonth: 'ပြီးခဲ့သောလ',
      thisWeek: 'ယခုအပတ်',
      customRange: 'ရက်စွဲရွေးမည်',
      titlePlaceholderIncome: 'ဥပမာ - လစာ၊ အပိုဝင်ငွေ',
      titlePlaceholderExpense: 'ဥပမာ - နေ့လယ်စာ၊ ကော်ဖီ',
      amountPlaceholder: '0',
      notePlaceholder: 'အသေးစိတ်မှတ်ချက်...',
      noIncomes: 'ဝင်ငွေ မှတ်တမ်း မရှိသေးပါ',
      noExpenses: 'ထွက်ငွေ မှတ်တမ်း မရှိသေးပါ',
      noFilteredResults: 'ရှာဖွေမှုနှင့် ကိုက်ညီသော မှတ်တမ်း မရှိပါ',
      deleteConfirm: 'ဤမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?',
      addSuccess: 'မှတ်တမ်း အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။',
      editSuccess: 'မှတ်တမ်း အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။',
      deleteSuccess: 'မှတ်တမ်း ဖျက်ပြီးပါပြီ။',
      actionError: 'လုပ်ဆောင်ချက် မအောင်မြင်ပါ။',
      fillRequired: 'လိုအပ်သော အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပါ။',
      invalidAmount: 'မှန်ကန်သော ပမာဏ ထည့်သွင်းပါ။',
      selectCategory: 'အမျိုးအစား ရွေးပါ',
      selectWallet: 'ပိုက်ဆံအိတ် ရွေးပါ',
      totalFiltered: 'စုစုပေါင်း',
    },
    transactions: {
      title: 'ငွေကြေးမှတ်တမ်း အားလုံး',
      allTypes: 'အားလုံး',
      incomeOnly: 'ဝင်ငွေသီးသန့်',
      expenseOnly: 'ထွက်ငွေသီးသန့်',
      searchPlaceholder: 'ခေါင်းစဉ်၊ အမျိုးအစားဖြင့် ရှာဖွေရန်...',
      noTransactions: 'မှတ်တမ်းများ မရှိသေးပါ',
      typeLabel: 'အမျိုးအစား',
      incomeBadge: 'ဝင်ငွေ',
      expenseBadge: 'ထွက်ငွေ',
      exportSuccess: 'CSV ဖိုင် ထုတ်ယူပြီးပါပြီ။',
    },
    wallets: {
      addWallet: 'ပိုက်ဆံအိတ် အသစ်ထည့်မည်',
      editWallet: 'ပိုက်ဆံအိတ် ပြင်ဆင်မည်',
      transferBtn: 'ငွေလွှဲမည်',
      totalBalanceAll: 'ပိုက်ဆံအိတ်အားလုံး စုစုပေါင်းလက်ကျန်',
      walletType: 'ပိုက်ဆံအိတ် အမျိုးအစား',
      customName: 'အမည် (Optional)',
      customNamePlaceholder: 'ဥပမာ - နေ့စဉ်သုံး KPay',
      initialBalance: 'မူလလက်ကျန်ငွေ',
      currentBalance: 'လက်ရှိလက်ကျန်',
      transactionsCount: 'မှတ်တမ်း',
      incomeTotal: 'ဝင်ငွေ',
      expenseTotal: 'ထွက်ငွေ',
      noWallets: 'ပိုက်ဆံအိတ် မရှိသေးပါ',
      deleteConfirm: 'ဤပိုက်ဆံအိတ်ကို ဖျက်ရန် သေချာပါသလား?',
      addSuccess: 'ပိုက်ဆံအိတ် အသစ်ထည့်ပြီးပါပြီ။',
      editSuccess: 'ပိုက်ဆံအိတ် ပြင်ဆင်ပြီးပါပြီ။',
      deleteSuccess: 'ပိုက်ဆံအိတ် ဖျက်ပြီးပါပြီ။',
      transferTitle: 'ပိုက်ဆံအိတ် အချင်းချင်း ငွေလွှဲမည်',
      fromWallet: 'လွှဲမည့် ပိုက်ဆံအိတ်',
      toWallet: 'လက်ခံမည့် ပိုက်ဆံအိတ်',
      transferAmount: 'လွှဲမည့် ပမာဏ',
      transferDate: 'ရက်စွဲ',
      transferSubmit: 'ငွေလွှဲအတည်ပြုမည်',
      sameWalletError: 'တူညီသော ပိုက်ဆံအိတ်သို့ ငွေလွှဲ၍မရပါ။',
      transferSuccess: 'ငွေလွှဲခြင်း အောင်မြင်ပါသည်။',
      transferHistory: 'ငွေလွှဲမှတ်တမ်းများ',
      noTransfers: 'ငွေလွှဲမှတ်တမ်း မရှိသေးပါ',
    },
    categories: {
      incomeCategories: 'ဝင်ငွေ အမျိုးအစားများ',
      expenseCategories: 'ထွက်ငွေ အမျိုးအစားများ',
      addCategory: 'အမျိုးအစား ထည့်မည်',
      newCategoryPlaceholder: 'အမျိုးအစား အမည်အသစ်...',
      renameCategory: 'အမည်ပြောင်းမည်',
      noCategories: 'အမျိုးအစား မရှိသေးပါ',
      deleteConfirm: 'ဤအမျိုးအစားကို ဖျက်ရန် သေချာပါသလား?',
      addSuccess: 'အမျိုးအစား အသစ်ထည့်ပြီးပါပြီ။',
      renameSuccess: 'အမျိုးအစား အမည်ပြောင်းပြီးပါပြီ။',
      deleteSuccess: 'အမျိုးအစား ဖျက်ပြီးပါပြီ။',
      duplicateError: 'ဤအမည်ဖြင့် အမျိုးအစား ရှိပြီးသားဖြစ်ပါသည်။',
    },
    loans: {
      addLoan: 'ချေးငွေအသစ် ထည့်မည်',
      editLoan: 'ချေးငွေ ပြင်ဆင်မည်',
      lentTab: 'ရရန်ရှိ (ပေးထား)',
      borrowedTab: 'ပေးရန်ရှိ (ယူထား)',
      allTab: 'အားလုံး',
      lentLabel: 'ပေးချေးထားငွေ',
      borrowedLabel: 'ချေးယူထားငွေ',
      totalToReceive: 'စုစုပေါင်း ရရန်ရှိ',
      totalToPay: 'စုစုပေါင်း ပေးရန်ရှိ',
      netLoanPosition: 'အသားတင် ချေးငွေအခြေအနေ',
      activeLoansCount: 'မကြေသေးသော ချေးငွေ',
      personName: 'သူ/အဖွဲ့အစည်း အမည်',
      personPlaceholder: 'ဥပမာ - ကိုအောင်',
      principalAmount: 'မူလပမာဏ',
      paidAmount: 'ဆပ်ပြီးပမာဏ',
      remainingAmount: 'ကျန်ငွေ',
      startDate: 'စတင်ရက်စွဲ',
      dueDate: 'ပြန်ဆပ်ရမည့်ရက်',
      statusPending: 'ဆပ်ရန်ကျန်',
      statusPartial: 'တစ်စိတ်တစ်ပိုင်းဆပ်ပြီး',
      statusCompleted: 'အကြွေးကြေပြီး',
      overdue: 'ရက်ကျော်',
      addRepayment: 'ငွေဆပ်မှတ်တမ်းထည့်မည်',
      repaymentHistory: 'ပြန်ဆပ်မှတ်တမ်းများ',
      repaymentAmount: 'ဆပ်သည့်ပမာဏ',
      repaymentDate: 'ဆပ်သည့်ရက်စွဲ',
      repaymentWallet: 'ပိုက်ဆံအိတ်',
      noLoans: 'ချေးငွေ မှတ်တမ်း မရှိသေးပါ',
      deleteConfirm: 'ဤချေးငွေ မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?',
      addSuccess: 'ချေးငွေ မှတ်တမ်းတင်ပြီးပါပြီ။',
      editSuccess: 'ချေးငွေ ပြင်ဆင်ပြီးပါပြီ။',
      deleteSuccess: 'ချေးငွေ ဖျက်ပြီးပါပြီ။',
      repaymentSuccess: 'ပြန်ဆပ်ငွေ မှတ်တမ်းတင်ပြီးပါပြီ။',
      repaymentExceedsError: 'ဆပ်သည့်ပမာဏသည် ကျန်ငွေထက် များနေပါသည်။',
    },
    app: {
      loadingPage: 'စာမျက်နှာ ဖွင့်နေပါသည်...',
      loadingData: 'အချက်အလက်များ ရယူနေပါသည်...',
      dbErrorTitle: 'Database Connection Trouble',
      dbErrorSubtitle: 'SmartWallet secure synchronization could not be established',
      reloadBtn: 'ပြန်လည်စတင်မည်',
      signOutBtn: 'အကောင့်မှ ထွက်မည်',
      signOutSuccess: 'အကောင့်မှ ထွက်ခွာပြီးပါပြီ။',
      signOutError: 'အကောင့်မှ ထွက်ခွာရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။',
    },
  },
  en: {
    common: {
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      confirm: 'Confirm',
      search: 'Search...',
      filter: 'Filter',
      clearFilters: 'Clear Filters',
      all: 'All',
      date: 'Date',
      amount: 'Amount',
      category: 'Category',
      wallet: 'Wallet',
      note: 'Note',
      title: 'Title',
      actions: 'Actions',
      noData: 'No records yet',
      loading: 'Loading...',
      total: 'Total',
      optional: 'Optional',
      required: 'Required',
      viewAll: 'View All',
      exportCsv: 'Export CSV',
      recordsCount: 'items',
    },
    nav: {
      dashboard: 'Dashboard',
      incomes: 'Income',
      expenses: 'Expenses',
      loans: 'Loans & Debts',
      wallets: 'Wallets',
      categories: 'Categories',
      transactions: 'Transactions',
      profile: 'Settings',
      installApp: 'Install App',
      signOut: 'Sign Out',
      financeHub: 'Finance Hub',
    },
    header: {
      offline: 'Offline',
      updateAvailable: 'Update Ready',
      switchToLight: 'Switch to Light Mode',
      switchToDark: 'Switch to Dark Mode',
      switchLanguage: 'Switch Language (MM / EN)',
    },
    auth: {
      signInTitle: 'Sign in to your account',
      signUpTitle: 'Create a new account',
      forgotTitle: 'Reset your password',
      orText: 'Or',
      createAccountLink: 'create a new account',
      alreadyHaveAccount: 'Already have an account?',
      signInLink: 'Sign in',
      backToSignIn: 'Back to sign in',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'John Doe',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Password',
      forgotPasswordLink: 'Forgot password?',
      signInBtn: 'Sign In',
      signUpBtn: 'Sign Up',
      sendResetBtn: 'Send Reset Link',
      orContinueWith: 'Or continue with',
      googleSignIn: 'Continue with Google',
      checkEmailTitle: 'Check your email',
      checkEmailDesc: 'We have sent a password reset link to your email address.',
      fillAllFields: 'Please fill in all required fields.',
      invalidEmail: 'Please enter a valid email address.',
      passwordMinLength: 'Password must be at least 6 characters.',
      welcomeBack: 'Welcome back!',
      signUpSuccess: 'Account created successfully. Welcome!',
      resetSentSuccess: 'Password reset link has been sent to your email.',
      resetFailed: 'Failed to send password reset email.',
      invalidCredential: 'Invalid email or password.',
      userNotFound: 'No account found with this email.',
      wrongPassword: 'Incorrect password.',
      emailInUse: 'An account with this email already exists.',
      operationNotAllowed: 'Email/Password sign-in is disabled.',
      signUpError: 'Failed to create account.',
      googleError: 'Google sign-in failed',
    },
    profile: {
      tabProfile: 'Profile',
      tabPreferences: 'Preferences',
      languageTitle: 'Language',
      languageDesc: 'Choose your preferred language for the app interface',
      langMyanmar: 'မြန်မာ (MM)',
      langEnglish: 'English (EN)',
      themeTitle: 'Appearance (Theme)',
      themeDesc: 'Choose light, dark, or match your system preference',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
      currencyTitle: 'Currency',
      baseCurrency: 'Primary Currency',
      displayCurrency: 'Display Currency',
      exchangeRates: 'Exchange Rates (1 unit = MMK)',
      saveCurrency: 'Save Currency',
      currencySaved: 'Currency settings saved.',
      resetRates: 'Reset Defaults',
      avatarLabel: 'Profile Avatar',
      randomAvatar: 'Randomize',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'John Doe',
      monthlyGoalLabel: 'Monthly Income Goal (Ks)',
      monthlyGoalPlaceholder: 'e.g. 1,000,000',
      saveProfile: 'Save Changes',
      nameRequired: 'Full name is required.',
      goalPositiveError: 'Monthly income goal must be a positive number.',
      updateSuccess: 'Profile updated successfully.',
      updateError: 'Failed to update profile.',
    },
    telegram: {
      title: 'Telegram Bot Integration',
      connectedBadge: 'Connected',
      notConnectedBadge: 'Not Connected',
      subtitle: 'Quickly log income/expenses and check wallet balances directly from Telegram',
      connectedAccount: 'Connected Telegram',
      availableCommands: 'Available Commands:',
      disconnectBtn: 'Disconnect',
      codeTitle: 'Your Telegram Link Code (Valid for 10 mins)',
      codeSubtitle: 'Send the following command to the Telegram Bot:',
      copyCode: 'Copy code',
      copyCommand: 'Copy',
      openBot: 'Open Telegram Bot',
      newCode: 'New Code',
      connectBtn: 'Connect Telegram',
      loginRequired: 'Please sign in first.',
      apiNotFound: 'API endpoint not found (requires Vercel or vercel dev).',
      codeFailed: 'Failed to generate link code.',
      codeGenerated: 'Link code generated (valid for 10 minutes).',
      disconnectFailed: 'Failed to disconnect Telegram.',
      disconnectSuccess: 'Telegram disconnected successfully.',
      copyFailed: 'Failed to copy to clipboard.',
    },
    pagination: {
      firstPage: 'First page',
      prevPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
    },
    dashboard: {
      totalBalance: 'Total Balance',
      monthlyIncome: 'Monthly Income',
      monthlyExpense: 'Monthly Expense',
      netCashflow: 'Monthly Net Cashflow',
      monthlyGoal: 'Monthly Income Goal',
      goalAchieved: 'Achieved',
      setGoalPrompt: 'Set a monthly goal in Profile',
      walletBalances: 'Wallet Balances',
      noWallets: 'No wallets yet',
      manageWallets: 'Manage',
      incomeVsExpense: 'Income vs Expense',
      expenseByCategory: 'Expenses by Category',
      noExpenseThisMonth: 'No expenses recorded this month',
      recentTransactions: 'Recent Transactions',
      noTransactions: 'No transactions yet',
      loansOverview: 'Loans & Debts Overview',
      toReceive: 'To Receive',
      toPay: 'To Pay',
      overdueLoans: 'Overdue',
      viewLoans: 'View Details',
      incomeLabel: 'Income',
      expenseLabel: 'Expense',
    },
    records: {
      addIncome: 'Add Income',
      addExpense: 'Add Expense',
      editIncome: 'Edit Income',
      editExpense: 'Edit Expense',
      searchPlaceholder: 'Search by title or note...',
      allCategories: 'All Categories',
      allWallets: 'All Wallets',
      dateFrom: 'From',
      dateTo: 'To',
      allDates: 'All Dates',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisWeek: 'This Week',
      customRange: 'Custom Range',
      titlePlaceholderIncome: 'e.g. Salary, Freelance',
      titlePlaceholderExpense: 'e.g. Lunch, Coffee',
      amountPlaceholder: '0',
      notePlaceholder: 'Optional note...',
      noIncomes: 'No income records yet',
      noExpenses: 'No expense records yet',
      noFilteredResults: 'No records match your filters',
      deleteConfirm: 'Are you sure you want to delete this record?',
      addSuccess: 'Record added successfully.',
      editSuccess: 'Record updated successfully.',
      deleteSuccess: 'Record deleted.',
      actionError: 'Operation failed.',
      fillRequired: 'Please fill in all required fields.',
      invalidAmount: 'Please enter a valid amount.',
      selectCategory: 'Select category',
      selectWallet: 'Select wallet',
      totalFiltered: 'Total',
    },
    transactions: {
      title: 'All Transactions',
      allTypes: 'All',
      incomeOnly: 'Income Only',
      expenseOnly: 'Expense Only',
      searchPlaceholder: 'Search by title or category...',
      noTransactions: 'No transactions yet',
      typeLabel: 'Type',
      incomeBadge: 'Income',
      expenseBadge: 'Expense',
      exportSuccess: 'CSV exported successfully.',
    },
    wallets: {
      addWallet: 'Add Wallet',
      editWallet: 'Edit Wallet',
      transferBtn: 'Transfer',
      totalBalanceAll: 'Total Balance Across All Wallets',
      walletType: 'Wallet Type',
      customName: 'Custom Name (Optional)',
      customNamePlaceholder: 'e.g. Daily KBZPay',
      initialBalance: 'Initial Balance',
      currentBalance: 'Current Balance',
      transactionsCount: 'Transactions',
      incomeTotal: 'Income',
      expenseTotal: 'Expense',
      noWallets: 'No wallets yet',
      deleteConfirm: 'Are you sure you want to delete this wallet?',
      addSuccess: 'Wallet added successfully.',
      editSuccess: 'Wallet updated successfully.',
      deleteSuccess: 'Wallet deleted.',
      transferTitle: 'Transfer Between Wallets',
      fromWallet: 'From Wallet',
      toWallet: 'To Wallet',
      transferAmount: 'Amount',
      transferDate: 'Date',
      transferSubmit: 'Confirm Transfer',
      sameWalletError: 'Cannot transfer to the same wallet.',
      transferSuccess: 'Transfer completed successfully.',
      transferHistory: 'Transfer History',
      noTransfers: 'No transfers yet',
    },
    categories: {
      incomeCategories: 'Income Categories',
      expenseCategories: 'Expense Categories',
      addCategory: 'Add Category',
      newCategoryPlaceholder: 'New category name...',
      renameCategory: 'Rename',
      noCategories: 'No categories yet',
      deleteConfirm: 'Are you sure you want to delete this category?',
      addSuccess: 'Category added successfully.',
      renameSuccess: 'Category renamed successfully.',
      deleteSuccess: 'Category deleted.',
      duplicateError: 'A category with this name already exists.',
    },
    loans: {
      addLoan: 'Add Loan',
      editLoan: 'Edit Loan',
      lentTab: 'Lent (To Receive)',
      borrowedTab: 'Borrowed (To Pay)',
      allTab: 'All',
      lentLabel: 'Lent Out',
      borrowedLabel: 'Borrowed',
      totalToReceive: 'Total To Receive',
      totalToPay: 'Total To Pay',
      netLoanPosition: 'Net Loan Position',
      activeLoansCount: 'Active Loans',
      personName: 'Person / Entity Name',
      personPlaceholder: 'e.g. Aung Aung',
      principalAmount: 'Principal Amount',
      paidAmount: 'Paid',
      remainingAmount: 'Remaining',
      startDate: 'Start Date',
      dueDate: 'Due Date',
      statusPending: 'Pending',
      statusPartial: 'Partial',
      statusCompleted: 'Completed',
      overdue: 'Overdue',
      addRepayment: 'Add Repayment',
      repaymentHistory: 'Repayment History',
      repaymentAmount: 'Repayment Amount',
      repaymentDate: 'Repayment Date',
      repaymentWallet: 'Wallet',
      noLoans: 'No loan records yet',
      deleteConfirm: 'Are you sure you want to delete this loan?',
      addSuccess: 'Loan added successfully.',
      editSuccess: 'Loan updated successfully.',
      deleteSuccess: 'Loan deleted.',
      repaymentSuccess: 'Repayment recorded successfully.',
      repaymentExceedsError: 'Repayment amount exceeds remaining balance.',
    },
    app: {
      loadingPage: 'Loading page...',
      loadingData: 'Loading your data...',
      dbErrorTitle: 'Database Connection Trouble',
      dbErrorSubtitle: 'SmartWallet secure synchronization could not be established',
      reloadBtn: 'Reload',
      signOutBtn: 'Sign Out',
      signOutSuccess: 'Signed out successfully.',
      signOutError: 'Failed to sign out.',
    },
  },
};
