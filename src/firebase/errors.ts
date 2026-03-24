export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    readonly context: SecurityRuleContext;
    readonly cause?: Error;

    constructor(context: SecurityRuleContext, options?: { cause: Error }) {
        const message = `FirestorePermissionError: Insufficient permissions for ${context.operation} on ${context.path}.`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;
        this.cause = options?.cause;
    }
}
