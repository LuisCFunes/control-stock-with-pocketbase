import { pb } from "./pocketbase_route";

export const DEFAULT_CATEGORIES = [
  "General",
  "Abarrotes",
  "Bebidas",
  "Snacks",
  "Lácteos",
  "Limpieza",
  "Cuidado Personal",
  "Golosinas",
];

export const getDeletedCategories = () => {
  try {
    const saved = localStorage.getItem("app_deleted_categories");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Error al leer categorías eliminadas:", err);
    return [];
  }
};

export const getSavedCustomCategories = () => {
  try {
    const saved = localStorage.getItem("app_custom_categories");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Error al leer categorías personalizadas:", err);
    return [];
  }
};

export const saveCustomCategory = (categoryName) => {
  if (!categoryName || typeof categoryName !== "string") return "";
  const trimmed = categoryName.trim();
  if (!trimmed) return "";
  const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  try {
    // Si estaba previamente eliminada, la removemos de eliminadas
    const deleted = getDeletedCategories();
    const updatedDeleted = deleted.filter(
      (c) => c.toLowerCase().trim() !== formatted.toLowerCase().trim()
    );
    localStorage.setItem("app_deleted_categories", JSON.stringify(updatedDeleted));

    // Si no es una de las predeterminadas, la guardamos en personalizadas
    const isDefault = DEFAULT_CATEGORIES.some(
      (d) => d.toLowerCase().trim() === formatted.toLowerCase().trim()
    );
    if (!isDefault) {
      const current = getSavedCustomCategories();
      const updated = Array.from(new Set([...current, formatted]));
      localStorage.setItem("app_custom_categories", JSON.stringify(updated));
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("categories_updated"));
    }
  } catch (err) {
    console.error("Error al guardar categoría:", err);
  }
  return formatted;
};

export const deleteCategory = (categoryName) => {
  if (!categoryName || typeof categoryName !== "string") return false;
  const trimmed = categoryName.trim();
  if (trimmed.toLowerCase() === "general") return false;

  try {
    // 1. Quitar de custom categories
    const current = getSavedCustomCategories();
    const updatedCustom = current.filter(
      (c) => c.toLowerCase().trim() !== trimmed.toLowerCase()
    );
    localStorage.setItem("app_custom_categories", JSON.stringify(updatedCustom));

    // 2. Agregar a la lista de categorías eliminadas
    const deleted = getDeletedCategories();
    const updatedDeleted = Array.from(new Set([...deleted, trimmed]));
    localStorage.setItem("app_deleted_categories", JSON.stringify(updatedDeleted));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("categories_updated"));
    }
    return true;
  } catch (err) {
    console.error("Error al eliminar categoría:", err);
    return false;
  }
};

export const deleteCategoryWithProducts = async (categoryName, products = []) => {
  if (!categoryName || typeof categoryName !== "string") {
    return { success: false, reason: "INVALID_NAME" };
  }
  const trimmed = categoryName.trim();
  if (trimmed.toLowerCase() === "general") {
    return { success: false, reason: "GENERAL_NOT_DELETABLE" };
  }

  // Filtrar productos que tengan asignada esta categoría
  const affected = products.filter(
    (p) =>
      p &&
      p.Categoria &&
      typeof p.Categoria === "string" &&
      p.Categoria.trim().toLowerCase() === trimmed.toLowerCase()
  );

  let updatedCount = 0;
  if (affected.length > 0) {
    for (const prod of affected) {
      try {
        await pb.collection("Productos").update(prod.id, { Categoria: "General" });
        updatedCount++;
      } catch (err) {
        console.error(`Error al reasignar categoría para producto ${prod.id}:`, err);
      }
    }
  }

  // Marcar la categoría como eliminada
  deleteCategory(trimmed);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("categories_updated"));
    if (updatedCount > 0) {
      window.dispatchEvent(new Event("products_updated"));
    }
  }

  return { success: true, count: affected.length, updatedCount };
};

export const restoreDefaultCategories = () => {
  try {
    localStorage.removeItem("app_deleted_categories");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("categories_updated"));
    }
    return true;
  } catch (err) {
    console.error("Error al restaurar categorías por defecto:", err);
    return false;
  }
};

export const getCategoryName = (product) => {
  if (
    product &&
    product.Categoria &&
    typeof product.Categoria === "string" &&
    product.Categoria.trim() !== ""
  ) {
    const trimmed = product.Categoria.trim();
    const deletedSet = new Set(
      getDeletedCategories().map((c) => c.toLowerCase().trim())
    );
    if (deletedSet.has(trimmed.toLowerCase())) {
      return "General";
    }
    return trimmed;
  }
  return "General";
};

export const extractCategories = (products = []) => {
  const deletedSet = new Set(
    getDeletedCategories().map((c) => c.toLowerCase().trim())
  );

  const categoriesSet = new Set();

  // 1. Por defecto (omitir las que el usuario haya eliminado)
  DEFAULT_CATEGORIES.forEach((cat) => {
    if (!deletedSet.has(cat.toLowerCase().trim())) {
      categoriesSet.add(cat);
    }
  });

  // 2. Personalizadas guardadas
  getSavedCustomCategories().forEach((cat) => {
    if (!deletedSet.has(cat.toLowerCase().trim())) {
      categoriesSet.add(cat);
    }
  });

  // 3. De productos existentes
  products.forEach((p) => {
    if (
      p &&
      p.Categoria &&
      typeof p.Categoria === "string" &&
      p.Categoria.trim() !== ""
    ) {
      const trimmed = p.Categoria.trim();
      if (!deletedSet.has(trimmed.toLowerCase())) {
        categoriesSet.add(trimmed);
      }
    }
  });

  // Asegurar siempre "General"
  categoriesSet.add("General");

  return Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, "es"));
};

export const countProductsByCategory = (products = []) => {
  const counts = {};
  products.forEach((p) => {
    const cat = getCategoryName(p);
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return counts;
};
