/* =========================================================
   ADVANCED REPORTING SERVICE
   ========================================================= */

import { supabase } from '../lib/supabase.js';

export const reportService = {
  // Stock Summary Report
  async generateStockSummaryReport(items, inventoryBatches) {
    const summary = {
      totalItems: items.length,
      totalValue: 0,
      byCategory: {},
      byStatus: { 'IN STOCK': 0, 'LOW STOCK': 0, 'OUT OF STOCK': 0 },
      generatedAt: new Date().toISOString()
    };

    items.forEach(item => {
      const category = item.Category || 'Uncategorized';
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { items: 0, quantity: 0 };
      }
      summary.byCategory[category].items += 1;
      summary.byCategory[category].quantity += Number(item.Remaining) || 0;

      const status = item.Remaining <= 0 ? 'OUT OF STOCK' : item.Remaining <= item.Minimum ? 'LOW STOCK' : 'IN STOCK';
      summary.byStatus[status]++;
    });

    return summary;
  },

  // Expiry Report
  async generateExpiryReport(items, inventoryBatches) {
    const today = new Date();
    const report = {
      expired: [],
      expiringIn30Days: [],
      expiringIn90Days: [],
      generatedAt: today.toISOString()
    };

    items.forEach(item => {
      const batches = inventoryBatches[String(item.id)] || [];
      batches.forEach(batch => {
        if (!batch.expiry_date) return;
        const expiryDate = new Date(batch.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          report.expired.push({ ...item, batch, daysExpired: Math.abs(daysUntilExpiry) });
        } else if (daysUntilExpiry <= 30) {
          report.expiringIn30Days.push({ ...item, batch, daysRemaining: daysUntilExpiry });
        } else if (daysUntilExpiry <= 90) {
          report.expiringIn90Days.push({ ...item, batch, daysRemaining: daysUntilExpiry });
        }
      });
    });

    return report;
  },

  // Low Stock Report
  async generateLowStockReport(items) {
    return items
      .filter(item => Number(item.Remaining) > 0 && Number(item.Remaining) <= Number(item.Minimum))
      .map(item => ({
        ...item,
        shortage: Number(item.Minimum) - Number(item.Remaining),
        recommendedOrder: (Number(item.Minimum) - Number(item.Remaining)) * 2
      }))
      .sort((a, b) => b.shortage - a.shortage);
  },

  // Inventory Movement Report
  async generateMovementReport(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('inventory_history')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const movements = {
        stockIn: data.filter(h => h.action === 'STOCK IN').length,
        stockOut: data.filter(h => h.action === 'STOCK OUT').length,
        byUser: {},
        byItem: {},
        total: data.length
      };

      data.forEach(record => {
        if (!movements.byUser[record.user_name]) {
          movements.byUser[record.user_name] = 0;
        }
        movements.byUser[record.user_name]++;

        if (!movements.byItem[record.item_name]) {
          movements.byItem[record.item_name] = { in: 0, out: 0 };
        }
        if (record.action === 'STOCK IN') {
          movements.byItem[record.item_name].in++;
        } else {
          movements.byItem[record.item_name].out++;
        }
      });

      return movements;
    } catch (error) {
      console.error('Error generating movement report:', error);
      throw error;
    }
  },

  // Export to CSV
  exportToCSV(data, filename = 'report.csv') {
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // Export to PDF
  async exportToPDF(data, filename = 'report.pdf') {
    // This would require a library like jsPDF or PDFKit
    console.log('Exporting to PDF:', data);
  },

  // Convert data to CSV format
  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }
};
