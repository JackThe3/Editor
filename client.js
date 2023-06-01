let UCITEL = false;

function getByValue(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
}

serverSocket.on("broadcast", (input) => {
    let {clients, transitString, locked} = input;
    console.log(locked);

    let clientsMAP = new Map(JSON.parse(transitString));
   // let answer = clients;

    console.log(clientsMAP);
    let answer = Array.from(clientsMAP.values());
    let me = document.getElementById("username");
    me.value = serverSocket.id;
    let list = document.getElementById("myList");
    list.innerHTML = '';
    answer.forEach((item) => {

        let li = document.createElement("li");
        let key = getByValue(clientsMAP, item);
        if (serverSocket.id === key){
            li.innerText = "➡" + "{"+ item + "}";
        }else{
            li.innerText = item;
        }
        if (!locked.includes(key)){
            li.innerText +=  "🔒";
        }
        else{
            li.innerText +=  "🖊";
        }

        list.appendChild(li);
        if (UCITEL){
            let btn = document.createElement("button");
            btn.innerHTML = item;
            btn.onclick = function () {
                serverSocket.emit("lock", key);
            };
            list.appendChild(btn);
        }

    });
});

serverSocket.on("locked", (answer) => {
    console.log("locked", answer)
    if (answer.includes(serverSocket.id)){
        myFunction(false);
    }else{
        myFunction(true);
    }
    serverSocket.emit("refresh");
});

function sendKEY() {
    let heslo = document.getElementById("myInput");
    console.log(heslo.value)
    UCITEL = true;
    serverSocket.emit("refresh");
}

function sendNICKNAME() {
    let nickname = document.getElementById("username");

    serverSocket.emit("nickname", nickname.value);

}