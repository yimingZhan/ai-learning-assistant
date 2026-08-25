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
    flex-wrap: wrap;
    align-items: flex-start;
    gap: ${token.marginSM}px ${token.marginXL}px;
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
  batchToolbar: css`
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px ${token.padding}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillQuaternary};

    .ant-btn {
      margin: 0;
    }

    @media (max-width: 576px) {
      align-items: flex-start;

      > .ant-space {
        width: 100%;
      }
    }
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
  `,
  eventDetailSection: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: ${token.margin}px;
    margin-bottom: ${token.marginLG}px;
    padding-bottom: ${token.paddingLG}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: 0;
    }
  `,
  eventSectionTitle: css`
    color: ${token.colorTextHeading};
    font-size: ${token.fontSizeLG}px;
    line-height: ${token.lineHeightLG};
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
  summaryFields: css`
    display: grid;
    min-width: 0;
    gap: ${token.margin}px;
  `,
  detailField: css`
    min-width: 0;
  `,
  detailLabel: css`
    display: block;
  `,
  detailParagraph: css`
    margin: ${token.marginXS}px 0 0 !important;
    color: ${token.colorText};
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  evidenceSection: css`
    gap: 0;
  `,
  evidenceList: css`
    min-width: 0;

    .ant-list-items {
      min-width: 0;
    }

    .ant-list-item:first-child {
      padding-top: ${token.padding}px !important;
    }

    .ant-list-item:last-child {
      padding-bottom: 0 !important;
      border-block-end: 0;
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
  evidenceFieldLabel: css`
    display: block;
    font-size: ${token.fontSizeSM}px;
  `,
  keyQuoteHeader: css`
    min-width: 0;

    .ant-btn {
      flex: 0 0 auto;
      height: auto;
      padding: 0;
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
    gap: 0;
  `,
  keyQuoteContent: css`
    min-width: 0;
    color: ${token.colorText};
    line-height: ${token.lineHeightLG};
    overflow-wrap: anywhere;
  `,
  keyQuoteMeta: css`
    flex: 0 0 auto;
    font-size: ${token.fontSizeSM}px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  `,
  evidenceDescriptions: css`
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
  originalDrawerBody: css`
    min-width: 0;
    padding: ${token.paddingLG}px;

    @media (max-width: 576px) {
      padding: ${token.padding}px;
    }
  `,
  originalChatList: css`
    min-width: 0;

    .ant-list-item {
      align-items: flex-start;
    }

    .ant-list-item-meta-description {
      color: ${token.colorText};
      line-height: ${token.lineHeightLG};
      overflow-wrap: anywhere;
    }
  `,
  originalChatTitle: css`
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginXS}px;

    .ant-tag {
      margin-inline-end: 0;
    }
  `,
}));
