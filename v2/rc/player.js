"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var Tracks = function Tracks(_ref) {
  var tracks = _ref.tracks,
      header = _ref.header,
      page = _ref.page,
      range = _ref.range;

  var _React$useState = React.useState(-1),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      t = _React$useState2[0],
      setT = _React$useState2[1];

  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      null,
      t,
      " ",
      header.name
    ),
    React.createElement(
      "div",
      { className: "row" },
      tracks.map(function (t) {
        return React.createElement(
          "div",
          { className: "col-md-" + 12 / tracks.length },
          t.notes && t.notes.reduce(function (grid, v, i) {
            grid[v.ticks / 1000] = v.name;
          }, new Array(30))
        );
      })
    )
  );
};
function rendertracks(_ref2) {
  var tracks = _ref2.tracks,
      header = _ref2.header;

  var domContainer = document.querySelector("main");
  ReactDOM.render(React.createElement(Tracks, { header: header, tracks: tracks }), domContainer);
}