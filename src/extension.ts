// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode';
import { getMasterKey, selectWorkflow, selectWorkflowRun } from './util';
import { runTrigger } from './runTrigger';
import { cancelWorkflowRun } from './cancelWorkflowRun';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export const activate = (context: vscode.ExtensionContext) => {

	console.log('Extension "logicapp-runner" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposableRunTrigger = vscode.commands.registerCommand('logicapp-runner.runTrigger', async () => {
		try {
			const key = await getMasterKey();
			const workflow = await selectWorkflow(key);	
			if (workflow) {
				await runTrigger(key, workflow);
			}
		} catch (e) {
			console.error(`Error encountered running logic app trigger: ${(e as Error).message}`);
		}
	});

	const disposableCancelRun = vscode.commands.registerCommand('logicapp-runner.cancelWorkflowRun', async () => {
		try {
			const key = await getMasterKey();
			const workflow = await selectWorkflow(key);
			if (workflow?.name) {
				const workflowRun = await selectWorkflowRun(key, workflow);
				if (workflowRun) {
					await cancelWorkflowRun(key, workflow.name, workflowRun);
				}
			}
			
		} catch (e) {
			console.error(`Error encountered cancelling the logic app run: ${(e as Error).message}`);
		}
	});

	context.subscriptions.push(disposableRunTrigger, disposableCancelRun);
};

// This method is called when your extension is deactivated
export const deactivate = () => {};
