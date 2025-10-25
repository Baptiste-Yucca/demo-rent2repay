/**
 * Normalize an Ethereum address to lowercase
 * @param address - The address to normalize
 * @returns The normalized address in lowercase
 */
export const normalizeAddress = (address: string | undefined): string => {
  if (!address) return '';
  return address.toLowerCase();
};

/**
 * Normalize an array of Ethereum addresses to lowercase
 * @param addresses - Array of addresses to normalize
 * @returns Array of normalized addresses in lowercase
 */
export const normalizeAddresses = (addresses: string[]): string[] => {
  return addresses.map(address => normalizeAddress(address));
};

/**
 * Check if two addresses are equal (case-insensitive)
 * @param address1 - First address
 * @param address2 - Second address
 * @returns True if addresses are equal (case-insensitive)
 */
export const isAddressEqual = (address1: string, address2: string): boolean => {
  return normalizeAddress(address1) === normalizeAddress(address2);
};
