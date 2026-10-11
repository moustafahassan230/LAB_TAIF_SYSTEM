/* =========================================================
   ANALYTICS & INSIGHTS SERVICE
   ========================================================= */

import { supabase } from '../lib/supabase.js';

export const analyticsService = {
  // Get Dashboard Metrics
  async getDashboardMetrics(items, inventoryBatches) {
    const metrics = {
      totalItems: items.length,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      expiringSoon: 0,
      expired: 0,
      totalValue: 0,
      categories: {},
      topMovingItems: [],
      slowMovingItems: [],
      storageUtilization: 0
    };

    const today = new Date();

    items.forEach(item => {
      const remaining = Number(item.Remaining) || 0;
      const minimum = Number(item.Minimum) || 0;

      // Status counts
      if (remaining <= 0) {
        metrics.outOfStock++;
      } else if (remaining <= minimum) {
        metrics.lowStock++;
      } else {
        metrics.inStock++;
      }

      // Expiry tracking
      const batches = inventoryBatches[String(item.id)] || [];
      batches.forEach(batch => {
        if (!batch.expiry_date) return;
        const expiryDate = new Date(batch.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          metrics.expired++;
        } else if (daysUntilExpiry <= 90) {
          metrics.expiringSoon++;
        }
      });

      // Category breakdown
      const category = item.Category || 'Other';
      if (!metrics.categories[category]) {
        metrics.categories[category] = 0;
      }
      metrics.categories[category]++;
    });

    return metrics;
  },

  // Get Inventory Health Score (0-100)
  getInventoryHealthScore(metrics) {
    let score = 100;

    // Deduct for low stock items
    score -= metrics.lowStock * 2;

    // Deduct for out of stock items
    score -= metrics.outOfStock * 5;

    // Deduct for expiring items
    score -= metrics.expiringSoon * 1;

    // Deduct for expired items
    score -= metrics.expired * 10;

    return Math.max(0, Math.min(100, score));
  },

  // Predict Stock Levels (simple forecast)
  predictStockLevels(historicalData, daysAhead = 7) {
    // Simple linear regression or moving average
    if (!historicalData || historicalData.length === 0) return [];

    const predictions = [];
    const avgConsumption = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;

    for (let i = 1; i <= daysAhead; i++) {
      predictions.push({
        day: i,
        predictedLevel: Math.max(0, historicalData[historicalData.length - 1] - (avgConsumption * i))
      });
    }

    return predictions;
  },

  // Get Slow Moving Items
  getSlowMovingItems(items, movementData, threshold = 5) {
    return items
      .filter(item => {
        const movement = movementData[item.Item] || { in: 0, out: 0 };
        return movement.out < threshold;
      })
      .sort((a, b) => {
        const movementA = movementData[a.Item]?.out || 0;
        const movementB = movementData[b.Item]?.out || 0;
        return movementA - movementB;
      });
  },

  // Get Fast Moving Items
  getFastMovingItems(items, movementData, threshold = 20) {
    return items
      .filter(item => {
        const movement = movementData[item.Item] || { in: 0, out: 0 };
        return movement.out >= threshold;
      })
      .sort((a, b) => {
        const movementA = movementData[a.Item]?.out || 0;
        const movementB = movementData[b.Item]?.out || 0;
        return movementB - movementA;
      });
  },

  // Get Dead Stock (not moved in 90 days)
  async getDeadStock(days = 90) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('inventory_history')
        .select('item_name')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const movedItems = new Set(data.map(h => h.item_name));
      return movedItems;
    } catch (error) {
      console.error('Error getting dead stock:', error);
      throw error;
    }
  }
};
