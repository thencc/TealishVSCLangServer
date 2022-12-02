# Tealish Language Server

Based on the starter code at https://code.visualstudio.com/api/language-extensions/language-server-extension-guide

## Functionality

This Language Server registers and works for .tl files. It has the following language features so far:
- Completions based on the Tealish langspec AND the TEAL v7 langspec.json file
- Diagnostics are still TBD but framed up in the language server

It also includes an End-to-End test from the template which will need to get much more specific to Tealish syntax, etc

## Structure

```
.
├── client // Language Client
│   ├── src
│   │   ├── test // End to End tests for Language Client / Server
│   │   └── extension.ts // Language Client entry point
├── package.json // The extension manifest.
└── server // Language Server
    └── src
        └── server.ts // Language Server entry point
```

## Running the server

- Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
- Open VS Code on this folder.
- Press Ctrl+Shift+B to start compiling the client and server
- Switch to the Run and Debug View in the Sidebar (Ctrl+Shift+D).
- Select `Launch Client` from the drop down (if it is not already).
- Press ▷ to run the launch config (F5).
- If you want to debug the server as well, use the launch configuration `Attach to Server`
- In the Extension Development Host instance of VSCode, open a document in 'tealish' language mode (a .tl file should open in this mode already)
  - Type `Txn` or `Global` to see completions based on the tealish langspec and try any other TEAL opcode to see the server's compeltion and docs from langspec.json.

