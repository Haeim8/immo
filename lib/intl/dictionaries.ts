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
    buy: string;
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
    startInvesting: string;
    connectToEarn: string;
    yourPosition: string;
    totalSupplied: string;
    totalBorrowed: string;
    netPosition: string;
    pendingRewards: string;
    activePositions: string;
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
    saleClosed: string;
    funded: (percentage: string) => string;
    sharesAvailable: (available: number, total: number) => string;
    lowSharesWarning: string;
    saleClosedBanner: string;
    saleEnded: string;
    daysLeft: (count: number) => string;
    hoursLeft: (count: number) => string;
    endingSoon: string;
    saleEndDateLabel: string;
    pricePerShare: string;
    priceEth: string;
    totalPrice: string;
    totalPriceEth: string;
    type: string;
    assetType: string;
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
    saleClosedError: string;
    priceUnavailableError: string;
    invalidContractError: string;
    priceUnavailableShort: string;
    fullDetails: string;
    location: string;
    province: string;
    totalRaiseAmount: string;
    campaignDuration: string;
    governance: string;
    votingEnabled: string;
    progress: string;
    viewMore: string;
    viewLess: string;
    campaignDurationValue: (count: number) => string;
    soldOutBadge: string;
  };
  portfolio: {
    title: string;
    subtitle: string;
    connectTitle: string;
    connectMessage: string;
    connectButton: string;
    connectHint: string;
    loading: string;
    error: string;
    networth: string;
    netWorth: string;
    supplied: string;
    borrowed: string;
    pending: string;
    yourPositions: string;
    active: string;
    noPositions: string;
    noPositionsDesc: string;
    browseVaults: string;
    rewards: string;
    health: string;
    claimRewards: string;
    available: string;
    viewExplorer: string;
    seeTransactions: string;
    connectDescription: string;
    portfolioOverview: string;
    lendingPositions: string;
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
    loading: string;
    error: string;
    noInvestors: string;
    noInvestorsText: string;
    rank: string;
    investor: string;
    investments: string;
    totalInvested: string;
    dividends: string;
    performance: string;
  };
  performance: {
    title: string;
    subtitle: string;
    comingSoonTitle: string;
    comingSoonText: string;
    loading: string;
    error: string;
    noProperties: string;
    noPropertiesText: string;
    rank: string;
    property: string;
    totalRaised: string;
    dividends: string;
    funding: string;
    performance: string;
    location: string;
    expectedReturn: string;
    sharesSold: string;
    sharePrice: string;
    totalDividends: string;
    active: string;
    inactive: string;
    liquidated: string;
    smartContract: string;
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
  vaults: {
    title: string;
    subtitle: string;
    loading: string;
    noVaults: string;
    noVaultsDesc: string;
    available: string;
  };
  staking: {
    liveEarning: string;
    title: string;
    earn: string;
    subtitle: string;
    totalStaked: string;
    avgAPY: string;
    variableRate: string;
    yourStake: string;
    positions: string;
    pendingRewards: string;
    claimable: string;
    noLock: string;
    flexible: string;
    withdrawAnytime: string;
    secured: string;
    audited: string;
    verified: string;
    connectTitle: string;
    connectDescription: string;
    availablePools: string;
    active: string;
    noPools: string;
    noPoolsDesc: string;
    supplyAPY: string;
    tvl: string;
    utilization: string;
    stake: string;
    manage: string;
    earnYield: string;
    earnYieldDesc: string;
    collateralized: string;
    collateralizedDesc: string;
    flexibleDesc: string;
    loading: string;
    stakeCVT: string;
    earnRewards: string;
    poolDescription: string;
    backToPools: string;
    poolStats: string;
    currentAPY: string;
    ofCapacity: string;
    available: string;
    toStake: string;
    lockPeriod: string;
    none: string;
    withdrawalTime: string;
    instant: string;
    stakingFee: string;
    minStake: string;
    yourPosition: string;
    staked: string;
    value: string;
    earning: string;
    claimRewards: string;
    howItWorks: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    unstake: string;
    stakeTokens: string;
    unstakeTokens: string;
    connectToStake: string;
    poolSize: string;
    capacity: string;
    stakingPositions: string;
    noPoolAvailable: string;
    noPoolDescription: string;
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
      buy: "Acheter",
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
      titleLine1: "Actifs tokenisés",
      titleLine2: "Plateforme de participation",
      subtitle:
        "Accédez à des actifs premium grâce à la blockchain. Participez, gagnez des récompenses et suivez vos actifs en temps réel.",
      exploreCTA: "Explorer les projets",
      explorerCTA: "Voir sur la blockchain",
      startInvesting: "Commencez à investir",
      connectToEarn: "Connectez votre wallet pour fournir des actifs et gagner des rendements.",
      yourPosition: "Votre position",
      totalSupplied: "Total fourni",
      totalBorrowed: "Total emprunté",
      netPosition: "Position nette",
      pendingRewards: "Récompenses en attente",
      activePositions: "Positions actives",
      metrics: {
        projects: "Projets financés",
        dividends: "Récompenses distribuées",
        investors: "Participants actifs",
      },
    },
    propertyGrid: {
      title: "Opportunités de participation",
      subtitle: "Découvrez notre sélection d'actifs tokenisés",
      loading: "Chargement des projets depuis la blockchain...",
      errorTitle: "Opportunités de participation",
      errorText: "Erreur lors du chargement des projets : {{error}}",
      emptyText: "Aucun projet disponible actuellement.",
      createHint: "De nouveaux projets seront bientôt proposés par notre équipe.",
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
      propertyType: "Type de projet",
      fundingStatus: "Statut de financement",
      clearFilters: "Effacer les filtres",
      clearFiltersToSeeAll: "Effacer les filtres pour voir tous les projets",
      showingResults: ({ start, end, total }) =>
        `Affichage de ${start} à ${end} sur ${total} projet${total > 1 ? "s" : ""}`,
      noResults: "Aucun projet ne correspond à vos critères.",
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
      contract: "Smart contract (Base Sepolia)",
      soldOut: "🎉 Rupture de stock - 100 % financé",
      saleClosed: "Vente clôturée",
      funded: (percentage: string) => `${percentage}% financé`,
      sharesAvailable: (available, total) => `${available} / ${total} parts disponibles`,
      lowSharesWarning: " - Vite, bientôt épuisé !",
      saleClosedBanner: "Vente clôturée - distribution en préparation",
      saleEnded: "Vente terminée",
      daysLeft: (count) => {
        const value = Number(count);
        return `${value} jour${value > 1 ? "s" : ""} restants`;
      },
      hoursLeft: (count) => {
        const value = Number(count);
        return `${value} heure${value > 1 ? "s" : ""} restantes`;
      },
      endingSoon: "Bientôt terminé",
      saleEndDateLabel: "Fin le {{date}}",
      pricePerShare: "Prix par part",
      priceEth: "≈ {{amount}} ETH",
      totalPrice: "Prix total",
      totalPriceEth: "≈ {{amount}} ETH",
      type: "Type",
      assetType: "Type d'actif",
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
      saleClosedError: "La vente est clôturée pour ce bien.",
      priceUnavailableError: "Impossible de récupérer le prix sur la blockchain. Veuillez réessayer plus tard.",
      invalidContractError: "Adresse de contrat invalide.",
      priceUnavailableShort: "Prix indisponible",
      fullDetails: "Détails complets",
      location: "Localisation",
      province: "Province",
      totalRaiseAmount: "Montant total à lever",
      campaignDuration: "Durée de la campagne",
      governance: "Gouvernance",
      votingEnabled: "Vote activé",
      progress: "Progression",
      viewMore: "Voir plus",
      viewLess: "Voir moins",
      campaignDurationValue: (count) => {
        const value = Number(count);
        return `${value} jour${value > 1 ? "s" : ""}`;
      },
      soldOutBadge: "Épuisé",
    },
    portfolio: {
      title: "Mon portfolio",
      subtitle: "Gérez vos puzzles et réclamez vos récompenses",
      connectTitle: "Commencez à participer dès maintenant",
      connectMessage: "Connectez votre wallet pour accéder à votre portfolio et participer aux projets tokenisés.",
      connectButton: "Connecter mon wallet",
      connectHint: "Sécurisé par la blockchain Base • Participation accessible dès quelques fractions d'ETH",
      loading: "Chargement de votre portfolio depuis la blockchain...",
      error: "Erreur : {{error}}",
      networth: "Valeur nette",
      netWorth: "Valeur nette",
      supplied: "Fourni",
      borrowed: "Emprunté",
      pending: "En attente",
      yourPositions: "Vos positions",
      active: "actif",
      noPositions: "Aucune position",
      noPositionsDesc: "Vous n'avez pas encore de position dans les vaults.",
      browseVaults: "Explorer les vaults",
      rewards: "Récompenses",
      health: "Santé",
      claimRewards: "Réclamer toutes les récompenses",
      available: "disponible",
      viewExplorer: "Voir sur l'explorateur",
      seeTransactions: "Voir toutes les transactions",
      connectDescription: "Connectez votre wallet pour voir votre portfolio, vos positions et vos gains sur tous les vaults.",
      portfolioOverview: "Aperçu du portfolio",
      lendingPositions: "Positions de prêt",
      metrics: {
        invested: "Total en puzzles",
        dividendsEarned: "Récompenses gagnées",
        pendingDividends: "Récompenses en attente",
        claimTitle: "Réclamez vos récompenses",
        claimSubtitle: (amount) => `Vous avez ${amount} disponibles à réclamer.`,
        claimButton: (amount) => `Réclamer ${amount}`,
      },
      investmentsTitle: "Mes puzzles",
      noInvestments: "Vous n'avez pas encore de puzzles.",
      browseHint: "Explorez les projets pour commencer à participer.",
      since: (date) => `Depuis le ${date}`,
      unknownProperty: "Projet inconnu",
      minted: (date) => `Minté le ${date}`,
      tokenLabel: (tokenId) => `NFT n°${tokenId}`,
      amountInvestedLabel: "Montant en puzzle",
      totalEarnedLabel: "Total gagné",
      pendingLabel: "Récompenses en attente",
      roiLabel: "ROI",
      claimCta: "Réclamer",
    },
    leaderboard: {
      title: "Top participants",
      subtitle: "Découvrez les meilleurs performeurs de l'écosystème CANTORFI",
      comingSoonTitle: "Bientôt disponible",
      comingSoonText:
        "Le classement mettra en avant les participants selon leurs puzzles et leurs rendements. Revenez vite voir votre position !",
      loading: "Chargement du classement...",
      error: "Erreur",
      noInvestors: "Aucun participant pour le moment",
      noInvestorsText: "Soyez le premier à apparaître dans le classement !",
      rank: "Rang",
      investor: "Participant",
      investments: "Puzzles",
      totalInvested: "Total en puzzles",
      dividends: "Récompenses",
      performance: "Performance",
    },
    performance: {
      title: "Analyses de performance",
      subtitle: "Suivez la performance de vos puzzles dans le temps",
      comingSoonTitle: "Bientôt disponible",
      comingSoonText:
        "Les analyses et graphiques détaillés seront bientôt accessibles. Nous travaillons à vous apporter des insights complets.",
      loading: "Chargement des données de performance...",
      error: "Erreur",
      noProperties: "Aucun projet pour le moment",
      noPropertiesText: "Aucun projet tokenisé disponible pour afficher les données de performance.",
      rank: "Rang",
      property: "Projet",
      totalRaised: "Total levé",
      dividends: "Récompenses",
      funding: "Financement",
      performance: "Performance",
      location: "Localisation",
      expectedReturn: "Rendement attendu",
      sharesSold: "Puzzles vendus",
      sharePrice: "Prix par puzzle",
      totalDividends: "Total récompenses",
      active: "Actif",
      inactive: "Inactif",
      liquidated: "Liquidé",
      smartContract: "Smart Contract",
    },
    waitlist: {
      badge: "🚀 Bientôt disponible",
      titleLine1: "Participez à",
      titleLine2: "l'avenir des actifs",
      subtitle:
        "Tokenisation d'actifs réels sur blockchain. Immobilier, véhicules, entreprises. Diversifiez votre portfolio dès {{amount}}.",
      successTitle: "Vous êtes sur la liste !",
      successText: "Nous vous contacterons dès le lancement.",
      joinTitle: "Rejoignez la waitlist",
      joinSubtitle: "Soyez parmi les premiers à participer",
      emailPlaceholder: "votre@email.com",
      submit: "Rejoindre la waitlist",
      submitting: "Inscription...",
      errorText: "Erreur lors de l'inscription à la waitlist. Veuillez réessayer.",
      consent: "En vous inscrivant, vous acceptez de recevoir nos communications.",
      stats: {
        assets: "Actifs disponibles",
        investors: "Participants",
        returns: "Rendement moyen",
        countries: "Pays couverts",
      },
      whyTitle: "Pourquoi CANTORFI ?",
      whySubtitle: "Une plateforme complète pour participer aux actifs réels tokenisés",
      feature1Title: "100 % sécurisé",
      feature1Text: "Smart contracts audités. Vos actifs sont protégés sur la blockchain.",
      feature2Title: "Rendements attractifs",
      feature2Text: "Jusqu'à 10 % de rendement annuel grâce aux récompenses automatisées.",
      feature3Title: "Liquidité instantanée",
      feature3Text: "Achetez ou revendez vos puzzles en quelques clics sur notre marketplace.",
      feature4Title: "Multi-actifs",
      feature4Text: "Immobilier, véhicules, entreprises et collectibles dans un seul portefeuille.",
      feature5Title: "Accès dès 1 $",
      feature5Text: "Participez avec n'importe quel montant. Aucun minimum requis.",
      feature6Title: "Vote & gouvernance",
      feature6Text: "Participez aux décisions clés grâce à votre NFT de puzzles.",
      footerCta: "Prêt à participer ?",
      footerText: "Rejoignez une nouvelle génération de participants.",
    },
    sidebar: {
      title: "Mon portfolio",
      description: "Gérez vos puzzles et réclamation des récompenses",
      tabs: {
        home: "Accueil",
        dividends: "Récompenses",
      },
      invested: "En puzzles",
      dividends: "Récompenses",
      investmentsTitle: "Mes puzzles",
      investedAmount: "Montant en puzzles",
      dividendsEarned: "Récompenses gagnées",
      pending: "En attente",
      since: (date) => `Depuis le ${date}`,
      claimTitle: "Réclamer les récompenses",
      claimSubtitle: (amount) => `Montant disponible : ${amount}`,
      claimButton: "Réclamer maintenant",
      claiming: "Réclamation...",
      successAlert: "Récompenses réclamées avec succès !",
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
      pushDescription: "Recevez des alertes pour les nouveaux projets",
      dividendsLabel: "Alertes de récompenses",
      dividendsDescription: "Soyez averti lorsque des récompenses sont distribuées",
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
      copyright: "© 2025 CANTORFI - Actifs sur blockchain",
      contactLabel: "Contact",
      contactEmail: "contact@cantorfi.tech",
      cgv: "CGV",
      cgu: "CGU",
    },
    legal: {
      cgvTitle: "Conditions Générales de Vente",
      cgvIntro: "Nos conditions générales de vente seront bientôt disponibles. Merci pour votre patience tandis que nous finalisons ce contenu.",
      cguTitle: "Conditions Générales d'Utilisation",
      cguIntro: "Nos conditions générales d'utilisation seront bientôt disponibles. Nous travaillons à vous fournir des informations claires et complètes.",
    },
    vaults: {
      title: "Marchés de prêt",
      subtitle: "Fournir ou emprunter des actifs",
      loading: "Chargement des vaults...",
      noVaults: "Aucun vault disponible",
      noVaultsDesc: "De nouveaux vaults seront ajoutés bientôt.",
      available: "marchés",
    },
    staking: {
      liveEarning: "GAINS EN COURS",
      title: "Staker",
      earn: "Gagner",
      subtitle: "Fournissez vos actifs aux vaults de prêt et gagnez des rendements passifs. Retirez à tout moment.",
      totalStaked: "Total staké",
      avgAPY: "APY moy.",
      variableRate: "Taux variable",
      yourStake: "Votre stake",
      positions: "positions",
      pendingRewards: "En attente",
      claimable: "Réclamable",
      noLock: "Sans blocage",
      flexible: "Flexible",
      withdrawAnytime: "Retrait à tout moment",
      secured: "Sécurisé",
      audited: "Audité",
      verified: "Contrats vérifiés",
      connectTitle: "Connectez-vous pour commencer",
      connectDescription: "Connectez votre wallet pour staker des actifs et gagner des rendements.",
      availablePools: "Pools disponibles",
      active: "actifs",
      noPools: "Aucun pool disponible",
      noPoolsDesc: "De nouveaux pools de staking seront ajoutés bientôt.",
      supplyAPY: "APY Supply",
      tvl: "TVL",
      utilization: "Util.",
      stake: "Staker",
      manage: "Gérer",
      earnYield: "Gagnez des rendements",
      earnYieldDesc: "Fournissez des actifs pour gagner des intérêts auprès des emprunteurs.",
      collateralized: "Collatéralisé",
      collateralizedDesc: "Tous les prêts sont sur-collatéralisés et liquidables.",
      flexibleDesc: "Pas de période de blocage. Retirez à tout moment selon la liquidité.",
      loading: "Chargement des pools de staking...",
      stakeCVT: "Staker CVT",
      earnRewards: "Gagnez",
      poolDescription: "Fournissez des tokens au vault, recevez des CVT, puis stakez vos CVT pour gagner des récompenses",
      backToPools: "Retour aux pools",
      poolStats: "Statistiques du pool",
      currentAPY: "APY actuel",
      ofCapacity: "de la capacité",
      available: "Disponible",
      toStake: "à staker",
      lockPeriod: "Période de blocage",
      none: "Aucune",
      withdrawalTime: "Délai de retrait",
      instant: "Instantané",
      stakingFee: "Frais de staking",
      minStake: "Stake minimum",
      yourPosition: "Votre position",
      staked: "Staké",
      value: "Valeur",
      earning: "Rendement",
      claimRewards: "Réclamer",
      howItWorks: "Comment ça marche",
      step1Title: "Déposer",
      step1Desc: "Stakez vos tokens dans le pool",
      step2Title: "Gagner",
      step2Desc: "Accumulez des récompenses au fil du temps",
      step3Title: "Retirer",
      step3Desc: "Retirez à tout moment sans frais",
      unstake: "Retirer",
      stakeTokens: "Staker",
      unstakeTokens: "Retirer",
      connectToStake: "Connectez votre wallet pour staker des tokens",
      poolSize: "Taille du pool",
      capacity: "Capacité",
      stakingPositions: "Positions de staking",
      noPoolAvailable: "Aucun pool de staking disponible",
      noPoolDescription: "Aucun vault avec staking n'est disponible pour le moment.",
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
      buy: "Buy",
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
      titleLine1: "Tokenized assets",
      titleLine2: "Participation platform",
      subtitle:
        "Access premium assets through blockchain technology. Participate, earn rewards, and monitor your assets in real time.",
      exploreCTA: "Explore projects",
      explorerCTA: "View on blockchain",
      startInvesting: "Start Investing",
      connectToEarn: "Connect your wallet to supply assets and earn yields.",
      yourPosition: "Your Position",
      totalSupplied: "Total Supplied",
      totalBorrowed: "Total Borrowed",
      netPosition: "Net Position",
      pendingRewards: "Pending Rewards",
      activePositions: "Active Positions",
      metrics: {
        projects: "Projects funded",
        dividends: "Rewards distributed",
        investors: "Active participants",
      },
    },
    propertyGrid: {
      title: "Participation opportunities",
      subtitle: "Explore our curated selection of tokenized assets",
      loading: "Loading projects from the blockchain...",
      errorTitle: "Participation opportunities",
      errorText: "Error loading projects: {{error}}",
      emptyText: "No projects available yet.",
      createHint: "New projects will be proposed soon by our team.",
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
      propertyType: "Project type",
      fundingStatus: "Funding status",
      clearFilters: "Clear filters",
      clearFiltersToSeeAll: "Clear filters to see all projects",
      showingResults: ({ start, end, total }) =>
        `Showing ${start} to ${end} of ${total} project${total > 1 ? "s" : ""}`,
      noResults: "No projects match your criteria.",
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
      contract: "Smart contract (Base Sepolia)",
      soldOut: "🎉 SOLD OUT – 100% funded",
      saleClosed: "Sale closed",
      funded: (percentage) => `${percentage}% funded`,
      sharesAvailable: (available, total) => `${available} / ${total} shares available`,
      lowSharesWarning: " – Hurry up!",
      saleClosedBanner: "Sale closed – distribution in progress",
      saleEnded: "Sale ended",
      daysLeft: (count) => {
        const value = Number(count);
        return `${value} day${value === 1 ? "" : "s"} left`;
      },
      hoursLeft: (count) => {
        const value = Number(count);
        return `${value} hour${value === 1 ? "" : "s"} left`;
      },
      endingSoon: "Ending soon",
      saleEndDateLabel: "Ends on {{date}}",
      pricePerShare: "Price per share",
      priceEth: "≈ {{amount}} ETH",
      totalPrice: "Total price",
      totalPriceEth: "≈ {{amount}} ETH",
      type: "Type",
      assetType: "Asset type",
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
      saleClosedError: "This sale is closed. No additional puzzles can be purchased.",
      priceUnavailableError: "We couldn't fetch the puzzle price from the blockchain. Please try again shortly.",
      invalidContractError: "Invalid contract address.",
      priceUnavailableShort: "Price unavailable",
      fullDetails: "Full details",
      location: "Location",
      province: "Province",
      totalRaiseAmount: "Total raise amount",
      campaignDuration: "Campaign duration",
      governance: "Governance",
      votingEnabled: "Voting enabled",
      progress: "Progress",
      viewMore: "View more",
      viewLess: "View less",
      campaignDurationValue: (count) => {
        const value = Number(count);
        return `${value} day${value === 1 ? "" : "s"}`;
      },
      soldOutBadge: "Sold out",
    },
    portfolio: {
      title: "My portfolio",
      subtitle: "Manage your puzzles and claim your rewards",
      connectTitle: "Start participating now",
      connectMessage: "Connect your wallet to access your portfolio and start participating in tokenized projects.",
      connectButton: "Connect my wallet",
      connectHint: "Secured by the Base blockchain • Participate with just a fraction of ETH",
      loading: "Loading your portfolio from the blockchain...",
      error: "Error: {{error}}",
      networth: "Net Worth",
      netWorth: "Net Worth",
      supplied: "Supplied",
      borrowed: "Borrowed",
      pending: "Pending",
      yourPositions: "Your Positions",
      active: "active",
      noPositions: "No Positions",
      noPositionsDesc: "You don't have any positions in vaults yet.",
      browseVaults: "Browse Vaults",
      rewards: "Rewards",
      health: "Health",
      claimRewards: "Claim All Rewards",
      available: "available",
      viewExplorer: "View on Explorer",
      seeTransactions: "See all transactions",
      connectDescription: "Connect your wallet to view your portfolio, positions, and earnings across all vaults.",
      portfolioOverview: "Portfolio Overview",
      lendingPositions: "Lending Positions",
      metrics: {
        invested: "Total in puzzles",
        dividendsEarned: "Rewards earned",
        pendingDividends: "Pending rewards",
        claimTitle: "Claim your rewards",
        claimSubtitle: (amount) => `You have ${amount} ready to claim.`,
        claimButton: (amount) => `Claim ${amount}`,
      },
      investmentsTitle: "My puzzles",
      noInvestments: "You don't have any puzzles yet.",
      browseHint: "Browse projects to start participating.",
      since: (date) => `Since ${date}`,
      unknownProperty: "Unknown project",
      minted: (date) => `Minted on ${date}`,
      tokenLabel: (tokenId) => `NFT #${tokenId}`,
      amountInvestedLabel: "Amount in puzzles",
      totalEarnedLabel: "Total earned",
      pendingLabel: "Pending rewards",
      roiLabel: "ROI",
      claimCta: "Claim",
    },
    leaderboard: {
      title: "Top participants",
      subtitle: "See the top performers in the CANTORFI ecosystem",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "The leaderboard will showcase top participants based on puzzles and returns. Check back soon to see where you rank!",
      loading: "Loading leaderboard...",
      error: "Error",
      noInvestors: "No participants yet",
      noInvestorsText: "Be the first participant to appear on the leaderboard!",
      rank: "Rank",
      investor: "Participant",
      investments: "Puzzles",
      totalInvested: "Total in Puzzles",
      dividends: "Rewards",
      performance: "Performance",
    },
    performance: {
      title: "Performance analytics",
      subtitle: "Track the performance of your puzzles over time",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "Detailed analytics and charts are coming soon. We're working on bringing you comprehensive insights.",
      loading: "Loading performance data...",
      error: "Error",
      noProperties: "No projects yet",
      noPropertiesText: "No tokenized projects available to display performance data.",
      rank: "Rank",
      property: "Project",
      totalRaised: "Total Raised",
      dividends: "Rewards",
      funding: "Funding",
      performance: "Performance",
      location: "Location",
      expectedReturn: "Expected Return",
      sharesSold: "Puzzles Sold",
      sharePrice: "Puzzle Price",
      totalDividends: "Total Rewards",
      active: "Active",
      inactive: "Inactive",
      liquidated: "Liquidated",
      smartContract: "Smart Contract",
    },
    waitlist: {
      badge: "🚀 Coming soon",
      titleLine1: "Participate in",
      titleLine2: "the future of assets",
      subtitle:
        "Real-world assets tokenized on blockchain. Real estate, vehicles, businesses. Diversify your portfolio from {{amount}}.",
      successTitle: "You're on the list!",
      successText: "We'll reach out as soon as we launch.",
      joinTitle: "Join the waitlist",
      joinSubtitle: "Be among the first to participate",
      emailPlaceholder: "your@email.com",
      submit: "Join the waitlist",
      submitting: "Registering...",
      errorText: "Error joining the waitlist. Please try again.",
      consent: "By joining, you agree to receive our communications.",
      stats: {
        assets: "Assets available",
        investors: "Participants",
        returns: "Average return",
        countries: "Countries covered",
      },
      whyTitle: "Why CANTORFI?",
      whySubtitle: "A complete platform to participate in tokenized real-world assets",
      feature1Title: "100% secure",
      feature1Text: "Audited smart contracts keep your assets protected on-chain.",
      feature2Title: "Attractive returns",
      feature2Text: "Earn up to 10% yearly with automated reward payouts.",
      feature3Title: "Instant liquidity",
      feature3Text: "Buy or sell your puzzles anytime on our marketplace.",
      feature4Title: "Multi-asset access",
      feature4Text: "Real estate, vehicles, businesses, collectibles—all in one portfolio.",
      feature5Title: "Access from $1",
      feature5Text: "Participate with any amount. No minimum required.",
      feature6Title: "Voting & governance",
      feature6Text: "Take part in key decisions through your puzzle NFT.",
      footerCta: "Ready to participate?",
      footerText: "Join a new generation of participants.",
    },
    sidebar: {
      title: "My portfolio",
      description: "Manage your puzzles and reward claims",
      tabs: {
        home: "Home",
        dividends: "Rewards",
      },
      invested: "In puzzles",
      dividends: "Rewards",
      investmentsTitle: "My puzzles",
      investedAmount: "Amount in puzzles",
      dividendsEarned: "Rewards earned",
      pending: "Pending",
      since: (date) => `Since ${date}`,
      claimTitle: "Claim rewards",
      claimSubtitle: (amount) => `Available amount: ${amount}`,
      claimButton: "Claim now",
      claiming: "Claiming...",
      successAlert: "Rewards claimed successfully!",
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
      pushDescription: "Receive alerts about new projects",
      dividendsLabel: "Reward alerts",
      dividendsDescription: "Be notified when rewards are distributed",
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
      copyright: "© 2025 CANTORFI - Blockchain Assets",
      contactLabel: "Contact",
      contactEmail: "contact@cantorfi.tech",
      cgv: "Terms of Sale (CGV)",
      cgu: "Terms of Use (CGU)",
    },
    legal: {
      cgvTitle: "Terms of Sale (CGV)",
      cgvIntro: "Our terms of sale will be available soon. Thank you for your patience while we finalize this content.",
      cguTitle: "Terms of Use (CGU)",
      cguIntro: "Our terms of use will be available soon. We're working to provide clear and comprehensive information.",
    },
    vaults: {
      title: "Lending Markets",
      subtitle: "Supply or borrow assets",
      loading: "Loading vaults...",
      noVaults: "No vaults available",
      noVaultsDesc: "New lending vaults coming soon.",
      available: "markets",
    },
    staking: {
      liveEarning: "EARNING REWARDS",
      title: "Stake",
      earn: "Earn",
      subtitle: "Supply your assets to lending vaults and earn passive yield. Withdraw anytime.",
      totalStaked: "Total Staked",
      avgAPY: "Avg. APY",
      variableRate: "Variable rate",
      yourStake: "Your Stake",
      positions: "positions",
      pendingRewards: "Pending",
      claimable: "Claimable",
      noLock: "No Lock",
      flexible: "Flexible",
      withdrawAnytime: "Withdraw anytime",
      secured: "Secured",
      audited: "Audited",
      verified: "Contracts verified",
      connectTitle: "Connect to Start Earning",
      connectDescription: "Connect your wallet to stake assets and earn yield.",
      availablePools: "Available Pools",
      active: "active",
      noPools: "No pools available yet",
      noPoolsDesc: "New staking pools will be added soon.",
      supplyAPY: "Supply APY",
      tvl: "TVL",
      utilization: "Util.",
      stake: "Stake",
      manage: "Manage",
      earnYield: "Earn Yield",
      earnYieldDesc: "Supply assets to earn interest from borrowers.",
      collateralized: "Collateralized",
      collateralizedDesc: "All loans are over-collateralized and liquidatable.",
      flexibleDesc: "No lock-up periods. Withdraw anytime subject to liquidity.",
      loading: "Loading staking pools...",
      stakeCVT: "Stake CVT",
      earnRewards: "Earn",
      poolDescription: "Supply tokens to the vault, receive CVT, then stake CVT to earn rewards",
      backToPools: "Back to pools",
      poolStats: "Pool Statistics",
      currentAPY: "Current APY",
      ofCapacity: "of capacity",
      available: "Available",
      toStake: "to stake",
      lockPeriod: "Lock Period",
      none: "None",
      withdrawalTime: "Withdrawal Time",
      instant: "Instant",
      stakingFee: "Staking Fee",
      minStake: "Min. Stake",
      yourPosition: "Your Position",
      staked: "Staked",
      value: "Value",
      earning: "Earning",
      claimRewards: "Claim",
      howItWorks: "How Staking Works",
      step1Title: "Deposit",
      step1Desc: "Stake your tokens in the pool",
      step2Title: "Earn",
      step2Desc: "Accumulate rewards over time",
      step3Title: "Withdraw",
      step3Desc: "Unstake anytime with no fees",
      unstake: "Unstake",
      stakeTokens: "Stake",
      unstakeTokens: "Unstake",
      connectToStake: "Connect your wallet to stake tokens",
      poolSize: "Pool size",
      capacity: "Capacity",
      stakingPositions: "Staking Positions",
      noPoolAvailable: "No Staking Pool Available",
      noPoolDescription: "No vaults with staking are available yet.",
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
      buy: "Comprar",
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
      titleLine1: "Activos tokenizados",
      titleLine2: "Plataforma de participación",
      subtitle:
        "Accede a activos premium a través de la tecnología blockchain. Participa, gana recompensas y controla tus activos en tiempo real.",
      exploreCTA: "Explorar proyectos",
      explorerCTA: "Ver en la blockchain",
      startInvesting: "Comenzar a invertir",
      connectToEarn: "Conecta tu wallet para suministrar activos y ganar rendimientos.",
      yourPosition: "Tu Posición",
      totalSupplied: "Total Suministrado",
      totalBorrowed: "Total Prestado",
      netPosition: "Posición Neta",
      pendingRewards: "Recompensas Pendientes",
      activePositions: "Posiciones Activas",
      metrics: {
        projects: "Proyectos financiados",
        dividends: "Recompensas distribuidas",
        investors: "Participantes activos",
      },
    },
    propertyGrid: {
      title: "Oportunidades de participación",
      subtitle: "Explora nuestra selección de activos tokenizados",
      loading: "Cargando proyectos desde la blockchain...",
      errorTitle: "Oportunidades de participación",
      errorText: "Error al cargar los proyectos: {{error}}",
      emptyText: "Aún no hay proyectos disponibles.",
      createHint: "Nuevos proyectos serán propuestos pronto por nuestro equipo.",
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
      propertyType: "Tipo de proyecto",
      fundingStatus: "Estado de financiación",
      clearFilters: "Limpiar filtros",
      clearFiltersToSeeAll: "Limpiar filtros para ver todos los proyectos",
      showingResults: ({ start, end, total }) =>
        `Mostrando ${start} a ${end} de ${total} proyecto${total > 1 ? "s" : ""}`,
      noResults: "No hay proyectos que coincidan con tus criterios.",
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
      contract: "Smart contract (Base Sepolia)",
      soldOut: "🎉 AGOTADO – 100 % financiado",
      saleClosed: "Venta cerrada",
      funded: (percentage) => `${percentage}% financiado`,
      sharesAvailable: (available, total) => `${available} / ${total} participaciones disponibles`,
      lowSharesWarning: " – ¡Date prisa!",
      saleClosedBanner: "Venta cerrada: distribución en curso",
      saleEnded: "Venta finalizada",
      daysLeft: (count) => {
        const value = Number(count);
        return `Queda${value === 1 ? "" : "n"} ${value} día${value === 1 ? "" : "s"}`;
      },
      hoursLeft: (count) => {
        const value = Number(count);
        return `Queda${value === 1 ? "" : "n"} ${value} hora${value === 1 ? "" : "s"}`;
      },
      endingSoon: "Termina pronto",
      saleEndDateLabel: "Finaliza el {{date}}",
      pricePerShare: "Precio por participación",
      priceEth: "≈ {{amount}} ETH",
      totalPrice: "Precio total",
      totalPriceEth: "≈ {{amount}} ETH",
      type: "Tipo",
      assetType: "Tipo de activo",
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
      saleClosedError: "Esta venta está cerrada. No se pueden comprar más participaciones.",
      priceUnavailableError: "No se pudo obtener el precio desde la blockchain. Inténtalo de nuevo más tarde.",
      invalidContractError: "Dirección de contrato no válida.",
      priceUnavailableShort: "Precio no disponible",
      fullDetails: "Detalles completos",
      location: "Ubicación",
      province: "Provincia",
      totalRaiseAmount: "Monto total a recaudar",
      campaignDuration: "Duración de la campaña",
      governance: "Gobernanza",
      votingEnabled: "Votación activada",
      progress: "Progreso",
      viewMore: "Ver más",
      viewLess: "Ver menos",
      campaignDurationValue: (count) => {
        const value = Number(count);
        return `${value} día${value === 1 ? "" : "s"}`;
      },
      soldOutBadge: "Agotado",
    },
    portfolio: {
      title: "Mi portafolio",
      subtitle: "Gestiona tus puzzles y cobra tus recompensas",
      connectTitle: "Comienza a participar ahora",
      connectMessage: "Conecta tu wallet para acceder a tu portafolio y empezar a participar en proyectos tokenizados.",
      connectButton: "Conectar mi wallet",
      connectHint: "Protegido por la blockchain Base • Participa desde fracciones de ETH",
      loading: "Cargando tu portafolio desde la blockchain...",
      error: "Error: {{error}}",
      networth: "Valor neto",
      netWorth: "Valor neto",
      supplied: "Suministrado",
      borrowed: "Prestado",
      pending: "Pendiente",
      yourPositions: "Tus posiciones",
      active: "activo",
      noPositions: "Sin posiciones",
      noPositionsDesc: "Aún no tienes posiciones en los vaults.",
      browseVaults: "Explorar vaults",
      rewards: "Recompensas",
      health: "Salud",
      claimRewards: "Reclamar todas las recompensas",
      available: "disponible",
      viewExplorer: "Ver en el explorador",
      seeTransactions: "Ver todas las transacciones",
      connectDescription: "Conecta tu wallet para ver tu portafolio, posiciones y ganancias en todos los vaults.",
      portfolioOverview: "Resumen del portafolio",
      lendingPositions: "Posiciones de préstamo",
      metrics: {
        invested: "Total en puzzles",
        dividendsEarned: "Recompensas cobradas",
        pendingDividends: "Recompensas pendientes",
        claimTitle: "Cobra tus recompensas",
        claimSubtitle: (amount) => `Tienes ${amount} disponibles para cobrar.`,
        claimButton: (amount) => `Cobrar ${amount}`,
      },
      investmentsTitle: "Mis puzzles",
      noInvestments: "Todavía no tienes puzzles.",
      browseHint: "Explora los proyectos para comenzar a participar.",
      since: (date) => `Desde ${date}`,
      unknownProperty: "Proyecto desconocido",
      minted: (date) => `Acuñado el ${date}`,
      tokenLabel: (tokenId) => `NFT #${tokenId}`,
      amountInvestedLabel: "Monto en puzzles",
      totalEarnedLabel: "Total cobrado",
      pendingLabel: "Recompensas pendientes",
      roiLabel: "ROI",
      claimCta: "Cobrar",
    },
    leaderboard: {
      title: "Mejores participantes",
      subtitle: "Descubre a los mejores del ecosistema CANTORFI",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "La clasificación mostrará a los principales participantes según sus puzzles y sus rendimientos. ¡Vuelve pronto para ver tu posición!",
      loading: "Cargando clasificación...",
      error: "Error",
      noInvestors: "Aún no hay participantes",
      noInvestorsText: "¡Sé el primer participante en aparecer en la clasificación!",
      rank: "Posición",
      investor: "Participante",
      investments: "Puzzles",
      totalInvested: "Total en Puzzles",
      dividends: "Recompensas",
      performance: "Rendimiento",
    },
    performance: {
      title: "Analítica de rendimiento",
      subtitle: "Sigue la evolución de tus puzzles con el tiempo",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "Muy pronto tendrás análisis detallados y gráficos completos. Estamos trabajando para ofrecerte toda la información que necesitas.",
      loading: "Cargando datos de rendimiento...",
      error: "Error",
      noProperties: "Aún no hay proyectos",
      noPropertiesText: "No hay proyectos tokenizados disponibles para mostrar datos de rendimiento.",
      rank: "Posición",
      property: "Proyecto",
      totalRaised: "Total recaudado",
      dividends: "Recompensas",
      funding: "Financiación",
      performance: "Rendimiento",
      location: "Ubicación",
      expectedReturn: "Rentabilidad esperada",
      sharesSold: "Puzzles vendidos",
      sharePrice: "Precio por puzzle",
      totalDividends: "Total recompensas",
      active: "Activo",
      inactive: "Inactivo",
      liquidated: "Liquidado",
      smartContract: "Smart Contract",
    },
    waitlist: {
      badge: "🚀 Próximamente",
      titleLine1: "Participa en",
      titleLine2: "el futuro de los activos",
      subtitle:
        "Activos del mundo real tokenizados en blockchain. Inmuebles, vehículos, empresas. Diversifica tu portafolio desde {{amount}}.",
      successTitle: "¡Estás en la lista!",
      successText: "Te avisaremos en cuanto lancemos.",
      joinTitle: "Únete a la lista de espera",
      joinSubtitle: "Sé de los primeros en participar",
      emailPlaceholder: "tu@email.com",
      submit: "Unirme a la lista",
      submitting: "Registrando...",
      errorText: "Error al unirte a la lista de espera. Inténtalo de nuevo.",
      consent: "Al unirte, aceptas recibir nuestras comunicaciones.",
      stats: {
        assets: "Activos disponibles",
        investors: "Participantes",
        returns: "Rentabilidad media",
        countries: "Países",
      },
      whyTitle: "¿Por qué CANTORFI?",
      whySubtitle: "Una plataforma integral para participar en activos tokenizados",
      feature1Title: "100% seguro",
      feature1Text: "Smart contracts auditados protegen tus activos en la blockchain.",
      feature2Title: "Rentabilidades atractivas",
      feature2Text: "Hasta un 10 % anual gracias a recompensas automáticas.",
      feature3Title: "Liquidez instantánea",
      feature3Text: "Compra o vende tus puzzles al instante en nuestro marketplace.",
      feature4Title: "Multi-activos",
      feature4Text: "Inmuebles, vehículos, empresas y coleccionables en un solo portafolio.",
      feature5Title: "Acceso desde 1 $",
      feature5Text: "Participa con cualquier monto. Sin mínimo requerido.",
      feature6Title: "Votación y gobernanza",
      feature6Text: "Participa en decisiones clave con tu NFT de puzzle.",
      footerCta: "¿Listo para participar?",
      footerText: "Únete a una nueva generación de participantes.",
    },
    sidebar: {
      title: "Mi portafolio",
      description: "Gestiona tus puzzles y el cobro de recompensas",
      tabs: {
        home: "Inicio",
        dividends: "Recompensas",
      },
      invested: "En puzzles",
      dividends: "Recompensas",
      investmentsTitle: "Mis puzzles",
      investedAmount: "Monto en puzzles",
      dividendsEarned: "Recompensas cobradas",
      pending: "Pendiente",
      since: (date) => `Desde ${date}`,
      claimTitle: "Cobrar recompensas",
      claimSubtitle: (amount) => `Importe disponible: ${amount}`,
      claimButton: "Cobrar ahora",
      claiming: "Cobrando...",
      successAlert: "¡Recompensas cobradas con éxito!",
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
      pushDescription: "Recibe alertas de nuevos proyectos",
      dividendsLabel: "Alertas de recompensas",
      dividendsDescription: "Recibe avisos cuando se distribuyan recompensas",
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
      copyright: "© 2025 CANTORFI - Activos en blockchain",
      contactLabel: "Contacto",
      contactEmail: "contact@cantorfi.tech",
      cgv: "Condiciones generales de venta (CGV)",
      cgu: "Condiciones generales de uso (CGU)",
    },
    legal: {
      cgvTitle: "Condiciones Generales de Venta",
      cgvIntro: "Nuestras condiciones generales de venta estarán disponibles en breve. Gracias por tu paciencia mientras finalizamos este contenido.",
      cguTitle: "Condiciones Generales de Uso",
      cguIntro: "Nuestras condiciones generales de uso estarán disponibles en breve. Estamos trabajando para ofrecerte información clara y completa.",
    },
    vaults: {
      title: "Mercados de préstamo",
      subtitle: "Suministrar o pedir prestado activos",
      loading: "Cargando vaults...",
      noVaults: "No hay vaults disponibles",
      noVaultsDesc: "Nuevos vaults de préstamo próximamente.",
      available: "mercados",
    },
    staking: {
      liveEarning: "GANANDO RECOMPENSAS",
      title: "Stake",
      earn: "Ganar",
      subtitle: "Suministra tus activos a los vaults de préstamo y gana rendimientos pasivos. Retira en cualquier momento.",
      totalStaked: "Total en Stake",
      avgAPY: "APY prom.",
      variableRate: "Tasa variable",
      yourStake: "Tu Stake",
      positions: "posiciones",
      pendingRewards: "Pendiente",
      claimable: "Reclamable",
      noLock: "Sin bloqueo",
      flexible: "Flexible",
      withdrawAnytime: "Retiro en cualquier momento",
      secured: "Seguro",
      audited: "Auditado",
      verified: "Contratos verificados",
      connectTitle: "Conecta para empezar a ganar",
      connectDescription: "Conecta tu wallet para hacer stake y ganar rendimientos.",
      availablePools: "Pools disponibles",
      active: "activos",
      noPools: "No hay pools disponibles",
      noPoolsDesc: "Nuevos pools de staking serán añadidos pronto.",
      supplyAPY: "APY Supply",
      tvl: "TVL",
      utilization: "Util.",
      stake: "Stake",
      manage: "Gestionar",
      earnYield: "Gana rendimientos",
      earnYieldDesc: "Suministra activos para ganar intereses de los prestatarios.",
      collateralized: "Colateralizado",
      collateralizedDesc: "Todos los préstamos están sobre-colateralizados y son liquidables.",
      flexibleDesc: "Sin períodos de bloqueo. Retira en cualquier momento según la liquidez.",
      loading: "Cargando pools de staking...",
      stakeCVT: "Stakear CVT",
      earnRewards: "Gana",
      poolDescription: "Suministra tokens al vault, recibe CVT, luego stakea CVT para ganar recompensas",
      backToPools: "Volver a pools",
      poolStats: "Estadísticas del pool",
      currentAPY: "APY actual",
      ofCapacity: "de capacidad",
      available: "Disponible",
      toStake: "para stakear",
      lockPeriod: "Período de bloqueo",
      none: "Ninguno",
      withdrawalTime: "Tiempo de retiro",
      instant: "Instantáneo",
      stakingFee: "Comisión de staking",
      minStake: "Stake mínimo",
      yourPosition: "Tu posición",
      staked: "En Stake",
      value: "Valor",
      earning: "Ganando",
      claimRewards: "Reclamar",
      howItWorks: "Cómo funciona el Staking",
      step1Title: "Depositar",
      step1Desc: "Stakea tus tokens en el pool",
      step2Title: "Ganar",
      step2Desc: "Acumula recompensas con el tiempo",
      step3Title: "Retirar",
      step3Desc: "Retira en cualquier momento sin comisiones",
      unstake: "Retirar",
      stakeTokens: "Stakear",
      unstakeTokens: "Retirar",
      connectToStake: "Conecta tu wallet para stakear tokens",
      poolSize: "Tamaño del pool",
      capacity: "Capacidad",
      stakingPositions: "Posiciones de staking",
      noPoolAvailable: "No hay pool de staking disponible",
      noPoolDescription: "No hay vaults con staking disponibles todavía.",
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
