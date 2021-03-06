import db from "../shared/database";
import Deck from "../shared/deck";
import { InternalDeck } from "../types/Deck";
import { Archetype } from "../types/Metadata";
import globalStore from "../shared/store";

function calculateDeviation(values: number[]): number {
  return Math.sqrt(values.reduce((a, b) => a + b) / (values.length - 1));
}

function getBestArchetype(deck: Deck): string {
  let bestMatch = "-";
  if (deck.getMainboard().get().length === 0) return bestMatch;

  // Calculate worst possible deviation for this deck
  let mainDeviations: number[] = [];

  deck
    .getMainboard()
    .get()
    .forEach((card) => {
      const deviation = card.quantity;
      mainDeviations.push(deviation * deviation);
    });
  let lowestDeviation = calculateDeviation(mainDeviations);
  const highest = lowestDeviation; //err..

  // Test for each archetype
  //debugLog("highest", highest);
  db.archetypes.forEach((arch: Archetype) => {
    //debugLog(arch.name);
    mainDeviations = [];
    deck
      .getMainboard()
      .get()
      .forEach((card) => {
        const cardData = db.card(card.id);
        if (!cardData) return;
        //let q = card.quantity;
        const name = cardData.name;
        const archMain = arch.average.mainDeck;
        const deviation = 1 - (archMain[name] ? 1 : 0); // archMain[name] ? archMain[name] : 0 // for full data
        mainDeviations.push(deviation * deviation);
        //debugLog(name, deviation, archMain[name]);
      });
    const finalDeviation = calculateDeviation(mainDeviations);

    if (finalDeviation < lowestDeviation) {
      lowestDeviation = finalDeviation;
      bestMatch = arch.name;
    }
    //debugLog(">>", finalDeviation, lowestDeviation, bestMatch);
  });

  if (lowestDeviation > highest * 0.5) {
    return "Unknown";
  }

  return bestMatch;
}

function getOpponentDeck(): InternalDeck {
  let oppCardsList: number[] = [...globalStore.currentMatch.opponent.cardsUsed];
  globalStore.currentMatch.matchGameStats.map((stats) => {
    oppCardsList = [...oppCardsList, ...stats.cardsSeen];
  });

  const _deck = new Deck(undefined, oppCardsList, []);
  _deck.getMainboard().removeDuplicates(true);
  _deck.colors;

  const format = db.events_format[globalStore.currentMatch.eventId];
  //currentMatch.opponent.deck.archetype = "-";
  const deckSave = _deck.getSave();

  let oppArchetype = getBestArchetype(_deck);
  if (
    (format !== "Standard" && format !== "Traditional Standard") ||
    oppArchetype == "Unknown"
  ) {
    if (globalStore.currentMatch.opponent.commanderGrpIds?.length) {
      const card = db.card(
        globalStore.currentMatch.opponent.commanderGrpIds[0]
      );
      oppArchetype = card ? card.name : "";
    } else {
      oppArchetype = _deck.colors.getColorArchetype();
    }
  }
  deckSave.archetype = oppArchetype;

  return deckSave;
}

export default getOpponentDeck;
