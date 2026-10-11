/* =========================================================
   CUSTOM HOOK: useInventory
   ========================================================= */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load inventory
  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [{ data: itemsData, error: itemsError }, { data: batchesData, error: batchesError }] =
        await Promise.all([
          supabase.from('inventory').select('*').order('id', { ascending: true }),
          supabase.from('inventory_batches').select('*').order('expiry_date', { ascending: true, nullsFirst: false })
        ]);

      if (itemsError) throw itemsError;
      if (batchesError) throw batchesError;

      setItems(itemsData || []);

      const batchMap = {};
      (batchesData || []).forEach(batch => {
        const key = String(batch.inventory_id);
        if (!batchMap[key]) batchMap[key] = [];
        batchMap[key].push(batch);
      });

      setBatches(batchMap);
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item
  const addItem = useCallback(async (itemData) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;
      setItems([...items, data]);
      return data;
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err.message);
      throw err;
    }
  }, [items]);

  // Update item
  const updateItem = useCallback(async (itemId, updates) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      setItems(items.map(item => item.id === itemId ? data : item));
      return data;
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message);
      throw err;
    }
  }, [items]);

  // Delete item
  const deleteItem = useCallback(async (itemId) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setItems(items.filter(item => item.id !== itemId));
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message);
      throw err;
    }
  }, [items]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    items,
    batches,
    loading,
    error,
    loadInventory,
    addItem,
    updateItem,
    deleteItem
  };
};
