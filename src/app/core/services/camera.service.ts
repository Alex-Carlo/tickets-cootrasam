import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  pickImageFromInput(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event: any) => {
            resolve(event.target.result);
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }

  async takePhoto(): Promise<string | null> {
    // Browser fallback - use file input
    return this.pickImageFromInput();
  }

  async pickPhotoFromGallery(): Promise<string | null> {
    return this.pickImageFromInput();
  }
}
