import {basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
import {python} from "@codemirror/lang-python"
import {Update, receiveUpdates, sendableUpdates, collab, getSyncedVersion} from "@codemirror/collab"
import {ChangeSet, EditorState, Text, Compartment, StateEffect} from "@codemirror/state"
import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view"


function pushUpdates(version, fullUpdates){
    // Strip off transaction data
    let updates = fullUpdates.map(u => ({
        clientID: u.clientID,
        changes: u.changes.toJSON()
    }))

    return new Promise(function(resolve) {
        serverSocket.emit('pushUpdates', version, updates, (status) => {resolve(status)});
    });
}

function pullUpdates(version){
    return new Promise(function(resolve) {
        serverSocket.emit('pullUpdates', version, (updates) => {
            let up = updates.map((u) => ({
            changes: ChangeSet.fromJSON(u.changes),
            clientID: u.clientID
        }))
        resolve(up);
        });
    });
}

function getDocument(){
    return new Promise(function(resolve) {
        serverSocket.emit('getDocument', (version, doc, id)=>{
            resolve({
                version,
                doc: Text.of(doc.split("\n")),
                id
            });
        });
    });
}

function getLocked(){
    return new Promise(function(resolve) {
        serverSocket.emit('getLocked', (locked)=>{
            resolve({
                locked
            });
        });
    });
}

function peerExtension(startVersion, id) {
    let plugin = ViewPlugin.fromClass(class {
        pushing = false
        id = id
        done = false
        constructor(view) {
            this.view = view
            this.pull()
        }

        update(update) {
            if (update.docChanged) this.push();
            //
        }

        async push() {
            let updates = sendableUpdates(this.view.state)
            if (this.pushing || !updates.length) return
            this.pushing = true
            let version = getSyncedVersion(this.view.state)
            let success = await pushUpdates(version, updates)
            this.pushing = false
            // Regardless of whether the push failed or new updates came in
            // while it was running, try again if there's updates remaining
            if (sendableUpdates(this.view.state).length)
                setTimeout(() => this.push(), 100)
        }

        async pull() {
            while (!this.done) {
                let version = getSyncedVersion(this.view.state)
                let updates = await pullUpdates(version)

                this.view.dispatch(receiveUpdates(this.view.state, updates))

            }
        }

        destroy() { this.done = true }
    })
    return [collab({startVersion, clientID: id}), plugin]
}

let edit, view, myFunction;

myFunction = function myFunction(lock) {
    view.dispatch({
        effects: edit.reconfigure(EditorState.readOnly.of(lock))
    })
}
async function createPeer() {
    let {version, doc, id} = await getDocument();
    console.log(id);
    //console.log("createPeer");
    edit = new Compartment();
    let state = EditorState.create({
        doc,
        extensions: [basicSetup, javascript(), peerExtension(version, id), edit.of(EditorState.readOnly.of(true)),
            EditorView.theme({
            "&.cm-editor": {height: "100%"},
            ".cm-scroller": {overflow: "auto"}
        })] //EditorState.readOnly.of(true)
    })

    view = new EditorView({
        state,
        parent: document.getElementById("e")
    })
    return view;
}


createPeer();


