import { createStyles } from "antd-style";

export const useGlobalToolbarStyles = createStyles(({ css, token }) => ({
  shell: css`
    display: flex;
    width: 100%;
    height: 100vh;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 767px) {
      height: calc(100dvh - 56px);
    }
  `,
  desktopToolbar: css`
    flex: 0 0 56px;

    @media (max-width: 767px) {
      display: none;
    }
  `,
  body: css`
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  `,
  content: css`
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;

    > * {
      height: 100%;
      min-height: 0;
    }
  `,
  assistantSidebar: css`
    width: clamp(360px, 28vw, 420px);
    min-width: 360px;
    min-height: 0;
    flex: none;
    background: ${token.colorBgContainer};
    border-left: 1px solid ${token.colorBorderSecondary};
    overflow: hidden;
  `,
  toolbar: css`
    position: relative;
    z-index: 20;
    display: flex;
    width: 100%;
    height: 56px;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    box-sizing: border-box;
    padding-inline: ${token.padding}px ${token.paddingSM}px;
    color: ${token.colorText};
    background: ${token.colorBgContainer};
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  mobileToolbar: css`
    padding-inline: ${token.paddingSM}px ${token.paddingXS}px;
    border-bottom: 0;
  `,
  mobileMenuButton: css`
    flex: none;
    font-size: ${token.fontSizeLG}px;
  `,
  location: css`
    min-width: 0;
    flex: 1;
    overflow: hidden;

    .ant-breadcrumb {
      min-width: 0;
      white-space: nowrap;
    }

    .ant-breadcrumb ol {
      min-width: 0;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    .ant-breadcrumb li:last-child {
      min-width: 0;
      overflow: hidden;
      color: ${token.colorText};
      font-weight: ${token.fontWeightStrong};
      text-overflow: ellipsis;
    }

    @media (max-width: 767px) {
      .ant-breadcrumb li:not(:last-child) {
        display: none;
      }
    }
  `,
  actions: css`
    display: flex;
    height: 100%;
    flex: none;
    align-items: center;
    gap: ${token.marginXXS}px;
  `,
  actionButton: css`
    height: 32px;
    padding-inline: ${token.paddingSM}px;
    color: ${token.colorTextSecondary};

    &:hover,
    &:focus-visible {
      color: ${token.colorText};
    }

    @media (max-width: 1199px) {
      width: 32px;
      padding-inline: 0;
    }
  `,
  activeAction: css`
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};

    &:hover,
    &:focus-visible {
      color: ${token.colorPrimaryHover} !important;
      background: ${token.colorPrimaryBgHover} !important;
    }
  `,
  actionLabel: css`
    @media (max-width: 1199px) {
      display: none;
    }
  `,
  helpAction: css`
    @media (max-width: 767px) {
      display: none;
    }
  `,
  userTrigger: css`
    display: flex;
    height: 40px;
    align-items: center;
    gap: ${token.marginXS}px;
    padding-inline: ${token.paddingXS}px;
    border-radius: ${token.borderRadius}px;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background: ${token.colorBgTextHover};
      outline: none;
    }
  `,
  userText: css`
    display: flex;
    max-width: 132px;
    min-width: 0;
    flex-direction: column;
    line-height: 18px;

    @media (max-width: 1199px) {
      display: none;
    }
  `,
  userName: css`
    overflow: hidden;
    color: ${token.colorText};
    font-size: ${token.fontSize}px;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  userRole: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  reminderPopover: css`
    width: min(380px, calc(100vw - 24px));
  `,
  reminderHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  reminderBody: css`
    max-height: 420px;
    overflow-y: auto;
  `,
  reminderFooter: css`
    display: flex;
    justify-content: center;
    padding: ${token.paddingXXS}px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  reminderItem: css`
    display: block;
    width: 100%;
    padding: ${token.paddingSM}px;
    color: inherit;
    text-align: start;
    background: transparent;
    border: 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    cursor: pointer;

    &:last-child {
      border-bottom: 0;
    }

    &:hover,
    &:focus-visible {
      background: ${token.colorBgTextHover};
      outline: none;
    }
  `,
  reminderTitle: css`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginXXS}px;
  `,
  reminderTitleText: css`
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: ${token.colorText};
    font-weight: ${token.fontWeightStrong};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  reminderDescription: css`
    display: -webkit-box;
    margin-bottom: ${token.marginXXS}px;
    overflow: hidden;
    color: ${token.colorTextSecondary};
    line-height: ${token.lineHeight};
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  `,
  reminderMeta: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  reminderState: css`
    padding: ${token.paddingLG}px ${token.paddingSM}px;
  `,
  helpContent: css`
    max-width: 560px;
    color: ${token.colorTextSecondary};
    line-height: ${token.lineHeightLG};
  `,
}));
