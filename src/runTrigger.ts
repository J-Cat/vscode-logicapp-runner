import vscode from 'vscode';
import { WorkflowTrigger, WorkflowTriggerCallbackUrl } from '@azure/arm-logic';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { WorkflowType } from './WorkflowType';

const getCallbackProperties = async (key: string, workflow: WorkflowType, trigger: WorkflowTrigger): Promise<WorkflowTriggerCallbackUrl> => {
	try {
		const response = await axios<unknown, AxiosResponse<WorkflowTriggerCallbackUrl>>({
			baseURL: vscode.workspace.getConfiguration('logicapp-runner').get('baseUrl'),
			url: `/runtime/webhooks/workflow/api/management/workflows/${workflow.name}/triggers/${trigger.name}/listCallbackUrl?code=${key}`,
			method: 'POST',
		});
	
		if ((response.status === StatusCodes.OK) && response.data.value) {
			return response.data;
		} else {
			const errorMsg = `Logic App: Error retrieving trigger callback URL: ${response.data}`;
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Logic App: Error retrieving trigger callback URL: ${(e as Error).message}`);
		throw e;
	}
};

const getCallbackPostSchema = async (key: string, workflow: WorkflowType, trigger: WorkflowTrigger): Promise<any> => {
	try {
		const response = await axios({
			baseURL: vscode.workspace.getConfiguration('logicapp-runner').get('baseUrl'),
			url: `/runtime/webhooks/workflow/api/management/workflows/${workflow.name}/triggers/${trigger.name}/schemas/json?code=${key}`,
		});
	
		if (response.status === StatusCodes.OK) {
			return response.data;
		} else {
			const errorMsg = `Logic App: Error retrieving trigger JSON post schema: ${response.data}`;
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Logic App: Error retrieving trigger JSON post schema: ${(e as Error).message}`);
		throw e;
	}
};

const runRecurrenceTrigger = async (key: string, workflow: WorkflowType, trigger: WorkflowTrigger): Promise<void> => {
	try {
		vscode.window.showInformationMessage(`Logic App: Running tigger, ${trigger.name}, for workflow, ${workflow.name}`);

		const response = await axios({
			baseURL: vscode.workspace.getConfiguration('logicapp-runner').get('baseUrl'),
			url: `/runtime/webhooks/workflow/api/management/workflows/${workflow.name}/triggers/${trigger.name}/run?code=${key}`,
			method: 'POST',
		});
	
		if (response.status === StatusCodes.OK) {
			vscode.window.showInformationMessage(`Logic App: Successfully ran the tigger, ${trigger.name}, for workflow, ${workflow.name}`);
		} else {
			const errorMsg = `Logic App: Failed to run trigger: ${response.data}`;
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Logic App: Failed to run trigger: ${(e as Error).message}`);
		throw e;
	}
};

const runRequestTrigger = async (key: string, workflow: WorkflowType, trigger: WorkflowTrigger): Promise<void> => {
	try {
		const callbackProperties = await getCallbackProperties(key, workflow, trigger);

		let jsonText: string|undefined;
		if (callbackProperties.method === 'POST') {
			const postJson = await getCallbackPostSchema(key, workflow, trigger);
			jsonText = await vscode.window.showInputBox({
				prompt: 'Enter post body',
				title: 'Post JSON',
				value: JSON.stringify(postJson),
			});
			if (!jsonText) {
				return;
			}
		}

		vscode.window.showInformationMessage(`Logic App: Running tigger, ${trigger.name}, for workflow, ${workflow.name}`);

		const response = await axios({
			baseURL: '',
			url: callbackProperties.value,
			method: callbackProperties.method,
			data: jsonText ? JSON.parse(jsonText) : undefined,
		});
	
		if (response.status === StatusCodes.OK) {
			vscode.window.showInformationMessage(`Logic App: Successfully ran the tigger, ${trigger.name}, for workflow, ${workflow.name}`);
		} else {
			const errorMsg = `Logic App: Failed to run trigger: ${response.data}`;
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		vscode.window.showErrorMessage(`Logic App: Failed to run trigger: ${(e as Error).message}`);
		throw e;
	}
};

export const runTrigger = async (key: string, workflow: WorkflowType): Promise<void> => {
	try {
		const trigger = Object.keys(workflow.triggers).map(triggerName => ({ name: triggerName, ...workflow.triggers[triggerName] }))?.[0];
		if (!trigger) {
			vscode.window.showErrorMessage(`Logic App: Trigger not found for workflow, ${workflow.name}.`);
			return;
		}

		switch (trigger.type?.toLowerCase()) {
			case 'recurrence':
				await runRecurrenceTrigger(key, workflow, trigger);
				break;

			case 'request':
				await runRequestTrigger(key, workflow, trigger);
				break;
		}
	} catch (e) {
		const error: AxiosError<{ error: { code: string; message: string }}> = e as AxiosError<{ error: { code: string; message: string } }>;
		vscode.window.showErrorMessage(`Logic App: Error running trigger.\n\n${error.message}\n\n${error.stack}\n\n${error?.response?.data?.error?.message}`, { modal: true });
		throw e;
	}	
};