export const ENTITLEMENT_DECISION_CONTRACT_VERSION = "1.0.0";
export const INSTALL_UPDATE_AUTHORITY_CONTRACT_VERSION = "1.0.0";
export const LAUNCH_TOKEN_BOUNDARY_CONTRACT_VERSION = "1.0.0";

export type ContractName =
  | "entitlementDecision"
  | "installUpdateAuthority"
  | "launchTokenBoundary";

export type ContractCompatibilityReport = {
  contract: ContractName;
  requestedVersion: string;
  supportedVersion: string;
  compatible: boolean;
  reasonCode: "ok_version_supported" | "unsupported_contract_version";
  remediation: "none" | "upgrade_or_downgrade_to_supported_version";
};

const SUPPORTED: Record<ContractName, string> = {
  entitlementDecision: ENTITLEMENT_DECISION_CONTRACT_VERSION,
  installUpdateAuthority: INSTALL_UPDATE_AUTHORITY_CONTRACT_VERSION,
  launchTokenBoundary: LAUNCH_TOKEN_BOUNDARY_CONTRACT_VERSION
};

export function evaluateContractCompatibility(
  contract: ContractName,
  requestedVersion: string
): ContractCompatibilityReport {
  const supportedVersion = SUPPORTED[contract];
  if (requestedVersion === supportedVersion) {
    return {
      contract,
      requestedVersion,
      supportedVersion,
      compatible: true,
      reasonCode: "ok_version_supported",
      remediation: "none"
    };
  }
  return {
    contract,
    requestedVersion,
    supportedVersion,
    compatible: false,
    reasonCode: "unsupported_contract_version",
    remediation: "upgrade_or_downgrade_to_supported_version"
  };
}
