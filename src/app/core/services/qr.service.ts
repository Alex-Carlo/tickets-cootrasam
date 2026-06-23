import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  async generateQRDataUrl(token: string): Promise<string> {
    try {
      const size = 400;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}`;

      const response = await fetch(qrUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read QR image'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  downloadQR(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  async shareQR(dataUrl: string, ticketInfo: string): Promise<void> {
    if (!navigator.share) {
      throw new Error('Share not supported on this device');
    }

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `ticket-${Date.now()}.png`, { type: 'image/png' });

      await navigator.share({
        title: 'Mi Tiquete',
        text: ticketInfo,
        files: [file]
      });
    } catch (error) {
      console.error('Error sharing:', error);
      throw new Error('Failed to share QR code');
    }
  }
}
