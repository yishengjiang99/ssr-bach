import React from "react";
import ReactDOM from "react-dom";
import { PDTA } from "./pdta.js";
import { fetchSoundFont, generatorNames } from "./readsf.js";
import { audioPath } from "./audioPath.js";

function Conzole(props) {
  const inputRef = React.useRef();
  const [lines, setLines] = React.useState(props.lines);
  window.addLine = (line) => setLines((prev) => prev.push(line));
  return (
    <div>
      <pre>{lines.slice(lines.length - 20).map((l) => l + "\n")}</pre>
      <form
        onSubmit={() => {
          addLine();
        }}
      >
        <input name="input" ref={inputRef} type="text" />
      </form>
    </div>
  );
}

function ZoneList({ pdta }) {
  const [phdrId, setPhdrId] = React.useState(0);
  const [pbagId, setPbagid] = React.useState(0);
  const [velFilter, setVelFilter] = React.useState(-1);
  const [keyFilter, setKeyFilter] = React.useState(-1);

  const [pane2Txt, setPane2Txt] = React.useState("");
  function ZoneUI({ zone, setPane2Txt }) {
    const [details, setDetails] = React.useState("");
    return (
      <div>
        {zone.sampleID && zone.sampleID > -1
          ? pdta.shdr[zone.sampleID].name
          : ""}
        <ul>
          {zone.generators.map((g) => (
            <li key={g.opid}>
              <b>{generatorNames[g.opid]}</b>:{" "}
              {g.opid == 43 || g.opid == 44
                ? `${g.range.lo}-${g.range.hi}`
                : g.s16}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="row">
        <label for="velfilter">vel: {velFilter}</label>
        <input
          id="velfilter"
          type="range"
          min={-1}
          max={128}
          value={velFilter}
          step={1}
          onChange={(e) => setVelFilter(e.target.value)}
        />
        <label for="keyfilter">key: {keyFilter}</label>
        <input
          type="range"
          min={-1}
          max={127}
          value={keyFilter}
          step={1}
          onChange={(e) => setKeyFilter(e.target.value)}
        />
      </div>
      <div className="row">
        <span
          style={{
            maxHeight: "70vh",
            scrollbarWidth: "none",
            overflowY: "scroll",
          }}
          className="col-md-4"
        >
          <ul>
            {pdta.phdr
              .filter((item) => item.bankId == 0)
              .sort((a, b) => a.presetId - b.presetId)
              .map((item, idx) => (
                <li key={idx}>
                  <a onClick={() => setPhdrId(idx)} href={`#${(item, idx)}`}>
                    {item.name} ({item.pbags.length})
                  </a>
                </li>
              ))}
          </ul>
        </span>
        <span
          id="col2"
          style={{
            maxHeight: "70vh",
            scrollbarWidth: "none",
            overflowY: "scroll",
          }}
          className="col-md-4"
        >
          <ul id="l2">
            {pdta.phdr[phdrId].defaultBag &&
            pdta.pbag[pdta.phdr[phdrId].defaultBag] ? (
              <PZone pzone={pdta.pbag[pdta.phdr[phdrId].defaultBag].pzone} />
            ) : null}
            {pdta
              .findPreset(
                pdta.phdr[phdrId].presetId,
                pdta.phdr[phdrId].bankId,
                keyFilter,
                velFilter
              )
              .map((z) => (
                <PZone pzone={z} />
              ))}
          </ul>
        </span>
        <span
          id="col4"
          style={{
            maxHeight: "70vh",
            scrollbarWidth: "none",
            overflowY: "scroll",
          }}
          className="col-md-4"
        >
          {Array.from(pdta.phdr[phdrId].ibagSet.values()).map((ibagId) => {
            return pdta.ibag[ibagId] ? (
              <ZoneUI
                zone={pdta.ibag[ibagId]?.izone}
                setPane2Txt={setPane2Txt}
              />
            ) : null;
          })}
        </span>
      </div>
      <pre>{pane2Txt}</pre>
    </div>
  );

  function PZone({ pzone }) {
    return (
      <div className="card">
        <ul>
          {pzone.generators &&
            pzone.generators.map(function (g) {
              return (
                <li key={g.opid}>
                  <b>{generatorNames[g.opid]}</b>:{" "}
                  {g.opid == 43 || g.opid == 44
                    ? `${g.range.lo}-${g.range.hi}`
                    : g.s16}
                </li>
              );
            })}
        </ul>
        <div>
          <button
            play={() =>
              ctxInstance((ctx) => {
                const samples = sff.sdta.bit16s.subarray(
                  pzone.sampleOffsets.startLoop,
                  pzone.sampleOffsets.endLoop
                );
                const ab = new AudioBuffer();
              })
            }
          >
            play
          </button>
          )}
        </div>
      </div>
    );
  }
}
(async function () {
  const containerbase = "https://dsp.grepawk.com/radio";
  const sff = await fetchSoundFont(containerbase + "/sf2/GeneralUserGS.sf2");

  ReactDOM.render(
    <div className="row">
      <ZoneList pdta={sff.pdta} />
    </div>,
    document.querySelector("#root")
  );
})();
