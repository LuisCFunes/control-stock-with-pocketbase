import { useState, useMemo, useEffect } from "react";
import { getCategoryName, extractCategories } from "../utilities/categories";

export const useProductFilter = (products = [], options = { defaultShowAll: false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [showAll, setShowAll] = useState(options?.defaultShowAll || false);
  const [categoriesVersion, setCategoriesVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setCategoriesVersion((v) => v + 1);
    window.addEventListener("categories_updated", handleUpdate);
    return () => window.removeEventListener("categories_updated", handleUpdate);
  }, []);

  const categories = useMemo(() => {
    // categoriesVersion asegura recalcular cuando se emite el evento 'categories_updated'
    void categoriesVersion;
    return extractCategories(products);
  }, [products, categoriesVersion]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() !== "" ||
    selectedCategory !== "" ||
    stockFilter !== "all"
  );

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // 1. Filtro por buscador (nombre)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const name = (item.Nombre || "").toLowerCase();
        if (!name.includes(query)) {
          return false;
        }
      }

      // 2. Filtro por categoría (si no tiene categoría, getCategoryName devuelve "General")
      if (selectedCategory !== "") {
        const itemCat = getCategoryName(item);
        if (itemCat !== selectedCategory) {
          return false;
        }
      }

      // 3. Filtro por disponibilidad de stock
      const cantidad = Number(item.Cantidad || 0);
      if (stockFilter === "in_stock" && cantidad <= 0) {
        return false;
      }
      if (stockFilter === "low_stock" && (cantidad <= 0 || cantidad > 5)) {
        return false;
      }
      if (stockFilter === "out_of_stock" && cantidad > 0) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setStockFilter("all");
    setShowAll(false);
  };

  const isInitialState = !hasActiveFilters && !showAll;

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    showAll,
    setShowAll,
    toggleShowAll: () => setShowAll((prev) => !prev),
    categories,
    hasActiveFilters,
    filteredProducts,
    isInitialState,
    clearFilters,
  };
};
