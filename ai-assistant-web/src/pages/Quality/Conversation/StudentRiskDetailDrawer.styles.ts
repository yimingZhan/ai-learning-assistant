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
  eventsTimeline: css`
    margin: 0;

    .ant-timeline-item:last-child {
      padding-bottom: 0;
    }

    &.ant-timeline.ant-timeline-layout-alternate .ant-timeline-item-header {
      flex: 0 0 104px !important;
      text-align: left !important;
    }

    .ant-timeline-item-title {
      text-align: left;
      white-space: nowrap;
    }

    &.ant-timeline.ant-timeline-layout-alternate .ant-timeline-item-content {
      flex: 1 1 auto !important;
      min-width: 0;
    }

    &.ant-timeline.ant-timeline-layout-alternate {
      .ant-timeline-item-icon,
      .ant-timeline-item-rail {
        left: 104px !important;
        right: auto !important;
      }
    }

    @media (max-width: 768px) {
      &.ant-timeline.ant-timeline-layout-alternate .ant-timeline-item-header {
        flex-basis: 88px !important;
      }

      &.ant-timeline.ant-timeline-layout-alternate {
        .ant-timeline-item-icon,
        .ant-timeline-item-rail {
          left: 88px !important;
        }
      }

      .ant-timeline-item-title {
        white-space: normal;
      }
    }
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
