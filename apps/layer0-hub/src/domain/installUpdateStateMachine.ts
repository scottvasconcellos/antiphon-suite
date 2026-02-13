export type AppLifecycleState =
  | "NotInstalled"
  | "Installing"
  | "Installed"
  | "UpdateAvailable"
  | "Updating"
  | "Ready"
  | "InstallFailed"
  | "UpdateFailed";

export type AppLifecycleEvent =
  | "BeginInstall"
  | "InstallSucceeded"
  | "InstallFailed"
  | "MarkUpdateAvailable"
  | "BeginUpdate"
  | "UpdateSucceeded"
  | "UpdateFailed"
  | "AcknowledgeFailure";

export type StateTransition = {
  from: AppLifecycleState;
  event: AppLifecycleEvent;
  to: AppLifecycleState;
  reason: string;
};

const TRANSITIONS: Record<AppLifecycleState, Partial<Record<AppLifecycleEvent, StateTransition>>> = {
  NotInstalled: {
    BeginInstall: { from: "NotInstalled", event: "BeginInstall", to: "Installing", reason: "install_started" }
  },
  Installing: {
    InstallSucceeded: { from: "Installing", event: "InstallSucceeded", to: "Installed", reason: "install_completed" },
    InstallFailed: { from: "Installing", event: "InstallFailed", to: "InstallFailed", reason: "install_failed" }
  },
  Installed: {
    MarkUpdateAvailable: { from: "Installed", event: "MarkUpdateAvailable", to: "UpdateAvailable", reason: "update_detected" },
    UpdateSucceeded: { from: "Installed", event: "UpdateSucceeded", to: "Ready", reason: "ready_current" }
  },
  UpdateAvailable: {
    BeginUpdate: { from: "UpdateAvailable", event: "BeginUpdate", to: "Updating", reason: "update_started" }
  },
  Updating: {
    UpdateSucceeded: { from: "Updating", event: "UpdateSucceeded", to: "Ready", reason: "update_completed" },
    UpdateFailed: { from: "Updating", event: "UpdateFailed", to: "UpdateFailed", reason: "update_failed" }
  },
  Ready: {
    MarkUpdateAvailable: { from: "Ready", event: "MarkUpdateAvailable", to: "UpdateAvailable", reason: "update_detected" }
  },
  InstallFailed: {
    AcknowledgeFailure: { from: "InstallFailed", event: "AcknowledgeFailure", to: "NotInstalled", reason: "recovery_to_not_installed" }
  },
  UpdateFailed: {
    AcknowledgeFailure: { from: "UpdateFailed", event: "AcknowledgeFailure", to: "UpdateAvailable", reason: "recovery_to_update_available" }
  }
};

export function transitionLifecycleState(from: AppLifecycleState, event: AppLifecycleEvent): StateTransition {
  const transition = TRANSITIONS[from][event];
  if (transition) {
    return transition;
  }
  return {
    from,
    event,
    to: from,
    reason: "no_op_invalid_transition"
  };
}
