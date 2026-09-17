import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders timetable widget host", () => {
  render(<App />);
  expect(
    screen.getByRole("region", { name: /timetable layout/i })
  ).toBeInTheDocument();
});
