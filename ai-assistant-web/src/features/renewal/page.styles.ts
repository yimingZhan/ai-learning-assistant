import { createStyles } from "antd-style";

export const useRenewalPageStyles = createStyles(({ css, token }) => ({
  scrollPage: css`
    height: 100%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;

    .ant-pro-page-container-children-container {
      padding-block-end: ${token.paddingLG}px;
    }

    .ant-table-content {
      overscroll-behavior-inline: contain;
      -webkit-overflow-scrolling: touch;
    }
  `,
}));
