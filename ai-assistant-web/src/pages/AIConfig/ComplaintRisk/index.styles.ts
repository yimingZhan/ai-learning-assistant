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
  statusCard: css`
    .ant-card-body {
      padding-block: ${token.paddingSM}px;
    }
  `,
  variableList: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  promptCard: css`
    .ant-card-head {
      min-height: 44px;
    }

    .ant-form-item {
      margin-bottom: 0;
    }
  `,
  ruleDescription: css`
    max-width: 360px;
  `,
  fullWidth: css`
    width: 100%;
  `,
  sectionStack: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
}));
