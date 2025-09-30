import QRCode from 'qrcode';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCodeDataURL(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: options.size || 256,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#0F4A3C', // evergreen color
      light: options.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'M' as const,
  };

  return await QRCode.toDataURL(text, defaultOptions);
}

export async function generateQRCodeSVG(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: options.size || 256,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#0F4A3C',
      light: options.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'M' as const,
  };

  return await QRCode.toString(text, { 
    type: 'svg',
    ...defaultOptions 
  });
}

export function generateShareableURL(shareSlug: string): string {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseURL}/share/${shareSlug}`;
}

export function generateQRCodeFilename(childName: string): string {
  const sanitizedName = childName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  return `${sanitizedName}_christmas_magic_qr_${timestamp}.png`;
}