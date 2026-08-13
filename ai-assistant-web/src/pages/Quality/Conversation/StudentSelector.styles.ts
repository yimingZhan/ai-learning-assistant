import { createStyles } from "antd-style";

export const useStudentSelectorStyles = createStyles(({ css, token }) => ({
  root: css`
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
  `,
  toolbar: css`
    display: flex;
    flex: none;
    gap: ${token.marginXS}px;
    padding: ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  search: css`
    min-width: 0;
    flex: 1;
  `,
  list: css`
    min-height: 0;
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
  filterForm: css`
    width: 300px;

    .ant-pro-form-group-container {
      width: 100%;
    }
  `,
  filterActions: css`
    display: flex;
    justify-content: flex-end;
    gap: ${token.marginXS}px;
    margin-top: ${token.marginSM}px;
  `,
}));
