export var cdiv = function (tag, attributes, children) {
    if (attributes === void 0) { attributes = {}; }
    if (children === void 0) { children = []; }
    var div = document.createElement(tag);
    Object.keys(attributes).map(function (k) {
        div[k] = attributes[k];
    });
    children.map(function (c) { return div.append(c); });
    return div;
};
export var startBtn = function (clickStart) {
    var strtbtn = document.createElement("button");
    strtbtn.innerHTML = "start";
    document.body.append(strtbtn);
    strtbtn.onclick = clickStart;
    return strtbtn;
};
export var $ = document.querySelector;
export var stdoutPanel = function (parentDiv) {
    parentDiv = parentDiv || document.body;
    var rx1 = cdiv("pre", { id: "rx1" });
    function stdout(str) {
        rx1.innerHTML = str + "\n" + rx1.innerHTML;
    }
    parentDiv.append(rx1);
    return {
        stdout: stdout,
        rx1: rx1,
    }; //
};
//# sourceMappingURL=misc-ui.js.map