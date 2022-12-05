

import {
	workspace,
	ExtensionContext,
	languages,
	TextDocument,
	CompletionItem,
	CompletionItemKind,
	Position,
	SignatureHelpProvider,
	SignatureHelp,
	ProviderResult,
	CancellationToken,
	SignatureHelpContext
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';



export class TealishSignatureHelpProvider implements SignatureHelpProvider {
    public provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken, context: SignatureHelpContext):ProviderResult<SignatureHelp> {

					return {
								signatures: [{
									label: 'Hello World Signature',
									documentation: 'some docs',
									parameters: [{
										label: 'param label',
										documentation: 'param docs'
									}]
								}],
								activeSignature: 0,
								activeParameter: 0
							};

						}







}