export interface HubClientConfig {
  appId: string;
  version: string;
}

export class HubClient {
  constructor(private readonly config: HubClientConfig) {}

  async register() {
    return { ok: true };
  }

  async validateLicense() {
    return true;
  }
}
