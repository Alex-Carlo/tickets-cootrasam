import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {
  async scanQRFromImage(dataUrl: string): Promise<string | null> {
    try {
      // Try to use jsQR if available
      const jsQR = await this.loadJsQR();
      if (jsQR) {
        return await this.decodeWithJsQR(jsQR, dataUrl);
      }
    } catch (error) {
      console.error('jsQR not available:', error);
    }

    return null;
  }

  private loadJsQR(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).jsQR !== 'undefined') {
        resolve((window as any).jsQR);
        return;
      }

      // Load from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => {
        resolve((window as any).jsQR);
      };
      script.onerror = () => {
        reject('Failed to load jsQR');
      };
      document.head.appendChild(script);
    });
  }

  private decodeWithJsQR(jsQR: any, dataUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(code ? code.data : null);
        } catch (error) {
          console.error('QR decode error:', error);
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = dataUrl;
    });
  }
}
