import { createStyles } from "antd-style";

export const useStudentSelectorStyles = createStyles(({ css, token }) => ({
  root: css`
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
  `,
  queryBar: css`
    width: 100%;
  `,
  queryFilter: css`
    padding: ${token.paddingSM}px ${token.padding}px 0;

    .ant-pro-query-filter-row {
      row-gap: ${token.marginXS}px;
    }

    .ant-form-item {
      margin-bottom: ${token.marginSM}px;
    }

    .ant-pro-query-filter-actions {
      white-space: nowrap;
    }
  `,
  progressTabs: css`
    flex: none;
    padding-inline: ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    .ant-tabs-nav {
      margin: 0;
    }

    .ant-tabs-tab {
      padding-block: ${token.paddingSM}px;
    }
  `,
  list: css`
    min-height: 0;
    flex: 1;
    padding: ${token.paddingSM}px;
    overflow-y: auto;

    .ant-list-items {
      display: flex;
      flex-direction: column;
      gap: ${token.marginXS}px;
    }

    .ant-list-item {
      padding: 0;
      border-block-end: 0;
    }
  `,
  studentCard: css`
    width: 100%;
    cursor: pointer;

    &:focus-visible {
      outline: ${token.lineWidthFocus}px solid ${token.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `,
  selectedCard: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
  pagination: css`
    display: flex;
    width: 100%;
    max-width: 100%;
    flex: none;
    justify-content: center;
    padding: ${token.paddingXS}px ${token.paddingSM}px ${token.paddingSM}px;
    border-top: 1px solid ${token.colorBorderSecondary};
    overflow: hidden;

    .ant-pagination {
      max-width: 100%;
    }
  `,
}));
