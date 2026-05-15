export const DISTRICTS = [
  "Altstadt Köpenick",
  "Dammvorstadt",
  "Spindlersfeld",
  "Friedrichshagen",
  "Müggelheim",
  "Wendenschloss",
  "Grünau",
  "Adlershof",
  "Köllnische Heide",
  "Rahnsdorf",
  "Schmöckwitz",
  "Bohnsdorf",
  "Niederschöneweide",
  "Oberschöneweide",
  "Johannisthal",
  "Altglienicke",
  "Treptow",
] as const;

export type District = (typeof DISTRICTS)[number];

// Keywords that map to districts — order matters (first match wins)
export const DISTRICT_KEYWORDS: [string, District][] = [
  ["altstadt", "Altstadt Köpenick"],
  ["alt-köpenick", "Altstadt Köpenick"],
  ["dammvorstadt", "Dammvorstadt"],
  ["spindlersfeld", "Spindlersfeld"],
  ["friedrichshagen", "Friedrichshagen"],
  ["müggelheim", "Müggelheim"],
  ["mueggelsee", "Müggelheim"],
  ["müggelsee", "Müggelheim"],
  ["wendenschloss", "Wendenschloss"],
  ["grünau", "Grünau"],
  ["adlershof", "Adlershof"],
  ["köllnische heide", "Köllnische Heide"],
  ["rahnsdorf", "Rahnsdorf"],
  ["schmöckwitz", "Schmöckwitz"],
  ["bohnsdorf", "Bohnsdorf"],
  ["niederschöneweide", "Niederschöneweide"],
  ["oberschöneweide", "Oberschöneweide"],
  ["johannisthal", "Johannisthal"],
  ["altglienicke", "Altglienicke"],
  ["treptow", "Treptow"],
];

/** Infer district from free text. Returns undefined if no match found. */
export function inferDistrict(text: string): District | undefined {
  const lc = text.toLocaleLowerCase("de-DE");
  return DISTRICT_KEYWORDS.find(([kw]) => lc.includes(kw))?.[1];
}
