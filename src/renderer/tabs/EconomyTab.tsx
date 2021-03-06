import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import isValid from "date-fns/isValid";
import React from "react";
import { useSelector } from "react-redux";
import { TableState } from "react-table";
import store, { AppState } from "../../shared/redux/stores/rendererStore";
import { InternalEconomyTransaction } from "../../types/inventory";
import EconomyTable from "../components/economy/EconomyTable";
import { getPrettyContext } from "../components/economy/economyUtils";
import { TransactionData } from "../components/economy/types";
import { toggleArchived } from "../rendererUtil";
import { reduxAction } from "../../shared/redux/sharedRedux";
import { IPC_ALL, IPC_RENDERER } from "../../shared/constants";
import { transactionsList } from "../../shared/store";

import appCss from "../app/app.css";

function saveTableState(economyTableState: TableState<TransactionData>): void {
  reduxAction(
    store.dispatch,
    { type: "SET_SETTINGS", arg: { economyTableState } },
    IPC_ALL ^ IPC_RENDERER
  );
}

function saveTableMode(economyTableMode: string): void {
  reduxAction(
    store.dispatch,
    { type: "SET_SETTINGS", arg: { economyTableMode } },
    IPC_ALL ^ IPC_RENDERER
  );
}

const sumBoosterCount = (boosters: { count: number }[]): number =>
  boosters.reduce(
    (accumulator: number, booster: { count: number }) =>
      accumulator + booster.count,
    0
  );

function getTxnData(archivedCache: Record<string, boolean>): TransactionData[] {
  const today = new Date();
  return transactionsList().map(
    (txn: InternalEconomyTransaction): TransactionData => {
      const ts = new Date(txn.date ?? NaN);
      const archived = archivedCache[txn.id] ?? txn.archived ?? false;
      const archivedSortVal = archived ? 1 : 0;
      const currentTrackLevel = txn.trackDiff?.currentLevel ?? 0;
      const oldTrackLevel = txn.trackDiff?.oldLevel ?? 0;
      const currentOrbCount = txn.orbCountDiff?.currentOrbCount ?? 0;
      const oldOrbCount = txn.orbCountDiff?.oldOrbCount ?? 0;
      const originalContext = txn.originalContext || txn.context || "";
      const artSkinsAdded = txn.delta?.artSkinsAdded ?? [];
      const boosterDelta = txn.delta?.boosterDelta ?? [];
      const cardsAdded = txn.delta?.cardsAdded ?? [];
      const draftTokensDelta = txn.delta?.draftTokensDelta ?? 0;
      const gemsDelta = txn.delta?.gemsDelta ?? 0;
      const goldDelta = txn.delta?.goldDelta ?? 0;
      const sealedTokensDelta = txn.delta?.sealedTokensDelta ?? 0;
      const vanityItemsAdded = txn.delta?.vanityItemsAdded ?? [];
      const vaultProgressDelta = txn.delta?.vaultProgressDelta ?? 0;
      const wcCommonDelta = txn.delta?.wcCommonDelta ?? 0;
      const wcUncommonDelta = txn.delta?.wcUncommonDelta ?? 0;
      const wcRareDelta = txn.delta?.wcRareDelta ?? 0;
      const wcMythicDelta = txn.delta?.wcMythicDelta ?? 0;
      return {
        ...txn,
        prettyContext: getPrettyContext(originalContext, false),
        fullContext: getPrettyContext(originalContext, true),
        archived,
        archivedSortVal,
        custom: true, // all txns may be archived
        trackLevelDelta: currentTrackLevel - oldTrackLevel,
        orbDelta: currentOrbCount - oldOrbCount,
        cardsAddedCount: cardsAdded.length ?? 0,
        artSkinsAddedCount: artSkinsAdded.length ?? 0,
        draftTokensDelta,
        gemsDelta,
        goldDelta,
        wcDelta: wcCommonDelta + wcUncommonDelta + wcRareDelta + wcMythicDelta,
        wcCommonDelta,
        wcUncommonDelta,
        wcRareDelta,
        wcMythicDelta,
        sealedTokensDelta,
        boosterDeltaCount: sumBoosterCount(boosterDelta),
        vanityAddedCount: vanityItemsAdded.length ?? 0,
        vaultProgressDelta: vaultProgressDelta / 100,
        aetherizedCardsCount: txn.aetherizedCards?.length ?? 0,
        timestamp: isValid(ts) ? ts.getTime() : NaN,
        daysAgo: differenceInCalendarDays(today, ts),
        xpGainedNumber: txn.xpGained ?? 0,
      };
    }
  );
}

export default function EconomyTab(): JSX.Element {
  const { economyTableMode, economyTableState } = store.getState().settings;
  const archivedCache = useSelector(
    (state: AppState) => state.renderer.archivedCache
  );
  const txnList = useSelector((state: AppState) => state.economy.economyIndex);
  const data = React.useMemo(() => {
    txnList;
    return getTxnData(archivedCache);
  }, [archivedCache, txnList]);
  return (
    <div className={appCss.uxItem}>
      <EconomyTable
        archiveCallback={toggleArchived}
        cachedState={economyTableState}
        cachedTableMode={economyTableMode}
        data={data}
        tableModeCallback={saveTableMode}
        tableStateCallback={saveTableState}
      />
    </div>
  );
}
