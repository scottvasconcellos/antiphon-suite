import { type HubSnapshot } from "../domain/types";

export type ControlPlaneOperationEntry = {
  id: string;
  appId: string;
  action: "install" | "update";
  status: "succeeded" | "failed";
  occurredAt: string;
};

export function toControlPlaneOperations(snapshot: HubSnapshot, limit = 5): ControlPlaneOperationEntry[] {
  return [...snapshot.transactions]
    .sort((a, b) => {
      if (a.occurredAt === b.occurredAt) {
        return a.id.localeCompare(b.id);
      }
      return b.occurredAt.localeCompare(a.occurredAt);
    })
    .slice(0, limit)
    .map((tx) => ({
      id: tx.id,
      appId: tx.appId,
      action: tx.action,
      status: tx.status,
      occurredAt: tx.occurredAt
    }));
}
