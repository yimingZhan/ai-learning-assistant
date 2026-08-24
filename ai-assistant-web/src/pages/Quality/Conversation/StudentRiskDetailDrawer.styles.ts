import { createStyles } from "antd-style";

export const useStudentRiskDetailStyles = createStyles(({ css, token }) => ({
  drawerBody: css`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: ${token.padding}px;
    overflow-x: hidden;

    @media (max-width: 768px) {
      padding: ${token.paddingSM}px;
    }
  `,
  content: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  summarySection: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.margin}px;
    padding-bottom: ${token.paddingLG}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  summaryHeader: css`
    min-width: 0;
  `,
  studentIdentity: css`
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: ${token.marginSM}px;
  `,
  studentName: css`
    color: ${token.colorTextHeading};
    font-size: ${token.fontSizeHeading4}px;
    line-height: ${token.lineHeightHeading4};
  `,
  studentNumber: css`
    font-variant-numeric: tabular-nums;
  `,
  overallRiskTag: css`
    margin-inline-end: 0;
  `,
  summaryDescriptions: css`
    min-width: 0;

    .ant-descriptions-view table {
      width: 100%;
      table-layout: fixed;
    }

    .ant-descriptions-item-label {
      color: ${token.colorTextSecondary};
      white-space: nowrap;
    }

    .ant-descriptions-item-content {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  `,
  riskStats: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillQuaternary};
  `,
  riskStatRow: css`
    display: flex;
    min-width: 0;
    align-items: flex-start;
    gap: ${token.margin}px;

    .ant-tag {
      margin-inline-end: 0;
    }

    @media (max-width: 576px) {
      flex-direction: column;
      gap: ${token.marginXS}px;
    }
  `,
  riskStatLabel: css`
    flex: 0 0 56px;

    @media (max-width: 576px) {
      flex-basis: auto;
    }
  `,
  eventsSection: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.margin}px;
  `,
  eventsHeader: css`
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: ${token.margin}px;
  `,
  statusFilter: css`
    width: 120px;
  `,
  riskTable: css`
    width: 100%;
    max-width: 100%;
    min-width: 0;

    .ant-table-wrapper,
    .ant-spin-nested-loading,
    .ant-spin-container,
    .ant-table,
    .ant-table-container {
      max-width: 100%;
      min-width: 0;
    }

    .ant-table-content {
      overflow-x: auto !important;
      overscroll-behavior-inline: contain;
    }

    .ant-table-cell {
      vertical-align: top;
    }

    .ant-table-cell .ant-tag {
      margin-inline-end: 0;
      white-space: nowrap;
    }

    .ant-pagination {
      margin-bottom: 0;
    }
  `,
  tableDate: css`
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  `,
  tableSummary: css`
    min-width: 0;
    margin-bottom: 0 !important;
    color: ${token.colorText};
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  tableKeywords: css`
    display: flex;
    max-height: 48px;
    min-width: 0;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
    overflow: hidden;

    .ant-tag {
      max-width: 100%;
      margin-inline-end: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
  evidenceNumber: css`
    font-variant-numeric: tabular-nums;
  `,
  tableOperations: css`
    white-space: nowrap;

    .ant-btn-link {
      padding-inline: ${token.paddingXS}px;
    }
  `,
  eventDrawerBody: css`
    min-width: 0;
    padding: ${token.paddingLG}px;

    @media (max-width: 576px) {
      padding: ${token.padding}px;
    }
  `,
  eventDetails: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  eventDescriptions: css`
    min-width: 0;

    .ant-descriptions-view table {
      width: 100%;
      table-layout: fixed;
    }

    .ant-descriptions-item-label {
      color: ${token.colorTextSecondary};
      white-space: nowrap;
    }

    .ant-descriptions-item-content {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .ant-tag {
      margin-inline-end: 0;
    }
  `,
  detailSection: css`
    min-width: 0;
  `,
  detailRow: css`
    display: flex;
    min-width: 0;
    align-items: flex-start;
    gap: ${token.margin}px;

    .ant-tag {
      margin-inline-end: 0;
    }

    @media (max-width: 576px) {
      flex-direction: column;
      gap: ${token.marginXS}px;
    }
  `,
  detailLabel: css`
    flex: 0 0 auto;
  `,
  detailContent: css`
    min-width: 0;
  `,
  detailParagraph: css`
    margin: ${token.marginXS}px 0 0 !important;
    color: ${token.colorText};
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  auditDescriptions: css`
    min-width: 0;
    padding: ${token.paddingSM}px ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillQuaternary};

    .ant-descriptions-item-label {
      color: ${token.colorTextSecondary};
    }
  `,
  evidenceHeading: css`
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: ${token.marginXS}px;
    padding-top: ${token.paddingXS}px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  evidenceList: css`
    min-width: 0;

    .ant-list-items {
      min-width: 0;
    }
  `,
  evidenceItem: css`
    min-width: 0;
    padding: ${token.padding}px 0 !important;
    align-items: stretch !important;
  `,
  evidenceItemBody: css`
    display: flex;
    width: 100%;
    min-width: 0;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  evidenceItemHeader: css`
    min-width: 0;

    .ant-btn {
      flex: 0 0 auto;
      padding-inline: 0;
    }
  `,
  evidenceItemTitle: css`
    min-width: 0;

    .ant-tag {
      margin-inline-end: 0;
    }
  `,
  keyQuotes: css`
    min-width: 0;
    padding: ${token.paddingSM}px ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillQuaternary};
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
    min-width: 0;
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
    font-size: ${token.fontSizeSM}px;

    @media (max-width: 576px) {
      align-items: flex-start;

      > * {
        flex-basis: 100%;
      }
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
}));
