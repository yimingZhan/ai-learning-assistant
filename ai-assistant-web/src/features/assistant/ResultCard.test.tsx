import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultCard } from "./ResultCard";

describe("ResultCard", () => {
  it("keeps evidence collapsed and renders only score essentials", () => {
    render(
      <ResultCard
        card={{
          kind: "score",
          conclusion: "整体有进步，但作业提交需要关注。",
          metrics: [
            { label: "数学模考", value: "78 → 86", note: "提升 8 分" },
          ],
        }}
        sources={[{ id: "score", label: "工作台 · 模考记录" }]}
      />,
    );

    expect(screen.getByText("整体有进步，但作业提交需要关注。")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /查看依据/ }).getAttribute(
        "aria-expanded",
      ),
    ).toBe("false");
  });

  it("allows editing and copying a parent reply draft", async () => {
    render(
      <ResultCard
        card={{ kind: "parentReply", draft: "您好，我们已经核对近期记录。" }}
      />,
    );

    const draft = screen.getByLabelText("回复草稿");
    fireEvent.change(draft, { target: { value: "您好，我们今天会继续跟进。" } });
    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "您好，我们今天会继续跟进。",
    );
    vi.clearAllMocks();
  });

  it("renders a minimal missing-data state", () => {
    render(
      <ResultCard
        card={{
          kind: "empty",
          message: "当前数据不足，请补充后再查询。",
          missing: ["模考、作业和出勤记录"],
        }}
      />,
    );

    expect(screen.getByText("数据不足")).toBeTruthy();
    expect(screen.getByText("缺少：模考、作业和出勤记录")).toBeTruthy();
  });
});
