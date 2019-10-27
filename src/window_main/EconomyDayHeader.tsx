import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { createDiv } from "../shared/dom-fns";
import startOfDay from "date-fns/startOfDay";
import {
  formatNumber,
  formatPercent,
} from "./renderer-util";
import { vaultPercentFormat, EconomyState } from "./economyUtils";
import React from "react";
import ReactDOM from "react-dom";
import EconomyValueRecord from "./EconomyValueRecord";
import LocalTime from "../shared/time-components/LocalTime";

function localDayDateFormat(date: Date) {
  return (
    <LocalTime datetime={date.toISOString()}
      year={"numeric"}
      month={"long"}
      day={"numeric"}>
    </LocalTime>
  );
}

function getDayString(daysago: number, timestamp: Date) {
  return daysago == 0 ? "Today" : daysago == 1 ? "Yesterday" : daysago > 0 ? localDayDateFormat(startOfDay(timestamp)) : '';
}

interface EconomyDayHeaderProps {
  date: string;
  econState: EconomyState;
}

export function EconomyDayHeader(props: EconomyDayHeaderProps) {
  const { date, econState } = props;
  const timestamp = new Date(date);
  econState.daysago = differenceInCalendarDays(new Date(), timestamp);
  const { dayList, daysago } = econState;
  const deltaPercent = dayList[econState.daysago].vaultProgress / 100.0;

  // gridTitle.style.gridArea = "1 / 1 / auto / 2";
  // gridTitle.style.lineHeight = "64px";
  // gridCards.style.gridArea = "1 / 2 / auto / 3";
  // gridVault.style.gridArea = "1 / 3 / auto / 4";
  // upcontca.style.width = "auto";
  // gridGold.style.gridArea = "1 / 4 / auto / 5";
  // gridGems.style.gridArea = "1 / 5 / auto / 6";
  // gridExp.style.gridArea = "1 / 6 / auto / 7";
  return (
    <>
      <div className={"flex_item gridTitle"}>
        {getDayString(daysago, timestamp)}
      </div>
      <EconomyValueRecord containerDiv iconClassName={"economy_card"} className={"gridCards"} deltaUpContent={formatNumber(dayList[daysago].cardsEarned)} title={"Cards"}/>
      <EconomyValueRecord containerDiv iconClassName={"economy_vault"} className={"gridVault"} deltaUpContent={formatPercent(deltaPercent, vaultPercentFormat as any)} title={"Vault"}/>
      <EconomyValueRecord containerDiv iconClassName={"economy_gold_med"} className={"gridGold"} deltaUpContent={formatNumber(dayList[daysago].goldEarned)} deltaDownContent={formatNumber(dayList[daysago].goldSpent)} title={"Gold"}/>
      <EconomyValueRecord containerDiv iconClassName={"economy_gems_med" } className={"gridGems"} deltaUpContent={formatNumber(dayList[daysago].gemsEarned)} deltaDownContent={formatNumber(dayList[daysago].gemsSpent)} title={"Gems"}/>
      <EconomyValueRecord containerDiv iconClassName={"economy_exp" } className={"gridExp"} deltaUpContent={formatNumber(dayList[daysago].expEarned)} title={"Experience"}/>
    </>
  );
}

export function createDayHeader(change: { date: string }, state: EconomyState) {
  const headerGrid = createDiv(["economy_title"]);
  ReactDOM.render(<EconomyDayHeader econState={state} date={change.date}/>, headerGrid);
  return headerGrid;
}