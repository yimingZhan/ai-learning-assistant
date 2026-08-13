import { createStyles } from "antd-style";

export const usePlatformAssistantConfigStyles = createStyles(
  ({ css, token }) => ({
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
    sectionStack: css`
      display: flex;
      flex-direction: column;
      gap: ${token.marginMD}px;
    `,
    fullWidth: css`
      width: 100%;
    `,
    capabilityDescription: css`
      max-width: 360px;
    `,
    roleCell: css`
      min-width: 104px;
    `,
    promptCard: css`
      .ant-form-item:last-child {
        margin-bottom: 0;
      }
    `,
    trialResult: css`
      margin-top: ${token.marginMD}px;
    `,
  }),
);
