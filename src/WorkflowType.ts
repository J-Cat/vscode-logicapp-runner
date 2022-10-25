import { Resource, WorkflowTrigger } from '@azure/arm-logic';

export interface WorkflowType extends Resource {
    readonly triggers: {
        [name: string]: WorkflowTrigger;
    }
}