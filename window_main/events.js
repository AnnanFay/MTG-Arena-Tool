/*
globals
  $$,
  addHover,
  Aggregator,
  allMatches,
  cardsDb,
  compare_cards,
  compare_courses,
  createDivision,
  DataScroller,
  eventsHistory,
  FilterPanel,
  get_deck_colors,
  get_rank_index_16,
  getEventWinLossClass,
  getReadableEvent,
  ipc_send,
  matchesHistory,
  mana,
  ListItem,
  playerData,
  queryElementsByClass,
  StatsPanel,
  timeSince,
  toMMSS
*/

let filters = Aggregator.getDefaultFilters();
filters.eventId = Aggregator.ALL_EVENT_TRACKS;
let filteredMatches;

function openEventsTab(_filters) {
  const mainDiv = document.getElementById("ux_0");
  mainDiv.classList.remove("flex_item");
  mainDiv.innerHTML = "";
  const d = createDivision(["list_fill"]);
  mainDiv.appendChild(d);

  eventsHistory.courses.sort(compare_courses);
  filters = { ...filters, ..._filters };
  filteredMatches = new Aggregator(filters);

  const eventsTop = createDivision(["events_top"]);
  eventsTop.style.display = "flex";
  eventsTop.style.width = "100%";
  eventsTop.style.alignItems = "center";
  eventsTop.style.justifyContent = "space-between";

  const filterPanel = new FilterPanel(
    "events_top",
    selected => openEventsTab(selected),
    filters,
    allMatches.trackEvents
  );

  const eventsTopFilter = filterPanel.render();
  eventsTop.appendChild(eventsTopFilter);

  const partialStats = {
    ...filteredMatches.stats,
    colors: [],
    tags: []
  };
  const statsPanel = new StatsPanel("events_top", partialStats);
  const eventsTopWinrate = statsPanel.render();
  eventsTopWinrate.style.width = "300px";
  eventsTopWinrate.style.marginRight = "16px";
  eventsTop.appendChild(eventsTopWinrate);

  mainDiv.appendChild(eventsTop);
  const dataScroller = new DataScroller(
    mainDiv,
    renderData,
    20,
    eventsHistory.courses.length
  );
  dataScroller.render(25);
}

// return val = how many rows it rendered into container
function renderData(container, index) {
  // for performance reasons, we leave events order mostly alone
  // to display most-recent-first, we use a reverse index
  const revIndex = eventsHistory.courses.length - index - 1;
  var course_id = eventsHistory.courses[revIndex];
  var course = eventsHistory[course_id];

  if (course === undefined || course.CourseDeck === undefined || course.archived) {
    return 0;
  }

  if (!filteredMatches) return 0;
  if (!filteredMatches.filterDate(course.date)) return 0;
  if (!filteredMatches.filterEvent(course.InternalEventName)) {
    return 0;
  }

  var tileGrpid = course.CourseDeck.deckTileId;

  let listItem = new ListItem(tileGrpid, course.id, expandEvent, archiveEvent);
  listItem.divideLeft();
  listItem.divideRight();
  attachEventData(listItem, course);

  var divExp = createDivision([course.id + "exp", "list_event_expand"]);

  container.appendChild(listItem.container);
  container.appendChild(divExp);
  return 1;
}

// converts a match index from a courses
// object into a valid index into the
// matchesHistory object
function getMatchesHistoryIndex(matchIndex) {
  if (matchesHistory.hasOwnProperty(matchIndex)) {
    return matchIndex;
  }

  let newStyleMatchIndex = `${matchIndex}-${playerData.arenaId}`;
  if (matchesHistory.hasOwnProperty(newStyleMatchIndex)) {
    return newStyleMatchIndex;
  }

  // We couldn't find a matching index
  // data might be corrupt
  return undefined;
}

// Given a courses object returns all of the matches
function getCourseMatches(course) {
  let wlGate = course.ModuleInstanceData.WinLossGate;
  let matchesList = wlGate ? wlGate.ProcessedMatchIds : undefined;
  if (!matchesList) {
    return [];
  }

  let matches = matchesList
    .map(getMatchesHistoryIndex)
    .map(index => matchesHistory[index])
    .filter(match => match !== undefined && match.type === "match");
  return matches;
}

function attachEventData(listItem, course) {
  let deckName = getReadableEvent(course.InternalEventName);
  let deckNameDiv = createDivision(["list_deck_name"], deckName);
  listItem.leftTop.appendChild(deckNameDiv);

  course.CourseDeck.colors.forEach(color => {
    let m = createDivision(["mana_s20", `mana_${mana[color]}`]);
    listItem.leftBottom.appendChild(m);
  });

  var eventState = course.CurrentEventState;
  if (eventState == "DoneWithMatches" || eventState == 2) {
    listItem.rightTop.appendChild(
      createDivision(["list_event_phase"], "Completed")
    );
  } else {
    listItem.rightTop.appendChild(
      createDivision(["list_event_phase_red"], "In progress")
    );
  }

  var matches = getCourseMatches(course);
  var totalDuration = matches.reduce((acc, match) => acc + match.duration, 0);

  listItem.rightBottom.appendChild(
    createDivision(
      ["list_match_time"],
      timeSince(new Date(course.date)) + " ago - " + toMMSS(totalDuration)
    )
  );

  var wl = "0:0";
  var wlGate = course.ModuleInstanceData.WinLossGate;
  if (wlGate !== undefined) {
    wl = wlGate.CurrentWins + ":" + wlGate.CurrentLosses;
  }
  var winLossClass = getEventWinLossClass(wlGate);

  let resultDiv = createDivision(["list_match_result", winLossClass], wl);
  resultDiv.style.marginLeft = "8px";
  listItem.right.after(resultDiv);
}

function archiveEvent(id) {
  ipc_send("archive_course", id);
}

// Given the data of a match will return a data row to be
// inserted into one of the screens.

// DOM should be consistent across all screens. Use CSS to style the row and hide elements.
//
// Used by events.js and potentially other screens.
function createMatchRow(match) {
  //  if (match.opponent == undefined) continue;
  //  if (match.opponent.userid.indexOf("Familiar") !== -1) continue;
  match.playerDeck.mainDeck.sort(compare_cards);
  match.oppDeck.mainDeck.sort(compare_cards);

  // Create the DOM structure
  // rowContainer
  //   flexTopLeft
  //   flexLeft
  //     flexTop
  //     flexBottom
  //   flexCenter
  //     flexCenterTop
  //     flexCenterBottom
  //   flexRight

  var rowContainer = createDivision([match.id, "list_match"]);

  var flexTopLeft = createDivision(["flex_item"]);

  var flexLeft = createDivision(["flex_item"]);
  flexLeft.style.flexDirection = "column";

  var flexTop = createDivision(["flex_top"]);
  flexLeft.appendChild(flexTop);

  var flexBottom = createDivision(["flex_bottom"]);
  flexLeft.appendChild(flexBottom);

  var flexCenter = createDivision(["flex_item"]);
  flexCenter.style.flexDirection = "column";
  flexCenter.style.flexGrow = 2;

  var flexCenterTop = createDivision(["flex_top"]);
  flexCenter.appendChild(flexCenterTop);

  var flexCenterBottom = createDivision(["flex_bottom"]);
  flexCenterBottom.style.marginRight = "14px";
  flexCenter.appendChild(flexCenterBottom);

  var flexRight = createDivision(["flex_item"]);

  rowContainer.appendChild(flexTopLeft);
  rowContainer.appendChild(flexLeft);
  rowContainer.appendChild(flexCenter);
  rowContainer.appendChild(flexRight);

  // Insert contents of flexTopLeft

  var tileGrpid = match.playerDeck.deckTileId;
  try {
    cardsDb.get(tileGrpid).images["art_crop"];
  } catch (e) {
    tileGrpid = 67003;
  }

  var tile = createDivision([match.id + "t", "deck_tile"]);
  try {
    let backgroundFile = cardsDb.get(tileGrpid).images["art_crop"];
    tile.style.backgroundImage = `url(https://img.scryfall.com/cards${backgroundFile})`;
  } catch (e) {
    timeSince(new Date(match.date)) + " ago - " + toMMSS(match.duration);
    console.error(e);
  }
  flexTopLeft.appendChild(tile);

  // Insert contents of flexTop
  flexTop.appendChild(
    createDivision(["list_deck_name"], match.playerDeck.name)
  );

  // Insert contents of flexBottom
  match.playerDeck.colors.forEach(function(color) {
    var m = createDivision(["mana_s20", "mana_" + mana[color]]);
    flexBottom.appendChild(m);
  });

  // Insert contents of flexCenterTop
  if (match.opponent.name == null) {
    match.opponent.name = "-";
  }

  flexCenterTop.appendChild(
    createDivision(
      ["list_match_title"],
      "vs " + match.opponent.name.slice(0, -6)
    )
  );

  var or = createDivision(["ranks_16"]);
  or.style.backgroundPosition = `${get_rank_index_16(match.opponent.rank) *
    -16}px 0px`;
  or.title = match.opponent.rank + " " + match.opponent.tier;
  flexCenterTop.appendChild(or);

  // insert contents of flexCenterBottom
  flexCenterBottom.appendChild(
    createDivision(
      ["list_match_time"],
      timeSince(new Date(match.date)) + " ago - " + toMMSS(match.duration)
    )
  );

  get_deck_colors(match.oppDeck).forEach(function(color) {
    var m = createDivision(["mana_s20", "mana_" + mana[color]]);
    flexCenterBottom.appendChild(m);
  });

  // insert contents of flexRight

  var resultClass = "list_match_result";
  var winLossClass =  match.player.win > match.opponent.win ? "green" : "red";
  flexRight.appendChild(
    createDivision([resultClass, winLossClass], match.player.win + ":" + match.opponent.win)
  );

  return rowContainer;
}

// This code is executed when an event row is clicked and adds
// rows below the event for every match in that event.
function expandEvent(id) {
  let course = eventsHistory[id];
  let expandDiv = queryElementsByClass(id + "exp")[0];

  if (expandDiv.hasAttribute("style")) {
    expandDiv.removeAttribute("style");
    setTimeout(function() {
      expandDiv.innerHTML = "";
    }, 200);
    return;
  }

  var matchesList = course.ModuleInstanceData.WinLossGate.ProcessedMatchIds;
  expandDiv.innerHTML = "";

  if (!matchesList) {
    return;
  }

  var matchRows = matchesList
    .map(
      index =>
        matchesHistory[index] ||
        matchesHistory[index + "-" + playerData.arenaId]
    )
    .filter(match => match !== undefined && match.type === "match")
    .map(match => {
      let row = createMatchRow(match);
      expandDiv.appendChild(row);
      addHover(match, expandDiv);
      return row;
    });

  var newHeight = matchRows.length * 64 + 16;

  expandDiv.style.height = `${newHeight}px`;
}

module.exports = {
  openEventsTab: openEventsTab,
  expandEvent: expandEvent
};
