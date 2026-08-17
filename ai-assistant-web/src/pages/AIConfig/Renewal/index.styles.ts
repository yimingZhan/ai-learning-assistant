import { createStyles } from "antd-style";

export const useRenewalConfigStyles = createStyles(({ css, token }) => ({
  goalLayout: css`
    display: grid;
    grid-template-columns: 224px minmax(0, 1fr);
    align-items: start;
    gap: ${token.marginMD}px;
    min-width: 0;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  `,
  gradeSidebar: css`
    position: sticky;
    top: ${token.marginMD}px;
    min-width: 0;
    padding: ${token.paddingSM}px;
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    @media (max-width: 900px) {
      position: static;
      overflow-x: auto;
    }
  `,
  sidebarHeading: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    padding: ${token.paddingXS}px ${token.paddingSM}px ${token.paddingSM}px;
  `,
  gradeList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;

    @media (max-width: 900px) {
      flex-direction: row;
      min-width: max-content;
    }
  `,
  gradeCard: css`
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    padding: ${token.paddingSM}px;
    color: ${token.colorText};
    text-align: left;
    background: ${token.colorBgContainer};
    border: 1px solid transparent;
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    transition: border-color ${token.motionDurationMid}, background ${token.motionDurationMid}, transform ${token.motionDurationMid};

    &:hover {
      border-color: ${token.colorPrimaryBorder};
      transform: translateX(2px);
    }

    @media (max-width: 900px) {
      width: 190px;
    }
  `,
  gradeCardActive: css`
    background: ${token.colorPrimaryBg};
    border-color: ${token.colorPrimary};
    box-shadow: inset 3px 0 0 ${token.colorPrimary};

    &:hover {
      transform: none;
    }
  `,
  gradeCardHint: css`
    font-size: ${token.fontSizeSM}px;
  `,
  detailCard: css`
    min-width: 0;

    .ant-card-head {
      min-height: 76px;
    }

    .ant-card-body {
      min-width: 0;
    }

    .ant-pro-table {
      min-width: 0;
    }
  `,
  requirementToolbar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    margin-bottom: ${token.marginSM}px;

    @media (max-width: 640px) {
      align-items: stretch;
      flex-direction: column;

      .ant-input {
        width: 100% !important;
      }
    }
  `,
  requirementTable: css`
    overflow-x: auto;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  requirementTableInner: css`
    width: 100%;
    min-width: 1080px;
    border-collapse: collapse;
    color: ${token.colorText};
    background: ${token.colorBgContainer};

    th,
    td {
      padding: ${token.paddingSM}px ${token.paddingMD}px;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid ${token.colorSplit};
    }

    th {
      color: ${token.colorTextSecondary};
      font-size: ${token.fontSizeSM}px;
      font-weight: ${token.fontWeightStrong};
      white-space: nowrap;
      background: ${token.colorFillAlter};
    }

    tbody tr {
      transition: background ${token.motionDurationMid};

      &:hover {
        background: ${token.controlItemBgHover};
      }

      &:last-child td {
        border-bottom: 0;
      }
    }

    td:first-child {
      min-width: 250px;
    }

    td:nth-child(2) {
      min-width: 190px;
    }

    td:nth-child(3) {
      min-width: 190px;
    }

    td:nth-child(4) {
      min-width: 120px;
      white-space: nowrap;
    }

    td:nth-child(5) {
      min-width: 150px;
    }

    td:nth-child(6) {
      min-width: 88px;
      white-space: nowrap;
    }

    td:last-child {
      min-width: 80px;
      white-space: nowrap;
    }
  `,
  requirementEmpty: css`
    display: grid;
    min-height: 260px;
    place-items: center;
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  sectionTitle: css`
    margin: ${token.marginSM}px 0 ${token.marginMD}px !important;
  `,
  criterionRow: css`
    display: grid;
    grid-template-columns: minmax(150px, 1.5fr) minmax(110px, 1fr) 90px minmax(110px, 1fr) 72px 32px;
    gap: ${token.marginXS}px;
    align-items: start;

    @media (max-width: 767px) {
      grid-template-columns: 1fr 1fr;
    }
  `,
  sourceTimeline: css`
    margin-top: ${token.marginSM}px;
  `,
}));
