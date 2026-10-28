export type Locale = "id" | "en";

export interface Dictionary {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    update: string;
    add: string;
    close: string;
    back: string;
    search: string;
    all: string;
    loading: string;
    noData: string;
    confirm: string;
    yes: string;
    no: string;
    actions: string;
    filter: string;
    reset: string;
    download: string;
    export: string;
    import: string;
    total: string;
    status: string;
    description: string;
    notes: string;
    date: string;
    time: string;
    nominal: string;
    category: string;
    wallet: string;
    type: string;
    copy: string;
    or: string;
  };
  nav: {
    transactions: string;
    wallets: string;
    reports: string;
    debts: string;
    categories: string;
    settings: string;
    newTransaction: string;
    mainMenu: string;
    others: string;
    toggleSidebar: string;
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      googleButton: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      forgotPasswordLink: string;
      submit: string;
      submitting: string;
      noAccount: string;
      registerLink: string;
    };
    register: {
      title: string;
      subtitle: string;
      googleButton: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      strengthLabel: string;
      strengthWeak: string;
      strengthMedium: string;
      strengthStrong: string;
      submit: string;
      submitting: string;
      hasAccount: string;
      loginLink: string;
      checkEmailTitle: string;
      checkEmailDescription: string;
      backToLoginButton: string;
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      emailLabel: string;
      emailPlaceholder: string;
      submit: string;
      submitting: string;
      backToLogin: string;
      successMessage: string;
    };
    resetPassword: {
      title: string;
      subtitle: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      submit: string;
      submitting: string;
      successMessage: string;
    };
  };
  transactions: {
    title: string;
    subtitle: string;
    dataCount: string;
    addNew: string;
    emptyState: string;
    emptyFilterState: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    types: {
      income: string;
      expense: string;
      transfer: string;
      correction: string;
    };
    tabs: {
      all: string;
      expense: string;
      income: string;
      transfer: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      copyTitle: string;
      type: string;
      nominal: string;
      nominalPlaceholder: string;
      wallet: string;
      walletPlaceholder: string;
      destinationWallet: string;
      destinationWalletPlaceholder: string;
      category: string;
      categoryPlaceholder: string;
      date: string;
      time: string;
      titleOrNotes: string;
      titleOrNotesPlaceholder: string;
      notes: string;
      notesPlaceholder: string;
      submitCreate: string;
      submitUpdate: string;
    };
    filter: {
      title: string;
      allTypes: string;
      allWallets: string;
      allCategories: string;
      dateRange: string;
      minAmount: string;
      maxAmount: string;
      sortBy: string;
      sortByDate: string;
      sortByAmount: string;
      sortOrder: string;
      sortDesc: string;
      sortAsc: string;
      resetFilter: string;
      applyFilter: string;
      activeFilters: string;
      clearAll: string;
      period: string;
      periodToday: string;
      periodThisWeek: string;
      periodThisMonth: string;
      periodThisYear: string;
      periodAllTime: string;
      periodCustom: string;
    };
    summary: {
      income: string;
      expense: string;
      balance: string;
    };
    detail: {
      title: string;
      type: string;
      nominal: string;
      date: string;
      time: string;
      wallet: string;
      sourceWallet: string;
      destinationWallet: string;
      category: string;
      notes: string;
      createdAt: string;
      updatedAt: string;
      editButton: string;
      copyButton: string;
      deleteButton: string;
    };
    ai: {
      voiceInput: string;
      fileAutoFill: string;
      listening: string;
      processing: string;
      error: string;
      fileUploadHint: string;
    };
    pagination: {
      showing: string;
      of: string;
      transactions: string;
      prevPage: string;
      nextPage: string;
    };
  };
  wallets: {
    title: string;
    subtitle: string;
    addNew: string;
    emptyState: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    types: {
      cash: string;
      bank: string;
      ewallet: string;
      investment: string;
      other: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      name: string;
      namePlaceholder: string;
      type: string;
      typePlaceholder: string;
      initialBalance: string;
      currentBalance: string;
      accountNumber: string;
      accountNumberPlaceholder: string;
      color: string;
      excludeTotal: string;
      excludeTotalDescription: string;
      selectBankPreset: string;
      submitCreate: string;
      submitUpdate: string;
    };
    detail: {
      title: string;
      currentBalance: string;
      initialBalance: string;
      accountNumber: string;
      transactionsHistory: string;
      correction: string;
      correctionTitle: string;
      correctionDescription: string;
      emptyTransactions: string;
      totalIncome: string;
      totalExpense: string;
    };
  };
  debts: {
    title: string;
    subtitle: string;
    addNew: string;
    emptyState: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    types: {
      debt: string;
      receivable: string;
      give: string;
      receive: string;
    };
    status: {
      active: string;
      paidOff: string;
      overdue: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      editContactTitle: string;
      type: string;
      personName: string;
      personNamePlaceholder: string;
      nominal: string;
      startDate: string;
      dueDate: string;
      wallet: string;
      walletPlaceholder: string;
      notes: string;
      notesPlaceholder: string;
      submitCreate: string;
      submitUpdate: string;
    };
    detail: {
      title: string;
      contact: string;
      totalLoaned: string;
      totalBorrowed: string;
      totalReturned: string;
      remainingBalance: string;
      installments: string;
      addInstallment: string;
      markAsPaid: string;
      markAsActive: string;
      emptyInstallments: string;
    };
    installment: {
      title: string;
      createTitle: string;
      editTitle: string;
      paymentType: string;
      typePayment: string;
      typeLoan: string;
      nominal: string;
      date: string;
      wallet: string;
      notes: string;
      submit: string;
      deleteConfirmTitle: string;
      deleteConfirmDescription: string;
    };
  };
  categories: {
    title: string;
    subtitle: string;
    addNew: string;
    emptyState: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    types: {
      income: string;
      expense: string;
      all: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      name: string;
      namePlaceholder: string;
      type: string;
      icon: string;
      color: string;
      submitCreate: string;
      submitUpdate: string;
    };
  };
  reports: {
    title: string;
    subtitle: string;
    period: string;
    customPeriod: string;
    tabs: {
      monthly: string;
      realtime: string;
      custom: string;
    };
    months: {
      jan: string;
      feb: string;
      mar: string;
      apr: string;
      may: string;
      jun: string;
      jul: string;
      aug: string;
      sep: string;
      oct: string;
      nov: string;
      dec: string;
    };
    summary: {
      totalIncome: string;
      totalExpense: string;
      netIncome: string;
      initialBalance: string;
      accumulatedBalance: string;
      endingBalance: string;
    };
    chart: {
      expenseByCategory: string;
      incomeByCategory: string;
      monthlyTrend: string;
      cashFlow: string;
      noExpenseData: string;
      noIncomeData: string;
    };
    budget: {
      title: string;
      spent: string;
      remaining: string;
      limit: string;
      overBudget: string;
    };
    settings: {
      title: string;
      cutoffDayLabel: string;
      cutoffDayDescription: string;
      accumulateBalanceLabel: string;
      accumulateBalanceDescription: string;
      saveButton: string;
    };
    export: {
      excelButton: string;
      pdfButton: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    tabs: {
      general: string;
      security: string;
    };
    profile: {
      title: string;
      description: string;
      nameLabel: string;
      emailLabel: string;
      avatarLabel: string;
      uploadAvatar: string;
      removeAvatar: string;
      saveButton: string;
    };
    preferences: {
      title: string;
      description: string;
      themeLabel: string;
      themeLight: string;
      themeDark: string;
      themeSystem: string;
      languageLabel: string;
      languageId: string;
      languageEn: string;
      currencyLabel: string;
      dateFormatLabel: string;
      numberFormatLabel: string;
      timeFormatLabel: string;
      landingPageLabel: string;
      decimalPlacesLabel: string;
      cutoffDayLabel: string;
      accumulateBalanceLabel: string;
      saveButton: string;
    };
    password: {
      title: string;
      description: string;
      currentPasswordLabel: string;
      newPasswordLabel: string;
      confirmPasswordLabel: string;
      saveButton: string;
    };
    sessions: {
      title: string;
      description: string;
      currentSessionBadge: string;
      deviceLabel: string;
      lastActiveLabel: string;
      terminateOtherButton: string;
      terminateAllButton: string;
    };
    connectedAccounts: {
      title: string;
      description: string;
      googleConnected: string;
      connectGoogle: string;
      disconnectGoogle: string;
    };
    export: {
      title: string;
      description: string;
      exportJson: string;
      exportExcel: string;
      exportPdf: string;
    };
    deleteAccount: {
      title: string;
      description: string;
      warningText: string;
      confirmInputPlaceholder: string;
      deleteButton: string;
    };
    logout: {
      title: string;
      description: string;
      confirmButton: string;
    };
  };
  errors: {
    unauthenticated: string;
    unauthorized: string;
    notFound: string;
    generic: string;
    validation: {
      required: string;
      minLength: string;
      maxLength: string;
      mustBeNumber: string;
      mustBePositive: string;
      invalidFormat: string;
      selectWallet: string;
      selectCategory: string;
      passwordMismatch: string;
      passwordMinLength: string;
      nameRequired: string;
      titleRequired: string;
      dateRequired: string;
      sameWalletTransfer: string;
      destinationWalletRequired: string;
      deleteWalletHasTransactions: string;
      deleteCategoryHasTransactions: string;
    };
  };
  toast: {
    success: string;
    error: string;
    created: string;
    updated: string;
    deleted: string;
    sessionExpired: string;
    sessionExpiredDesc: string;
    failedToLoad: string;
    networkError: string;
    copySuccess: string;
    transactionCreated: string;
    transactionUpdated: string;
    transactionDeleted: string;
    walletCreated: string;
    walletUpdated: string;
    walletDeleted: string;
    categoryCreated: string;
    categoryUpdated: string;
    categoryDeleted: string;
    installmentCreated: string;
    installmentUpdated: string;
    installmentDeleted: string;
    preferencesSaved: string;
    profileUpdated: string;
    passwordUpdated: string;
    sessionTerminated: string;
  };
  pwa: {
    offline: {
      title: string;
      description: string;
      retry: string;
    };
    shortcuts: {
      newTransaction: string;
      reports: string;
    };
    install: {
      bannerTitle: string;
      bannerDesc: string;
      installButton: string;
      installedSuccess: string;
      installFailed: string;
    };
  };
  notFound: {
    title: string;
    description: string;
    backLink: string;
  };
  breadcrumb: {
    transactions: string;
    wallets: string;
    reports: string;
    debts: string;
    categories: string;
    settings: string;
    detailReports: string;
    detailWallets: string;
    detailTransactions: string;
    detailDebts: string;
    detailCategories: string;
  };
}
