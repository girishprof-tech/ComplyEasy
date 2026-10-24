import type { CertificatePayload } from '@/types';

export const ACCEPTED_CERTIFICATE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_CERTIFICATE_BYTES = 5 * 1024 * 1024;
export const CERTIFICATE_ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';

/**
 * Reads a File into the { fileName, mimeType, dataBase64 } shape the backend
 * expects. Certificates travel as base64 inside the normal JSON item payload.
 */
export function fileToCertificatePayload(file: File): Promise<CertificatePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.onload = () => {
      const result = reader.result as string; // "data:<mime>;base64,<data>"
      resolve({
        fileName: file.name,
        mimeType: file.type,
        dataBase64: result.slice(result.indexOf(',') + 1),
      });
    };
    reader.readAsDataURL(file);
  });
}
