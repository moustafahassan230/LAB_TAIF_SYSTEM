/* =========================================================
   SUPPLIER MANAGEMENT SERVICE
   ========================================================= */

import { supabase } from '../lib/supabase.js';

export const supplierService = {
  // Get all suppliers
  async getSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },

  // Create supplier
  async createSupplier(supplierData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          name: supplierData.name,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address,
          city: supplierData.city,
          country: supplierData.country,
          payment_terms: supplierData.payment_terms,
          rating: supplierData.rating || 5,
          active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  // Update supplier
  async updateSupplier(supplierId, supplierData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', supplierId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  // Delete supplier
  async deleteSupplier(supplierId) {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  // Get supplier orders
  async getSupplierOrders(supplierId) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      throw error;
    }
  },

  // Get supplier performance
  async getSupplierPerformance(supplierId) {
    try {
      const { data, error } = await supabase
        .from('supplier_performance')
        .select('*')
        .eq('supplier_id', supplierId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching supplier performance:', error);
      throw error;
    }
  }
};
