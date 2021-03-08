"use strict";

const Tracks = ({ tracks, header, page, range }) => {
  const [t, setT] = React.useState(-1);
  return (
    <div>
      <div>
        {t} {header.name}
      </div>
      <div className="row">
        {tracks.map((t) => (
          <div className={`col-md-${12 / tracks.length}`}>
            {t.notes &&
              t.notes.reduce((grid, v, i) => {
                grid[v.ticks / 1000] = v.name;
              }, new Array(30))}
          </div>
        ))}
      </div>
    </div>
  );
};
function rendertracks({ tracks, header }) {
  let domContainer = document.querySelector("main");
  ReactDOM.render(<Tracks header={header} tracks={tracks} />, domContainer);
}
