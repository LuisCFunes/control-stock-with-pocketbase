import { useEffect, useState, useCallback } from "react";
import { pb, accessToken } from "../utilities/pocketbase_route";

export const useData = () => {
  const [listProducts, setListProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  pb.autoCancellation(false);

  const fetchAndSetList = useCallback(async () => {
    setLoading(true);
    try {
      pb.collection("Productos").requestOptions = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const records = await pb.collection("Productos").getList(1, 20, {
        sort: "-created",
      });
      setListProducts(records.items);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetList();
  }, [fetchAndSetList]);

  return { listProducts, error, loading };
};
