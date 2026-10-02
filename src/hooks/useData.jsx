import { useEffect, useState, useCallback } from "react";
import { productService } from "../services";

export const useData = () => {
  const [listProducts, setListProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAndSetList = useCallback(async () => {
    setLoading(true);
    try {
      const records = await productService.getProducts({ sort: "-created" });
      setListProducts(records);
      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeFn = null;

    fetchAndSetList();

    const handleRealtime = (e) => {
      if (!isMounted) return;
      if (e.action === "create") {
        setListProducts((prev) => [e.record, ...prev.filter((p) => p.id !== e.record.id)]);
      } else if (e.action === "update") {
        setListProducts((prev) =>
          prev.map((p) => (p.id === e.record.id ? e.record : p))
        );
      } else if (e.action === "delete") {
        setListProducts((prev) => prev.filter((p) => p.id !== e.record.id));
      }
    };

    productService
      .subscribe(handleRealtime)
      .then((unsub) => {
        if (!isMounted) {
          unsub();
        } else {
          unsubscribeFn = unsub;
        }
      })
      .catch((err) => {
        console.warn("PocketBase realtime error on Productos:", err);
      });

    const handleProductsUpdated = () => fetchAndSetList();
    window.addEventListener("products_updated", handleProductsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("products_updated", handleProductsUpdated);
      if (unsubscribeFn) {
        unsubscribeFn();
      } else {
        productService.unsubscribe(handleRealtime).catch(() => {});
      }
    };
  }, [fetchAndSetList]);

  return { listProducts, error, loading, reload: fetchAndSetList };
};
