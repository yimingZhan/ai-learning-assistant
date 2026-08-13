import { createStyles } from "antd-style";

export const useCompactAssistantPanelStyles = createStyles(
  ({ css, token }) => ({
    root: css`
      display: flex;
      height: 100%;
      min-height: 0;
      flex-direction: column;
      background: ${token.colorBgContainer};
      overflow: hidden;
    `,
    header: css`
      display: flex;
      height: 52px;
      flex: 0 0 52px;
      align-items: center;
      justify-content: space-between;
      padding-inline: ${token.padding}px ${token.paddingXS}px;
      border-bottom: 1px solid ${token.colorBorderSecondary};
      box-sizing: border-box;
    `,
    title: css`
      flex: none;
      font-weight: ${token.fontWeightStrong};
    `,
    context: css`
      display: block;
      width: 100%;
      margin-bottom: ${token.marginXS}px;
      overflow: hidden;
      font-size: ${token.fontSizeSM}px;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    headerButton: css`
      font-size: ${token.fontSizeLG}px;
    `,
    conversations: css`
      width: min(300px, calc(100vw - 48px));
      max-height: 480px;
      overflow-y: auto;

      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    messageArea: css`
      min-height: 0;
      flex: 1;
      padding: ${token.padding}px;
      overflow-y: auto;
    `,
    emptyState: css`
      display: flex;
      flex-direction: column;
      gap: ${token.margin}px;
    `,
    prompts: css`
      display: flex;
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: ${token.marginXS}px;
    `,
    promptButton: css`
      width: auto;
      max-width: 100%;
      height: auto;
      min-height: ${token.controlHeight}px;
      padding-block: ${token.paddingXS}px;
      text-align: start;
      white-space: normal;
    `,
    messageList: css`
      width: 100%;
    `,
    senderArea: css`
      flex: none;
      padding: ${token.paddingSM}px;
      border-top: 1px solid ${token.colorBorderSecondary};

      .ant-alert {
        margin-bottom: ${token.marginXS}px;
      }
    `,
  }),
);
