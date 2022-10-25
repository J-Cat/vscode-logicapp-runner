import vscode from 'vscode';
import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { Workflow, WorkflowRun, WorkflowTrigger } from '@azure/arm-logic';
import { runTrigger } from './runTrigger';
import { WorkflowRunType } from './WorkflowRunType';
import { WorkflowType } from './WorkflowType';
import moment from 'moment';

export const getMasterKey = async (): Promise<string> => {
	try {
		const response = await axios({
			baseURL: vscode.workspace.getConfiguration('logicapp-runner').get('baseUrl'),
			url: '/admin/host/keys/default',
			method: 'GET',
			///data: {},
		});
	
		if ((response.status === StatusCodes.OK) && response.data.value) {
			return response.data.value;
		} else {
			const errorMsg = `Logic App: Error retrieving master key.: ${response.data}`;
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Logic App: Error retrieving master key.: ${(e as Error).message}`);
		throw e;
	}
};

export const selectWorkflow = async (key: string): Promise<WorkflowType | undefined> => {
	try {
		const response = await axios<unknown, AxiosResponse<WorkflowType[]>>({
			baseURL: vscode.workspace.getConfiguration('logicapp-runner').get('baseUrl'),
			url: `/runtime/webhooks/workflow/api/management/workflows?code=${key}`,
			method: 'GET',
		});
	
		if (response.status === StatusCodes.OK && response.data?.length) {
			const result = await vscode.window.showQuickPick(
				response.data.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(workflow => workflow.name as string), 
				{
					placeHolder: 'Select Logic App',
				},
			);
			if (result) {
				const workflow = response.data.find(w => w.name === result);
				if (!workflow) {
					return;
				}
				return workflow;
			}
		} else {
			const errorMsg = 'Logic App: No workflows found.';
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Logic App: No workflows found: ${(e as Error).message}`);
		throw e;
	}
};

export const selectWorkflowRun = async (key: string, workflow: WorkflowType): Promise<WorkflowRunType | undefined> => {
	try {
		const response = await axios<unknown, AxiosResponse<{ value: WorkflowRunType[] }>>({
			baseURL: vscode.workspace.getConfiguration('logicapp-runner').get('baseUrl'),
			url: `/runtime/webhooks/workflow/api/management/workflows/${workflow.name}/runs?code=${key}`,
			method: 'GET',
		});
	
		if (response.status === StatusCodes.OK && response.data?.value?.length) {
			const result = await vscode.window.showQuickPick(
				response.data?.value?.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(workflowRun => `${workflowRun.name}\t${moment(workflowRun.properties.startTime).format('yyyy-MM-DD\thh:mm:ssa')}\t${workflowRun.properties.status}` as string), 
				{
					placeHolder: 'Select Workflow Run',
				},
			);
			if (result) {
				const workflowRun = response.data?.value?.find?.(r => r.name === result?.split?.('\t')?.[0]);
				if (!workflowRun) {
					return;
				}
				return workflowRun;
			}
		} else {
			const errorMsg = 'Logic App: No workflow runs found.';
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Logic App: No workflow runs found: ${(e as Error).message}`);
		throw e;
	}
};
