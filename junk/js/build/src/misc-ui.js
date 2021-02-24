export const cdiv = (tag, attributes = {}, children = []) => {
    const div = document.createElement(tag);
    Object.keys(attributes).map((k) => {
        div[k] = attributes[k];
    });
    typeof children === "string"
        ? (div.innerHTML += children)
        : [].concat(children).map((c) => div.append(c));
    return div;
};
export const startBtn = (clickStart) => {
    const strtbtn = document.createElement("button");
    strtbtn.innerHTML = "start";
    document.body.append(strtbtn);
    strtbtn.onclick = clickStart;
    return strtbtn;
};
export const $ = document.querySelector;
export const stdoutPanel = (parentDiv) => {
    parentDiv = parentDiv || document.body;
    const std = parentDiv.querySelector("#stdout") || cdiv("pre", { id: "stdout" });
    const linkdiv = cdiv("span");
    function stdout(str) {
        std.innerHTML = str + "\n" + std.innerHTML;
    }
    const rx1 = parentDiv.querySelector("#rx1") || cdiv("span", { id: "rx1" });
    function printrx(str) {
        rx1.innerHTML = str;
    }
    parentDiv.append(rx1);
    parentDiv.append(std);
    return {
        stdout,
        std,
        printrx: (str, n = 1) => {
            parentDiv.querySelector("#rx" + n)
                ? (parentDiv.querySelector("#rx" + n).innerHTML = str)
                : cdiv("span", { id: `rx${n}` }, str);
        },
        printlink: (href, name) => {
            linkdiv.innerHTML += `<a href='${href}'>${name}</a>`;
        },
    }; //
};
export function logtime(stdout) {
    let t0 = performance.now();
    return function log(str) {
        stdout(`${performance.now() - t0}: ${str}`);
        //t0 = performance.now();
        return true;
    };
}
export const { printrx, stdout } = stdoutPanel(document.querySelector("#root"));
