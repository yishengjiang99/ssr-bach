import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import Replay10Icon from "@material-ui/icons/Replay";
import Foward10Icon from "@material-ui/icons/Forward";
import { IconButton } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    margin: "auto",
    maxWidth: 500,
  },
  image: {
    width: 128,
    height: 128,
  },
  img: {
    margin: "auto",
    display: "block",
    maxWidth: "100%",
    maxHeight: "100%",
  },
}));

export type File = {
  url: string;
  name: string;
  text: string;
  seconds: string;
  instruments: string[];
  coverImage?: string;
};

export function FileList({ files, playFn, pauseFn }) {
  function Card3({ file }) {
    const [channel, setChannel] = React.useState(null);
    const [playing, setPlaying] = React.useState(false);
    const classes = useStyles();
    React.useEffect(() => {
      setChannel(new BroadcastChannel("playbacklistener"));
    }, [channel]);
    return (
      <div className={classes.root}>
        <Paper className={classes.paper}>
          <Grid container spacing={2}>
            <Grid item>
              <ButtonBase className={classes.image}>
                <img
                  className={classes.img}
                  alt="complex"
                  src={file.coverImage}
                />
              </ButtonBase>
            </Grid>
            <Grid item xs={12} sm container>
              <Grid item xs container direction="column" spacing={2}>
                <Grid item xs>
                  <Typography gutterBottom variant="subtitle1">
                    {file.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {file.text}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {file.instruments.slice(3).join(";")}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body2" style={{ cursor: "pointer" }}>
                    Play
                    {playing ? (
                      <IconButton aria-label="Pause" onClick={pauseFn}>
                        <PauseIcon />
                      </IconButton>
                    ) : (
                      <IconButton aria-label="Play" onClick={playFn}>
                        <PlayArrowIcon />
                      </IconButton>
                    )}
                  </Typography>
                </Grid>
              </Grid>
              <Grid item>
                <Typography variant="subtitle1">$19.00</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </div>
    );
  }
  return React.createElement(
    "ul",
    {},
    files.map((f) => Card3({ file: f }))
  );
}
