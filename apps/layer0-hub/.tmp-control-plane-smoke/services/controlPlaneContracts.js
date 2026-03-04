export const ENTITLEMENT_DECISION_CONTRACT_VERSION = "1.0.0";
export const INSTALL_UPDATE_AUTHORITY_CONTRACT_VERSION = "1.0.0";
export const LAUNCH_TOKEN_BOUNDARY_CONTRACT_VERSION = "1.0.0";
export const CONTRACT_COMPAT_REASON_CODES = [
    "ok_version_supported",
    "unsupported_contract_version"
];
const SUPPORTED = {
    entitlementDecision: ENTITLEMENT_DECISION_CONTRACT_VERSION,
    installUpdateAuthority: INSTALL_UPDATE_AUTHORITY_CONTRACT_VERSION,
    launchTokenBoundary: LAUNCH_TOKEN_BOUNDARY_CONTRACT_VERSION
};
export function evaluateContractCompatibility(contract, requestedVersion) {
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
