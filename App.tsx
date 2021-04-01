import { Midi } from "@tonejs/midi";
import { Note } from "@tonejs/midi/dist/Note";
import React, { useEffect, useState } from "react";
import "./App.css";
const cellwidth = 20,
	cellheight = 20;
let reloads = 0; const grid = new Array(50 * 4).fill(new Array(88).fill(0))

function App({
	midi: {
		header: { name, meta, ppq },
		tracks,
	},
}: { midi: Midi }) {
	function ticksToMeasures(t) {
		return t / ppq / 4;
	}
	useEffect(() => {
		reloads++
		let tlimit = 0;
		while (ticksToMeasures(tlimit++) < 50);
		for (const t of tracks)
		{
			for (const n of t.notes)
			{
				if (n.ticks > tlimit) break;
				let nbar = n.bars, x = ticksToMeasures(n.ticks);
				while (nbar--)
				{
					if (!grid[x] || !grid[x][n.midi - 21])
					{
						console.log(x, n.midi); x++;
						continue;
					}
					grid[x][n.midi - 21] = t.instrument.number; x++;
				}
			}
		}
	}, []);
	return (
		<div className="App">
			<h3>{name}</h3>
			<i>{meta[0].text}</i>
			<Box midigrid={grid} cols={grid.length} rows={grid[0].length} />
		</div>
	);
}
function Box({ midigrid, rows, cols, moving }: { midigrid: number[][], rows: number, cols: number, moving?: boolean }) {
	const [grid, dispatch] = React.useReducer((prevState, action) => {
		const { r, c, state } = action;
		prevState[r][c] = state;
		return prevState;
	}, midigrid); //.fill(false));
	return (
		<div>{reloads}
			<svg
				style={{ width: "80vw", overflowX: 'scroll' }}
				className="container"
				width={cols * cellheight}
				height={rows * cellwidth}
			>
				<g className={moving ? "table-move" : "table"}>
					{grid.map((row, r) => {
						return <g>{row.map((v, c) =>
							<Cell dispatch={dispatch} initOn={v} r={r} c={c} />

						)}</g>
					})}

				</g>
			</svg>
		</div>
	);
}
function Cell({ initOn, r, c, dispatch }) {
	const [on, setOn] = useState(initOn);
	return (
		<rect
			onClick={() => {
				setOn(!on);
				dispatch({ state: on, r, c });
			}}
			fill={on ? "grey" : "lightgrey"}
			key={c}
			y={r * cellheight}
			x={c * cellwidth}
			width={cellwidth - 2}
			height={cellheight - 2}
		></rect>
	);
}
export default App;
