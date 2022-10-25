import vscode from 'vscode';
import { WorkflowRun, WorkflowTriggerCallbackUrl } from "@azure/arm-logic";
import axios, { AxiosError, AxiosResponse } from "axios";
import { StatusCodes } from 'http-status-codes';

export const cancelWorkflowRun = async (key: string, workflowName: string, workflowRun: WorkflowRun): Promise<void> => {
	try {
		const response = await axios<unknown, AxiosResponse>({
			baseURL: vscode.workspace.getConfiguration('logicapp-runner').get('baseUrl'),
			url: `/runtime/webhooks/workflow/api/management/workflows/${workflowName}/runs/${workflowRun.name}/cancel?code=${key}`,
			method: 'POST',
			data: {},
		});
	
		if (response.status === StatusCodes.OK) {
			vscode.window.showInformationMessage(`Logic App: Cancelled workflow run, ${workflowRun.name}, on workflow, ${workflowName}.`);
			return;
		} else {
			const errorMsg = `Logic App: Error retrieving trigger callback URL: ${response.data}`;
			vscode.window.showErrorMessage(errorMsg);
			throw new Error(errorMsg);
		}
	} catch (e) {
		const error: AxiosError<{ error: { code: string; message: string }}> = e as AxiosError<{ error: { code: string; message: string } }>;
		vscode.window.showErrorMessage(`Logic App: Error cancelling workflow run.\n\n${error.message}\n\n${error.stack}\n\n${error?.response?.data?.error?.message}`, { modal: true });
		throw e;
	}	
};