import { DbCardData } from "../../types/Metadata";

import notFound from "../../assets/images/notfound.png";
import database from "../database";
import debugLog from "../debugLog";

export function getCardImage(
  card: DbCardData | number | undefined,
  quality: string
): string {
  if (card === undefined) {
    return notFound;
  }
  const cardObj =
    typeof card == "string"
      ? database.card(parseInt(card))
      : typeof card == "number"
      ? database.card(card)
      : card;
  try {
    const url = cardObj?.images[quality];
    if (url === undefined || url === "") throw "Undefined url";
    return "https://img.scryfall.com/cards" + cardObj?.images[quality];
  } catch (e) {
    // eslint-disable-next-line no-console
    // debugLog(e, "error");
    debugLog(`Cant find card image: ${cardObj}, ${typeof cardObj}`, "info");
    return notFound;
  }
}

export function getCardArtCrop(card?: DbCardData | number): string {
  return getCardImage(card, "art_crop");
}
