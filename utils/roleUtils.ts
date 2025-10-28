import { keccak256 } from 'viem';
import { stringToBytes } from 'viem';

export enum UserRole {
  ADMIN = 'ADMIN_ROLE',
  OPERATOR = 'OPERATOR_ROLE',
  EMERGENCY = 'EMERGENCY_ROLE',
}

/**
 * Calculate the OPERATOR_ROLE hash using keccak256("OPERATOR_ROLE")
 */
export function getOperatorRole(): `0x${string}` {
  return keccak256(stringToBytes('OPERATOR_ROLE'));
}

/**
 * Calculate the ADMIN_ROLE hash using keccak256("ADMIN_ROLE")
 */
export function getAdminRole(): `0x${string}` {
  return keccak256(stringToBytes('ADMIN_ROLE'));
}

/**
 * Calculate the EMERGENCY_ROLE hash using keccak256("EMERGENCY_ROLE")
 */
export function getEmergencyRole(): `0x${string}` {
  return keccak256(stringToBytes('EMERGENCY_ROLE'));
}

/**
 * Calculate a role hash using keccak256
 */
export function getRoleHash(roleName: string): `0x${string}` {
  return keccak256(stringToBytes(roleName));
}

/**
 * Get role info by role type
 */
export function getRoleHashByType(role: UserRole): `0x${string}` {
  switch (role) {
    case UserRole.ADMIN:
      return getAdminRole();
    case UserRole.OPERATOR:
      return getOperatorRole();
    case UserRole.EMERGENCY:
      return getEmergencyRole();
  }
}

