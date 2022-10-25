import { Resource } from '@azure/arm-logic';

export interface WorkflowRunType extends Resource {
    readonly properties: {
        readonly status: string;
        readonly startTime: string;
        readonly endTime: string;
        readonly waitEndTime: string;
    }
}