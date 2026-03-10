declare module 'mammoth/mammoth.browser' {
    export interface Result {
        value: string;
        messages: any[];
    }
    export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<Result>;
}
