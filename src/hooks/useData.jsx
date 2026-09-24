import { useEffect, useState, useCallback } from "react";
import { pb } from "../utilities/pocketbase_route";

export const useData = () => {
  const [listProducts, setListProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  pb.autoCancellation(false);

  const fetchAndSetList = useCallback(async () => {
    setLoading(true);
    try {
      const records = await pb.collection("Productos").getFullList({
        sort: "-created",
      });
      setListProducts(records);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetList();
    const handleProductsUpdated = () => fetchAndSetList();
    window.addEventListener("products_updated", handleProductsUpdated);
    return () => window.removeEventListener("products_updated", handleProductsUpdated);
  }, [fetchAndSetList]);

  return { listProducts, error, loading, reload: fetchAndSetList };
};
