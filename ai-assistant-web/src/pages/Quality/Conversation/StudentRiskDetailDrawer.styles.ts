import { createStyles } from "antd-style";

export const useStudentRiskDetailStyles = createStyles(({ css, token }) => ({
  drawerBody: css`
    min-width: 0;
    padding: ${token.padding}px;

    @media (max-width: 768px) {
      padding: ${token.paddingSM}px;
    }
  `,
  content: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.margin}px;
  `,
  eventsBody: css`
    min-width: 0;
  `,
  statusFilter: css`
    width: 120px;
  `,
  overviewBody: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.margin}px;
  `,
  overviewRow: css`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: ${token.margin}px;

    > .ant-typography:first-child {
      flex: 0 0 auto;
      color: ${token.colorTextSecondary};
    }
  `,
  eventsTimeline: css`
    margin: 0;

    .ant-timeline-item:last-child {
      padding-bottom: 0;
    }

    .ant-timeline-item-content {
      min-width: 0;
    }

    .ant-timeline-item-title {
      white-space: nowrap;
    }
  `,
  timelineDate: css`
    color: ${token.colorTextHeading};
    font-size: ${token.fontSizeLG}px;
    font-weight: ${token.fontWeightStrong};
    line-height: ${token.lineHeightLG};
    letter-spacing: 0.2px;
    font-variant-numeric: tabular-nums;
  `,
  timelineEventList: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.margin}px;
  `,
  riskTypeCard: css`
    min-width: 0;

    > .ant-card-body {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: ${token.margin}px;
    }
  `,
  riskTypeHeader: css`
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: ${token.margin}px;
    padding-bottom: ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  riskTypeValue: css`
    min-width: 0;
    color: ${token.colorTextHeading};
    font-size: ${token.fontSizeLG}px;
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  riskSummary: css`
    min-width: 0;
  `,
  riskMetaRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginLG}px;
  `,
  riskMetaItem: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  riskMetaValue: css`
    min-width: 0;
  `,
  riskKeywordRow: css`
    display: flex;
    min-width: 0;
    align-items: flex-start;
    gap: ${token.marginXS}px;

    > .ant-typography {
      flex: 0 0 auto;
    }

    > .ant-space {
      min-width: 0;
    }
  `,
  eventActions: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    padding-top: ${token.paddingXS}px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  riskSummaryText: css`
    margin: ${token.marginXS}px 0 0 !important;
    color: ${token.colorText};
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  evidenceCollapse: css`
    min-width: 0;
    background: ${token.colorBgContainer};

    > .ant-collapse-item > .ant-collapse-header {
      align-items: center;
    }

    .ant-collapse-content-box {
      padding: ${token.padding}px !important;
      background: ${token.colorFillQuaternary};
    }
  `,
  evidenceCollapseLabel: css`
    min-width: 0;

    .ant-tag {
      margin-inline-end: 0;
      color: ${token.colorTextSecondary};
    }
  `,
  evidenceList: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  evidenceBlock: css`
    min-width: 0;
    border-color: ${token.colorBorderSecondary};

    > .ant-card-body {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: ${token.marginSM}px;
    }
  `,
  evidenceSummary: css`
    min-width: 0;
    padding: ${token.paddingSM}px ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
  `,
  evidenceSummaryText: css`
    margin: ${token.marginXS}px 0 0 !important;
    color: ${token.colorText};
    font-size: ${token.fontSize}px;
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  keyQuotes: css`
    min-width: 0;
    padding: ${token.paddingSM}px ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
  `,
  keyQuoteList: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    margin: ${token.marginXS}px 0 0;
    padding: 0;
    list-style: none;
  `,
  keyQuoteItem: css`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: ${token.marginXS}px;
  `,
  keyQuoteTime: css`
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
  `,
  keyQuoteContent: css`
    min-width: 0;
    color: ${token.colorText};
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  evidenceMeta: css`
    min-width: 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;

    .ant-divider-vertical {
      margin-inline: 0;
    }

    @media (max-width: 576px) {
      align-items: flex-start;

      .ant-divider-vertical {
        display: none;
      }

      > * {
        flex-basis: 100%;
      }
    }
  `,
  actionRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;

    .ant-btn {
      padding-inline: 0;
    }
  `,
  emptyEvidence: css`
    padding: ${token.paddingSM}px ${token.padding}px;
    border: 1px dashed ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillQuaternary};
  `,
  nestedDrawerBody: css`
    padding: ${token.paddingLG}px;

    @media (max-width: 576px) {
      padding: ${token.padding}px;
    }
  `,
  chatList: css`
    .ant-list-item {
      align-items: flex-start;
    }

    .ant-list-item-meta-description {
      color: ${token.colorText};
      line-height: ${token.lineHeightLG};
    }
  `,
  chatTitle: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginXS}px;
  `,
  transcript: css`
    margin-top: ${token.marginLG}px;
    line-height: ${token.lineHeightLG};
    white-space: pre-line;
    overflow-wrap: anywhere;
  `,
  learningDetails: css`
    .ant-descriptions-item-label {
      width: 140px;
      color: ${token.colorTextSecondary};
    }

    .ant-descriptions-item-content {
      overflow-wrap: anywhere;
    }

    @media (max-width: 576px) {
      .ant-descriptions-item-label {
        width: 112px;
      }
    }
  `,
}));
