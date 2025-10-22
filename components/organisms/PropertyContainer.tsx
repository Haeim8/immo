"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import PropertyCard from "@/components/molecules/PropertyCard";
import GlassCard from "@/components/atoms/GlassCard";
import { Investment } from "@/lib/types";
import { useTranslations } from "@/components/providers/IntlProvider";

interface PropertyContainerProps {
  properties: Investment[];
}

type SortOption = "price-asc" | "price-desc" | "return-desc" | "name-asc";
type FilterType = "all" | "residential" | "commercial" | "mixed";
type FilterStatus = "all" | "funding" | "funded";

const PROPERTIES_PER_PAGE = 12;

export default function PropertyContainer({ properties }: PropertyContainerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);

  const propertyContainerT = useTranslations("propertyContainer");

  // Filtrage et tri
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = [...properties];

    // Recherche par nom ou localisation
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.name.toLowerCase().includes(query) ||
          property.location.toLowerCase().includes(query)
      );
    }

    // Filtre par type
    if (filterType !== "all") {
      filtered = filtered.filter((property) => property.type.toLowerCase() === filterType);
    }

    // Filtre par statut
    if (filterStatus !== "all") {
      if (filterStatus === "funding") {
        filtered = filtered.filter((property) => property.fundingProgress < 100);
      } else if (filterStatus === "funded") {
        filtered = filtered.filter((property) => property.fundingProgress >= 100);
      }
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.priceUSD - b.priceUSD;
        case "price-desc":
          return b.priceUSD - a.priceUSD;
        case "return-desc":
          return b.expectedReturn - a.expectedReturn;
        case "name-asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [properties, searchQuery, sortBy, filterType, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProperties.length / PROPERTIES_PER_PAGE);
  const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
  const endIndex = startIndex + PROPERTIES_PER_PAGE;
  const currentProperties = filteredAndSortedProperties.slice(startIndex, endIndex);

  // Reset à la page 1 quand les filtres changent
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Gestion des pages
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll smooth vers le haut du conteneur
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    handleFilterChange();
  };

  const handleTypeFilter = (value: FilterType) => {
    setFilterType(value);
    handleFilterChange();
  };

  const handleStatusFilter = (value: FilterStatus) => {
    setFilterStatus(value);
    handleFilterChange();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("name-asc");
    setFilterType("all");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || sortBy !== "name-asc" || filterType !== "all" || filterStatus !== "all";

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres - Responsive */}
      <div className="space-y-4">
        {/* Ligne 1: Recherche + Bouton filtres (mobile) */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={propertyContainerT("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10
                       text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                       transition-all duration-300 text-sm"
            />
          </div>

          {/* Bouton filtres (visible sur mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-500/50
                     transition-all duration-300 text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {propertyContainerT("filters")}
            {hasActiveFilters && (
              <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
            )}
          </button>
        </div>

        {/* Filtres - Toujours visibles sur desktop, toggle sur mobile */}
        <AnimatePresence>
          {(showFilters || true) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="hidden sm:block"
            >
              <GlassCard className="p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {propertyContainerT("filterBy")}
                  </span>

                  {/* Tri */}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="px-3 py-2 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10
                             text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                             hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="name-asc">{propertyContainerT("sortNameAsc")}</option>
                    <option value="price-asc">{propertyContainerT("sortPriceAsc")}</option>
                    <option value="price-desc">{propertyContainerT("sortPriceDesc")}</option>
                    <option value="return-desc">{propertyContainerT("sortReturnDesc")}</option>
                  </select>

                  {/* Type de propriété */}
                  <div className="flex gap-2">
                    {(["all", "residential", "commercial", "mixed"] as FilterType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTypeFilter(type)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300
                          ${filterType === type
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                            : "backdrop-blur-xl bg-white/5 border-white/10 hover:border-cyan-500/30"
                          } border`}
                      >
                        {propertyContainerT(`type.${type}`)}
                      </button>
                    ))}
                  </div>

                  {/* Statut */}
                  <div className="flex gap-2">
                    {(["all", "funding", "funded"] as FilterStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilter(status)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300
                          ${filterStatus === status
                            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                            : "backdrop-blur-xl bg-white/5 border-white/10 hover:border-blue-500/30"
                          } border`}
                      >
                        {propertyContainerT(`status.${status}`)}
                      </button>
                    ))}
                  </div>

                  {/* Bouton clear filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="ml-auto px-3 py-2 rounded-lg text-xs font-medium
                               backdrop-blur-xl bg-red-500/10 border border-red-500/30 text-red-400
                               hover:bg-red-500/20 transition-all duration-300 flex items-center gap-2"
                    >
                      <X className="h-3 w-3" />
                      {propertyContainerT("clearFilters")}
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtres mobile (dropdown) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden"
            >
              <GlassCard className="p-4 space-y-4">
                {/* Tri */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                    {propertyContainerT("sortBy")}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="w-full px-3 py-2 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10
                             text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="name-asc">{propertyContainerT("sortNameAsc")}</option>
                    <option value="price-asc">{propertyContainerT("sortPriceAsc")}</option>
                    <option value="price-desc">{propertyContainerT("sortPriceDesc")}</option>
                    <option value="return-desc">{propertyContainerT("sortReturnDesc")}</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                    {propertyContainerT("propertyType")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["all", "residential", "commercial", "mixed"] as FilterType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTypeFilter(type)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300
                          ${filterType === type
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                            : "backdrop-blur-xl bg-white/5 border-white/10"
                          } border`}
                      >
                        {propertyContainerT(`type.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Statut */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                    {propertyContainerT("fundingStatus")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["all", "funding", "funded"] as FilterStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilter(status)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300
                          ${filterStatus === status
                            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                            : "backdrop-blur-xl bg-white/5 border-white/10"
                          } border`}
                      >
                        {propertyContainerT(`status.${status}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium
                             backdrop-blur-xl bg-red-500/10 border border-red-500/30 text-red-400
                             hover:bg-red-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    {propertyContainerT("clearFilters")}
                  </button>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Résultats */}
      <div className="text-sm text-muted-foreground">
        {propertyContainerT("showingResults", {
          start: filteredAndSortedProperties.length > 0 ? startIndex + 1 : 0,
          end: Math.min(endIndex, filteredAndSortedProperties.length),
          total: filteredAndSortedProperties.length,
        })}
      </div>

      {/* Grille de propriétés */}
      {currentProperties.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">{propertyContainerT("noResults")}</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-cyan-400 hover:text-cyan-300 transition-colors text-sm underline"
            >
              {propertyContainerT("clearFiltersToSeeAll")}
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <AnimatePresence mode="wait">
            {currentProperties.map((property, index) => (
              <motion.div
                key={property.publicKey}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <PropertyCard investment={property} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          {/* Bouton précédent */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10
                     hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Numéros de page */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Sur mobile, n'afficher que quelques pages autour de la page actuelle
              const isMobileView = typeof window !== "undefined" && window.innerWidth < 640;
              if (isMobileView && totalPages > 5) {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  // Afficher la page
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-muted-foreground">...</span>;
                } else {
                  return null;
                }
              }

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`min-w-[40px] h-[40px] rounded-lg font-medium transition-all duration-300
                    ${currentPage === page
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 border"
                      : "backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-500/50"
                    }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Bouton suivant */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10
                     hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
