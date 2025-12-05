import { isAddress as viemIsAddress } from 'viem';

/**
 * Value Object représentant une adresse EVM (Ethereum Virtual Machine)
 * Suit les principes DDD pour encapsuler la logique métier des adresses
 */
export class EvmAddress {
  private readonly _value: `0x${string}`;

  private constructor(value: string) {
    // Validation du format (0x suivi de 40 caractères hexadécimaux)
    const normalized = value.toLowerCase();
    if (!viemIsAddress(normalized)) {
      throw new Error(`Invalid EVM address format: ${value}`);
    }
    
    this._value = normalized as `0x${string}`;
  }

  /**
   * Crée une instance d'EvmAddress à partir d'une string
   * @param value - L'adresse à convertir (doit commencer par 0x)
   * @returns Une instance d'EvmAddress
   * @throws Error si l'adresse est invalide
   */
  static from(value: string | undefined | null): EvmAddress {
    if (!value) {
      throw new Error('EvmAddress cannot be created from empty value');
    }
    return new EvmAddress(value);
  }

  /**
   * Crée une instance d'EvmAddress à partir d'une string, retourne undefined si invalide
   * @param value - L'adresse à convertir
   * @returns Une instance d'EvmAddress ou undefined
   */
  static fromOptional(value: string | undefined | null): EvmAddress | undefined {
    if (!value) {
      return undefined;
    }
    try {
      return new EvmAddress(value);
    } catch {
      return undefined;
    }
  }

  /**
   * Retourne la valeur normalisée de l'adresse (lowercase)
   * @returns L'adresse en string lowercase typée `0x${string}`
   */
  value(): `0x${string}` {
    return this._value;
  }

  /**
   * Retourne la valeur pour compatibilité avec viem (type `0x${string}`)
   * @returns L'adresse typée pour viem
   */
  toViemAddress(): `0x${string}` {
    return this._value;
  }

  /**
   * Compare deux adresses (case-insensitive)
   * @param other - L'autre adresse à comparer
   * @returns True si les adresses sont égales
   */
  equals(other: EvmAddress): boolean {
    return this._value === other._value;
  }

  /**
   * Retourne une version tronquée de l'adresse pour l'affichage
   * @param startLength - Nombre de caractères au début (défaut: 6)
   * @param endLength - Nombre de caractères à la fin (défaut: 4)
   * @returns L'adresse tronquée (ex: "0x1234...5678")
   */
  toShortString(startLength: number = 6, endLength: number = 4): string {
    return `${this._value.slice(0, startLength)}...${this._value.slice(-endLength)}`;
  }

  /**
   * Vérifie si l'adresse est l'adresse zéro
   * @returns True si l'adresse est 0x0000000000000000000000000000000000000000
   */
  isZeroAddress(): boolean {
    return this._value === '0x0000000000000000000000000000000000000000';
  }

  /**
   * Retourne la représentation string de l'adresse
   */
  toString(): string {
    return this._value;
  }
}

