import React, { useRef, useCallback, useState } from "react";
import {
  RANKS,
  WHITE,
  BLUE,
  BLACK,
  RED,
  GREEN,
  COLORLESS,
} from "../../../shared/constants";
import ReactSelect from "../../../shared/ReactSelect";
import { getRankIndex } from "../../../shared/utils/getRankIndex";
import { toDDHHMMSS, toMMSS } from "../../../shared/utils/dateTo";
import Aggregator, { AggregatorStats } from "../../aggregator";
import {
  compareWinrates,
  formatPercent,
  getTagColor,
  getWinrateClass,
} from "../../rendererUtil";

import indexCss from "../../index.css";
import topNavCss from "../main/topNav.css";
import listItemCss from "../list-item/ListItem.css";
import manaCurveCss from "../../../shared/ManaCurve/ManaCurve.css";
import sharedCss from "../../../shared/shared.css";

const manaClasses: string[] = [];
manaClasses[WHITE] = sharedCss.manaW;
manaClasses[BLUE] = sharedCss.manaU;
manaClasses[BLACK] = sharedCss.manaB;
manaClasses[RED] = sharedCss.manaR;
manaClasses[GREEN] = sharedCss.manaG;
manaClasses[COLORLESS] = sharedCss.manaC;

const { RANKED_CONST, RANKED_DRAFT } = Aggregator;

function ColoredWinrate({ stats }: { stats: AggregatorStats }): JSX.Element {
  const colClass = getWinrateClass(stats.winrate);
  const title = `${stats.wins} won : ${stats.losses} lost`;
  return (
    <span className={colClass + "_bright"} title={title}>
      {formatPercent(stats.winrate)}
    </span>
  );
}

const frequencySort = (a: AggregatorStats, b: AggregatorStats): number =>
  b.total - a.total;

const getStyleHeight = (frac: number): string => Math.round(frac * 100) + "%";

function WinrateChart({
  winrates,
  showTags,
}: {
  winrates: AggregatorStats[];
  showTags: boolean;
}): JSX.Element {
  const curveMax = Math.max(
    ...winrates.map((cwr) => Math.max(cwr.wins || 0, cwr.losses || 0)),
    0
  );
  const barStats = [...winrates];
  barStats.sort(compareWinrates);
  return (
    <>
      <div className={manaCurveCss.manaCurve}>
        {barStats.map((cwr, index) => {
          return (
            <React.Fragment key={index}>
              <div
                className={
                  manaCurveCss.manaCurveColumn + " " + sharedCss.back_green
                }
                style={{ height: getStyleHeight(cwr.wins / curveMax) }}
                title={`${cwr.wins} won`}
              />
              <div
                className={
                  manaCurveCss.mana_curve_column + " " + sharedCss.back_red
                }
                style={{ height: getStyleHeight(cwr.losses / curveMax) }}
                title={`${cwr.losses} lost`}
              />
            </React.Fragment>
          );
        })}
      </div>
      <div className={manaCurveCss.mana_curve_costs}>
        {barStats.map((cwr, index) => {
          let winRate = 0;
          if (cwr.wins) {
            winRate = cwr.wins / (cwr.wins + cwr.losses);
          }
          const colClass = getWinrateClass(winRate, true);
          return (
            <div
              key={index}
              className={manaCurveCss.mana_curve_column_number}
              title={`${cwr.wins} won : ${cwr.losses} lost`}
            >
              <span className={colClass}>{formatPercent(winRate)}</span>
              {showTags && (
                <div
                  className={manaCurveCss.mana_curve_tag}
                  style={{ backgroundColor: getTagColor(cwr.tag) }}
                >
                  {cwr.tag}
                </div>
              )}
              {cwr.colors?.map((color) => (
                <div
                  key={color}
                  className={sharedCss.manaS16 + " " + manaClasses[color]}
                  style={{ margin: "3px auto 3px auto" }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

function FrequencyChart({
  winrates,
  total,
  showTags,
}: {
  winrates: AggregatorStats[];
  total: number;
  showTags: boolean;
}): JSX.Element {
  const curveMax = Math.max(...winrates.map((cwr) => cwr.total));
  const barStats = [...winrates];
  barStats.sort(frequencySort);
  return (
    <>
      <div className={manaCurveCss.mana_curve}>
        {barStats.map((cwr, index) => {
          return (
            <div
              key={index}
              className={
                manaCurveCss.mana_curve_column + " " + sharedCss.back_blue
              }
              style={{ height: getStyleHeight(cwr.total / curveMax) }}
              title={`${cwr.total} matches`}
            />
          );
        })}
      </div>
      <div className={manaCurveCss.mana_curve_costs}>
        {barStats.map((cwr, index) => {
          let frequency = 0;
          if (cwr.total) {
            frequency = cwr.total / total;
          }
          return (
            <div
              key={index}
              className={manaCurveCss.mana_curve_column_number}
              title={`${cwr.total} matches`}
            >
              <span className={sharedCss.whiteBright}>
                {formatPercent(frequency)}
              </span>
              {showTags && (
                <div
                  className={manaCurveCss.mana_curve_tag}
                  style={{ backgroundColor: getTagColor(cwr.tag) }}
                >
                  {cwr.tag}
                </div>
              )}
              {cwr.colors?.map((color) => (
                <div
                  key={color}
                  className={sharedCss.manaS16 + " " + manaClasses[color]}
                  style={{ margin: "3px auto 3px auto" }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function MatchResultsStatsPanel({
  prefixId,
  aggregator,
  showCharts,
}: {
  prefixId: string;
  aggregator: Aggregator;
  showCharts: boolean;
}): JSX.Element {
  const { stats, playStats, drawStats, tagStats, colorStats } = aggregator;
  const { eventId } = aggregator.filters;
  const isLimited = eventId === RANKED_DRAFT;
  const isConstructed = eventId === RANKED_CONST;
  const rankedStats = isLimited
    ? aggregator.limitedStats
    : isConstructed
    ? aggregator.constructedStats
    : undefined;
  const [showTags, setShowTags] = React.useState(true);

  // Set up panel width and ref
  const [panelWidth, setPanelWidth] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Check if we resized the panelRef div
  const checkResize = useCallback((): void => {
    const newWidth =
      panelRef && panelRef.current ? panelRef.current.offsetWidth : 0;
    if (panelWidth !== newWidth) {
      setPanelWidth(newWidth);
    }
  }, [panelWidth, panelRef, setPanelWidth]);

  // Make an interval to listen for the resize of the div
  React.useEffect(() => {
    const interval = setInterval(function () {
      checkResize();
    }, 100);
    return (): void => {
      clearInterval(interval);
    };
  }, [checkResize]);

  const barsToShow = Math.max(3, Math.round(panelWidth / 40));
  // Archetypes
  const tagsWinrates = [...Object.values(tagStats)];
  tagsWinrates.sort(frequencySort);
  const freqTagStats = tagsWinrates.slice(0, barsToShow);
  // Colors
  const colorsWinrates = [...Object.values(colorStats)];
  colorsWinrates.sort(frequencySort);
  const freqColorStats = colorsWinrates.slice(0, barsToShow);
  return (
    <div className={indexCss.main_stats} ref={panelRef}>
      <div className={prefixId + "_winrate"}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            className={listItemCss.listDeckWinrate}
            style={{ margin: "0 auto 0 0" }}
          >
            Overall (matches):
          </div>
          <div
            className={listItemCss.listDeckWinrate}
            style={{ margin: "0 0 0 auto" }}
          >
            {`${stats.wins}:${stats.losses} `}(
            <ColoredWinrate stats={stats} />)
          </div>
        </div>
        {!!rankedStats &&
          RANKS.map((rank) => {
            const stats = rankedStats[rank.toLowerCase()];
            if (!stats || !stats.total) {
              return <React.Fragment key={rank} />;
            }
            return (
              <div
                key={rank}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  className={
                    isLimited
                      ? topNavCss.topLimitedRank
                      : topNavCss.topConstructedRank
                  }
                  style={{
                    margin: "0 auto 0 0",
                    backgroundPosition: `${getRankIndex(rank, 1) * -48}px 0px`,
                  }}
                  title={rank}
                ></div>
                <div
                  className={listItemCss.listDeckWinrate}
                  style={{ margin: "0 0 0 auto" }}
                >
                  {`${stats.wins}:${stats.losses} `}(
                  <ColoredWinrate stats={stats} />)
                </div>
              </div>
            );
          })}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            className={listItemCss.listDeckWinrate}
            style={{ margin: "0 auto 0 0" }}
          >
            Play/Draw (games):
          </div>
          <div
            className={listItemCss.listDeckWinrate}
            style={{ margin: "0 0 0 auto" }}
          >
            <ColoredWinrate stats={playStats} />/
            <ColoredWinrate stats={drawStats} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            className={listItemCss.listMatchTime}
            style={{ margin: "0 auto 0 0" }}
          >
            Duration:
          </div>
          <div
            className={listItemCss.listMatchTime}
            style={{ margin: "0 0 0 auto" }}
            title={toDDHHMMSS(stats.duration)}
          >
            {toMMSS(stats.duration)}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label className={indexCss.butContainerLabel}>Group by:</label>
          <ReactSelect
            className={"match_results_group_select"}
            current={showTags ? "Archetype" : "Color"}
            options={["Archetype", "Color"]}
            callback={(filter): void => setShowTags(filter === "Archetype")}
            style={{
              margin: "12px auto auto 4px",
              textAlign: "left",
              width: "120px",
              display: "inline-flex",
            }}
          />
        </div>
        {showCharts && (
          <div
            className={
              showTags ? "stats_panel_arch_charts" : "stats_panel_color_charts"
            }
          >
            <div
              className={indexCss.ranks_history_title}
              style={{ marginTop: "24px" }}
            >
              Frequent Matchups
            </div>
            <FrequencyChart
              winrates={showTags ? freqTagStats : freqColorStats}
              total={stats.total}
              showTags={showTags}
            />
            <div
              className={indexCss.ranks_history_title}
              style={{ marginTop: "24px" }}
            >
              Wins vs Losses
            </div>
            <WinrateChart
              winrates={showTags ? freqTagStats : freqColorStats}
              showTags={showTags}
            />
          </div>
        )}
      </div>
    </div>
  );
}
