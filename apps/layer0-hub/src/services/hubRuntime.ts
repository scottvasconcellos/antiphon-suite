import { type HubEngine } from "../domain/hubEngine";
import { type HubState } from "../domain/types";

type GetCurrentState = () => HubState;

function runtimeErrorState(base: HubState, message: string): HubState {
  return {
    ...base,
    status: {
      mode: "runtime-error",
      message
    }
  };
}

export async function runHubTask(
  engine: HubEngine | null,
  task: () => Promise<HubState>,
  getCurrentState: GetCurrentState
): Promise<HubState> {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected failure.";
    if (engine) {
      const withTransactions = await engine.syncTransactions();
      return runtimeErrorState(withTransactions, message);
    }
    return runtimeErrorState(getCurrentState(), message);
  }
}
