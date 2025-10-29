type Locale = 'fr' | 'en' | 'es';

export interface LabeledOption {
  value: string;
  labels: Record<Locale, string>;
}

export const ASSET_TYPE_OPTIONS: LabeledOption[] = [
  {
    value: 'house',
    labels: { fr: 'Maison', en: 'House', es: 'Casa' },
  },
  {
    value: 'apartment',
    labels: { fr: 'Appartement', en: 'Apartment', es: 'Apartamento' },
  },
  {
    value: 'land',
    labels: { fr: 'Terrain', en: 'Land', es: 'Terreno' },
  },
  {
    value: 'boat',
    labels: { fr: 'Bateau', en: 'Boat', es: 'Barco' },
  },
  {
    value: 'vehicle',
    labels: { fr: 'Voiture', en: 'Car', es: 'Coche' },
  },
  {
    value: 'motorcycle',
    labels: { fr: 'Moto', en: 'Motorcycle', es: 'Motocicleta' },
  },
  {
    value: 'equipment',
    labels: { fr: 'Outil', en: 'Equipment', es: 'Equipo' },
  },
];

export const PLACE_TYPE_OPTIONS: LabeledOption[] = [
  {
    value: 'residential',
    labels: { fr: 'Résidentiel', en: 'Residential', es: 'Residencial' },
  },
  {
    value: 'commercial',
    labels: { fr: 'Commercial', en: 'Commercial', es: 'Comercial' },
  },
  {
    value: 'industrial',
    labels: { fr: 'Industriel', en: 'Industrial', es: 'Industrial' },
  },
  {
    value: 'hospitality',
    labels: { fr: 'Hôtellerie', en: 'Hospitality', es: 'Hostelería' },
  },
  {
    value: 'logistics',
    labels: { fr: 'Logistique', en: 'Logistics', es: 'Logística' },
  },
  {
    value: 'mixed_use',
    labels: { fr: 'Usage mixte', en: 'Mixed use', es: 'Uso mixto' },
  },
  {
    value: 'other',
    labels: { fr: 'Autre', en: 'Other', es: 'Otro' },
  },
];

export const COUNTRY_CODES = [
  'FR',
  'US',
  'CA',
  'ES',
  'PT',
  'DE',
  'IT',
  'GB',
  'AE',
  'MA',
  'SN',
  'NG',
  'BR',
  'SG',
  'CH',
  'AU',
] as const;
