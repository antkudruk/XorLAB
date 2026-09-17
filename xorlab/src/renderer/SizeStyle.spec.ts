/*
    Copyright 2023 - Present Anton Kudruk
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { sizeStyleItemFactory } from "./SizeStyle";


describe("sizeStyleItemFactory", () => {
    describe("given a string with a number and a unit", () => {
        it("when the string is '10px'", () => {
            const sizeString = "10px";

            const result = sizeStyleItemFactory(sizeString);

            expect(result).toEqual({
                unit: "px",
                value: 10
            });
        });

        it("when the string is '10%'", () => {
            const sizeString = "10%";

            const result = sizeStyleItemFactory(sizeString);

            expect(result).toEqual({
                unit: "%",
                value: 10
            });
        });

        it("when the string is '10em'", () => {
            const sizeString = "10em";

            const result = sizeStyleItemFactory(sizeString);

            expect(result).toEqual({
                unit: "em",
                value: 10
            });
        });

        it("when the string is '10rem'", () => {
            const sizeString = "10rem";

            const result = sizeStyleItemFactory(sizeString);

            expect(result).toEqual({
                unit: "rem",
                value: 10
            });
        });

        it("when the string is 'rem'", () => {
            const result = sizeStyleItemFactory("rem");

            expect(result).toEqual({
                unit: "rem",
                value: 100
            });
        });

        it("when the string is '10flex'", () => {
            const sizeString = "10flex";

            const result = sizeStyleItemFactory(sizeString);

            expect(result).toEqual({
                unit: "flex",
                value: 10
            });
        });
    });
});
