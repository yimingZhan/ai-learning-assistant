import { createStyles } from "antd-style";

export const useConversationStyles = createStyles(({ css, token }) => ({
  pageContainer: css`
    height: 100%;
    min-height: 0;

    > .ant-pro-grid-content,
    > .ant-pro-grid-content > .ant-pro-grid-content-children,
    > .ant-pro-grid-content
      > .ant-pro-grid-content-children
      > .ant-pro-page-container-children-container {
      height: 100%;
      min-height: 0;
    }
  `,
  page: css`
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: ${token.colorBgLayout};
    overflow: hidden;
  `,
  top: css`
    flex: none;
    padding: ${token.paddingSM}px;
    padding-bottom: 0;
  `,
  topCard: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  workspace: css`
    width: 100%;
    flex: 1;
    min-height: 0;
    padding: ${token.paddingSM}px;
    box-sizing: border-box;
    background: ${token.colorBgLayout};
    overflow: hidden;
  `,
  splitter: css`
    width: 100%;
    height: 100%;
    gap: ${token.paddingSM}px;
  `,
  panelCard: css`
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    overflow: hidden;

    > .ant-card-body {
      width: 100%;
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
  `,
  panel: css`
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  panelHeader: css`
    display: flex;
    height: 52px;
    flex: 0 0 52px;
    align-items: center;
    justify-content: space-between;
    padding-inline: ${token.padding}px ${token.paddingXS}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    box-sizing: border-box;
  `,
  panelScroll: css`
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  `,
  emptyPanel: css`
    width: 100%;
    height: 100%;
  `,
  coreRiskList: css`
    max-height: ${token.controlHeightSM * 2}px;
    overflow: hidden;
    cursor: help;
  `,
  coreRiskItem: css`
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: ${token.marginXS}px;
    height: ${token.controlHeightSM}px;
    line-height: ${token.controlHeightSM}px;
    white-space: nowrap;
  `,
  coreRiskDate: css`
    flex: none;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-variant-numeric: tabular-nums;
  `,
  coreRiskSummary: css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  coreRiskTooltip: css`
    display: flex;
    max-width: 560px;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  coreRiskTooltipItem: css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: ${token.marginXS}px;
    line-height: ${token.lineHeightLG};
  `,
  coreRiskTooltipDate: css`
    opacity: 0.72;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  `,
  relatedPeopleList: css`
    max-height: ${token.controlHeightSM * 2}px;
    overflow: hidden;
    cursor: help;
  `,
  relatedPersonItem: css`
    height: ${token.controlHeightSM}px;
    overflow: hidden;
    line-height: ${token.controlHeightSM}px;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  relatedPeopleTooltip: css`
    display: flex;
    max-width: 360px;
    flex-direction: column;
    gap: ${token.marginXS}px;
    line-height: ${token.lineHeightLG};
  `,
}));
