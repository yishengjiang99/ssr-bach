import { SF2File, generatorNames } from "../node_modules/parse-sf2/dist/index.js";
import { applyEnvelope } from "./adsr.js";
import { mkdiv as h } from "../node_modules/mkdiv/index.js";
import { SynthChannel } from "./audio-path.js";
import { SharedState } from "./shared-state.js";
export async function init(ctx, ninputs = 5, url = "file.sf2") {
    let sffile;
    let programs = new Array(ninputs).fill([0, 0]);
    const synths = [];
    const iputProcs = [];
    const pendingRelease = new Array(ninputs).fill([]);
    try {
        ctx = new AudioContext({ sampleRate: 44100 });
    }
    catch (e) {
        console.log(e, "ignore prob");
    }
    sffile = await SF2File.fromURL(url);
    try {
        await ctx.audioWorklet.addModule("./dist/input-proc.js");
        //and arraybuffer for audioworklet processors to write down their state and other feelings
        // oh god why am i writing commets here
        statebuff = new SharedArrayBuffer(ninputs * 1024);
        const wknodeParam = (i) => ({
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            processorOptions: {
                statebuff: statebuff.slice(1024 * i),
            },
        });
        for (let i = 0; i < ninputs; i++) {
            synths.push(new SynthChannel(ctx, sffile));
            const aw = new AudioWorkletNode(ctx, "input-proc", wknodeParam(i));
            iputProcs.push({
                aw,
                state: new SharedState(statebuff, 1024 * i, []),
            });
            aw.port.addEventListener("message", () => {
                //	aw.connect(ctx.destination);
                aw.port.addEventListener("message", (e) => console.log(e.data), { once: false });
            }, { once: true });
            aw.port.onmessageerror = (e) => alert("msg err" + e.data);
            aw.onprocessorerror = (e) => alert(e.type);
            aw.port.postMessage({
                sdtaF32s: sffile.sdta.floatArr,
                statebuff: statebuff.slice(1024 * i, 1024 * (i + 1)),
            });
            aw.connect(synths[i].preamp);
        }
    }
    catch (e) {
        alert(e.message);
    }
    function program(channel, bankId, presetId) {
        programs[channel] = [presetId, bankId];
    }
    function keyOn(channel, key, vel, when = 0, presetId = programs[channel][0], bankId = programs[channel][1]) {
        const zones = sffile.pdta.findPreset(presetId, bankId, key, vel);
        zones.map((z, i) => {
            const { onAttack, onRelease } = applyEnvelope(z.volEnv, iputProcs[channel].aw.parameters.get("egVal"), ctx);
            onAttack();
            iputProcs[channel].aw.parameters
                .get("pitchShift")
                .setValueAtTime(Math.pow(2, (key * 100 - z.pitch) / 1200), ctx.currentTime + 0.1);
        });
        iputProcs[channel].aw.port.postMessage({ start: when, zones: zones.map((z) => z.serialize()) });
        const { onAttack, onRelease } = applyEnvelope(zones[0].volEnv, iputProcs[channel].aw.parameters.get("egVal"), ctx);
        onAttack();
        iputProcs[channel].aw.parameters
            .get("pitchShift")
            .setValueAtTime(Math.pow(2, (key * 100 - z.pitch) / 1200), ctx.currentTime + 0.1);
        pendingRelease[channel].push(onRelease);
        return [z];
    }
    function keyOff(channel, key) {
        if (pendingRelease[channel][0]) {
            pendingRelease[channel][0]();
            pendingRelease[channel].shift();
        }
    }
    return {
        keyOn,
        keyOff,
        program,
        presets: (start, end) => sffile.pdta.phdr.slice(start, end),
        iputProcs,
    };
}
export function mkui(controller) {
    const div = h("div", {}, ["mkmusic"]);
    controller.presets(0, 5).forEach((p, i) => {
        controller.program(i, p.bankId, p.presetId);
        let vel = 55;
        const label = h("span");
        const slider = h("input", {
            oninput: (e) => {
                vel = parseInt(e.target.value);
                label.innerHTML = vel + "";
            },
            type: "range",
            min: "1",
            value: vel + "",
            max: "127",
        });
        const info = h("span", { class: "rx" });
        const btns = [];
        for (let o = 44; o < 88; o++) {
            btns.push(h("button", {
                onmousedown: (e) => {
                    const zone = controller.keyOn(i, o, vel, 0);
                    e.target.addEventListener("mouseup", (e) => {
                        controller.keyOff(i, o);
                    });
                    info.innerHTML = zone === null || zone === void 0 ? void 0 : zone.generators.map((g) => `${generatorNames[g.operator]}:${g.s16}\n`).join("&nbsp;");
                },
            }));
        }
        const panel = h("div", { class: "panel" }, [
            h("p", {}, [label, slider, info]),
            h("p", {}, btns),
        ]);
        div.append(panel);
    });
    const statediv = h("div");
    function updateloop() {
        statediv.innerHTML = controller.iputProcs.map((ch) => ch.state.u8.join(",")).join("\n");
        setTimeout(updateloop, 500);
    }
    updateloop();
    div.append(statediv);
    return div;
}
