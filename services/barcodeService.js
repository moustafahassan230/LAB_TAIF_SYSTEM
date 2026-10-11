/* =========================================================
   BARCODE & QR CODE SERVICE
   ========================================================= */

export const barcodeService = {
  // Generate QR Code
  generateQRCode(data) {
    // Using QR Code API (online)
    const qrSize = '300x300';
    const encodedData = encodeURIComponent(JSON.stringify(data));
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}&data=${encodedData}`;
  },

  // Generate Barcode
  generateBarcode(code) {
    // Using Barcode API
    return `https://barcode.tec-it.com/barcode.ashx?data=${code}&code=Code128&dpi=96`;
  },

  // Scan Barcode (using camera)
  async scanBarcode() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  },

  // Decode Barcode from image
  decodeBarcode(imageData) {
    // This would typically use a library like jsbarcode or quagga
    console.log('Decoding barcode from:', imageData);
    return imageData;
  },

  // Print barcode label
  printBarcodeLabel(itemData) {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcode</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          .label { width: 100mm; height: 60mm; border: 1px solid black; padding: 10px; }
          .barcode-img { width: 80%; height: auto; margin: 10px 0; }
          .item-info { font-size: 12px; margin-top: 10px; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="label">
          <img class="barcode-img" src="${this.generateBarcode(itemData.id)}" />
          <div class="item-info">
            <strong>${itemData.Item}</strong><br/>
            ID: ${itemData.id}<br/>
            Expiry: ${itemData.expiry_date || 'N/A'}
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
  }
};
