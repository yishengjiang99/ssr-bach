function ZoneUI({ zone, setPane2Txt }) {
  const [details, setDetails] = React.useState('');
  return (
    <div>
      {zone.shdr.name}
      <div className="light section">status:{details}</div>
      <div>
        <button
          onClick={() => {
            const newLocal = JSON.stringify(zone, (key, val) => {
              if (key == 'generators') return false;
              else return val;
            });
            setPane2Txt(newLocal);
            start(`/sample/${zone.keyRange.lo}/${zone.velRange.hi}`, (update) =>
              setDetails(update)
            );
          }}
        >
          details
        </button>
      </div>
    </div>
  );
}
export function ZoneList({ list, zones }) {
  const [zoneList, setZoneList] = React.useState([]);
  const [pane2Txt, setPane2Txt] = React.useState('');

  return (
    <div className="row">
      <span className="col-md-3">
        {list.map((item, idx) => (
          <li key={idx} name={item.name}>
            <a
              onClick={() =>
                fetch(`/presets/${idx}`)
                  .then((res) => res.json())
                  .then((arr) => setZoneList(arr))
              }
              href={`#${item.presetId}`}
            >
              (123)
            </a>
            {item.name}
          </li>
        ))}
      </span>
      <span id="col2" className="col-md-3">
        <ul id="l2">
          {zoneList.map((z, i) => (
            <ZoneUI key={i} setPane2Txt={setPane2Txt} zone={z} />
          ))}
        </ul>
      </span>
      <span id="col1" className="col-md-3">
        <pre className="sticky">{pane2Txt}</pre>
      </span>
    </div>
  );
}
