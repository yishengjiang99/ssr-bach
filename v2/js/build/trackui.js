import { renderToString } from 'react-dom/server';
export const trackUI = ({ name, instrument, notes }) => renderToString(createElement(React.createElement("tr", null,
    React.createElement("td", null, name),
    React.createElement("td", null, instrument),
    notes.map(note => React.createElement("td", null,
        React.createElement("a", { href: note.buffer }, note.name))))));
export const PlayerUI = ({ tempo, duration, paused, time, children }) => {
    return (React.createElement("table", null,
        React.createElement("tr", null,
            React.createElement("td", { colspan: "3" }, duration)),
        children));
};
