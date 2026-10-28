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
  };
  nav: {
    transactions: string;
    wallets: string;
    reports: string;
    debts: string;
    categories: string;
    settings: string;
    newTransaction: string;
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      submitting: string;
      forgotPasswordLink: string;
      noAccount: string;
      registerLink: string;
    };
    register: {
      title: string;
      subtitle: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      submit: string;
      submitting: string;
      hasAccount: string;
      loginLink: string;
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
    };
    form: {
      createTitle: string;
      editTitle: string;
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
      resetFilter: string;
      applyFilter: string;
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
      destinationWallet: string;
      category: string;
      notes: string;
      createdAt: string;
      updatedAt: string;
    };
    ai: {
      voiceInput: string;
      fileAutoFill: string;
      listening: string;
      processing: string;
      error: string;
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
      accountNumber: string;
      accountNumberPlaceholder: string;
      color: string;
      submitCreate: string;
      submitUpdate: string;
    };
    detail: {
      title: string;
      currentBalance: string;
      accountNumber: string;
      transactionsHistory: string;
      correction: string;
      emptyTransactions: string;
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
    };
    status: {
      active: string;
      paidOff: string;
      overdue: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      type: string;
      personName: string;
      personNamePlaceholder: string;
      nominal: string;
      startDate: string;
      dueDate: string;
      wallet: string;
      notes: string;
      notesPlaceholder: string;
      submitCreate: string;
      submitUpdate: string;
    };
    detail: {
      title: string;
      contact: string;
      totalLoaned: string;
      totalReturned: string;
      remainingBalance: string;
      installments: string;
      addInstallment: string;
      markAsPaid: string;
      emptyInstallments: string;
    };
    installment: {
      title: string;
      createTitle: string;
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
      accumulatedBalance: string;
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
    export: {
      excelButton: string;
      pdfButton: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    profile: {
      title: string;
      description: string;
      nameLabel: string;
      emailLabel: string;
      avatarLabel: string;
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
    };
  };
  toast: {
    success: string;
    error: string;
    created: string;
    updated: string;
    deleted: string;
    sessionExpired: string;
    failedToLoad: string;
    networkError: string;
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
  };
}
