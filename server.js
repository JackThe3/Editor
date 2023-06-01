import { Server, Socket } from 'socket.io';
import * as http from 'http';
import {ChangeSet, Text} from "@codemirror/state";
import express from "express";

const app = express();
const server = http.createServer (app);
const io = new Server(server);

app.use('/', express.static('.'));

let updates = []
let doc = Text.of(["Start document"])
let pending = [];
let clients = [];
let locked = [];
let clientsMAP = new Map();

// listening for connections from clients
io.on('connection',  (socket) =>{
    clients.push(socket.id);
    clientsMAP.set(socket.id, socket.id);

    console.log(clientsMAP);
    let transitString = JSON.stringify(Array.from(clientsMAP));

    io.sockets.emit('broadcast',{clients, transitString, locked} );


    socket.on('disconnect', () =>{
        console.log("disconnect:", socket.id);
        const index = clients.indexOf(socket.id);
        clients.splice(index, 1);
        clientsMAP.delete(socket.id);
        io.sockets.emit('broadcast', {clients, clientsMAP, locked});
    })

    socket.on("lock", (id) => {
        console.log("zamknuty:", id); //id clienta
        if (locked.includes(id)){
            const index = locked.indexOf(id);
            locked.splice(index, 1);
        }else{
            locked.push(id)
        }
        io.sockets.emit("locked", locked);
    });

    socket.on("refresh", (id) => {
        let transitString = JSON.stringify(Array.from(clientsMAP));
        io.sockets.emit('broadcast',{clients, transitString, locked});
    });

    socket.on("nickname", (nickname) => {
        console.log(nickname);
        console.log(socket.id);
        clientsMAP.set(socket.id, nickname);
        console.log(clientsMAP);
        let transitString = JSON.stringify(Array.from(clientsMAP));
        io.sockets.emit('broadcast',{clients, transitString, locked});
    });

    socket.on('pullUpdates', (version, resp) => {
        if (version < updates.length) {
            resp(updates.slice(version))
        } else {
            pending.push(resp);
        }
    })



    socket.on('pushUpdates', (version, docUpdates, resp) => {
        docUpdates = (docUpdates);
        console.log("PushUpdate: ",version, docUpdates);

        try {
            if ((version != updates.length)) {
                resp(false);
            } else {
                for (let update of docUpdates) {
                    // Convert the JSON representation to an actual ChangeSet
                    // instance
                    let changes = ChangeSet.fromJSON(update.changes)
                    updates.push({changes, clientID: update.clientID})
                    doc = changes.apply(doc)
                }
                resp(true);

                while (pending.length) pending.pop()(docUpdates)
            }
        } catch (error) {
            console.error(error)
        }
    })

    socket.on('getDocument', (resp) => {
        resp(updates.length, doc.toString(), socket.id);
    })
})

//`
const PORT = 8000;
server.listen (PORT, () => {
    console.log (`Listen on port ${PORT}`);
});