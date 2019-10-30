import React, { Fragment, useEffect, useState } from "react";

const CLOCK_MODE_BOTH = 0;
const CLOCK_MODE_ELAPSED = 1;
const CLOCK_MODE_CLOCK = 2;

export interface ClockProps {
  matchBeginTime: Date;
  priorityTimers: any[];
  turnPriority: number;
  oppName: string;
  playerSeat: number;
}

export default function Clock(props: ClockProps): JSX.Element {
  const [clockMode, setClockMode] = useState(CLOCK_MODE_BOTH);
  const [state, setState] = useState({
    now: new Date(),
    hhE: "0",
    mmE: "0",
    ssE: "0",
    mmP1: "0",
    ssP1: "0",
    mmP2: "0",
    ssP2: "0"
  });
  const {
    matchBeginTime,
    priorityTimers,
    turnPriority,
    oppName,
    playerSeat
  } = props;

  const tick = (): void => {
    let hh, mm, ss, time;

    time = priorityTimers[1] / 1000;
    const now = new Date();
    const msDiff = now.getTime() - new Date(priorityTimers[0]).getTime();
    if (turnPriority === 1 && time > 0) {
      time += msDiff / 1000;
    }
    mm = Math.floor((time % 3600) / 60);
    const mmP1 = ("0" + mm).slice(-2);
    ss = Math.floor(time % 60);
    const ssP1 = ("0" + ss).slice(-2);

    time = priorityTimers[2] / 1000;
    if (turnPriority === 2 && time > 0) {
      time += msDiff / 1000;
    }
    mm = Math.floor((time % 3600) / 60);
    const mmP2 = ("0" + mm).slice(-2);
    ss = Math.floor(time % 60);
    const ssP2 = ("0" + ss).slice(-2);

    const diff = Math.floor((Date.now() - matchBeginTime.getTime()) / 1000);
    hh = Math.floor(diff / 3600);
    mm = Math.floor((diff % 3600) / 60);
    ss = Math.floor(diff % 60);
    const hhE = ("0" + hh).slice(-2);
    const mmE = ("0" + mm).slice(-2);
    const ssE = ("0" + ss).slice(-2);

    setState({ mmP1, ssP1, mmP2, ssP2, hhE, mmE, ssE, now });
  };

  const handleClockPrev = (): void => {
    if (clockMode <= CLOCK_MODE_BOTH) {
      setClockMode(CLOCK_MODE_CLOCK);
    } else {
      setClockMode(clockMode - 1);
    }
  };

  const handleClockNext = (): void => {
    if (clockMode >= CLOCK_MODE_CLOCK) {
      setClockMode(CLOCK_MODE_BOTH);
    } else {
      setClockMode(clockMode + 1);
    }
  };

  useEffect(() => {
    const timerID = setInterval(() => tick(), 250);
    return (): void => {
      clearInterval(timerID);
    };
  });

  let cleanName = oppName;
  if (oppName !== "Sparky") {
    cleanName = oppName.slice(0, -6);
  }
  let p1name = cleanName;
  let p2name = "You";
  if (playerSeat === 1) {
    p1name = "You";
    p2name = cleanName;
  }

  return (
    <div className="overlay_clock_container click-on">
      <div className="clock_prev" onClick={handleClockPrev} />
      <div className="clock_turn">
        {clockMode === CLOCK_MODE_BOTH ? (
          <Fragment>
            <div
              key="clock_pname1"
              className={
                "clock_pname1 " + (turnPriority === 1 ? "pname_priority" : "")
              }
            >
              {p1name}
            </div>
            <div
              key="clock_pname2"
              className={
                "clock_pname2 " + (turnPriority === 2 ? "pname_priority" : "")
              }
            >
              {p2name}
            </div>
          </Fragment>
        ) : turnPriority === playerSeat ? (
          "You have priority."
        ) : (
          "Opponent has priority."
        )}
      </div>
      <div className="clock_elapsed">
        {clockMode === CLOCK_MODE_BOTH && (
          <Fragment>
            <div className="clock_priority_1" key="clock_priority_1">
              {state.mmP1 + ":" + state.ssP1}
            </div>
            <div className="clock_priority_2" key="clock_priority_2">
              {state.mmP2 + ":" + state.ssP2}
            </div>
          </Fragment>
        )}
        {clockMode === CLOCK_MODE_ELAPSED &&
          state.hhE + ":" + state.mmE + ":" + state.ssE}
        {clockMode === CLOCK_MODE_CLOCK && state.now.toLocaleTimeString()}
      </div>
      <div className="clock_next" onClick={handleClockNext} />
    </div>
  );
}
