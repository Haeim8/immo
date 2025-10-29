"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Locale,
  Dictionary,
  dictionaries,
  defaultLocale,
  CurrencyCode,
  currencyMeta,
  defaultCurrency,
  supportedCurrencies,
} from "@/lib/intl/dictionaries";

interface IntlContextValue {
  language: Locale;
  setLanguage: (locale: Locale) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  t: (path: string, variables?: Record<string, string | number>) => string;
  formatCurrency: (amountUSD: number, options?: Intl.NumberFormatOptions) => string;
  convertFromUSD: (amountUSD: number) => number;
  rates: Record<CurrencyCode, number>;
  dictionary: Dictionary;
}

const IntlContext = createContext<IntlContextValue | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "usci:language";
const CURRENCY_STORAGE_KEY = "usci:currency";

const FALLBACK_RATES: Record<CurrencyCode, number> = {
  usd: 1,
  eur: 0.92,
  cad: 1.37,
  krw: 1395,
  jpy: 149,
  gbp: 0.79,
};

const COUNTRY_DEFAULTS: Record<
  string,
  { language: Locale; currency: CurrencyCode }
> = {
  FR: { language: "fr", currency: "eur" },
  BE: { language: "fr", currency: "eur" },
  CH: { language: "fr", currency: "eur" },
  CA: { language: "en", currency: "cad" },
  US: { language: "en", currency: "usd" },
  GB: { language: "en", currency: "gbp" },
  IE: { language: "en", currency: "eur" },
  ES: { language: "es", currency: "eur" },
  MX: { language: "es", currency: "usd" },
  AR: { language: "es", currency: "usd" },
  CO: { language: "es", currency: "usd" },
  KR: { language: "en", currency: "krw" },
  JP: { language: "en", currency: "jpy" },
};

async function fetchRates(): Promise<Record<CurrencyCode, number>> {
  try {
    const response = await fetch(
      "https://api.exchangerate.host/latest?base=USD&symbols=EUR,CAD,KRW,JPY,GBP"
    );
    if (!response.ok) {
      throw new Error("Rates request failed");
    }
    const data = await response.json();
    const rates: Record<CurrencyCode, number> = {
      usd: 1,
      eur: data.rates?.EUR ?? FALLBACK_RATES.eur,
      cad: data.rates?.CAD ?? FALLBACK_RATES.cad,
      krw: data.rates?.KRW ?? FALLBACK_RATES.krw,
      jpy: data.rates?.JPY ?? FALLBACK_RATES.jpy,
      gbp: data.rates?.GBP ?? FALLBACK_RATES.gbp,
    };
    return rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return FALLBACK_RATES;
  }
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>(defaultLocale);
  const [currency, setCurrencyState] = useState<CurrencyCode>(defaultCurrency);
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);

  // Load preferences from storage / detection
  useEffect(() => {
    // Skip during SSR/build
    if (typeof window === 'undefined') return;

    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale | null;
    const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;

    if (storedLang && dictionaries[storedLang]) {
      setLanguageState(storedLang);
      document.documentElement.lang = storedLang;
    }

    if (storedCurrency && supportedCurrencies.includes(storedCurrency)) {
      setCurrencyState(storedCurrency);
    }

    if (!storedLang || !storedCurrency) {
      fetch("/api/detect")
        .then((res) => res.json())
        .then((data: { country?: string } | undefined) => {
          if (!data?.country) return;
          const defaults = COUNTRY_DEFAULTS[data.country];
          if (defaults) {
            if (!storedLang) {
              setLanguageState(defaults.language);
              document.documentElement.lang = defaults.language;
              localStorage.setItem(LANGUAGE_STORAGE_KEY, defaults.language);
            }
            if (!storedCurrency) {
              setCurrencyState(defaults.currency);
              localStorage.setItem(CURRENCY_STORAGE_KEY, defaults.currency);
            }
          }
        })
        .catch((err) => {
          // Silent fail during build/SSR
          if (typeof window !== 'undefined') {
            console.error("Geolocation detection failed:", err);
          }
        });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    // Skip during SSR/build
    if (typeof window === 'undefined') return;

    fetchRates().then(setRates);
  }, []);

  const setLanguage = useCallback((locale: Locale) => {
    setLanguageState(locale);
    if (typeof window !== 'undefined') {
      document.documentElement.lang = locale;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    }
  }, []);

  const dictionary = useMemo<Dictionary>(() => dictionaries[language] ?? dictionaries[defaultLocale], [language]);

  const t = useCallback(
    (path: string, variables?: Record<string, string | number>) => {
      const segments = path.split(".");
      let value: any = dictionary;
      for (const segment of segments) {
        if (value && typeof value === "object" && segment in value) {
          value = value[segment];
        } else {
          console.warn(`Missing translation for key: ${path} (${language})`);
          value = path;
          break;
        }
      }

      if (typeof value === "function") {
        return value(
          ...(variables ? Object.values(variables).map((v) => String(v)) : [])
        );
      }

      if (typeof value === "string") {
        let result = value;
        if (variables) {
          Object.entries(variables).forEach(([key, val]) => {
            result = result.replace(`{{${key}}}`, String(val));
          });
        }
        return result;
      }

      return String(value);
    },
    [dictionary, language]
  );

  const convertFromUSD = useCallback(
    (amountUSD: number) => amountUSD * (rates[currency] ?? 1),
    [currency, rates]
  );

  const formatCurrency = useCallback(
    (amountUSD: number, options?: Intl.NumberFormatOptions) => {
      const meta = currencyMeta[currency];
      const converted = convertFromUSD(amountUSD);
      return new Intl.NumberFormat(meta.locale, {
        style: "currency",
        currency: meta.currency,
        ...options,
      }).format(converted);
    },
    [convertFromUSD, currency]
  );

  const value: IntlContextValue = useMemo(
    () => ({
      language,
      setLanguage,
      currency,
      setCurrency,
      t,
      formatCurrency,
      convertFromUSD,
      rates,
      dictionary,
    }),
    [language, setLanguage, currency, setCurrency, t, formatCurrency, convertFromUSD, rates, dictionary]
  );

  return <IntlContext.Provider value={value}>{children}</IntlContext.Provider>;
}

export function useIntl() {
  const context = useContext(IntlContext);
  if (!context) {
    throw new Error("useIntl must be used within IntlProvider");
  }
  return context;
}

export function useTranslations(section?: string) {
  const { t } = useIntl();
  return useCallback(
    (key: string, variables?: Record<string, string | number>) =>
      t(section ? `${section}.${key}` : key, variables),
    [section, t]
  );
}

export function useCurrencyFormatter() {
  const { formatCurrency, convertFromUSD, currency } = useIntl();
  return { formatCurrency, convertFromUSD, currency, meta: currencyMeta[currency] };
}
