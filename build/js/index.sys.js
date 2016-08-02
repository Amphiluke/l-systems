System.register("panels/collections.sys.js", ["../ls.sys.js", "../dom.sys.js", "../channel.sys.js", "../plotter.sys.js"], function (_export, _context) {
    "use strict";

    var ls, dom, channel, plotter;
    return {
        setters: [function (_lsSysJs) {
            ls = _lsSysJs.default;
        }, function (_domSysJs) {
            dom = _domSysJs.default;
        }, function (_channelSysJs) {
            channel = _channelSysJs.default;
        }, function (_plotterSysJs) {
            plotter = _plotterSysJs.default;
        }],
        execute: function () {

            let bank = new Map();

            let collectionCtrl = {
                get current() {
                    return dom.ui.get("collections").value;
                },
                set current(name) {
                    dom.ui.get("collections").value = name;
                    collectionCtrl.fillLSystemList();
                    collectionCtrl.updateControlStates();
                },

                fillBank() {
                    dom.ui.get("collections").length = 0;

                    // Load built in collections
                    let xhr = new XMLHttpRequest();
                    xhr.open("GET", "lib/bank.json");
                    xhr.send(null);
                    xhr.addEventListener("load", () => {
                        let collections = JSON.parse(xhr.responseText);
                        for (let collName of Object.keys(collections).sort()) {
                            collectionCtrl.add(collName, collections[collName], false, false);
                        }
                        collectionCtrl.current = bank.keys().next().value;
                    });

                    // Load user defined collections (if any)
                    let userCollections = localStorage.getItem("userCollections");
                    if (userCollections) {
                        userCollections = JSON.parse(userCollections);
                        for (let collName of Object.keys(userCollections).sort()) {
                            collectionCtrl.add(collName, userCollections[collName], true, false);
                        }
                    }
                },

                fillLSystemList(collection = collectionCtrl.current) {
                    let html = "";
                    for (let name of bank.get(collection).keys()) {
                        html += `<option>${ name }</option>`;
                    }
                    let select = dom.ui.get("lSystems");
                    select.innerHTML = html;
                    select.selectedIndex = 0;
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

                add(name, lSystems = {}, userDefined = true, setCurrent = true) {
                    name = collectionCtrl._getValidName(name, bank);
                    let collection = collectionCtrl.plainToCollection(lSystems);
                    // User defined collections are editable in contrast to built in collections.
                    // So we need an attribute to distinct these two types of collections
                    collection.userDefined = userDefined;
                    bank.set(name, collection);
                    let option = document.createElement("option");
                    option.text = name;
                    dom.ui.get("collections").children[userDefined ? 1 : 0].appendChild(option);
                    if (setCurrent) {
                        collectionCtrl.current = name;
                    }
                },

                delete(collection = collectionCtrl.current) {
                    if (!collectionCtrl.isUserDefined(collection)) {
                        throw new Error("Built in collection cannot be deleted");
                    }
                    bank.delete(collection);
                    if (collection === collectionCtrl.current) {
                        collectionCtrl.current = bank.keys().next().value;
                    }
                    let select = dom.ui.get("collections");
                    select.children[1].removeChild([...select.options].find(option => option.text === collection));
                },

                isUserDefined(collection = collectionCtrl.current) {
                    return !!bank.get(collection).userDefined;
                },

                deleteLSystem(name, collection = collectionCtrl.current) {
                    if (!collectionCtrl.isUserDefined(collection)) {
                        throw new Error("Built in collections cannot be modified");
                    }
                    bank.get(collection).delete(name);
                    let select = dom.ui.get("lSystems");
                    select.removeChild([...select.options].find(option => option.text === name));
                },

                addLSystem(name, collection = collectionCtrl.current) {
                    if (!collectionCtrl.isUserDefined(collection)) {
                        throw new Error("Built in collections cannot be modified");
                    }
                    collection = bank.get(collection);
                    name = collectionCtrl._getValidName(name, collection);
                    let lSystem = new Map();
                    lSystem.axiom = ls.axiom;
                    lSystem.alpha = -ls.alpha * 180 / Math.PI;
                    lSystem.theta = ls.theta * 180 / Math.PI;
                    lSystem.step = ls.step;
                    lSystem.iterCount = ls.iterCount;
                    lSystem.rules = ls.rules;
                    collection.set(name, lSystem);
                    let option = document.createElement("option");
                    option.text = name;
                    dom.ui.get("lSystems").add(option);
                },

                updateControlStates() {
                    dom.ui.get("deleteColl").disabled = dom.ui.get("addLS").disabled = dom.ui.get("removeLS").disabled = !collectionCtrl.isUserDefined();
                },

                storeUserCollections() {
                    let userCollections = {};
                    for (let collection of bank.keys()) {
                        if (collectionCtrl.isUserDefined(collection)) {
                            userCollections[collection] = collectionCtrl.collectionToPlain(collection);
                        }
                    }
                    localStorage.setItem("userCollections", JSON.stringify(userCollections));
                },

                collectionToPlain(collection = collectionCtrl.current) {
                    let plain = {};
                    for (let [name, params] of bank.get(collection)) {
                        let data = plain[name] = { rules: {} };
                        ({ axiom: data.axiom, alpha: data.alpha, theta: data.theta, iterCount: data.iterCount, step: data.step } = params);
                        for (let [letter, rule] of params.rules) {
                            data.rules[letter] = rule;
                        }
                    }
                    return plain;
                },

                plainToCollection(plain) {
                    let collection = new Map();
                    for (let itemName of Object.keys(plain).sort()) {
                        let params = plain[itemName];
                        params.rules = new Map(Object.keys(params.rules).map(letter => [letter, params.rules[letter]]));
                        collection.set(itemName, params);
                    }
                    return collection;
                },

                _getValidName(name, map) {
                    let i = 2;
                    let validName = name;
                    while (map.has(validName)) {
                        validName = `${ name } (${ i++ })`;
                    }
                    return validName;
                }
            };

            collectionCtrl.fillBank();

            let handlers = {
                changeCollection(e) {
                    collectionCtrl.current = e.target.value;
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
                },

                clickCreateCollection() {
                    let name = window.prompt("Enter a new collection name", `collection #${ bank.size + 1 }`);
                    if (name !== null) {
                        collectionCtrl.add(name);
                    }
                },

                clickDeleteCollection() {
                    if (window.confirm("Delete the selected collection?")) {
                        collectionCtrl.delete();
                    }
                },

                clickAddLS() {
                    let name = window.prompt("Enter the name of the L-system", "");
                    if (name !== null) {
                        collectionCtrl.addLSystem(name);
                    }
                },

                clickRemoveLS() {
                    let select = dom.ui.get("lSystems");
                    if (select.selectedIndex >= 0 && collectionCtrl.isUserDefined() && window.confirm("Delete the selected L-system?")) {
                        collectionCtrl.deleteLSystem(select.value);
                    }
                },

                changeImport(e) {
                    let reader = new FileReader();
                    let file = e.target.files[0];
                    reader.addEventListener("load", () => {
                        let name = file.name.endsWith(".json") ? file.name.slice(0, -5) : file.name;
                        collectionCtrl.add(name, JSON.parse(reader.result));
                    });
                    reader.addEventListener("error", () => {
                        throw reader.error;
                    });
                    reader.readAsText(file);
                },

                mouseDownExport(e) {
                    let link = e.target;
                    URL.revokeObjectURL(link.href);
                    let data = [JSON.stringify(collectionCtrl.collectionToPlain(), null, 2)];
                    let blob = new Blob(data, { type: "application/json" });
                    link.href = URL.createObjectURL(blob);
                    link.download = `${ collectionCtrl.current }.json`;
                },

                beforeUnload() {
                    collectionCtrl.storeUserCollections();
                }
            };

            dom.ui.get("collections").addEventListener("change", handlers.changeCollection);
            dom.ui.get("lSystems").addEventListener("dblclick", handlers.dblClickLSystem);
            dom.ui.get("lSystems").addEventListener("keydown", handlers.keyDownLSystem);

            dom.ui.get("createColl").addEventListener("click", handlers.clickCreateCollection);
            dom.ui.get("deleteColl").addEventListener("click", handlers.clickDeleteCollection);

            dom.ui.get("addLS").addEventListener("click", handlers.clickAddLS);
            dom.ui.get("removeLS").addEventListener("click", handlers.clickRemoveLS);

            dom.ui.get("importColl").addEventListener("change", handlers.changeImport);
            dom.ui.get("exportColl").addEventListener("mousedown", handlers.mouseDownExport);

            window.addEventListener("beforeunload", handlers.beforeUnload);
        }
    };
});
System.register("panels/settings.sys.js", ["../dom.sys.js", "../ls.sys.js", "../plotter.sys.js", "../channel.sys.js"], function (_export, _context) {
    "use strict";

    var dom, ls, plotter, channel;
    return {
        setters: [function (_domSysJs) {
            dom = _domSysJs.default;
        }, function (_lsSysJs) {
            ls = _lsSysJs.default;
        }, function (_plotterSysJs) {
            plotter = _plotterSysJs.default;
        }, function (_channelSysJs) {
            channel = _channelSysJs.default;
        }],
        execute: function () {

            let panel = dom.ui.get(".panels").get("settings");
            let popup = dom.ui.get("letterPopup");
            let rulesBlock = panel.querySelector(".ls-rules");

            let ruleCtrl = {
                tpl: dom.ui.get("ruleTpl"),

                delete(letter) {
                    if (ls.deleteRule(letter)) {
                        let label = rulesBlock.querySelector(`[data-mark="${ letter }"]`);
                        let input = label.previousElementSibling.querySelector("input");
                        input.focus();
                        input.selectionStart = input.selectionEnd = input.value.length;
                        label.parentNode.removeChild(label);
                    }
                },

                insert(letter, beforeEl = ruleCtrl.tpl) {
                    if (!letter) {
                        return;
                    }
                    let html = ruleCtrl.tpl.innerHTML.replace(/\$\{(?:letter|rule)\}/g, letter);
                    beforeEl.insertAdjacentHTML("beforebegin", html);
                    ls.setRule(letter, letter);
                    let input = rulesBlock.querySelector(`input[data-letter="${ letter }"]`);
                    input.focus();
                    input.select();
                },

                replace(oldLetter, newLetter) {
                    if (ls.deleteRule(oldLetter)) {
                        ls.setRule(newLetter, newLetter);
                        let label = rulesBlock.querySelector(`[data-mark="${ oldLetter }"]`);
                        let input = rulesBlock.querySelector(`input[data-letter="${ oldLetter }"]`);
                        label.dataset.mark = newLetter;
                        input.dataset.letter = newLetter;
                        input.focus();
                    }
                },

                sync() {
                    let labels = rulesBlock.querySelectorAll("[data-mark]:not([data-mark='F']):not([data-mark='B'])");
                    [...labels].forEach(label => label.parentNode.removeChild(label));
                    let template = ruleCtrl.tpl.innerHTML;
                    for (let [letter, rule] of ls.rules) {
                        if (letter === "F" || letter === "B") {
                            rulesBlock.querySelector(`input[data-letter="${ letter }"]`).value = rule;
                        } else {
                            let html = template.replace(/\$\{letter\}/g, letter).replace(/\$\{rule\}/g, rule);
                            ruleCtrl.tpl.insertAdjacentHTML("beforebegin", html);
                        }
                    }
                }
            };

            let handlers = {
                clickAddRule() {
                    ruleCtrl.insert([...ls.vacantLetters][0]);
                },

                keyDownBackspace(e) {
                    let target = e.target;
                    let letter = target.dataset.letter;
                    if (letter && !target.value) {
                        ruleCtrl.delete(letter);
                        e.preventDefault();
                    }
                },

                keyDownDelete(e) {
                    if (e.ctrlKey) {
                        ruleCtrl.delete(e.target.dataset.letter);
                    }
                },

                keyDownInsert(e) {
                    let letter = e.target.dataset.letter;
                    if (letter) {
                        let beforeEl = letter === "F" ? undefined : rulesBlock.querySelector(`[data-mark="${ letter }"]`).nextElementSibling;
                        ruleCtrl.insert([...ls.vacantLetters][0], beforeEl);
                    }
                },

                clickRuleLetter(e) {
                    let target = e.target;
                    let letter = target.dataset.mark;
                    if (letter && letter !== "F" && letter !== "B") {
                        if (!popup.classList.contains("visible")) {
                            let vacant = ls.vacantLetters;
                            [...popup.getElementsByTagName("button")].forEach(btn => {
                                btn.disabled = btn.value && !vacant.has(btn.value);
                            });
                        }
                        popup.classList.toggle("visible");
                        if (popup.classList.contains("visible")) {
                            popup.style.left = `${ target.offsetLeft }px`;
                            popup.style.top = `${ target.offsetTop + target.offsetHeight }px`;
                            popup.dataset.ownerLetter = letter;
                        }
                    }
                },

                clickPopupBtn(e) {
                    let newLetter = e.target.value;
                    let oldLetter = popup.dataset.ownerLetter;
                    if (newLetter) {
                        ruleCtrl.replace(oldLetter, newLetter);
                    } else {
                        ruleCtrl.delete(oldLetter);
                    }
                    popup.classList.remove("visible");
                },

                clickPlot(e) {
                    e.preventDefault();
                    let ruleFields = [...rulesBlock.querySelectorAll("input[data-letter]")];
                    let rules = new Map(ruleFields.map(field => [field.dataset.letter, field.value.toUpperCase()]));
                    try {
                        ls.reset();
                        ls.axiom = dom.ui.get("axiom").value.toUpperCase();
                        ls.alpha = -dom.ui.get("alpha").value * Math.PI / 180;
                        ls.theta = dom.ui.get("theta").value * Math.PI / 180;
                        ls.step = Number(dom.ui.get("step").value);
                        ls.iterCount = Number(dom.ui.get("iterCount").value);
                        ls.setRules(rules);
                    } catch (ex) {
                        alert(ex.message);
                        return;
                    }
                    plotter.plot();
                },

                syncLSystem() {
                    dom.ui.get("axiom").value = ls.axiom;
                    dom.ui.get("alpha").value = (-ls.alpha * 180 / Math.PI).toFixed(3);
                    dom.ui.get("theta").value = (ls.theta * 180 / Math.PI).toFixed(3);
                    dom.ui.get("step").value = ls.step;
                    dom.ui.get("iterCount").value = ls.iterCount;
                    ruleCtrl.sync();
                }
            };

            dom.ui.get("addRule").addEventListener("click", handlers.clickAddRule);

            rulesBlock.addEventListener("keydown", e => {
                let method = `keyDown${ e.key }`;
                if (handlers.hasOwnProperty(method)) {
                    handlers[method](e);
                }
            });

            rulesBlock.addEventListener("click", handlers.clickRuleLetter);
            popup.addEventListener("click", handlers.clickPopupBtn);
            dom.ui.get("plot").addEventListener("click", handlers.clickPlot);

            channel.subscribe("LSystemConfigured", handlers.syncLSystem);
        }
    };
});
System.register("panels/appearance.sys.js", ["../dom.sys.js", "../plotter.sys.js"], function (_export, _context) {
    "use strict";

    var dom, plotter;
    return {
        setters: [function (_domSysJs) {
            dom = _domSysJs.default;
        }, function (_plotterSysJs) {
            plotter = _plotterSysJs.default;
        }],
        execute: function () {

            let panel = dom.ui.get(".panels").get("appearance"),
                canvas = dom.ui.get("canvas");

            let appearanceCtrl = {
                setFg(color) {
                    plotter.settings.strokeStyle = color;
                    plotter.repaint();
                },

                setBg(color) {
                    plotter.settings.fillStyle = document.body.style.background = color;
                    plotter.repaint();
                },

                transforms: {
                    rotate: { pattern: /\s*rotate\(.+?deg\)/, unit: "deg" },
                    translateX: { pattern: /\s*translateX\(.+?px\)/, unit: "px" },
                    translateY: { pattern: /\s*translateY\(.+?px\)/, unit: "px" },
                    scale: { pattern: /\s*scale\(.+?\)/, unit: "" }
                },

                setTransform(transform, value) {
                    let style = canvas.style;
                    let { pattern, unit } = appearanceCtrl.transforms[transform];
                    let otherTransforms = style.transform.replace(pattern, "").trim();
                    if (!value) {
                        style.transform = otherTransforms;
                    } else {
                        style.transform = `${ otherTransforms } ${ transform }(${ value }${ unit })`.trim();
                    }
                }
            };

            let handlers = {
                changeFg(e) {
                    appearanceCtrl.setFg(e.target.value);
                },

                changeBg(e) {
                    appearanceCtrl.setBg(e.target.value);
                },

                toggleTransparency(e) {
                    let bgInput = dom.ui.get("bgClr");
                    let transparent = bgInput.disabled = e.target.checked;
                    appearanceCtrl.setBg(transparent ? "transparent" : bgInput.value);
                },

                changeTransform(e) {
                    let transform = e.target.dataset.transform;
                    if (transform && e.target.validity.valid) {
                        appearanceCtrl.setTransform(transform, e.target.value.trim());
                    }
                }
            };

            dom.ui.get("fgClr").addEventListener("change", handlers.changeFg);
            dom.ui.get("bgClr").addEventListener("change", handlers.changeBg);
            dom.ui.get("noBgClr").addEventListener("change", handlers.toggleTransparency);

            panel.addEventListener("change", handlers.changeTransform);
        }
    };
});
System.register("channel.sys.js", [], function (_export, _context) {
    "use strict";

    return {
        setters: [],
        execute: function () {
            let handlerRegistry = new Map();

            let channel = {
                publish(event, ...args) {
                    let handlers = handlerRegistry.get(event);
                    if (handlers) {
                        handlers.forEach(handler => handler(...args));
                    }
                },

                subscribe(event, handler) {
                    let handlers = handlerRegistry.get(event);
                    if (!handlers) {
                        handlers = [];
                        handlerRegistry.set(event, handlers);
                    }
                    handlers.push(handler);
                },

                unsubscribe(event, handler) {
                    let handlers = handlerRegistry.get(event);
                    if (handlers) {
                        let index = handlers.indexOf(handler);
                        if (index >= 0) {
                            handlers.splice(index, 1);
                            if (!handlers.length) {
                                handlerRegistry.delete(event);
                            }
                        }
                    }
                }
            };

            _export("default", channel);
        }
    };
});
System.register("validator.sys.js", [], function (_export, _context) {
    "use strict";

    return {
        setters: [],
        execute: function () {
            let ruleRE = /^[A-Z\+\-\[\]]*$/;

            let validator = {
                messages: {
                    AXIOM: "The axiom may contain only the following characters: “A”-Z”, “+”, “-”, “[”, “]”",
                    RULE: "Production rules may may contain only the following characters: “A”-Z”, “+”, “-”, “[”, “]”",
                    LETTER: "The allowed alphabet letters are: “A”-“Z”",
                    ALPHA: "The “alpha” parameter must be a finite number",
                    THETA: "The “theta” parameter must be a finite number",
                    STEP: "The “step” parameter must be a positive finite number",
                    COUNT: "The number of iterations must be integer and finite",
                    NUMBER: "A valid finite number expected"
                },

                checkRule(rule, msg = validator.messages.RULE) {
                    return ruleRE.test(rule) || msg;
                },

                checkLetter(letter, msg = validator.messages.LETTER) {
                    return letter.length === 1 && letter >= "A" && letter <= "Z" || msg;
                },

                checkStep(step, msg = validator.messages.STEP) {
                    return Number.isFinite(step) && step > 0 || msg;
                },

                checkCount(count, msg = validator.messages.COUNT) {
                    return Number.isInteger(count) && count > 0 || msg;
                },

                checkNumber(number, msg = validator.messages.NUMBER) {
                    return Number.isFinite(number) || msg;
                }
            };

            _export("default", validator);
        }
    };
});
System.register("ls.sys.js", ["./validator.sys.js"], function (_export, _context) {
    "use strict";

    var validator;
    return {
        setters: [function (_validatorSysJs) {
            validator = _validatorSysJs.default;
        }],
        execute: function () {

            const ctrlRuleList = [["F", ""], ["B", ""], ["+", "+"], ["-", "-"], ["[", "["], ["]", "]"]];

            const defaults = {
                alpha: 0,
                theta: 0,
                step: 10,
                iterCount: 3
            };

            let axiom, rules, settings;

            let ls = {
                // The initial code (an axiom)
                get axiom() {
                    return axiom;
                },
                set axiom(value) {
                    let status = validator.checkRule(value, validator.messages.AXIOM);
                    if (status === true) {
                        axiom = value;
                    } else {
                        throw new Error(status);
                    }
                },

                // Initial angle in radians
                get alpha() {
                    return settings.alpha;
                },
                set alpha(value) {
                    let status = validator.checkNumber(value, validator.messages.ALPHA);
                    if (status === true) {
                        settings.alpha = value;
                    } else {
                        throw new Error(status);
                    }
                },

                // Angle increment in radians
                get theta() {
                    return settings.theta;
                },
                set theta(value) {
                    let status = validator.checkNumber(value, validator.messages.THETA);
                    if (status === true) {
                        settings.theta = value;
                    } else {
                        throw new Error(status);
                    }
                },

                // The length of a “turtle” step in px
                get step() {
                    return settings.step;
                },
                set step(value) {
                    let status = validator.checkStep(value);
                    if (status === true) {
                        settings.step = value;
                    } else {
                        throw new Error(status);
                    }
                },

                // Total number of iterations used to generate the resulting L-system code
                get iterCount() {
                    return settings.iterCount;
                },
                set iterCount(value) {
                    let status = validator.checkCount(value);
                    if (status === true) {
                        settings.iterCount = value;
                    } else {
                        throw new Error(status);
                    }
                },

                // Productions for each symbol in the axiom
                get rules() {
                    let ruleList = [...rules].filter(([key]) => key >= "A" && key <= "Z");
                    return new Map(ruleList);
                },
                setRule(production, letter) {
                    let status = validator.checkLetter(letter);
                    if (status !== true) {
                        throw new Error(status);
                    }
                    status = validator.checkRule(production);
                    if (status !== true) {
                        throw new Error(status);
                    }
                    rules.set(letter, production);
                },
                setRules(productions) {
                    productions.forEach(this.setRule, this);
                },
                deleteRule(letter) {
                    if (letter !== "F" && letter !== "B" && rules.has(letter)) {
                        rules.delete(letter);
                        return true;
                    }
                    return false;
                },

                get vacantLetters() {
                    let letters = "ACDEGHIJKLMNOPQRSTUVWXYZ";
                    let vacant = new Set();
                    for (let letter of letters) {
                        if (!rules.has(letter)) {
                            vacant.add(letter);
                        }
                    }
                    return vacant;
                },

                getCode() {
                    let code = axiom;
                    for (let count = settings.iterCount; count > 0; count--) {
                        let newCode = "";
                        for (let letter of code) {
                            newCode += rules.get(letter) || "";
                        }
                        code = newCode;
                    }
                    return code;
                },

                reset() {
                    axiom = "";
                    settings = Object.assign({}, defaults);
                    rules = new Map(ctrlRuleList);
                }
            };

            ls.reset();

            _export("default", ls);
        }
    };
});
System.register("dom.sys.js", [], function (_export, _context) {
    "use strict";

    return {
        setters: [],
        execute: function () {
            let dom = {
                ui: new Map(),

                cache(el, lsId) {
                    let index = lsId.indexOf(".");
                    if (index >= 0) {
                        let groupName = lsId.slice(index);
                        let group = this.ui.get(groupName);
                        if (!group) {
                            group = new Map();
                            this.ui.set(groupName, group);
                        }
                        group.set(lsId.slice(0, index), el);
                    } else {
                        this.ui.set(lsId, el);
                    }
                },

                // Use this to search non-cached dynamic elements
                getElementByLSID(lsId, context = document.body) {
                    return context.querySelector(`[data-ls-id="${ lsId }"]`);
                }
            };

            for (let el of document.body.querySelectorAll("[data-ls-id]")) {
                dom.cache(el, el.dataset.lsId);
            }

            _export("default", dom);
        }
    };
});
System.register("plotter.sys.js", ["./ls.sys.js", "./dom.sys.js"], function (_export, _context) {
    "use strict";

    var ls, dom;
    return {
        setters: [function (_lsSysJs) {
            ls = _lsSysJs.default;
        }, function (_domSysJs) {
            dom = _domSysJs.default;
        }],
        execute: function () {

            let canvas = dom.ui.get("canvas");
            let ctx = canvas.getContext("2d");

            /**
             * Internal data for the current plotting process
             * @property {Number} x - Current x-coordinate of the turtle
             * @property {Number} y - Current y-coordinate of the turtle
             * @property {Number} alpha - Current rotation of the turtle
             * @property {Number} left - The leftmost edge x-coordinate of the L-system
             * @property {Number} top - The topmost edge y-coordinate of the L-system
             * @property {Number} right - The rightmost edge x-coordinate of the L-system
             * @property {Number} bottom - The bottommost edge y-coordinate of the L-system
             * @property {Number} step - Cached value of `ls.step`
             * @property {Number} theta - Cached value of `ls.theta`
             * @property {Array.<{x: Number, y: Number, alpha: Number}>} stack - The stack of saved coordinates of the turtle
             * @property {String} cleanCode - Filtered codeword string (all draw irrelevant letters excluded)
             * @type {Object}
             */
            let plotData = { stack: [] };

            /**
             * Maps the codeword letters to the real drawing commands for the turtle
             * @type {Map}
             */
            let actions = new Map();

            actions.set("F", function () {
                plotData.x += plotData.step * Math.cos(plotData.alpha);
                plotData.y += plotData.step * Math.sin(plotData.alpha);
                ctx.lineTo(plotData.x, plotData.y);
            });
            actions.set("B", function () {
                plotData.x += plotData.step * Math.cos(plotData.alpha);
                plotData.y += plotData.step * Math.sin(plotData.alpha);
                ctx.moveTo(plotData.x, plotData.y);
            });
            actions.set("+", function () {
                plotData.alpha += plotData.theta;
            });
            actions.set("-", function () {
                plotData.alpha -= plotData.theta;
            });
            actions.set("[", function () {
                plotData.stack.push({ x: plotData.x, y: plotData.y, alpha: plotData.alpha });
            });
            actions.set("]", function () {
                ({ x: plotData.x, y: plotData.y, alpha: plotData.alpha } = plotData.stack.pop());
                ctx.moveTo(plotData.x, plotData.y);
            });

            /**
             * Maps the codeword letters to the commands of the preparatory stage (preparing the plotData object before drawing)
             * @type {Map}
             */
            let preactions = new Map([...actions]);

            preactions.set("F", function () {
                plotData.x += plotData.step * Math.cos(plotData.alpha);
                plotData.y += plotData.step * Math.sin(plotData.alpha);
                plotData.left = Math.min(plotData.left, plotData.x);
                plotData.right = Math.max(plotData.right, plotData.x);
                plotData.top = Math.min(plotData.top, plotData.y);
                plotData.bottom = Math.max(plotData.bottom, plotData.y);
            });
            preactions.set("B", preactions.get("F"));
            preactions.set("]", function () {
                ({ x: plotData.x, y: plotData.y, alpha: plotData.alpha } = plotData.stack.pop());
            });

            let plotter = {
                settings: {
                    fillStyle: "transparent",
                    strokeStyle: "#080"
                },

                reset() {
                    plotData.cleanCode = "";
                    plotData.x = plotData.y = 0;
                    ({ step: plotData.step, alpha: plotData.alpha, theta: plotData.theta, iterCount: plotData.count } = ls);
                    plotData.stack.length = 0;
                    plotData.left = plotData.top = Number.MAX_VALUE;
                    plotData.right = plotData.bottom = -Number.MAX_VALUE;
                },

                /**
                 * Calculate L-system bounding rect and cleanup the codeword for the turtle
                 * by dropping all letters which don't affect the drawing process
                 */
                prepare() {
                    let code = ls.getCode();
                    let cleanCode = "";
                    for (let symbol of code) {
                        let action = preactions.get(symbol);
                        if (action) {
                            cleanCode += symbol;
                            action();
                        }
                    }
                    plotData.cleanCode = cleanCode;
                },

                /**
                 * Reset the turtle coordinates and empty the stack of saved positions.
                 * Call this every time before drawing to guarantee that the L-system will be centered on the canvas
                 */
                setup() {
                    plotData.x = (canvas.offsetWidth - plotData.left - plotData.right) / 2;
                    plotData.y = (canvas.offsetHeight - plotData.top - plotData.bottom) / 2;
                    plotData.alpha = ls.alpha;
                    plotData.stack.length = 0;
                },

                /**
                 * Clear the entire canvas
                 */
                clear() {
                    ctx.strokeStyle = this.settings.strokeStyle;
                    ctx.fillStyle = this.settings.fillStyle;
                    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
                    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
                },

                /**
                 * Repaint the L-system using the current `plotData` parameters.
                 * This doesn't recalculate the entire plot but just redraws the previous result
                 */
                repaint() {
                    this.clear();
                    if (plotData.cleanCode) {
                        // We have to reset the turtle coordinates every repaint because of the fact
                        // that canvas sizes might change since the last repaint
                        this.setup();
                        ctx.beginPath();
                        ctx.moveTo(plotData.x, plotData.y);
                        for (let symbol of plotData.cleanCode) {
                            actions.get(symbol)();
                        }
                        ctx.stroke();
                    }
                },

                /**
                 * Completely recalculate the entire plot taking the actual parameters of the L-system
                 * and then draw the result on the canvas
                 */
                plot() {
                    this.reset();
                    this.prepare();
                    this.repaint();
                }
            };

            _export("default", plotter);

            {
                let debounceTimer = null;
                let repaint = () => {
                    debounceTimer = null;
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                    plotter.repaint();
                };

                window.addEventListener("resize", () => {
                    if (debounceTimer !== null) {
                        clearTimeout(debounceTimer);
                    }
                    debounceTimer = setTimeout(repaint, 100);
                });

                repaint();
            }
        }
    };
});
System.register("panels/exporting.sys.js", ["../dom.sys.js", "../ls.sys.js", "../channel.sys.js", "../plotter.sys.js"], function (_export, _context) {
    "use strict";

    var dom, ls, channel, plotter;
    return {
        setters: [function (_domSysJs) {
            dom = _domSysJs.default;
        }, function (_lsSysJs) {
            ls = _lsSysJs.default;
        }, function (_channelSysJs) {
            channel = _channelSysJs.default;
        }, function (_plotterSysJs) {
            plotter = _plotterSysJs.default;
        }],
        execute: function () {

            let panel = dom.ui.get(".panels").get("exporting"),
                exportLink = dom.ui.get("exportImg"),
                canvas = dom.ui.get("canvas");

            let exportCtrl = {
                makeImgLink(mimeType = "image/png") {
                    URL.revokeObjectURL(exportLink.href);
                    canvas.toBlob(blob => {
                        let ext = mimeType.slice(mimeType.lastIndexOf("/") + 1);
                        exportLink.href = URL.createObjectURL(blob);
                        exportLink.download = `l-system.${ ext }`;
                        exportLink.innerHTML = `Download ${ ext.toUpperCase() }…`;
                        panel.classList.add("ls-export-requested");
                    }, mimeType);
                },

                unmakeImgLink() {
                    panel.classList.remove("ls-export-requested");
                },

                getLSystemLink() {
                    let link = `${ location.origin }${ location.pathname }?~ls~=`;
                    link += `ax${ encodeURIComponent(ls.axiom) }~`;
                    for (let [letter, rule] of ls.rules) {
                        link += `r${ letter }${ encodeURIComponent(rule) }~`;
                    }
                    link += `al${ (-ls.alpha * 180 / Math.PI).toFixed(3) }~`;
                    link += `th${ (ls.theta * 180 / Math.PI).toFixed(3) }~`;
                    link += `it${ ls.iterCount }~`;
                    link += `st${ ls.step }`;
                    return link;
                },

                checkURLQuery() {
                    let match = location.search.match(/(?:\?|&)~ls~=([^&]+)/);
                    if (!match) {
                        return;
                    }
                    ls.reset();
                    for (let param of match[1].split("~")) {
                        let key = param.slice(0, 2);
                        let value = decodeURIComponent(param.slice(2));
                        switch (key) {
                            case "ax":
                                ls.axiom = value;
                                break;
                            case "al":
                                ls.alpha = -value * Math.PI / 180;
                                break;
                            case "th":
                                ls.theta = value * Math.PI / 180;
                                break;
                            case "it":
                                ls.iterCount = +value;
                                break;
                            case "st":
                                ls.step = +value;
                                break;
                            default:
                                if (key[0] === "r") {
                                    ls.setRule(value, key[1]);
                                }
                                break;
                        }
                    }
                    channel.publish("LSystemConfigured");
                    plotter.plot();
                }
            };

            let handlers = {
                clickExportControl(e) {
                    let target = e.target;
                    if (target === exportLink) {
                        exportCtrl.unmakeImgLink();
                    } else if (target.dataset.mimeType) {
                        exportCtrl.makeImgLink(target.dataset.mimeType);
                    }
                },

                clickMakeLink() {
                    let linkField = dom.ui.get("linkAddress");
                    linkField.value = exportCtrl.getLSystemLink();
                    linkField.focus();
                    linkField.select();
                },

                focusLinkAddress(e) {
                    e.target.select();
                }
            };

            panel.querySelector(".ls-export-controls").addEventListener("click", handlers.clickExportControl);
            dom.ui.get("makeLink").addEventListener("click", handlers.clickMakeLink);
            dom.ui.get("linkAddress").addEventListener("focus", handlers.focusLinkAddress);

            exportCtrl.checkURLQuery();
        }
    };
});
System.register("panels/panels.sys.js", ["../dom.sys.js", "../channel.sys.js", "./collections.sys.js", "./settings.sys.js", "./appearance.sys.js", "./exporting.sys.js"], function (_export, _context) {
    "use strict";

    var dom, channel;
    return {
        setters: [function (_domSysJs) {
            dom = _domSysJs.default;
        }, function (_channelSysJs) {
            channel = _channelSysJs.default;
        }, function (_collectionsSysJs) {}, function (_settingsSysJs) {}, function (_appearanceSysJs) {}, function (_exportingSysJs) {}],
        execute: function () {

            let openedPanel = [...dom.ui.get(".panels").values()].find(el => el.classList.contains("ls-panel-open"));

            let panels = {
                show(panelId, allowToggle = false) {
                    let panel = dom.ui.get(".panels").get(panelId);
                    if (!panel) {
                        return;
                    }
                    if (panel !== openedPanel) {
                        if (openedPanel) {
                            openedPanel.classList.remove("ls-panel-open");
                        }
                        panel.classList.add("ls-panel-open");
                        openedPanel = panel;
                    } else if (allowToggle) {
                        this.hide();
                    }
                },

                hide() {
                    if (openedPanel) {
                        openedPanel.classList.remove("ls-panel-open");
                        openedPanel = null;
                    }
                }
            };

            dom.ui.get("tabs").addEventListener("click", e => {
                let ref = e.target.dataset.lsRef;
                if (ref) {
                    panels.show(ref, true);
                }
            });

            channel.subscribe("LSystemConfigured", () => {
                panels.show("settings");
            });

            _export("default", panels);
        }
    };
});
System.register("index.sys.js", ["./panels/panels.sys.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_panelsPanelsSysJs) {}],
    execute: function () {}
  };
});