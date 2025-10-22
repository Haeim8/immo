export type Locale = "fr" | "en" | "es";

export type CurrencyCode = "usd" | "eur" | "cad" | "krw" | "jpy" | "gbp";

export interface Dictionary {
  common: {
    loading: string;
    loadingBlockchain: string;
    connectWallet: string;
    disconnect: string;
    error: string;
    success: string;
    devnet: string;
    mainnet: string;
    testnet: string;
    claim: string;
    close: string;
    confirm: string;
  };
  navbar: {
    home: string;
    portfolio: string;
    leaderboard: string;
    performance: string;
    waitlist: string;
    waitlistBadge: string;
    settings: string;
    admin: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    exploreCTA: string;
    explorerCTA: string;
    metrics: {
      projects: string;
      dividends: string;
      investors: string;
    };
  };
  propertyGrid: {
    title: string;
    subtitle: string;
    loading: string;
    errorTitle: string;
    errorText: string;
    emptyText: string;
    createHint: string;
  };
  propertyContainer: {
    searchPlaceholder: string;
    filters: string;
    filterBy: string;
    sortBy: string;
    sortNameAsc: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortReturnDesc: string;
    propertyType: string;
    fundingStatus: string;
    clearFilters: string;
    clearFiltersToSeeAll: string;
    showingResults: (data: { start: number; end: number; total: number }) => string;
    noResults: string;
    type: {
      all: string;
      residential: string;
      commercial: string;
      mixed: string;
    };
    status: {
      all: string;
      funding: string;
      funded: string;
    };
  };
  propertyCard: {
    description: string;
    surface: string;
    return: string;
    built: string;
    rooms: string;
    features: string;
    contract: string;
    soldOut: string;
    funded: (percentage: string) => string;
    sharesAvailable: (available: number, total: number) => string;
    lowSharesWarning: string;
    pricePerShare: string;
    totalPrice: string;
    type: string;
    expectedReturn: string;
    estValue: string;
    buyShares: (quantity: number) => string;
    processing: (quantity: number) => string;
    purchased: string;
    connectWallet: string;
    quantityLabel: string;
    purchaseSuccess: string;
    purchaseError: string;
    quantityRangeError: (min: number, max: number) => string;
  };
  portfolio: {
    title: string;
    subtitle: string;
    connectMessage: string;
    connectHint: string;
    loading: string;
    error: string;
    metrics: {
      invested: string;
      dividendsEarned: string;
      pendingDividends: string;
      claimTitle: string;
      claimSubtitle: (amount: string) => string;
      claimButton: (amount: string) => string;
    };
    investmentsTitle: string;
    noInvestments: string;
    browseHint: string;
    since: (date: string) => string;
    unknownProperty: string;
    minted: (date: string) => string;
    tokenLabel: (tokenId: string) => string;
    amountInvestedLabel: string;
    totalEarnedLabel: string;
    pendingLabel: string;
    roiLabel: string;
    claimCta: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    comingSoonTitle: string;
    comingSoonText: string;
  };
  performance: {
    title: string;
    subtitle: string;
    comingSoonTitle: string;
    comingSoonText: string;
  };
  waitlist: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    successTitle: string;
    successText: string;
    joinTitle: string;
    joinSubtitle: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    errorText: string;
    consent: string;
    stats: {
      assets: string;
      investors: string;
      returns: string;
      countries: string;
    };
    whyTitle: string;
    whySubtitle: string;
    feature1Title: string;
    feature1Text: string;
    feature2Title: string;
    feature2Text: string;
    feature3Title: string;
    feature3Text: string;
    feature4Title: string;
    feature4Text: string;
    feature5Title: string;
    feature5Text: string;
    feature6Title: string;
    feature6Text: string;
    footerCta: string;
    footerText: string;
  };
  sidebar: {
    title: string;
    description: string;
    tabs: {
      home: string;
      dividends: string;
    };
    invested: string;
    dividends: string;
    investmentsTitle: string;
    investedAmount: string;
    dividendsEarned: string;
    pending: string;
    since: (date: string) => string;
    claimTitle: string;
    claimSubtitle: (amount: string) => string;
    claimButton: string;
    claiming: string;
    successAlert: string;
  };
  settings: {
    title: string;
    subtitle: string;
    appearanceTitle: string;
    appearanceSubtitle: string;
    themeLabel: string;
    themeDescription: string;
    languageTitle: string;
    languageSubtitle: string;
    languageLabel: string;
    languageDescription: string;
    currencyTitle: string;
    currencySubtitle: string;
    currencyLabel: string;
    currencyDescription: string;
    notificationsTitle: string;
    notificationsSubtitle: string;
    pushLabel: string;
    pushDescription: string;
    dividendsLabel: string;
    dividendsDescription: string;
    emailTitle: string;
    emailSubtitle: string;
    newsletterLabel: string;
    newsletterDescription: string;
    reportsLabel: string;
    reportsDescription: string;
    enabled: string;
    disabled: string;
  };
  footer: {
    copyright: string;
    contactLabel: string;
    contactEmail: string;
    cgv: string;
    cgu: string;
  };
  legal: {
    cgvTitle: string;
    cgvIntro: string;
    cguTitle: string;
    cguIntro: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    common: {
      loading: "Chargement...",
      loadingBlockchain: "Chargement des données depuis la blockchain...",
      connectWallet: "Connecter le wallet",
      disconnect: "Déconnexion",
      error: "Erreur",
      success: "Succès",
      devnet: "Solana Devnet",
      mainnet: "Solana Mainnet Beta",
      testnet: "Solana Testnet",
      claim: "Réclamer",
      close: "Fermer",
      confirm: "Confirmer",
    },
    navbar: {
      home: "Accueil",
      portfolio: "Portfolio",
      leaderboard: "Classement",
      performance: "Performance",
      waitlist: "Waitlist",
      waitlistBadge: "NOUVEAU",
      settings: "Paramètres",
      admin: "Admin",
    },
    hero: {
      titleLine1: "Immobilier tokenisé",
      titleLine2: "Plateforme d'investissement",
      subtitle:
        "Accédez à des actifs immobiliers premium grâce à la blockchain. Investissez, gagnez des revenus passifs et suivez vos actifs en temps réel.",
      exploreCTA: "Explorer les propriétés",
      explorerCTA: "Voir sur la blockchain",
      metrics: {
        projects: "Projets financés",
        dividends: "Dividendes distribués",
        investors: "Investisseurs actifs",
      },
    },
    propertyGrid: {
      title: "Opportunités d'investissement",
      subtitle: "Découvrez notre sélection de propriétés immobilières tokenisées",
      loading: "Chargement des propriétés depuis la blockchain...",
      errorTitle: "Opportunités d'investissement",
      errorText: "Erreur lors du chargement des propriétés : {{error}}",
      emptyText: "Aucune propriété disponible pour le moment. Soyez le premier à en créer une !",
      createHint: "Connectez votre wallet et allez dans l'admin pour créer des propriétés.",
    },
    propertyContainer: {
      searchPlaceholder: "Rechercher par nom ou localisation...",
      filters: "Filtres",
      filterBy: "Filtrer par",
      sortBy: "Trier par",
      sortNameAsc: "Nom (A-Z)",
      sortPriceAsc: "Prix croissant",
      sortPriceDesc: "Prix décroissant",
      sortReturnDesc: "Rendement décroissant",
      propertyType: "Type de propriété",
      fundingStatus: "Statut de financement",
      clearFilters: "Effacer les filtres",
      clearFiltersToSeeAll: "Effacer les filtres pour voir toutes les propriétés",
      showingResults: ({ start, end, total }) =>
        `Affichage de ${start} à ${end} sur ${total} propriété${total > 1 ? "s" : ""}`,
      noResults: "Aucune propriété ne correspond à vos critères.",
      type: {
        all: "Tous types",
        residential: "Résidentiel",
        commercial: "Commercial",
        mixed: "Mixte",
      },
      status: {
        all: "Tous",
        funding: "En financement",
        funded: "Financé",
      },
    },
    propertyCard: {
      description: "Description",
      surface: "Surface",
      return: "Rendement",
      built: "Construction",
      rooms: "Pièces",
      features: "Caractéristiques",
      contract: "Smart contract (Solana Devnet)",
      soldOut: "🎉 Rupture de stock - 100 % financé",
      funded: (percentage: string) => `${percentage}% financé`,
      sharesAvailable: (available, total) => `${available} / ${total} parts disponibles`,
      lowSharesWarning: " - Vite, bientôt épuisé !",
      pricePerShare: "Prix par part",
      totalPrice: "Prix total",
      type: "Type",
      expectedReturn: "Rendement attendu",
      estValue: "Valeur estimée",
      buyShares: (quantity) => `Acheter ${quantity} part${quantity > 1 ? "s" : ""}`,
      processing: (quantity) => `Traitement de ${quantity} part${quantity > 1 ? "s" : ""}...`,
      purchased: "Acheté !",
      connectWallet: "Connecter le wallet",
      quantityLabel: "Nombre de parts à acheter",
      purchaseSuccess: "Part achetée avec succès ! 🎉",
      purchaseError: "Échec de l'achat de la part. Veuillez réessayer.",
      quantityRangeError: (min, max) =>
        `Veuillez sélectionner entre ${min} et ${max} part${max > 1 ? "s" : ""}`,
    },
    portfolio: {
      title: "Mon portfolio",
      subtitle: "Gérez vos investissements et réclamez vos dividendes",
      connectMessage: "Connectez votre wallet pour consulter votre portfolio",
      connectHint: "Cliquez sur « Connecter le wallet » dans l'en-tête pour commencer.",
      loading: "Chargement de votre portfolio depuis la blockchain...",
      error: "Erreur : {{error}}",
      metrics: {
        invested: "Total investi",
        dividendsEarned: "Dividendes gagnés",
        pendingDividends: "Dividendes en attente",
        claimTitle: "Réclamez vos dividendes",
        claimSubtitle: (amount) => `Vous avez ${amount} disponibles à réclamer.`,
        claimButton: (amount) => `Réclamer ${amount}`,
      },
      investmentsTitle: "Mes investissements",
      noInvestments: "Vous n'avez pas encore d'investissements.",
      browseHint: "Parcourez les propriétés pour commencer à investir.",
      since: (date) => `Depuis le ${date}`,
      unknownProperty: "Propriété inconnue",
      minted: (date) => `Minté le ${date}`,
      tokenLabel: (tokenId) => `NFT n°${tokenId}`,
      amountInvestedLabel: "Montant investi",
      totalEarnedLabel: "Total gagné",
      pendingLabel: "Dividendes en attente",
      roiLabel: "ROI",
      claimCta: "Réclamer",
    },
    leaderboard: {
      title: "Top investisseurs",
      subtitle: "Découvrez les meilleurs performeurs de l'écosystème USCI",
      comingSoonTitle: "Bientôt disponible",
      comingSoonText:
        "Le classement mettra en avant les investisseurs selon leurs portefeuilles et leurs rendements. Revenez vite voir votre position !",
    },
    performance: {
      title: "Analyses de performance",
      subtitle: "Suivez la performance de vos investissements dans le temps",
      comingSoonTitle: "Bientôt disponible",
      comingSoonText:
        "Les analyses et graphiques détaillés seront bientôt accessibles. Nous travaillons à vous apporter des insights complets.",
    },
    waitlist: {
      badge: "🚀 Bientôt disponible",
      titleLine1: "Investissez dans",
      titleLine2: "l'avenir des actifs",
      subtitle:
        "Tokenisation d'actifs réels sur blockchain. Immobilier, véhicules, entreprises. Diversifiez votre portfolio dès {{amount}}.",
      successTitle: "Vous êtes sur la liste !",
      successText: "Nous vous contacterons dès le lancement.",
      joinTitle: "Rejoignez la waitlist",
      joinSubtitle: "Soyez parmi les premiers à investir",
      emailPlaceholder: "votre@email.com",
      submit: "Rejoindre la waitlist",
      submitting: "Inscription...",
      errorText: "Erreur lors de l'inscription à la waitlist. Veuillez réessayer.",
      consent: "En vous inscrivant, vous acceptez de recevoir nos communications.",
      stats: {
        assets: "Actifs disponibles",
        investors: "Investisseurs",
        returns: "Rendement moyen",
        countries: "Pays couverts",
      },
      whyTitle: "Pourquoi USCI ?",
      whySubtitle: "Une plateforme complète pour investir dans des actifs réels tokenisés",
      feature1Title: "100 % sécurisé",
      feature1Text: "Smart contracts audités. Vos actifs sont protégés sur la blockchain.",
      feature2Title: "Rendements attractifs",
      feature2Text: "Jusqu'à 10 % de rendement annuel grâce aux dividendes automatisés.",
      feature3Title: "Liquidité instantanée",
      feature3Text: "Achetez ou revendez vos parts en quelques clics sur notre marketplace.",
      feature4Title: "Multi-actifs",
      feature4Text: "Immobilier, véhicules, entreprises et collectibles dans un seul portefeuille.",
      feature5Title: "Accès dès 1 $",
      feature5Text: "Investissez avec n'importe quel montant. Aucun minimum requis.",
      feature6Title: "Vote & gouvernance",
      feature6Text: "Participez aux décisions clés grâce à votre NFT de parts.",
      footerCta: "Prêt à investir ?",
      footerText: "Rejoignez une nouvelle génération d'investisseurs.",
    },
    sidebar: {
      title: "Mon portfolio",
      description: "Gérez vos investissements et réclamation des dividendes",
      tabs: {
        home: "Accueil",
        dividends: "Dividendes",
      },
      invested: "Investi",
      dividends: "Dividendes",
      investmentsTitle: "Mes investissements",
      investedAmount: "Montant investi",
      dividendsEarned: "Dividendes gagnés",
      pending: "En attente",
      since: (date) => `Depuis le ${date}`,
      claimTitle: "Réclamer les dividendes",
      claimSubtitle: (amount) => `Montant disponible : ${amount}`,
      claimButton: "Réclamer maintenant",
      claiming: "Réclamation...",
      successAlert: "Dividendes réclamés avec succès !",
    },
    settings: {
      title: "Paramètres",
      subtitle: "Personnalisez votre expérience sur la plateforme",
      appearanceTitle: "Apparence",
      appearanceSubtitle: "Personnalisez l'apparence de l'interface",
      themeLabel: "Thème",
      themeDescription: "Choisissez entre le mode clair et sombre",
      languageTitle: "Langue",
      languageSubtitle: "Sélectionnez votre langue préférée",
      languageLabel: "Langue de l'interface",
      languageDescription: "Affichage de l'application",
      currencyTitle: "Devise",
      currencySubtitle: "Choisissez la devise d'affichage",
      currencyLabel: "Devise de référence",
      currencyDescription: "Montant affiché sur la plateforme",
      notificationsTitle: "Notifications",
      notificationsSubtitle: "Gérez vos préférences de notification",
      pushLabel: "Notifications push",
      pushDescription: "Recevez des alertes pour les nouveaux investissements",
      dividendsLabel: "Alertes de dividendes",
      dividendsDescription: "Soyez averti lorsque des dividendes sont distribués",
      emailTitle: "E-mails",
      emailSubtitle: "Paramètres de communication par e-mail",
      newsletterLabel: "Newsletter",
      newsletterDescription: "Recevez les dernières actualités et opportunités",
      reportsLabel: "Rapports mensuels",
      reportsDescription: "Résumé de vos performances envoyé chaque mois",
      enabled: "Activé",
      disabled: "Désactivé",
    },
    footer: {
      copyright: "© 2025 USCI - Immobilier sur blockchain",
      contactLabel: "Contact",
      contactEmail: "contrat@usci.tech",
      cgv: "CGV",
      cgu: "CGU",
    },
    legal: {
      cgvTitle: "Conditions Générales de Vente",
      cgvIntro: "Nos conditions générales de vente seront bientôt disponibles. Merci pour votre patience tandis que nous finalisons ce contenu.",
      cguTitle: "Conditions Générales d'Utilisation",
      cguIntro: "Nos conditions générales d'utilisation seront bientôt disponibles. Nous travaillons à vous fournir des informations claires et complètes.",
    },
  },
  en: {
    common: {
      loading: "Loading...",
      loadingBlockchain: "Loading data from the blockchain...",
      connectWallet: "Connect wallet",
      disconnect: "Disconnect",
      error: "Error",
      success: "Success",
      devnet: "Solana Devnet",
      mainnet: "Solana Mainnet Beta",
      testnet: "Solana Testnet",
      claim: "Claim",
      close: "Close",
      confirm: "Confirm",
    },
    navbar: {
      home: "Home",
      portfolio: "Portfolio",
      leaderboard: "Leaderboard",
      performance: "Performance",
      waitlist: "Waitlist",
      waitlistBadge: "NEW",
      settings: "Settings",
      admin: "Admin",
    },
    hero: {
      titleLine1: "Tokenized real estate",
      titleLine2: "Investment platform",
      subtitle:
        "Access premium real estate through blockchain technology. Invest, earn passive income, and monitor your assets in real time.",
      exploreCTA: "Explore properties",
      explorerCTA: "View on blockchain",
      metrics: {
        projects: "Projects funded",
        dividends: "Dividends distributed",
        investors: "Active investors",
      },
    },
    propertyGrid: {
      title: "Investment opportunities",
      subtitle: "Explore our curated selection of tokenized real estate properties",
      loading: "Loading properties from the blockchain...",
      errorTitle: "Investment opportunities",
      errorText: "Error loading properties: {{error}}",
      emptyText: "No properties available yet. Be the first to create one!",
      createHint: "Connect your wallet and open the admin panel to create properties.",
    },
    propertyContainer: {
      searchPlaceholder: "Search by name or location...",
      filters: "Filters",
      filterBy: "Filter by",
      sortBy: "Sort by",
      sortNameAsc: "Name (A-Z)",
      sortPriceAsc: "Price (Low to High)",
      sortPriceDesc: "Price (High to Low)",
      sortReturnDesc: "Return (High to Low)",
      propertyType: "Property type",
      fundingStatus: "Funding status",
      clearFilters: "Clear filters",
      clearFiltersToSeeAll: "Clear filters to see all properties",
      showingResults: ({ start, end, total }) =>
        `Showing ${start} to ${end} of ${total} propert${total > 1 ? "ies" : "y"}`,
      noResults: "No properties match your criteria.",
      type: {
        all: "All types",
        residential: "Residential",
        commercial: "Commercial",
        mixed: "Mixed",
      },
      status: {
        all: "All",
        funding: "Funding",
        funded: "Funded",
      },
    },
    propertyCard: {
      description: "Description",
      surface: "Surface area",
      return: "Return",
      built: "Built",
      rooms: "Rooms",
      features: "Features",
      contract: "Smart contract (Solana Devnet)",
      soldOut: "🎉 SOLD OUT – 100% funded",
      funded: (percentage) => `${percentage}% funded`,
      sharesAvailable: (available, total) => `${available} / ${total} shares available`,
      lowSharesWarning: " – Hurry up!",
      pricePerShare: "Price per share",
      totalPrice: "Total price",
      type: "Type",
      expectedReturn: "Expected return",
      estValue: "Est. total value",
      buyShares: (quantity) => `Buy ${quantity} share${quantity > 1 ? "s" : ""}`,
      processing: (quantity) => `Processing ${quantity} share${quantity > 1 ? "s" : ""}...`,
      purchased: "Purchased!",
      connectWallet: "Connect wallet",
      quantityLabel: "Number of shares to buy",
      purchaseSuccess: "Share purchased successfully! 🎉",
      purchaseError: "Failed to purchase the share. Please try again.",
      quantityRangeError: (min, max) =>
        `Please select between ${min} and ${max} share${max > 1 ? "s" : ""}`,
    },
    portfolio: {
      title: "My portfolio",
      subtitle: "Manage your investments and claim your dividends",
      connectMessage: "Connect your wallet to view your portfolio",
      connectHint: "Click “Connect wallet” in the header to get started.",
      loading: "Loading your portfolio from the blockchain...",
      error: "Error: {{error}}",
      metrics: {
        invested: "Total invested",
        dividendsEarned: "Dividends earned",
        pendingDividends: "Pending dividends",
        claimTitle: "Claim your dividends",
        claimSubtitle: (amount) => `You have ${amount} ready to claim.`,
        claimButton: (amount) => `Claim ${amount}`,
      },
      investmentsTitle: "My investments",
      noInvestments: "You don't have any investments yet.",
      browseHint: "Browse properties to start investing.",
      since: (date) => `Since ${date}`,
      unknownProperty: "Unknown property",
      minted: (date) => `Minted on ${date}`,
      tokenLabel: (tokenId) => `NFT #${tokenId}`,
      amountInvestedLabel: "Amount invested",
      totalEarnedLabel: "Total earned",
      pendingLabel: "Pending dividends",
      roiLabel: "ROI",
      claimCta: "Claim",
    },
    leaderboard: {
      title: "Top investors",
      subtitle: "See the top performers in the USCI ecosystem",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "The leaderboard will showcase top investors based on holdings and returns. Check back soon to see where you rank!",
    },
    performance: {
      title: "Performance analytics",
      subtitle: "Track the performance of your investments over time",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "Detailed analytics and charts are coming soon. We're working on bringing you comprehensive insights.",
    },
    waitlist: {
      badge: "🚀 Coming soon",
      titleLine1: "Invest in",
      titleLine2: "the future of assets",
      subtitle:
        "Real-world assets tokenized on blockchain. Real estate, vehicles, businesses. Diversify your portfolio from {{amount}}.",
      successTitle: "You're on the list!",
      successText: "We'll reach out as soon as we launch.",
      joinTitle: "Join the waitlist",
      joinSubtitle: "Be among the first to invest",
      emailPlaceholder: "your@email.com",
      submit: "Join the waitlist",
      submitting: "Registering...",
      errorText: "Error joining the waitlist. Please try again.",
      consent: "By joining, you agree to receive our communications.",
      stats: {
        assets: "Assets available",
        investors: "Investors",
        returns: "Average return",
        countries: "Countries covered",
      },
      whyTitle: "Why USCI?",
      whySubtitle: "A complete platform to invest in tokenized real-world assets",
      feature1Title: "100% secure",
      feature1Text: "Audited smart contracts keep your assets protected on-chain.",
      feature2Title: "Attractive returns",
      feature2Text: "Earn up to 10% yearly with automated dividend payouts.",
      feature3Title: "Instant liquidity",
      feature3Text: "Buy or sell your shares anytime on our marketplace.",
      feature4Title: "Multi-asset access",
      feature4Text: "Real estate, vehicles, businesses, collectibles—all in one portfolio.",
      feature5Title: "Access from $1",
      feature5Text: "Invest with any amount. No minimum required.",
      feature6Title: "Voting & governance",
      feature6Text: "Take part in key decisions through your share NFT.",
      footerCta: "Ready to invest?",
      footerText: "Join a new generation of investors.",
    },
    sidebar: {
      title: "My portfolio",
      description: "Manage your investments and dividend claims",
      tabs: {
        home: "Home",
        dividends: "Dividends",
      },
      invested: "Invested",
      dividends: "Dividends",
      investmentsTitle: "My investments",
      investedAmount: "Amount invested",
      dividendsEarned: "Dividends earned",
      pending: "Pending",
      since: (date) => `Since ${date}`,
      claimTitle: "Claim dividends",
      claimSubtitle: (amount) => `Available amount: ${amount}`,
      claimButton: "Claim now",
      claiming: "Claiming...",
      successAlert: "Dividends claimed successfully!",
    },
    settings: {
      title: "Settings",
      subtitle: "Customize your platform experience",
      appearanceTitle: "Appearance",
      appearanceSubtitle: "Customize the interface appearance",
      themeLabel: "Theme",
      themeDescription: "Choose between light and dark mode",
      languageTitle: "Language",
      languageSubtitle: "Select your preferred language",
      languageLabel: "Interface language",
      languageDescription: "Application display",
      currencyTitle: "Currency",
      currencySubtitle: "Choose the display currency",
      currencyLabel: "Reference currency",
      currencyDescription: "Displayed amounts across the platform",
      notificationsTitle: "Notifications",
      notificationsSubtitle: "Manage your notification preferences",
      pushLabel: "Push notifications",
      pushDescription: "Receive alerts about new investments",
      dividendsLabel: "Dividend alerts",
      dividendsDescription: "Be notified when dividends are distributed",
      emailTitle: "Email",
      emailSubtitle: "Email communication settings",
      newsletterLabel: "Newsletter",
      newsletterDescription: "Receive the latest news and opportunities",
      reportsLabel: "Monthly reports",
      reportsDescription: "Monthly performance summary delivered to your inbox",
      enabled: "Enabled",
      disabled: "Disabled",
    },
    footer: {
      copyright: "© 2025 USCI - Blockchain Real Estate",
      contactLabel: "Contact",
      contactEmail: "contrat@usci.tech",
      cgv: "Terms of Sale (CGV)",
      cgu: "Terms of Use (CGU)",
    },
    legal: {
      cgvTitle: "Terms of Sale (CGV)",
      cgvIntro: "Our terms of sale will be available soon. Thank you for your patience while we finalize this content.",
      cguTitle: "Terms of Use (CGU)",
      cguIntro: "Our terms of use will be available soon. We're working to provide clear and comprehensive information.",
    },
  },
  es: {
    common: {
      loading: "Cargando...",
      loadingBlockchain: "Cargando datos desde la blockchain...",
      connectWallet: "Conectar wallet",
      disconnect: "Desconectar",
      error: "Error",
      success: "Éxito",
      devnet: "Solana Devnet",
      mainnet: "Solana Mainnet Beta",
      testnet: "Solana Testnet",
      claim: "Cobrar",
      close: "Cerrar",
      confirm: "Confirmar",
    },
    navbar: {
      home: "Inicio",
      portfolio: "Portafolio",
      leaderboard: "Clasificación",
      performance: "Rendimiento",
      waitlist: "Lista de espera",
      waitlistBadge: "NUEVO",
      settings: "Configuración",
      admin: "Admin",
    },
    hero: {
      titleLine1: "Inmobiliaria tokenizada",
      titleLine2: "Plataforma de inversión",
      subtitle:
        "Accede a inmuebles premium a través de la tecnología blockchain. Invierte, genera ingresos pasivos y controla tus activos en tiempo real.",
      exploreCTA: "Explorar propiedades",
      explorerCTA: "Ver en la blockchain",
      metrics: {
        projects: "Proyectos financiados",
        dividends: "Dividendos distribuidos",
        investors: "Inversores activos",
      },
    },
    propertyGrid: {
      title: "Oportunidades de inversión",
      subtitle: "Explora nuestra selección de propiedades inmobiliarias tokenizadas",
      loading: "Cargando propiedades desde la blockchain...",
      errorTitle: "Oportunidades de inversión",
      errorText: "Error al cargar las propiedades: {{error}}",
      emptyText: "Aún no hay propiedades disponibles. ¡Sé el primero en crear una!",
      createHint: "Conecta tu wallet y ve al panel de administración para crear propiedades.",
    },
    propertyContainer: {
      searchPlaceholder: "Buscar por nombre o ubicación...",
      filters: "Filtros",
      filterBy: "Filtrar por",
      sortBy: "Ordenar por",
      sortNameAsc: "Nombre (A-Z)",
      sortPriceAsc: "Precio (Menor a Mayor)",
      sortPriceDesc: "Precio (Mayor a Menor)",
      sortReturnDesc: "Rentabilidad (Mayor a Menor)",
      propertyType: "Tipo de propiedad",
      fundingStatus: "Estado de financiación",
      clearFilters: "Limpiar filtros",
      clearFiltersToSeeAll: "Limpiar filtros para ver todas las propiedades",
      showingResults: ({ start, end, total }) =>
        `Mostrando ${start} a ${end} de ${total} propiedad${total > 1 ? "es" : ""}`,
      noResults: "No hay propiedades que coincidan con tus criterios.",
      type: {
        all: "Todos los tipos",
        residential: "Residencial",
        commercial: "Comercial",
        mixed: "Mixto",
      },
      status: {
        all: "Todos",
        funding: "En financiación",
        funded: "Financiado",
      },
    },
    propertyCard: {
      description: "Descripción",
      surface: "Superficie",
      return: "Rentabilidad",
      built: "Construido",
      rooms: "Habitaciones",
      features: "Características",
      contract: "Smart contract (Solana Devnet)",
      soldOut: "🎉 AGOTADO – 100 % financiado",
      funded: (percentage) => `${percentage}% financiado`,
      sharesAvailable: (available, total) => `${available} / ${total} participaciones disponibles`,
      lowSharesWarning: " – ¡Date prisa!",
      pricePerShare: "Precio por participación",
      totalPrice: "Precio total",
      type: "Tipo",
      expectedReturn: "Rentabilidad esperada",
      estValue: "Valor total estimado",
      buyShares: (quantity) => `Comprar ${quantity} participación${quantity > 1 ? "es" : ""}`,
      processing: (quantity) => `Procesando ${quantity} participación${quantity > 1 ? "es" : ""}...`,
      purchased: "¡Comprado!",
      connectWallet: "Conectar wallet",
      quantityLabel: "Número de participaciones a comprar",
      purchaseSuccess: "¡Participación comprada con éxito! 🎉",
      purchaseError: "No se pudo completar la compra. Inténtalo de nuevo.",
      quantityRangeError: (min, max) =>
        `Selecciona entre ${min} y ${max} participación${max > 1 ? "es" : ""}`,
    },
    portfolio: {
      title: "Mi portafolio",
      subtitle: "Gestiona tus inversiones y cobra tus dividendos",
      connectMessage: "Conecta tu wallet para ver tu portafolio",
      connectHint: "Haz clic en «Connect wallet» en la cabecera para comenzar.",
      loading: "Cargando tu portafolio desde la blockchain...",
      error: "Error: {{error}}",
      metrics: {
        invested: "Total invertido",
        dividendsEarned: "Dividendos cobrados",
        pendingDividends: "Dividendos pendientes",
        claimTitle: "Cobra tus dividendos",
        claimSubtitle: (amount) => `Tienes ${amount} disponibles para cobrar.`,
        claimButton: (amount) => `Cobrar ${amount}`,
      },
      investmentsTitle: "Mis inversiones",
      noInvestments: "Todavía no tienes inversiones.",
      browseHint: "Explora las propiedades para comenzar a invertir.",
      since: (date) => `Desde ${date}`,
      unknownProperty: "Propiedad desconocida",
      minted: (date) => `Acuñado el ${date}`,
      tokenLabel: (tokenId) => `NFT #${tokenId}`,
      amountInvestedLabel: "Monto invertido",
      totalEarnedLabel: "Total cobrado",
      pendingLabel: "Dividendos pendientes",
      roiLabel: "ROI",
      claimCta: "Cobrar",
    },
    leaderboard: {
      title: "Mejores inversores",
      subtitle: "Descubre a los mejores del ecosistema USCI",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "La clasificación mostrará a los principales inversores según sus tenencias y sus rendimientos. ¡Vuelve pronto para ver tu posición!",
    },
    performance: {
      title: "Analítica de rendimiento",
      subtitle: "Sigue la evolución de tus inversiones con el tiempo",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "Muy pronto tendrás análisis detallados y gráficos completos. Estamos trabajando para ofrecerte toda la información que necesitas.",
    },
    waitlist: {
      badge: "🚀 Próximamente",
      titleLine1: "Invierte en",
      titleLine2: "el futuro de los activos",
      subtitle:
        "Activos del mundo real tokenizados en blockchain. Inmuebles, vehículos, empresas. Diversifica tu portafolio desde {{amount}}.",
      successTitle: "¡Estás en la lista!",
      successText: "Te avisaremos en cuanto lancemos.",
      joinTitle: "Únete a la lista de espera",
      joinSubtitle: "Sé de los primeros en invertir",
      emailPlaceholder: "tu@email.com",
      submit: "Unirme a la lista",
      submitting: "Registrando...",
      errorText: "Error al unirte a la lista de espera. Inténtalo de nuevo.",
      consent: "Al unirte, aceptas recibir nuestras comunicaciones.",
      stats: {
        assets: "Activos disponibles",
        investors: "Inversores",
        returns: "Rentabilidad media",
        countries: "Países",
      },
      whyTitle: "¿Por qué USCI?",
      whySubtitle: "Una plataforma integral para invertir en activos tokenizados",
      feature1Title: "100% seguro",
      feature1Text: "Smart contracts auditados protegen tus activos en la blockchain.",
      feature2Title: "Rentabilidades atractivas",
      feature2Text: "Hasta un 10 % anual gracias a dividendos automáticos.",
      feature3Title: "Liquidez instantánea",
      feature3Text: "Compra o vende tus participaciones al instante en nuestro marketplace.",
      feature4Title: "Multi-activos",
      feature4Text: "Inmuebles, vehículos, empresas y coleccionables en un solo portafolio.",
      feature5Title: "Acceso desde 1 $",
      feature5Text: "Invierte con cualquier monto. Sin mínimo requerido.",
      feature6Title: "Votación y gobernanza",
      feature6Text: "Participa en decisiones clave con tu NFT de participación.",
      footerCta: "¿Listo para invertir?",
      footerText: "Únete a una nueva generación de inversores.",
    },
    sidebar: {
      title: "Mi portafolio",
      description: "Gestiona tus inversiones y el cobro de dividendos",
      tabs: {
        home: "Inicio",
        dividends: "Dividendos",
      },
      invested: "Invertido",
      dividends: "Dividendos",
      investmentsTitle: "Mis inversiones",
      investedAmount: "Monto invertido",
      dividendsEarned: "Dividendos cobrados",
      pending: "Pendiente",
      since: (date) => `Desde ${date}`,
      claimTitle: "Cobrar dividendos",
      claimSubtitle: (amount) => `Importe disponible: ${amount}`,
      claimButton: "Cobrar ahora",
      claiming: "Cobrando...",
      successAlert: "¡Dividendos cobrados con éxito!",
    },
    settings: {
      title: "Configuración",
      subtitle: "Personaliza tu experiencia en la plataforma",
      appearanceTitle: "Apariencia",
      appearanceSubtitle: "Personaliza la apariencia de la interfaz",
      themeLabel: "Tema",
      themeDescription: "Elige entre modo claro y oscuro",
      languageTitle: "Idioma",
      languageSubtitle: "Selecciona tu idioma preferido",
      languageLabel: "Idioma de la interfaz",
      languageDescription: "Visualización de la aplicación",
      currencyTitle: "Divisa",
      currencySubtitle: "Elige la divisa de visualización",
      currencyLabel: "Divisa de referencia",
      currencyDescription: "Importes mostrados en toda la plataforma",
      notificationsTitle: "Notificaciones",
      notificationsSubtitle: "Gestiona tus preferencias de notificación",
      pushLabel: "Notificaciones push",
      pushDescription: "Recibe alertas de nuevas inversiones",
      dividendsLabel: "Alertas de dividendos",
      dividendsDescription: "Recibe avisos cuando se distribuyan dividendos",
      emailTitle: "Correo electrónico",
      emailSubtitle: "Preferencias de comunicación por correo",
      newsletterLabel: "Boletín",
      newsletterDescription: "Recibe las últimas noticias y oportunidades",
      reportsLabel: "Informes mensuales",
      reportsDescription: "Resumen mensual de tus resultados directamente en tu correo",
      enabled: "Activado",
      disabled: "Desactivado",
    },
    footer: {
      copyright: "© 2025 USCI - Bienes raíces en blockchain",
      contactLabel: "Contacto",
      contactEmail: "contrat@usci.tech",
      cgv: "Condiciones generales de venta (CGV)",
      cgu: "Condiciones generales de uso (CGU)",
    },
    legal: {
      cgvTitle: "Condiciones Generales de Venta",
      cgvIntro: "Nuestras condiciones generales de venta estarán disponibles en breve. Gracias por tu paciencia mientras finalizamos este contenido.",
      cguTitle: "Condiciones Generales de Uso",
      cguIntro: "Nuestras condiciones generales de uso estarán disponibles en breve. Estamos trabajando para ofrecerte información clara y completa.",
    },
  },
};

export const currencyMeta: Record<
  CurrencyCode,
  { label: string; symbol: string; locale: string; currency: string }
> = {
  usd: { label: "USD ($)", symbol: "$", locale: "en-US", currency: "USD" },
  eur: { label: "EUR (€)", symbol: "€", locale: "fr-FR", currency: "EUR" },
  cad: { label: "CAD (C$)", symbol: "C$", locale: "en-CA", currency: "CAD" },
  krw: { label: "KRW (₩)", symbol: "₩", locale: "ko-KR", currency: "KRW" },
  jpy: { label: "JPY (¥)", symbol: "¥", locale: "ja-JP", currency: "JPY" },
  gbp: { label: "GBP (£)", symbol: "£", locale: "en-GB", currency: "GBP" },
};

export const defaultLocale: Locale = "fr";
export const defaultCurrency: CurrencyCode = "eur";
export const supportedCurrencies: CurrencyCode[] = [
  "usd",
  "eur",
  "cad",
  "krw",
  "jpy",
  "gbp",
];
