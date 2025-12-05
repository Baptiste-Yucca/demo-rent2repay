import { EvmAddress } from '@/lib/domain/EvmAddress';

/**
 * Normalize an Ethereum address to EvmAddress Value Object
 * @param address - The address to normalize
 * @returns The EvmAddress Value Object or undefined if address is empty
 */
export const normalizeAddress = (address: string | undefined): EvmAddress | undefined => {
  return EvmAddress.fromOptional(address);
};

/**
 * Normalize an array of Ethereum addresses to EvmAddress Value Objects
 * @param addresses - Array of addresses to normalize
 * @returns Array of EvmAddress Value Objects (filters out invalid addresses)
 */
export const normalizeAddresses = (addresses: string[]): EvmAddress[] => {
  return addresses
    .map(address => EvmAddress.fromOptional(address))
    .filter((addr): addr is EvmAddress => addr !== undefined);
};

/**
 * Check if two addresses are equal (case-insensitive)
 * @param address1 - First address
 * @param address2 - Second address
 * @returns True if addresses are equal (case-insensitive)
 */
export const isAddressEqual = (address1: string | EvmAddress, address2: string | EvmAddress): boolean => {
  const addr1 = address1 instanceof EvmAddress ? address1 : EvmAddress.fromOptional(address1);
  const addr2 = address2 instanceof EvmAddress ? address2 : EvmAddress.fromOptional(address2);
  
  if (!addr1 || !addr2) {
    return false;
  }
  
  return addr1.equals(addr2);
};
