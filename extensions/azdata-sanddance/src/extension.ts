// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as tempWrite from 'temp-write';
import { newPanel, WebViewWithUri } from 'common-backend';
import { MssqlExtensionApi, IFileNode } from './mssqlapis';

let current: WebViewWithUri | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('sanddance.view', (commandContext: vscode.Uri | azdata.ObjectExplorerContext) => {
            if (!commandContext) {
                vscode.window.showErrorMessage('No file was specified for the View in SandDance command');
                return;
            }
            if (commandContext instanceof vscode.Uri) {
                viewInSandDance(<vscode.Uri>commandContext, context);
            } else if (commandContext.nodeInfo) {
                // This is a call from the object explorer right-click.
                downloadAndViewInSandDance(commandContext, context);
            }
        }
        )
    );

    //make the visualizer icon visible
    vscode.commands.executeCommand('setContext', 'showVisualizer', true);

    // Ideally would unregister listener on deactivate, but this is currently a void function.
    // Issue #6374 created in ADS repository to track this ask
    azdata.queryeditor.registerQueryEventListener({
        async onQueryEvent(type: azdata.queryeditor.QueryEvent, document: azdata.queryeditor.QueryDocument, args: any) {
            if (type === 'visualize') {
                const providerid = document.providerId;
                let provider: azdata.QueryProvider;
                provider = azdata.dataprotocol.getProvider(providerid, azdata.DataProviderType.QueryProvider);
                let data = await provider.getQueryRows({
                    ownerUri: document.uri,
                    batchIndex: args.batchId,
                    resultSetIndex: args.id,
                    rowsStartIndex: 0,
                    rowsCount: args.rowCount
                });

                let rows = data.resultSubset.rows;
                let columns = args.columnInfo;
                let rowsCount = args.rowCount;

                // Create Json
                let jsonArray = [];

                interface jsonType {
                    [key: string]: any
                }

                for (let row = 0; row < rowsCount; row++) {
                    let jsonObject: jsonType = {};
                    for (let col = 0; col < columns.length; col++) {
                        if (!rows[row][col].isNull) {
                            jsonObject[columns[col].columnName] = rows[row][col].displayValue;
                        }
                        // If display value is null, don't do anything for now
                    }
                    jsonArray.push(jsonObject);
                }

                let json = JSON.stringify(jsonArray);
                let fileuri = saveTemp(json);
                queryViewInSandDance(fileuri, context, document);
            }
        }
    });
}

async function downloadAndViewInSandDance(commandContext: azdata.ObjectExplorerContext, context: vscode.ExtensionContext): Promise<void> {
    try {
        let fileUri = await saveHdfsFileToTempLocation(commandContext);
        if (fileUri) {
            viewInSandDance(fileUri, context);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error viewing in sanddance: ${error.message ? error.message : error}`);
    }
}

function viewInSandDance(fileUri: vscode.Uri, context: vscode.ExtensionContext, uriTabName?: string | undefined): void {
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    const uriFsPath = fileUri.fsPath;
    //only allow one SandDance at a time
    if (current && current.uriFsPath !== uriFsPath) {
        current.panel.dispose();
        current = undefined;
    }
    if (current) {
        //TODO: registerWebviewPanelSerializer to hydrate state
        // If we already have a panel, show it in the target column
        current.panel.reveal(columnToShowIn);
    }
    else {
        // Otherwise, create a new panel
        current = newPanel(context, uriFsPath, uriTabName);
        current.panel.onDidDispose(() => {
            current = undefined;
        }, null, context.subscriptions);
        // Handle messages from the webview
        current.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'getFileContent': {
                    fs.readFile(uriFsPath, (err, data) => {
                        if (current && current.panel.visible) {
                            //TODO string type of dataFile
                            const dataFile = {
                                type: path.extname(uriFsPath).substring(1),
                                rawText: data.toString('utf8')
                            };
                            const compactUI = context.globalState.get('compactUI');
                            current.panel.webview.postMessage({ command: 'gotFileContent', dataFile, compactUI });
                        }
                    });
                    break;
                }
                case 'setCompactUI': {
                    context.globalState.update('compactUI', message.compactUI);
                    break;
                }
            }
        }, undefined, context.subscriptions);
    }
}

// View in SandDance for SQL query editor
function queryViewInSandDance(fileUri: vscode.Uri, context: vscode.ExtensionContext, editorUri: azdata.queryeditor.QueryDocument): void {
    const uriTabName = editorUri.uri;
    viewInSandDance(fileUri, context, uriTabName);
}


export async function saveHdfsFileToTempLocation(commandContext: azdata.ObjectExplorerContext): Promise<vscode.Uri | undefined> {
    let extension = vscode.extensions.getExtension('Microsoft.mssql');
    if (!extension) {
        return undefined;
    }
    let extensionApi: MssqlExtensionApi = extension.exports;
    let browser = extensionApi.getMssqlObjectExplorerBrowser();
    let node: IFileNode = await browser.getNode<IFileNode>(commandContext);
    let contents = await node.getFileContentsAsString();
    if (contents !== undefined) {
        let localFile = tempWrite.sync(contents, node.getNodeInfo().label);
        return vscode.Uri.file(localFile);
    }   // else ignore for now
    return undefined;
}


function saveTemp(data: string): vscode.Uri {
    let localFile = tempWrite.sync(data, 'file.json');
    return vscode.Uri.file(localFile);
}


export function deactivate() {
    vscode.commands.executeCommand('setContext', 'showVisualizer', false);
}

