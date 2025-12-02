import { Locale } from "./intl/dictionaries";

export type ErrorCode =
  | "NETWORK_MISMATCH"
  | "WALLET_DISCONNECTED"
  | "PROTOCOL_UNREACHABLE"
  | "READER_CALL_FAILED"
  | "USER_REJECTED"
  | "INSUFFICIENT_FUNDS"
  | "ALLOWANCE_LOW"
  | "VAULT_PAUSED"
  | "INVALID_CHAIN_DATA"
  | "UNKNOWN";

type LocalizedMessage = {
  title: string;
  description: string;
  actionLabel?: string;
  severity?: "error" | "warning" | "info";
};

type ErrorDictionary = Record<ErrorCode, Record<Locale, LocalizedMessage>>;

const dictionary: ErrorDictionary = {
  NETWORK_MISMATCH: {
    en: {
      title: "Wrong network",
      description: "Switch to Base Sepolia to interact with CantorFi test contracts.",
      actionLabel: "Switch network",
      severity: "warning",
    },
    fr: {
      title: "Mauvaise blockchain",
      description: "Passe sur Base Sepolia pour interagir avec les contrats de test CantorFi.",
      actionLabel: "Changer de réseau",
      severity: "warning",
    },
    es: {
      title: "Red incorrecta",
      description: "Cambia a Base Sepolia para interactuar con los contratos de prueba de CantorFi.",
      actionLabel: "Cambiar de red",
      severity: "warning",
    },
  },
  WALLET_DISCONNECTED: {
    en: {
      title: "Wallet not connected",
      description: "Connect your wallet to load balances and positions.",
      actionLabel: "Connect wallet",
    },
    fr: {
      title: "Wallet non connecté",
      description: "Connecte ton wallet pour charger tes soldes et positions.",
      actionLabel: "Connecter le wallet",
    },
    es: {
      title: "Wallet desconectado",
      description: "Conecta tu wallet para cargar saldos y posiciones.",
      actionLabel: "Conectar wallet",
    },
  },
  PROTOCOL_UNREACHABLE: {
    en: {
      title: "Protocol unavailable",
      description: "Unable to reach the protocol contracts. Check your RPC or try again.",
      actionLabel: "Retry",
      severity: "error",
    },
    fr: {
      title: "Protocole indisponible",
      description: "Impossible de joindre les contrats du protocole. Vérifie ton RPC ou réessaie.",
      actionLabel: "Réessayer",
      severity: "error",
    },
    es: {
      title: "Protocolo no disponible",
      description: "No se puede contactar con los contratos. Comprueba tu RPC o inténtalo de nuevo.",
      actionLabel: "Reintentar",
      severity: "error",
    },
  },
  READER_CALL_FAILED: {
    en: {
      title: "Data fetch failed",
      description: "Reading vault data from the reader contract failed. The subgraph/RPC may be down.",
      actionLabel: "Reload",
      severity: "error",
    },
    fr: {
      title: "Échec de la récupération des données",
      description: "La lecture des données du reader a échoué. Le RPC ou le sous-graph peut être indisponible.",
      actionLabel: "Recharger",
      severity: "error",
    },
    es: {
      title: "Error al recuperar datos",
      description: "Falló la lectura de datos desde el reader. Puede que el RPC o el subgraph estén caídos.",
      actionLabel: "Recargar",
      severity: "error",
    },
  },
  USER_REJECTED: {
    en: {
      title: "Signature rejected",
      description: "You rejected the transaction in your wallet.",
      severity: "info",
    },
    fr: {
      title: "Signature refusée",
      description: "Tu as refusé la transaction dans ton wallet.",
      severity: "info",
    },
    es: {
      title: "Firma rechazada",
      description: "Rechazaste la transacción en tu wallet.",
      severity: "info",
    },
  },
  INSUFFICIENT_FUNDS: {
    en: {
      title: "Insufficient funds",
      description: "Your balance is too low to cover the amount plus gas fees.",
      severity: "error",
    },
    fr: {
      title: "Fonds insuffisants",
      description: "Ton solde est insuffisant pour le montant et les frais de gas.",
      severity: "error",
    },
    es: {
      title: "Fondos insuficientes",
      description: "Tu saldo es insuficiente para el importe y las comisiones de gas.",
      severity: "error",
    },
  },
  ALLOWANCE_LOW: {
    en: {
      title: "Approval required",
      description: "Increase your token allowance for this vault to continue.",
      actionLabel: "Approve",
      severity: "warning",
    },
    fr: {
      title: "Approbation requise",
      description: "Augmente ton allowance pour ce vault afin de continuer.",
      actionLabel: "Approuver",
      severity: "warning",
    },
    es: {
      title: "Aprobación requerida",
      description: "Aumenta la asignación de tokens para este vault para continuar.",
      actionLabel: "Aprobar",
      severity: "warning",
    },
  },
  VAULT_PAUSED: {
    en: {
      title: "Vault paused",
      description: "Operations are temporarily paused by the protocol admin.",
      severity: "info",
    },
    fr: {
      title: "Vault en pause",
      description: "Les opérations sont temporairement suspendues par l’administrateur du protocole.",
      severity: "info",
    },
    es: {
      title: "Vault en pausa",
      description: "Las operaciones están en pausa temporalmente por el administrador del protocolo.",
      severity: "info",
    },
  },
  INVALID_CHAIN_DATA: {
    en: {
      title: "Unexpected contract data",
      description: "The contract returned unexpected values. Refresh or contact support.",
      severity: "warning",
    },
    fr: {
      title: "Données contractuelles inattendues",
      description: "Le contrat a renvoyé des valeurs inattendues. Rafraîchis ou contacte le support.",
      severity: "warning",
    },
    es: {
      title: "Datos inesperados del contrato",
      description: "El contrato devolvió valores inesperados. Actualiza o contacta con soporte.",
      severity: "warning",
    },
  },
  UNKNOWN: {
    en: {
      title: "Unknown error",
      description: "An unexpected error occurred. Try again.",
      severity: "error",
    },
    fr: {
      title: "Erreur inconnue",
      description: "Une erreur inattendue est survenue. Réessaie.",
      severity: "error",
    },
    es: {
      title: "Error desconocido",
      description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
      severity: "error",
    },
  },
};

const FALLBACK: LocalizedMessage = {
  title: "Error",
  description: "Something went wrong.",
};

export function getErrorMessage(
  code: ErrorCode,
  locale: Locale
): LocalizedMessage {
  const entry = dictionary[code] ?? dictionary.UNKNOWN;
  return entry[locale] ?? entry.en ?? FALLBACK;
}
