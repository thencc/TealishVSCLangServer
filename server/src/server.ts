import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	TextDocumentIdentifier,
	Definition,
	Location,
	ServerRequestHandler,
	HandlerResult
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import * as FullLangSpec from './langspec.json';


/*

For jump to definition I was thinking of jumping to the user defined functions and blocks, either when CMD + Click on the function usage or from the symbols list (CMD+shift+O).

*/

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {

	console.log('server init!');
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},

			// Tell the client that this server supports go to definition.
			definitionProvider: true,
			implementationProvider: true,
			referencesProvider: true,
			// signatureHelpProvider: {
			// 	triggerCharacters: [ '(' ]
			// }
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});


// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.tealishLanguageServer || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'tealishLanguageServer'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {

	// TBD: must update references here

	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	const problems = 0;
	const diagnostics: Diagnostic[] = [];

	// while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
	// 	problems++;
	// 	const diagnostic: Diagnostic = {
	// 		severity: DiagnosticSeverity.Warning,
	// 		range: {
	// 			start: textDocument.positionAt(m.index),
	// 			end: textDocument.positionAt(m.index + m[0].length)
	// 		},
	// 		message: `${m[0]} is all uppercase.`,
	// 		source: 'ex'
	// 	};
	// 	if (hasDiagnosticRelatedInformationCapability) {
	// 		diagnostic.relatedInformation = [
	// 			{
	// 				location: {
	// 					uri: textDocument.uri,
	// 					range: Object.assign({}, diagnostic.range)
	// 				},
	// 				message: 'Spelling matters'
	// 			},
	// 			{
	// 				location: {
	// 					uri: textDocument.uri,
	// 					range: Object.assign({}, diagnostic.range)
	// 				},
	// 				message: 'Particularly for names'
	// 			}
	// 		];
	// 	}
	//	diagnostics.push(diagnostic);
	//}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// connection.onSignatureHelp(handler: )

// import opcodes from full langspec
//
// omit the ops in opcodesToOmit array to avoid UI confustion, these are either implicit in tealish
// or implemented with functions in tealish
// this may have to get more complicated, but for now...

const opcodesToOmit = [
	"+","-","/","*","\u003c","\u003e","\u003c=","\u003e=","\u0026\u0026","||","==","!=","!","%","|","\u0026","^","~","txn","global","gtxn","txna","gtxna","gtxns","gtxnsa","bnz","bz","b","return","assert","callsub","retsub","itxn_begin","itxn_field","itxn_submit","itxn","itxna","gitxn","gitxna","gtxnas","gtxnsas","gitxnas"
];

const LangSpecCompletions = [] as CompletionItem[];
FullLangSpec.Ops.forEach((op:any) => {

	// if Args is defined, it's a function

	if (
		! opcodesToOmit.includes(op.Name)
	) {
		LangSpecCompletions.push({
			label: op.Name,
			kind: op.Args ? CompletionItemKind.Function : CompletionItemKind.Constant,
			data: op.Opcode
		});
	}

});

// This handler provides the initial list of the completion items.

connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return LangSpecCompletions;
	}
);

connection.onImplementation((params): Definition => {
	console.log('on implementation');
	return { uri: params.textDocument.uri, range: { start: { line: 3, character: 0}, end: {line: 3, character: 10 }}};
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {

		console.log('resolve');

		FullLangSpec.Ops.forEach((op:any) => {

			if (item.data == op.Opcode) {
				item.detail = op.ImmediateNote;
				item.documentation = op.Doc;
			}

		});

		return item;

	}
);

connection.onDefinition((params): Definition => {
	console.log('on def');
	return { uri: params.textDocument.uri, range: { start: { line: 2, character: 0}, end: {line: 2, character: 10 }}};
});

// connection.onDe;


connection.onTypeDefinition((params): Definition => {
	console.log('on type def');
	return { uri: params.textDocument.uri, range: { start: { line: 2, character: 0}, end: {line: 2, character: 10 }}};
});

connection.onReferences((params): Location[] => {
	console.log('on refs');
	return [
		{ uri: params.textDocument.uri, range: { start: { line: 0, character: 0}, end: {line: 0, character: 10 }}},
		{ uri: params.textDocument.uri, range: { start: { line: 2, character: 0}, end: {line: 2, character: 20 }}},
	];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
