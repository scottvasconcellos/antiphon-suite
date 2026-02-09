import { License } from '../../domain/auth/License';
import type { LicenseStore } from './types';

const TAURI_FS_MODULE = '@tauri-apps/plugin-fs';
const TAURI_PATH_MODULE = '@tauri-apps/api/path';

interface StoredLicenseRecord {
  appId: string;
  userId: string;
  expiresAt: string | null;
  isActive: boolean;
}

/**
 * Tauri filesystem-backed license store.
 */
export class TauriLicenseStore implements LicenseStore {
  private readonly fileName = 'licenses.json';

  /**
   * Saves or updates a license for its user.
   */
  public async save(license: License): Promise<void> {
    const existing = await this.load(license.userId);
    const updated = upsert(existing, license);

    await this.writeUserLicenses(license.userId, updated);
  }

  /**
   * Loads all licenses for a given user from app data storage.
   */
  public async load(userId: string): Promise<License[]> {
    const fsModule = await loadModule(TAURI_FS_MODULE);
    const filePath = await this.resolveUserFilePath(userId);

    const exists = getFunction<(path: string) => Promise<boolean>>(
      fsModule,
      'exists',
    );

    if (!(await exists(filePath))) {
      return [];
    }

    const readTextFile = getFunction<(path: string) => Promise<string>>(
      fsModule,
      'readTextFile',
    );

    const raw = await readTextFile(filePath);
    const parsed = parseStoredLicenses(raw);

    return parsed.map(
      (record) =>
        new License({
          appId: record.appId,
          userId: record.userId,
          expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
          isActive: record.isActive,
        }),
    );
  }

  /**
   * Deletes a stored license by composite id `${userId}:${appId}`.
   */
  public async delete(licenseId: string): Promise<void> {
    const [userId, appId] = parseLicenseId(licenseId);
    const existing = await this.load(userId);
    const filtered = existing.filter((license) => license.appId !== appId);

    await this.writeUserLicenses(userId, filtered);
  }

  private async writeUserLicenses(
    userId: string,
    licenses: License[],
  ): Promise<void> {
    const fsModule = await loadModule(TAURI_FS_MODULE);
    const userDir = await this.resolveUserDirectory(userId);
    const filePath = await this.resolveUserFilePath(userId);

    const mkdir = getFunction<
      (path: string, options?: { recursive?: boolean }) => Promise<void>
    >(fsModule, 'mkdir');

    const writeTextFile = getFunction<
      (path: string, contents: string) => Promise<void>
    >(fsModule, 'writeTextFile');

    await mkdir(userDir, { recursive: true });

    const serialized = JSON.stringify(
      licenses.map(serializeLicense),
      null,
      2,
    );

    await writeTextFile(filePath, serialized);
  }

  private async resolveBaseDirectory(): Promise<string> {
    const pathModule = await loadModule(TAURI_PATH_MODULE);
    const appDataDir = getFunction<() => Promise<string>>(pathModule, 'appDataDir');
    const join = getFunction<(...parts: string[]) => Promise<string>>(
      pathModule,
      'join',
    );

    const dataDir = await appDataDir();
    return join(dataDir, 'antiphon', 'licenses');
  }

  private async resolveUserDirectory(userId: string): Promise<string> {
    const pathModule = await loadModule(TAURI_PATH_MODULE);
    const join = getFunction<(...parts: string[]) => Promise<string>>(
      pathModule,
      'join',
    );

    const baseDir = await this.resolveBaseDirectory();
    return join(baseDir, userId);
  }

  private async resolveUserFilePath(userId: string): Promise<string> {
    const pathModule = await loadModule(TAURI_PATH_MODULE);
    const join = getFunction<(...parts: string[]) => Promise<string>>(
      pathModule,
      'join',
    );

    const userDirectory = await this.resolveUserDirectory(userId);
    return join(userDirectory, this.fileName);
  }
}

/**
 * Creates a stable id used by delete() for a specific license.
 */
export function toLicenseId(license: Pick<License, 'userId' | 'appId'>): string {
  return `${license.userId}:${license.appId}`;
}

function upsert(licenses: License[], incoming: License): License[] {
  const index = licenses.findIndex((license) => license.appId === incoming.appId);

  if (index < 0) {
    return [...licenses, incoming];
  }

  const cloned = [...licenses];
  cloned[index] = incoming;
  return cloned;
}

function serializeLicense(license: License): StoredLicenseRecord {
  return {
    appId: license.appId,
    userId: license.userId,
    expiresAt: license.expiresAt ? license.expiresAt.toISOString() : null,
    isActive: license.isActive,
  };
}

function parseStoredLicenses(raw: string): StoredLicenseRecord[] {
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isStoredLicenseRecord);
}

function isStoredLicenseRecord(value: unknown): value is StoredLicenseRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.appId === 'string' &&
    typeof candidate.userId === 'string' &&
    (typeof candidate.expiresAt === 'string' || candidate.expiresAt === null) &&
    typeof candidate.isActive === 'boolean'
  );
}

function parseLicenseId(licenseId: string): [string, string] {
  const separator = licenseId.indexOf(':');

  if (separator <= 0 || separator >= licenseId.length - 1) {
    throw new Error('License id must use format "{userId}:{appId}".');
  }

  const userId = licenseId.slice(0, separator);
  const appId = licenseId.slice(separator + 1);

  return [userId, appId];
}

async function loadModule(moduleName: string): Promise<Record<string, unknown>> {
  return (await import(moduleName)) as Record<string, unknown>;
}

function getFunction<T extends (...args: unknown[]) => unknown>(
  moduleObject: Record<string, unknown>,
  functionName: string,
): T {
  const candidate = moduleObject[functionName];

  if (typeof candidate !== 'function') {
    throw new Error(`Missing function "${functionName}" in Tauri module.`);
  }

  return candidate as T;
}
