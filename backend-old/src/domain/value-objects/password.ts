/**
 * Password Value Object
 * 
 * Represents a password with validation rules.
 * Note: This is for validation only. Actual hashing happens in the application layer.
 */

export class Password {
  private readonly value: string;

  constructor(password: string) {
    if (!this.isValid(password)) {
      throw new Error(
        'Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
    this.value = password;
  }

  private isValid(password: string): boolean {
    // Minimum 12 characters
    if (password.length < 12) {
      return false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return false;
    }

    return true;
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return '[REDACTED]';
  }
}

