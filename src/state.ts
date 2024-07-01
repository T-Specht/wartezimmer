export type BoxState = {
  box: string;
  abteilung: "zko" | "zpr";
  schritt: string;
  timestamp: Date;
  saal: "a1" | "a2" | "b2" | "b1";
};

export type SaalState = BoxState[];

export const SAAL_BOX = {
  a1: [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15],
  a2: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  b1: [18, 19, 20, 21, 22, 24, 25, 26, 27, 28],
  b2: [18, 19, 20, 21, 22, 24, 25, 26, 27],
};
