function runtimeErrorState(base, message) {
    return {
        ...base,
        status: {
            mode: "runtime-error",
            message,
            code: "runtime_task_failed"
        }
    };
}
export async function runHubTask(engine, task, getCurrentState) {
    try {
        return await task();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected failure.";
        if (engine) {
            const withTransactions = await engine.syncTransactions();
            return runtimeErrorState(withTransactions, message);
        }
        return runtimeErrorState(getCurrentState(), message);
    }
}
