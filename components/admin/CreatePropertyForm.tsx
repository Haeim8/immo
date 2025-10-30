'use client';

import { ChangeEvent, FC, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import AnimatedButton from '@/components/atoms/AnimatedButton';
import GlassCard from '@/components/atoms/GlassCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWalletAddress, useEthPrice } from '@/lib/evm/hooks';
import { useCreatePlace } from '@/lib/evm/write-hooks';
import { usdToEth } from '@/lib/evm/adapters';
import { uploadPropertyImage } from '@/lib/pinata/upload';
import { createPropertyMetadata, uploadPropertyMetadata } from '@/lib/pinata/metadata';
import { ASSET_TYPE_OPTIONS, PLACE_TYPE_OPTIONS, COUNTRY_CODES } from '@/lib/data/propertyOptions';
import { useIntl } from '@/components/providers/IntlProvider';

const FORM_STORAGE_KEY = 'usci:admin:create-form';

// Types d'actifs où le nombre de pièces n'a pas de sens
const ASSET_TYPES_WITHOUT_ROOMS = ['vehicle', 'boat', 'motorcycle', 'equipment', 'land'];

type Locale = 'fr' | 'en' | 'es';

interface CreatePropertyFormState {
  assetType: string;
  placeType: string;
  name: string;
  city: string;
  province: string;
  country: string;
  totalRaiseUsd: string;
  totalShares: string;
  durationDays: string;
  expectedReturnPct: string;
  surface: string;
  rooms: string;
  yearBuilt: string;
  description: string;
  longDescription: string;
  features: string;
  votingEnabled: boolean;
}

const DEFAULT_FORM_STATE: CreatePropertyFormState = {
  assetType: 'house',
  placeType: 'residential',
  name: '',
  city: '',
  province: '',
  country: 'FR',
  totalRaiseUsd: '',
  totalShares: '',
  durationDays: '',
  expectedReturnPct: '',
  surface: '',
  rooms: '',
  yearBuilt: '',
  description: '',
  longDescription: '',
  features: '',
  votingEnabled: true,
};

const CreatePropertyForm: FC = () => {
  const { isConnected } = useWalletAddress();
  const { price: ethPrice } = useEthPrice();
  const {
    createPlace,
    isPending: isCreating,
    isSuccess: txSuccess,
    error: txError
  } = useCreatePlace();
  const { language } = useIntl();
  const currentLocale = language as Locale;

  const [formData, setFormData] = useState<CreatePropertyFormState>(DEFAULT_FORM_STATE);
  const [isPersistEnabled, setIsPersistEnabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');

  // Gérer le succès de la création
  useEffect(() => {
    if (txSuccess) {
      resetForm();
    }
  }, [txSuccess]);

  const assetOptions = useMemo(
    () =>
      ASSET_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.labels[currentLocale] ?? option.labels.en,
      })),
    [currentLocale]
  );

  const placeTypeOptions = useMemo(
    () =>
      PLACE_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.labels[currentLocale] ?? option.labels.en,
      })),
    [currentLocale]
  );

  const countryOptions = useMemo(() => {
    if (typeof window === 'undefined') {
      return COUNTRY_CODES.map((code) => ({ value: code, label: code }));
    }

    try {
      const Formatter = (Intl as unknown as { DisplayNames?: typeof Intl.DisplayNames }).DisplayNames;
      if (typeof Formatter !== 'function') {
        return COUNTRY_CODES.map((code) => ({ value: code, label: code }));
      }

      const formatter = new Formatter([language], { type: 'region' });
      return COUNTRY_CODES.map((code) => ({
        value: code,
        label: formatter.of(code) ?? code,
      })).sort((a, b) => a.label.localeCompare(b.label, language));
    } catch {
      return COUNTRY_CODES.map((code) => ({ value: code, label: code }));
    }
  }, [language]);

  const sharePriceUsd = useMemo(() => {
    const total = parseFloat(formData.totalRaiseUsd);
    const shares = parseFloat(formData.totalShares);
    if (!Number.isFinite(total) || !Number.isFinite(shares) || shares <= 0) {
      return '';
    }
    return (total / shares).toFixed(2);
  }, [formData.totalRaiseUsd, formData.totalShares]);

  const sharePriceEth = useMemo(() => {
    if (!sharePriceUsd) return '';
    if (!ethPrice.usd || !Number.isFinite(ethPrice.usd)) return '';
    const value = parseFloat(sharePriceUsd);
    if (!Number.isFinite(value) || value <= 0) return '';
    return (value / ethPrice.usd).toFixed(6);
  }, [sharePriceUsd, ethPrice.usd]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = localStorage.getItem(FORM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CreatePropertyFormState>;
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (storageError) {
      console.warn('Impossible de charger le brouillon du formulaire', storageError);
    } finally {
      setIsPersistEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!isPersistEnabled || typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (storageError) {
      console.warn('Impossible de persister le brouillon du formulaire', storageError);
    }
  }, [formData, isPersistEnabled]);

  // Forcer rooms à 0 pour les types d'actifs où ça n'a pas de sens
  useEffect(() => {
    if (ASSET_TYPES_WITHOUT_ROOMS.includes(formData.assetType)) {
      if (formData.rooms !== '0') {
        setFormData((prev) => ({ ...prev, rooms: '0' }));
      }
    }
  }, [formData.assetType, formData.rooms]);

  const updateField = (field: keyof CreatePropertyFormState, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setIsPersistEnabled(false);
    setFormData(DEFAULT_FORM_STATE);
    setSelectedImage(null);
    setImagePreview('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FORM_STORAGE_KEY);
      window.setTimeout(() => setIsPersistEnabled(true), 0);
    } else {
      setIsPersistEnabled(true);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      setError('Connectez votre wallet avant de créer une propriété.');
      return;
    }

    if (!selectedImage) {
      setError('Veuillez ajouter une image de couverture.');
      return;
    }

    const requiredFields: Array<[keyof CreatePropertyFormState, string]> = [
      ['name', 'Nom'],
      ['city', 'Ville'],
      ['province', 'Région'],
      ['country', 'Pays'],
      ['totalRaiseUsd', 'Montant à lever'],
      ['totalShares', 'Nombre de parts'],
      ['durationDays', 'Durée (jours)'],
      ['expectedReturnPct', 'Rendement attendu'],
      ['surface', 'Surface'],
      // Rooms est requis seulement pour certains types d'actifs
      ...(!ASSET_TYPES_WITHOUT_ROOMS.includes(formData.assetType) ? [['rooms', 'Pièces'] as [keyof CreatePropertyFormState, string]] : []),
      ['yearBuilt', 'Année de construction'],
      ['description', 'Description courte'],
    ];

    const missing = requiredFields
      .filter(([field]) => {
        const value = formData[field];
        if (typeof value === 'boolean') {
          return false;
        }
        return value.trim().length === 0;
      })
      .map(([, label]) => label);

    if (missing.length > 0) {
      setError(`Veuillez compléter les champs suivants : ${missing.join(', ')}`);
      return;
    }

    if (!sharePriceUsd) {
      setError('Impossible de calculer le prix par part. Vérifiez le montant et le nombre de parts.');
      return;
    }

    const totalRaiseUsd = parseFloat(formData.totalRaiseUsd);
    const totalShares = parseInt(formData.totalShares, 10);
    const sharePriceValue = parseFloat(sharePriceUsd);
    const durationDays = parseInt(formData.durationDays, 10);
    const expectedReturnPct = parseFloat(formData.expectedReturnPct);
    const surface = parseInt(formData.surface, 10);
    const rooms = parseInt(formData.rooms, 10);
    const yearBuilt = parseInt(formData.yearBuilt, 10);
    const currentYear = new Date().getFullYear();

    if (!Number.isFinite(totalRaiseUsd) || totalRaiseUsd <= 0) {
      setError('Le montant à lever doit être supérieur à 0 USD.');
      return;
    }
    if (!Number.isInteger(totalShares) || totalShares <= 0) {
      setError('Le nombre de parts doit être un entier positif.');
      return;
    }
    if (!Number.isFinite(sharePriceValue) || sharePriceValue <= 0) {
      setError('Le prix par part calculé est invalide.');
      return;
    }
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      setError('La durée doit être exprimée en jours et supérieure à 0.');
      return;
    }
    if (!Number.isFinite(expectedReturnPct) || expectedReturnPct < 0) {
      setError('Le rendement attendu doit être positif.');
      return;
    }
    if (!Number.isFinite(surface) || surface <= 0) {
      setError('La surface doit être un entier positif.');
      return;
    }

    // Validation conditionnelle pour rooms
    if (ASSET_TYPES_WITHOUT_ROOMS.includes(formData.assetType)) {
      // Pour les véhicules, bateaux, équipements, etc., rooms doit être 0
      if (rooms !== 0) {
        setError("Le nombre de pièces n'est pas applicable pour ce type d'actif et doit être 0.");
        return;
      }
    } else {
      // Pour les maisons, appartements, etc., rooms doit être entre 1 et 255
      if (!Number.isInteger(rooms) || rooms <= 0 || rooms > 255) {
        setError('Le nombre de pièces doit être compris entre 1 et 255.');
        return;
      }
    }
    if (!Number.isInteger(yearBuilt) || yearBuilt < 1800 || yearBuilt > currentYear) {
      setError(`L'année de construction doit être comprise entre 1800 et ${currentYear}.`);
      return;
    }

    const saleDurationSeconds = durationDays * 86400;
    const expectedReturnBps = Math.round(expectedReturnPct * 100);
    const puzzlePriceWei = usdToEth(sharePriceValue, ethPrice.usd);

    if (puzzlePriceWei <= 0n) {
      setError('Le prix par part converti en ETH est invalide.');
      return;
    }

    setError('');

    let uploadedImageCid = '';
    try {
      uploadedImageCid = await uploadPropertyImage(selectedImage, formData.name.trim());
    } catch (uploadError) {
      console.error('Upload image failed:', uploadError);
      setError("Échec de l'upload de l'image sur IPFS.");
      return;
    }

    let metadataCid = '';
    try {
      const metadata = createPropertyMetadata({
        assetType: formData.assetType,
        name: formData.name.trim(),
        city: formData.city.trim(),
        province: formData.province.trim(),
        country: formData.country,
        description: formData.description.trim(),
        longDescription: formData.longDescription.trim(),
        imageCid: uploadedImageCid,
        surface,
        rooms,
        propertyType: formData.placeType,
        yearBuilt,
        features: formData.features,
        totalShares,
        sharePrice: sharePriceValue,
        expectedReturn: expectedReturnPct,
        votingEnabled: formData.votingEnabled,
        externalUrl: 'https://usci.com/property/',
      });
      metadataCid = await uploadPropertyMetadata(metadata);
    } catch (metadataError) {
      console.error('Upload metadata failed:', metadataError);
      setError("Impossible d'envoyer les métadonnées sur IPFS.");
      return;
    }

    setError('');
    createPlace({
      assetType: formData.assetType,
      name: formData.name.trim(),
      city: formData.city.trim(),
      province: formData.province.trim(),
      country: formData.country,
      totalPuzzles: totalShares,
      puzzlePrice: puzzlePriceWei,
      saleDurationSeconds,
      surface,
      rooms,
      expectedReturnBps,
      placeType: formData.placeType,
      yearBuilt,
      imageCid: uploadedImageCid,
      metadataCid,
      votingEnabled: formData.votingEnabled,
    });
  };

  return (
    <GlassCard>
      <h3 className="text-2xl font-bold mb-6 text-purple-400">Créer une nouvelle propriété</h3>

      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold mb-4">Informations générales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type d'actif</label>
              <Select
                value={formData.assetType}
                onValueChange={(value) => updateField('assetType', value)}
                disabled={isCreating}
              >
                <SelectTrigger className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {assetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nom de la propriété</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : Villa Méditerranée"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type d'exploitation</label>
              <Select
                value={formData.placeType}
                onValueChange={(value) => updateField('placeType', value)}
                disabled={isCreating}
              >
                <SelectTrigger className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none">
                  <SelectValue placeholder="Usage du bien" />
                </SelectTrigger>
                <SelectContent>
                  {placeTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : Paris"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Région / Province</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => updateField('province', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : Île-de-France"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pays</label>
              <Select
                value={formData.country}
                onValueChange={(value) => updateField('country', value)}
                disabled={isCreating}
              >
                <SelectTrigger className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Surface (m²)</label>
              <input
                type="number"
                value={formData.surface}
                onChange={(e) => updateField('surface', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : 120"
              />
            </div>
            {!ASSET_TYPES_WITHOUT_ROOMS.includes(formData.assetType) && (
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de pièces</label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => updateField('rooms', e.target.value)}
                  disabled={isCreating}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  placeholder="Ex : 4"
                />
              </div>
            )}
            {ASSET_TYPES_WITHOUT_ROOMS.includes(formData.assetType) && (
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Nombre de pièces (non applicable)
                </label>
                <input
                  type="text"
                  value="N/A"
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Financement</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Montant à lever (USD)</label>
              <input
                type="number"
                value={formData.totalRaiseUsd}
                onChange={(e) => updateField('totalRaiseUsd', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : 500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de parts</label>
              <input
                type="number"
                value={formData.totalShares}
                onChange={(e) => updateField('totalShares', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : 1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prix par part (USD)</label>
              <input
                type="text"
                value={sharePriceUsd}
                readOnly
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground"
                placeholder="Calcul automatique"
              />
              {sharePriceEth && (
                <p className="text-xs text-muted-foreground mt-1">≈ {sharePriceEth} ETH</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rendement attendu (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.expectedReturnPct}
                onChange={(e) => updateField('expectedReturnPct', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : 5.5"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Paramètres techniques</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Durée de vente (jours)</label>
              <input
                type="number"
                value={formData.durationDays}
                onChange={(e) => updateField('durationDays', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : 30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Année de construction</label>
              <input
                type="number"
                value={formData.yearBuilt}
                onChange={(e) => updateField('yearBuilt', e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex : 2020"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description (512 caractères max)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            maxLength={512}
            disabled={isCreating}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none resize-none"
            placeholder="Présentation courte du bien"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.description.length}/512 caractères
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Présentation détaillée (2000 caractères max)
          </label>
          <textarea
            value={formData.longDescription}
            onChange={(e) => updateField('longDescription', e.target.value)}
            rows={8}
            maxLength={2000}
            disabled={isCreating}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none resize-none"
            placeholder="Argumentaire complet, historique, points clés…"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.longDescription.length}/2000 caractères
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Atouts (séparés par une virgule)</label>
          <input
            type="text"
            value={formData.features}
            onChange={(e) => updateField('features', e.target.value)}
            disabled={isCreating}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 focus:outline-none"
            placeholder="Piscine, Garage, Jardin"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image de couverture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isCreating}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
          />
          {imagePreview && (
            <div className="mt-4 relative rounded-xl overflow-hidden border border-white/10">
              <div className="relative w-full h-64">
                <Image
                  src={imagePreview}
                  alt="Prévisualisation"
                  fill
                  className="object-cover rounded-xl"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={formData.votingEnabled}
              onChange={(e) => updateField('votingEnabled', e.target.checked)}
              disabled={isCreating}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
            />
            Activer la gouvernance communautaire
          </label>
          <p className="text-xs text-muted-foreground">
            Permet aux investisseurs de voter sur les propositions liées au bien.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <p className="text-sm text-muted-foreground">
            1 ETH ={' '}
            <span className="text-cyan-400 font-semibold">
              ${ethPrice.usd.toFixed(2)} USD
            </span>
            {' • '}
            <span className="text-xs">
              Mise à jour : {new Date(ethPrice.lastUpdated).toLocaleTimeString()}
            </span>
          </p>
        </div>

        {/* Transaction en cours */}
        {isCreating && (
          <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium">Déploiement en cours...</p>
              <p className="text-sm text-muted-foreground">
                Veuillez signer la transaction dans votre wallet et attendre la confirmation.
              </p>
            </div>
          </div>
        )}

        {/* Succès de la transaction */}
        {txSuccess && !isCreating && (
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300">
            ✅ Propriété créée avec succès ! La transaction a été confirmée sur la blockchain.
          </div>
        )}

        {/* Erreur de transaction */}
        {txError && !isCreating && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ Erreur blockchain : {txError.message || 'La transaction a échoué'}
          </div>
        )}

        {/* Erreur locale (validation ou upload IPFS) */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
            ❌ {error}
          </div>
        )}

        {!isConnected && (
          <div className="p-4 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-300">
            Connectez votre wallet pour pouvoir déployer un contrat.
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <AnimatedButton variant="outline" className="flex-1" onClick={resetForm} disabled={isCreating}>
            Réinitialiser
          </AnimatedButton>
          <AnimatedButton
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isCreating || !isConnected}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Déploiement en cours...
              </>
            ) : (
              'Déployer sur Base'
            )}
          </AnimatedButton>
        </div>
      </div>
    </GlassCard>
  );
};

export default CreatePropertyForm;
