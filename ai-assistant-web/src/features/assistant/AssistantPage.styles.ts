import { createStyles } from "antd-style";

export const useAssistantPageStyles = createStyles(({ css, token }) => ({
  root: css`
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  chatHeader: css`
    display: flex;
    height: 52px;
    flex: 0 0 52px;
    align-items: center;
    justify-content: space-between;
    padding-inline: ${token.padding}px ${token.paddingXS}px;
    border-bottom: 1px solid ${token.colorBorder};
    box-sizing: border-box;
  `,
  headerTitle: css`
    font-weight: ${token.fontWeightStrong};
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
  chatBody: css`
    min-width: 0;
    min-height: 0;
    flex: 1;
    padding: ${token.padding}px;
    overflow-y: auto;

    @media (max-width: 767px) {
      padding: ${token.paddingSM}px;
    }
  `,
  content: css`
    width: 100%;
    max-width: 940px;
    margin-inline: auto;
  `,
  emptyState: css`
    display: flex;
    flex-direction: column;
    gap: ${token.margin}px;
  `,
  chatWelcome: css`
    padding: ${token.paddingSM}px ${token.padding}px;
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgTextHover};
  `,
  messageList: css`
    width: 100%;
  `,
  chatSend: css`
    flex: none;
    padding: ${token.padding}px;
    border-top: 1px solid ${token.colorBorderSecondary};

    @media (max-width: 767px) {
      padding: ${token.paddingSM}px;
    }
  `,
  quickActions: css`
    margin-bottom: ${token.marginSM}px;
  `,
  alert: css`
    margin-bottom: ${token.marginXS}px;
  `,
}));
