import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepWiseApp } from "@/components/stepwise-app";

describe("StepWise shell", () => {
  it("server-renders the action-first heading", () => {
    const html = renderToStaticMarkup(createElement(StepWiseApp));

    expect(html).toContain("<h1>Know what to do next.</h1>");
  });
});
