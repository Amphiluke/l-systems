import ls from "../ls.js";
import dom from "../dom.js";
import channel from "../channel.js";
import plotter from "../plotter.js";

let bank = new Map();

let collectionCtrl = {
    current: null, // currently selected collection name

    fillBank(collections) {
        for (let collName of Object.keys(collections)) {
            let items = collections[collName];
            let collection = new Map();
            bank.set(collName, collection);
            for (let itemName of Object.keys(items)) {
                let params = items[itemName];
                params.rules = new Map(Object.keys(params.rules).map(letter => [letter, params.rules[letter]]));
                collection.set(itemName, params);
            }
        }
    },

    fillCollectionList() {
        let html = "";
        for (let name of bank.keys()) {
            html += `<option>${name}</option>`;
        }
        html += "<option value=''>Add…</option>";
        dom.ui.get("collections").innerHTML = html;
    },

    fillLSystemList(collection) {
        let html = "";
        for (let name of bank.get(collection).keys()) {
            html += `<option>${name}</option>`;
        }
        let select = dom.ui.get("lSystems");
        select.innerHTML = html;
        collectionCtrl.current = collection;
    },
    
    setupLSystem(name, collection = collectionCtrl.current) {
        let params = bank.get(collection).get(name);
        if (!params) {
            return;
        }
        ls.reset();
        ls.axiom = params.axiom;
        ls.alpha = -params.alpha * Math.PI / 180;
        ls.theta = params.theta * Math.PI / 180;
        ls.step = params.step;
        ls.iterCount = params.iterCount;
        ls.setRules(params.rules);
    },
    
    create(name) {
        let i = 2;
        let validName = name;
        while (bank.has(validName)) {
            validName = `${name} (${i++})`;
        }
        let collection = new Map();
        // User defined collections are editable in contrast to built in collections.
        // So we need an attribute to distinct these two types of collections
        collection.userDefined = true;
        bank.set(validName, collection);
        let option = document.createElement("option");
        option.text = validName;
        let select = dom.ui.get("collections");
        select.add(option, select.length - 1);
        select.value = validName;
        dom.ui.get("lSystems").length = 0;
        collectionCtrl.current = validName;
    },

    delete(collection) {
        if (!collectionCtrl.isUserDefined(collection)) {
            throw new Error("Built in collection cannot be deleted");
        }
        bank.delete(collection);
    },

    isUserDefined(collection = collectionCtrl.current) {
        return !!bank.get(collection).userDefined;
    },

    deleteLSystem(name, collection = collectionCtrl.current) {
        if (!collectionCtrl.isUserDefined(collection)) {
            throw new Error("Built in collections cannot be modified");
        }
        bank.get(collection).delete(name);
    }
};


let handlers = {
    loadBank(e) {
        collectionCtrl.fillBank(JSON.parse(e.target.responseText));
        collectionCtrl.fillCollectionList();
        collectionCtrl.fillLSystemList(bank.keys().next().value);
    },

    changeCollection(e) {
        let select = e.target,
            collection = select.value,
            delBtn = dom.ui.get("deleteColl");
        if (collection) {
            collectionCtrl.fillLSystemList(collection);
            delBtn.disabled = !collectionCtrl.isUserDefined();
        } else {
            let name = window.prompt("Enter a new collection name", `collection #${bank.size + 1}`);
            if (name !== null) {
                collectionCtrl.create(name);
                delBtn.disabled = false;
            } else {
                select.value = collectionCtrl.current;
            }
        }
    },

    dblClickLSystem(e) {
        collectionCtrl.setupLSystem(e.target.value);
        channel.publish("LSystemConfigured");
    },

    keyDownLSystem(e) {
        switch (e.key) {
            case "Enter":
                collectionCtrl.setupLSystem(e.target.value);
                channel.publish("LSystemConfigured");
                break;
            case " ":
                collectionCtrl.setupLSystem(e.target.value);
                plotter.plot();
                break;
            case "Delete":
                if (collectionCtrl.isUserDefined() && window.confirm("Delete the selected L-system?")) {
                    collectionCtrl.deleteLSystem(e.target.value);
                }
                break;
        }
    }
};

let xhr = new XMLHttpRequest();
xhr.open("GET", "lib/bank.json");
xhr.addEventListener("load", handlers.loadBank);
xhr.send(null);

dom.ui.get("collections").addEventListener("change", handlers.changeCollection);
dom.ui.get("lSystems").addEventListener("dblclick", handlers.dblClickLSystem);
dom.ui.get("lSystems").addEventListener("keydown", handlers.keyDownLSystem);