import { License } from '../../domain/auth/License';

/** Data shape returned by auth API for a user. */
export interface UserDTO {
  id: string;
  email: string;
  passwordHash: string;
}

/** Data shape returned by auth API for a license. */
export interface LicenseDTO {
  appId: string;
  userId: string;
  expiresAt: string | null;
  isActive: boolean;
}

/** Auth API dependency contract used by AuthService. */
export interface AuthApiClient {
  login(email: string, password: string): Promise<{ token: string; user: UserDTO }>;
  fetchLicenses(userId: string): Promise<LicenseDTO[]>;
  refreshToken?(token: string): Promise<string>;
}

/** License persistence dependency contract used by AuthService. */
export interface LicenseStore {
  save(license: License): Promise<void>;
  load(userId: string): Promise<License[]>;
  delete(licenseId: string): Promise<void>;
}

/** Token persistence contract used to support refresh flow. */
export interface TokenStore {
  setToken(token: string): Promise<void>;
  getToken(): Promise<string | null>;
  clearToken(): Promise<void>;
}
