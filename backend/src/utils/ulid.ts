import { ulid } from 'ulid';

export const generateUserId = (): string => `usr_${ulid().toLowerCase()}`;
export const generateOwnerId = (): string => `own_${ulid().toLowerCase()}`;
export const generateAdminId = (): string => `adm_${ulid().toLowerCase()}`;
export const generateListingId = (): string => `lst_${ulid().toLowerCase()}`;
export const generateBookingId = (): string => `bkg_${ulid().toLowerCase()}`;
export const generateVehicleId = (): string => `vhc_${ulid().toLowerCase()}`;
export const generateReviewId = (): string => `rev_${ulid().toLowerCase()}`;
export const generateEarningId = (): string => `ern_${ulid().toLowerCase()}`;
export const generateImageId = (): string => `img_${ulid().toLowerCase()}`;
export const generateFavoriteId = (): string => `fav_${ulid().toLowerCase()}`;

export const generateId = (prefix: string): string => `${prefix}_${ulid().toLowerCase()}`;

export const decodeUlidTimestamp = (id: string): Date => {
  const ulidPart = id.split('_')[1];
  if (!ulidPart) return new Date();
  const timestamp = parseInt(ulidPart.substring(0, 10), 32);
  return new Date(timestamp);
};

export const isValidId = (id: string, expectedPrefix?: string): boolean => {
  const parts = id.split('_');
  if (parts.length !== 2) return false;
  const [prefix, ulidPart] = parts;
  if (expectedPrefix && prefix !== expectedPrefix) return false;
  return /^[a-z]{3}$/.test(prefix) && /^[0-9a-z]{26}$/.test(ulidPart);
};
