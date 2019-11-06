import _ from "lodash";
import React, { useEffect } from "react";
import ReactDOM from 'react-dom';
import { queryElements as $$ } from "../shared/dom-fns";
import { openTab, clickNav } from "./tabControl";
import pd from "../shared/player-data";

import {
    get_rank_index,
    formatRank
} from "../shared/util";

import {
    MAIN_HOME,
    MAIN_DECKS,
    MAIN_HISTORY,
    MAIN_EVENTS,
    MAIN_EXPLORE,
    MAIN_ECONOMY,
    MAIN_COLLECTION,
    MAIN_CONSTRUCTED,
    MAIN_LIMITED
} from "../shared/constants";

interface topNavItemProps {
    currentTab: number,
    compact: boolean,
    id: number,
    title: string
}

function TopNavItem(props:topNavItemProps) {
    const {currentTab, compact, id, title} = props;

    const selected = currentTab == id;

    const clickTab = React.useCallback((tabId: number) => (event: React.MouseEvent<HTMLDivElement>) => {
        if (!event.currentTarget.classList.contains("item_selected")) {
            $$(".top_nav_item").forEach(el => el.classList.remove("item_selected"));
            event.currentTarget.classList.add("item_selected");
            clickNav(tabId);
            openTab(tabId);
        }
    }, [props.id]);

    return compact ? (
        <div className={(selected ? "item_selected" : "") + " top_nav_item_no_label top_nav_item it" + id} onClick={clickTab(id)}>
            <div className={"top_nav_icon icon_" + id} title={_.camelCase(title)}></div>
        </div>
    ) : (
        <div className={(selected ? "item_selected" : "") + " top_nav_item it" + id + (title == "" ? " top_nav_item_no_label" : "")} onClick={clickTab(id)}>
            {title !== "" ? (<span className={"top_nav_item_text"}>{title}</span>) : 
            (<div className={"top_nav_icon icon_" + id} title={_.camelCase(title)}></div>)}
        </div>
    );
}

interface topRankProps {
    currentTab: number,
    id: number,
    rank: any,
    rankClass: string
}

function TopRankIcon(props:topRankProps) {
    const {currentTab, id, rank, rankClass} = props;
    
    const selected = currentTab == id;

    const clickTab = React.useCallback(() => (event: React.MouseEvent<HTMLDivElement>) => {
        clickNav(id);
    }, [props.id]);
    

   const propTitle = formatRank(rank);
   const rankStyle = {
       backgroundPosition: get_rank_index(rank.rank, rank.tier) * -48 + "px 0px"
   };

    return (
        <div className={(selected ? "item_selected" : "") + " top_nav_item"} onClick={clickTab()}>
            <div style={rankStyle} title={propTitle} className={rankClass}></div>
        </div>
    );
}

interface patreonProps {
    patreon: boolean,
    patreonTier: number
}

function PatreonBadge(props: patreonProps) {
    const { patreonTier } = props;

    let title = "Patreon Basic Tier";
    if (patreonTier === 1) title = "Patreon Standard Tier";
    if (patreonTier === 2) title = "Patreon Modern Tier";
    if (patreonTier === 3) title = "Patreon Legacy Tier";
    if (patreonTier === 4) title = "Patreon Vintage Tier";

    const style = {
        backgroundPosition: (-40 * patreonTier) + "px 0px"
    };

    return (
        <div title={title} style={style} className="top_patreon" ></div>
    );
}

function TopNav() {
    const [compact, setCompact] = React.useState(false);
    const currentTab = pd.settings.last_open_tab;

    const defaultTab = {
        compact: compact,
        currentTab: currentTab
    }

    const homeTab = {...defaultTab, id: MAIN_HOME, title:""};
    const myDecksTab = {...defaultTab, id: MAIN_DECKS, title:"MY DECKS"};
    const historyTab = {...defaultTab, id: MAIN_HISTORY, title:"HISTORY"};
    const eventsTab = {...defaultTab, id: MAIN_EVENTS, title:"EVENTS"};
    const exploreTab = {...defaultTab, id: MAIN_EXPLORE, title:"EXPLORE"};
    const economyTab = {...defaultTab, id: MAIN_ECONOMY, title:"ECONOMY"};
    const collectionTab = {...defaultTab, id: MAIN_COLLECTION, title:"COLLECTION"};

    const contructedNav = {currentTab: currentTab, id: MAIN_CONSTRUCTED,rank: pd.rank.constructed, rankClass: "top_constructed_rank"};
    const limitedNav = {currentTab: currentTab, id: MAIN_LIMITED,rank: pd.rank.limited, rankClass: "top_limited_rank"};

    React.useEffect(() => {
        if ($$(".top_nav_icons")[0].offsetWidth < 530) {
            if (!compact) {
                setCompact(true);
            }
        } else if (compact) {
            setCompact(false);
        }
    });

    const patreon = {
        patreon: pd.patreon,
        patreonTier: pd.patreon_tier
    };

    let userName = pd.name.slice(0, -6);
    let userNumerical = pd.name.slice(-6);

    return (
        <div className="top_nav">
            <div className="top_nav_icons">
                <TopNavItem {...homeTab}/>
                <TopNavItem {...myDecksTab}/>
                <TopNavItem {...historyTab}/>
                <TopNavItem {...eventsTab}/>
                <TopNavItem {...exploreTab}/>
                <TopNavItem {...economyTab}/>
                <TopNavItem {...collectionTab}/>
            </div>
            <div className="top_nav_info">
                <div className="top_userdata_container">
                    <TopRankIcon {...contructedNav}/>
                    <TopRankIcon {...limitedNav}/>
                    { pd.patreon ? <PatreonBadge {...patreon} /> : null }
                    <div className="top_username" title={"Arena username"}>{userName}</div>
                    <div className="top_username_id" title={"Arena user ID"}>{userNumerical}</div>
                </div>
            </div>
        </div>
    );
}

export default function createTopNav(parent: Element): boolean {
    ReactDOM.render(
        <TopNav />,
        parent
    );
    return true;
}