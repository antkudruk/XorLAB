import { describe, expect, it } from "vitest";
import { parseElementsCsv } from "./loadElementsCsv";

describe("parseElementsCsv", () => {
  it("parses quoted CSV cells and numeric fields", () => {
    const csv = `atomicNumber,symbol,name,period,group,block,series,seriesOrder,category,phase,atomicMass,electronegativity,density,meltingPointK,boilingPointK,electronConfiguration,discoveredBy,year
25,Mn,Manganese,4,7,d,,,Transition Metal,solid,54.938,1.55,7.44E+00,1519.15,2334,,"Gahn, Scheele",1774`;

    const [element] = parseElementsCsv(csv);

    expect(element.atomicNumber).toBe(25);
    expect(element.group).toBe(7);
    expect(element.atomicMass).toBeCloseTo(54.938);
    expect(element.discoveredBy).toBe("Gahn, Scheele");
  });
});
