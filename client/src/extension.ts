import * as path from 'path';
import {
	workspace,
	ExtensionContext,
	languages,
	TextDocument,
	CompletionItem,
	CompletionItemKind,
	Position
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

import { TealishSpec } from './tealishlangspec';

import { TealishSignatureHelpProvider } from './SigHelpProvider';

let client: LanguageClient;

export function activate(context: ExtensionContext) {

	const tealishCompletionProvider = languages.registerCompletionItemProvider(
		'tealish',
		{
			// static completions
			provideCompletionItems(document: TextDocument, position: Position) {
				return [
					new CompletionItem('NoOp', CompletionItemKind.Property),
					new CompletionItem('OptIn', CompletionItemKind.Property),
					new CompletionItem('CloseOut', CompletionItemKind.Property),
					new CompletionItem('ClearState', CompletionItemKind.Property),
					new CompletionItem('UpdateApplication', CompletionItemKind.Property),
					new CompletionItem('DeleteApplication', CompletionItemKind.Property),
					new CompletionItem('Pay', CompletionItemKind.Property),
					new CompletionItem('Acfg', CompletionItemKind.Property),
					new CompletionItem('Axfer', CompletionItemKind.Property),
					new CompletionItem('Afrz', CompletionItemKind.Property),
					new CompletionItem('Appl', CompletionItemKind.Property),
					new CompletionItem('Txn', CompletionItemKind.Class),
					new CompletionItem('Global', CompletionItemKind.Class),
					new CompletionItem('Gtxn', CompletionItemKind.Class),
					new CompletionItem('switch', CompletionItemKind.Operator),
					new CompletionItem('block', CompletionItemKind.Operator),
					new CompletionItem('end', CompletionItemKind.Operator),
					new CompletionItem('assert', CompletionItemKind.Function),
					new CompletionItem('exit', CompletionItemKind.Function),
					new CompletionItem('if', CompletionItemKind.Operator),
					new CompletionItem('elif', CompletionItemKind.Operator),
					new CompletionItem('const', CompletionItemKind.Keyword),
					new CompletionItem('bytes', CompletionItemKind.Keyword),
					new CompletionItem('jump', CompletionItemKind.Operator),
					new CompletionItem('int', CompletionItemKind.Keyword),
					new CompletionItem('inner_txn', CompletionItemKind.Operator),
				];
			}
		}
	);


	const specCompletionProvider = languages.registerCompletionItemProvider(
		'tealish',
		{
			// completions for common functions / objects
			provideCompletionItems(document: TextDocument, position: Position) {

				// Txn, Gtxn, Global
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (linePrefix.endsWith('Txn.')) {
					return TxnCompletions;
				} else if (linePrefix.search(/Gtxn\[\d\]\./)) {
					return GtxnCompletions;
				} else if (linePrefix.endsWith('Global.')) {
					return GlobalCompletions;
				}


				// TBD look for containing inner_txn context and provide itxn completion before 'end'?

			}
		},
		'.' // triggered whenever a '.' is being typed
	);



	// rough out completors from langspec
	// we can also just parse the langspec JSON but #ShortAttentionSpan
	const TxnCompletions = [] as CompletionItem[];
	const GtxnCompletions = [] as CompletionItem[];
	const GlobalCompletions = [] as CompletionItem[];



	TealishSpec.Txn.forEach((compString:string) => {
		TxnCompletions.push(new CompletionItem(compString, CompletionItemKind.Property));
	});

	TealishSpec.Gtxn.forEach((compString:string) => {
		GtxnCompletions.push(new CompletionItem(compString, CompletionItemKind.Property));
	});

	TealishSpec.Global.forEach((compString:string) => {
		GlobalCompletions.push(new CompletionItem(compString, CompletionItemKind.Property));
	});

	// populate the object completors from the above
	const objectCompletionProvider = languages.registerCompletionItemProvider(
		'tealish',
		{
			// completions for common functions / objects
			provideCompletionItems(document: TextDocument, position: Position) {

				// Txn, Gtxn, Global
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (linePrefix.endsWith('Txn.')) {
					return TxnCompletions;
				} else if (linePrefix.search(/Gtxn\[\d\]\./)) {
					return GtxnCompletions;
				} else if (linePrefix.endsWith('Global.')) {
					return GlobalCompletions;
				}


				// TBD look for containing inner_txn context and provide itxn completion before 'end'?

			}
		},
		'.' // triggered whenever a '.' is being typed
	);


	context.subscriptions.push(tealishCompletionProvider, specCompletionProvider, objectCompletionProvider);


	// try some client-side signature help
	context.subscriptions.push(
        languages.registerSignatureHelpProvider(
            'tealish', new TealishSignatureHelpProvider(), '(', ','));



	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for Tealish documents
		documentSelector: [{ scheme: 'file', language: 'tealish' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'tealishLanguageServer',
		'Tealish Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
