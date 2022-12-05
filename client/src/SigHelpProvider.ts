

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
	SignatureHelpContext,
	SignatureInformation
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

import { TealishSpec } from './tealishlangspec';
import * as TealSpec  from './langspec.json';


export class TealishSignatureHelpProvider implements SignatureHelpProvider {
    public provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken, context: SignatureHelpContext):ProviderResult<SignatureHelp> {

			// inspect what method we are calling
			const linePrefix = document.lineAt(position).text.substr(0, position.character);
			console.log(linePrefix);

			const possibleSigs = [] as SignatureInformation[];

			TealSpec.Ops.forEach((op:any) => {

				// note that if Args is defined, it's a "function"
				if (op.Args && op.Name.length > 1 && linePrefix.indexOf(op.Name) > -1) {

					//const params = op.Args

					// TBD: docs can support markdown, etc, let's format this
					const docs = op.Doc + (op.DocExtra? op.DocExtra : '');

					// note that the args in the langspec are kind of weird, seeing
					// things like
					//
					// "Name": "app_global_put",
          // "Args": "B.",
          // "Size": 1,
          // "Doc": "write B to key A in the global state of the current application",
					//
					// which should probably be referencing B and A?


					possibleSigs.push(
						{
									label: `${op.Name}(${op.Args}) : Returns ${op.Returns || 'null'}`,
									documentation: docs,
									parameters: [{
										label: op.Args,
										documentation: ''
									}]
						});
				}

			});


			// TBD look at why multiple hits are breaking in the UI
			//console.log(possibleSigs);
			return {
				signatures: possibleSigs,
				activeSignature: 0,
				activeParameter: 0 // TBD look at current cursor location
			};

		}










}