/*
global
    setsList,
    cardsDb,
    makeId,
    ConicGradient,
    daysPast,
    timeSince,
    toMMSS,
    toHHMM,
    selectAdd,
    addCardHover,
    get_set_scryfall,
    get_colation_set,
    getEventId,
    addCardSeparator,
    addCardTile,
    getReadableEvent,
    get_collection_export,
    get_collection_stats,
    get_deck_colors,
    get_deck_types_ammount,
    get_deck_curve,
    get_deck_colors_ammount,
    get_deck_lands_ammount,
    get_deck_missing,
    get_deck_export,
    get_deck_export_txt,
    get_rank_index_16,
    get_rank_index,
    draftRanks
    get_card_type_sort,
    collectionSortSet,
    collectionSortName,
    collectionSortCmc,
    collectionSortRarity,
    compare_colors,
    compare_cards,
    timestamp
*/

// We need to store a sorted list of card types so we create the card counts in the same order.
var orderedCardTypes = ['cre','lan','ins','sor','enc','art','pla'];
var orderedCardRarities = ['common', 'uncommon', 'rare', 'mythic'];
var orderedColorCodes = ['w', 'u', 'b', 'r', 'g', 'c'];
var orderedManaColors = ['#E7CA8E', '#AABEDF','#A18E87','#DD8263','#B7C89E','#E3E3E3'];

function deckColorBar(deck) {
    let deckColors = $('<div class="deck_top_colors" style="align-self: center;"></div>');
    deck.colors.forEach(color => {
        deckColors.append($(`<div class="mana_s20 mana_${mana[color]}"></div>`));
    });
    return deckColors;
}

function deckManaCurve(deck) {
    let manaCounts = get_deck_curve(deck);
    let curveMax = Math.max(...manaCounts);

    let curve = $('<div class="mana_curve"></div>');
    let numbers = $('<div class="mana_curve_numbers"></div>');
    manaCounts.forEach((count, i) => {
        curve.append($(`<div class="mana_curve_column" style="height: ${manaCounts[i]/curveMax*100}%"></div>`))
        numbers.append($(`<div class="mana_curve_column_number"><div style="margin: 0 auto !important" class="mana_s16 mana_${i}"></div></div>`))
    })

    let container = $('<div>').append(curve, numbers);
    return container;
}

function colorPieChart(colorCounts, title) {
    /*
    used for land / card pie charts.
    colorCounts should be object with values for each of the color codes wubrgc and total.
    */
    console.log('making colorPieChart', colorCounts, title);

    var stops = [];
    var start = 0;
    orderedColorCodes.forEach((colorCode, i) => {
        let currentColor = orderedManaColors[i];
        var stop = start + (colorCounts[colorCode] || 0) / colorCounts.total * 100;
        stops.push(`${currentColor} 0 ${stop}%`);
        // console.log('\t', start, stop, currentColor);
        start = stop;
    });
    let gradient = new ConicGradient({
        stops: stops.join(', '),
        size: 400
        // Default size: Math.max(innerWidth, innerHeight)
    });
    let chart = $(`<div class="pie_container"><span>${title}</span><svg class="pie">${gradient.svg}</svg></div>`);
    return chart;
}

function deckWinrateCurve(deck) {

    // getDeckWinrate returns
    // {total: winrate, wins: wins, losses: loss, lastEdit: winrateLastEdit, colors: colorsWinrates};
    // or 0 if there is no data

    let deckWinrates = getDeckWinrate(deck.id, deck.lastUpdated);
    if (!deckWinrates) {
        console.log('no deck winrate data');
        return;
    }

    let colorsWinrates = deckWinrates.colors

    //$('<span>w/l vs Color combinations</span>').appendTo(stats);
    let curveMax = Math.max(...colorsWinrates.map(cwr=>Math.max(cwr.wins, cwr.losses)));
    console.log('curveMax', curveMax);

    let curve = $('<div class="mana_curve"></div>');
    let numbers = $('<div class="mana_curve_costs"></div>');

    colorsWinrates.forEach(cwr => {
        if (cwr.wins + cwr.losses > 2) {
            curve.append($(`<div class="mana_curve_column back_green" style="height: ${(cwr.wins/curveMax*100)}%"></div>`));
            curve.append($(`<div class="mana_curve_column back_red" style="height: ${(cwr.losses/curveMax*100)}%"></div>`));

            let curveNumber = $(`<div class="mana_curve_column_number">
                ${cwr.wins}/${cwr.losses}
                <div style="margin: 0 auto !important" class=""></div>
            </div>`);

            let colors = cwr.colors;
            colors.forEach(function(color) {
                curveNumber.append($(`<div style="margin: 0 auto !important" class="mana_s16 mana_${mana[color]}"></div>`));
            })
            numbers.append(curveNumber);
        }
    });
    let container = $('<div>').append(curve, numbers);
    return container;
}

function deckStatsSection(deck, deck_type) {
    let stats = $('<div class="stats"></div>');

    $('<div class="button_simple visualView">Visual View</div>').appendTo(stats);
    $('<div class="button_simple openHistory">History of changes</div>').appendTo(stats);
    $('<div class="button_simple exportDeck">Export to Arena</div>').appendTo(stats);
    $('<div class="button_simple exportDeckStandard">Export to .txt</div>').appendTo(stats);

    let cardTypes = get_deck_types_ammount(deck);
    let typesContainer = $('<div class="types_container"></div>');
    orderedCardTypes.forEach(cardTypeKey => {
        $(`<div class="type_icon_cont">
            <div title="Creatures" class="type_icon type_${cardTypeKey}"></div>
            <span>${cardTypes[cardTypeKey]}</span>
        </div>`)
        .appendTo(typesContainer);
    });
    typesContainer.appendTo(stats);


    // Mana Curve
    deckManaCurve(deck).appendTo(stats);

    //let missing = get_deck_missing(deck);
    let pieContainer = $('<div class="pie_container_outer"></div>');
    pieContainer.appendTo(stats);

    // Deck colors
    let colorCounts = get_deck_colors_ammount(deck);
    pieChart = colorPieChart(colorCounts, 'Mana Symbols');
    pieChart.appendTo(pieContainer);

    // Lands colors
    let landCounts = get_deck_lands_ammount(deck);
    pieChart = colorPieChart(landCounts, 'Mana Sources');
    pieChart.appendTo(pieContainer);


    if (deck_type == 0 || deck_type == 2) {
        let winrateCurveSection = deckWinrateCurve(deck);
        if (winrateCurveSection) {
            winrateCurveSection.appendTo(stats);
        }
    } else {
        console.log('skipping winrate curve. deck_type is', deck_type);
    }

    // Deck crafting cost section
    let missingWildcards = get_deck_missing(deck);
    let costSection = $('<div class="wildcards_cost"><span>Wildcards Needed</span></div>');
    orderedCardRarities.forEach(cardRarity => {
        $(`<div title="${cardRarity}" class="wc_cost wc_${cardRarity}">
            ${missingWildcards[cardRarity]}</div>`)
            .appendTo(costSection);
    });
    costSection.appendTo(stats);

    return stats;
}

function openDeck(deck, deck_type) {
    /*
        deck_type is either 1 or 2.
        1 = event deck
        2 = normal deck
    */

    // #ux_1 is right side, #ux_0 is left side
    let container = $("#ux_1");
    container.empty();

    let top = $(`<div class="decklist_top"><div class="button back"></div><div class="deck_name">${deck.name}</div></div>`);

    deckColorBar(deck)
        .appendTo(top);

    let tileGrpId = deck.deckTileId;
    if (cardsDb.get(tileGrpId)) {
        change_background("", tileGrpId);
    }

    let deckListSection = $('<div class="decklist"></div>');
    drawDeck(deckListSection, deck);

    let statsSection = deckStatsSection(deck, deck_type);

    let fld = $('<div class="flex_item"></div>');
    deckListSection.appendTo(fld);
    statsSection.appendTo(fld);
    container.append(top);
    container.append(fld);

    // Attach event handlers
    $(".visualView").click(e => drawDeckVisual(deckListSection, statsSection, deck));

    $(".openHistory").click(e => ipc_send('get_deck_changes', deck.id));

    $(".exportDeck").click(e => {
        let list = get_deck_export(deck);
        ipc_send('set_clipboard', list);
    });

    $(".exportDeckStandard").click(e => {
        let list = get_deck_export_txt(deck);
        ipc_send('export_txt', {str: list, name: deck.name});
    });

    $(".back").click(e => {
        change_background("default");
        $('.moving_ux').animate({'left': '0px'}, 250, 'easeInOutCubic'); 
    });
}

module.exports = {
    open_deck: openDeck
}