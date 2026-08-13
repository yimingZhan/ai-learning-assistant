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
  analysisDescriptions: css`
    .ant-descriptions-item-label {
      color: ${token.colorTextSecondary};
      white-space: nowrap;
    }

    .ant-descriptions-item-content {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    @media (max-width: 576px) {
      .ant-descriptions-item-label {
        white-space: normal;
      }
    }
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
  timelineEvent: css`
    min-width: 0;
  `,
  themeHeader: css`
    min-width: 0;
    padding-bottom: ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  eventDescriptions: css`
    .ant-descriptions-item-label,
    .ant-descriptions-item-content {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  `,
  summaryField: css`
    min-width: 0;
    margin-top: ${token.marginSM}px;
  `,
  summaryValue: css`
    margin-top: ${token.marginXS}px;
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  evidenceField: css`
    min-width: 0;
    margin-top: ${token.margin}px;
  `,
  evidenceList: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.margin}px;
  `,
  evidenceBlock: css`
    min-width: 0;

    .ant-card-body {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: ${token.marginSM}px;
    }
  `,
  evidenceDescription: css`
    .ant-descriptions-item-label,
    .ant-descriptions-item-content {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    @media (max-width: 576px) {
      .ant-descriptions-item-label {
        white-space: normal;
      }
    }
  `,
  evidenceExcerpt: css`
    margin-top: ${token.marginXS}px;
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  actionRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;

    .ant-btn {
      padding-inline: 0;
    }
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
}));
