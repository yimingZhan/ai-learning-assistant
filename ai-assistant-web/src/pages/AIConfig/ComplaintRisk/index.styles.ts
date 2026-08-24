import { createStyles } from "antd-style";

export const useComplaintRiskConfigStyles = createStyles(({ css, token }) => ({
  page: css`
    height: 100%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;

    .ant-pro-page-container-children-container {
      padding-block-end: ${token.paddingLG}px;
    }
  `,
  content: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  loadingState: css`
    min-height: 360px;
  `,
  tabContent: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
    min-width: 0;
  `,
  promptCard: css`
    .ant-typography {
      margin-bottom: ${token.marginSM}px;
    }
  `,
  referenceList: css`
    margin: 0;
    padding-inline-start: ${token.paddingLG}px;

    li + li {
      margin-top: ${token.marginXXS}px;
    }
  `,
  actionGroup: css`
    white-space: nowrap;

    .ant-btn {
      padding-inline: ${token.paddingXS}px;
    }
  `,
  versionSnapshot: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
    padding: ${token.paddingMD}px;
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  versionSnapshotList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  versionSnapshotItem: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
    padding: ${token.paddingSM}px ${token.paddingMD}px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  versionSnapshotType: css`
    font-weight: ${token.fontWeightStrong};
  `,
  versionSnapshotGroup: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  versionSnapshotLabel: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  versionSnapshotExamples: css`
    margin: 0;
    padding-inline-start: ${token.paddingLG}px;

    li + li {
      margin-top: ${token.marginXXS}px;
    }
  `,
  examplesTitle: css`
    margin-bottom: ${token.marginXXS}px !important;
  `,
  examplesStack: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  exampleRow: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    column-gap: ${token.marginSM}px;
    min-width: 0;
  `,
  exampleInput: css`
    min-width: 0;
    width: 100%;
    margin-bottom: 0;
    padding-block-end: ${token.marginSM}px;

    .ant-form-item-control-input,
    .ant-form-item-control-input-content,
    .ant-input-textarea {
      min-width: 0;
      width: 100%;
    }
  `,
  exampleActions: css`
    flex: none;
    white-space: nowrap;

    .ant-btn {
      width: 32px;
      min-width: 32px;
      padding-inline: 0;
    }
  `,
}));
