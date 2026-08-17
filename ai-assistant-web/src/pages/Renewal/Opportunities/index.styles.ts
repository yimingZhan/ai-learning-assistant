import { createStyles } from "antd-style";

export const useRenewalWorkbenchStyles = createStyles(({ css, token }) => ({
  pageContainer: css`
    height: 100%;
    min-height: 0;

    > .ant-pro-grid-content,
    > .ant-pro-grid-content > .ant-pro-grid-content-children,
    > .ant-pro-grid-content
      > .ant-pro-grid-content-children
      > .ant-pro-page-container-children-container {
      height: 100%;
      min-height: 0;
    }
  `,
  page: css`
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: ${token.colorBgLayout};
    overflow: hidden;
  `,
  top: css`
    flex: none;
    padding: ${token.paddingSM}px;
    padding-bottom: 0;
  `,
  topCard: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  filters: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px ${token.padding}px;
    overflow-x: auto;
    scrollbar-width: thin;

    > * {
      flex: none;
    }
  `,
  search: css`
    width: 220px;

    @media (max-width: 767px) {
      width: 200px;
    }
  `,
  filterSelect: css`
    width: 136px;
  `,
  ownerSelect: css`
    width: 168px;
  `,
  workspace: css`
    min-width: 0;
    min-height: 0;
    flex: 1;
    padding: ${token.paddingSM}px;
    overflow: hidden;
  `,
  splitter: css`
    width: 100%;
    height: 100%;
    gap: ${token.paddingSM}px;
  `,
  panelCard: css`
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-shadow: none;
    overflow: hidden;

    > .ant-card-body {
      width: 100%;
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
  `,
  panel: css`
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  panelHeader: css`
    display: flex;
    min-height: 52px;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginXS}px;
    padding: ${token.paddingSM}px ${token.padding}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    box-sizing: border-box;
  `,
  panelHeading: css`
    margin: 0 !important;
  `,
  panelScroll: css`
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  `,
  listTabs: css`
    flex: none;
    padding-inline: ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    .ant-tabs-nav {
      margin: 0;
    }
  `,
  studentList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
    padding: ${token.paddingSM}px;
  `,
  studentItem: css`
    display: block;
    width: 100%;
    padding: ${token.paddingSM}px;
    color: inherit;
    text-align: start;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    transition:
      background-color 180ms ease-out,
      border-color 180ms ease-out;

    &:hover,
    &:focus-visible {
      background: ${token.colorBgTextHover};
      border-color: ${token.colorPrimaryBorder};
      outline: none;
    }
  `,
  studentItemSelected: css`
    background: ${token.colorPrimaryBg};
    border-color: ${token.colorPrimary};
  `,
  studentPrimary: css`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginXXS}px;
  `,
  studentName: css`
    min-width: 0;
    flex: 1;
    overflow: hidden;
    font-weight: ${token.fontWeightStrong};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  studentMeta: css`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  studentReason: css`
    display: -webkit-box;
    margin-top: ${token.marginXS}px;
    overflow: hidden;
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeight};
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  `,
  studentTrigger: css`
    display: block;
    margin-top: ${token.marginXXS}px;
    overflow: hidden;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  empty: css`
    padding: ${token.paddingXL}px ${token.padding}px;
  `,
  diagnosisBody: css`
    display: flex;
    flex-direction: column;
    gap: ${token.margin}px;
    padding: ${token.padding}px;
  `,
  studentSummary: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  studentTitleRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
  `,
  factGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${token.marginSM}px ${token.marginLG}px;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  `,
  fact: css`
    display: grid;
    min-width: 0;
    grid-template-columns: 80px minmax(0, 1fr);
    align-items: baseline;
    gap: ${token.marginXS}px;
    font-size: ${token.fontSizeSM}px;
  `,
  factLabel: css`
    color: ${token.colorTextSecondary};
  `,
  factValue: css`
    min-width: 0;
    overflow-wrap: anywhere;
  `,
  section: css`
    padding-top: ${token.padding}px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  sectionHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    margin-bottom: ${token.marginSM}px;
  `,
  sectionTitle: css`
    margin: 0 !important;
  `,
  conditionList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  condition: css`
    padding: ${token.paddingSM}px ${token.padding}px;
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  conditionHeader: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    margin-bottom: ${token.marginXS}px;
  `,
  conditionReason: css`
    margin: 0 0 ${token.marginSM}px !important;
    color: ${token.colorTextSecondary};
  `,
  evidencePreview: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginSM}px;
  `,
  evidenceChip: css`
    max-width: 100%;
    padding: ${token.paddingXXS}px ${token.paddingXS}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadiusSM}px;
  `,
  conditionFooter: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
  `,
  productList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  product: css`
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      border-bottom: 0;
    }
  `,
  productMain: css`
    min-width: 0;
    flex: 1;
  `,
  productMeta: css`
    display: block;
    margin-top: ${token.marginXXS}px;
  `,
  collapse: css`
    background: transparent;

    .ant-collapse-header {
      padding-inline: 0 !important;
    }

    .ant-collapse-content-box {
      padding-inline: 0 !important;
    }
  `,
  coveredItem: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    padding-block: ${token.paddingXS}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    &:last-child {
      border-bottom: 0;
    }
  `,
  assistantIntro: css`
    padding: ${token.paddingSM}px;
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  assistantIntroTitle: css`
    display: block;
    margin-bottom: ${token.marginXS}px;
  `,
  assistantAction: css`
    width: 100%;
    height: auto;
    justify-content: flex-start;
    padding: ${token.paddingXS}px 0;
    text-align: start;
    white-space: normal;
  `,
  assistantSource: css`
    display: block;
    margin-top: ${token.marginXS}px;
    font-size: ${token.fontSizeSM}px;
  `,
  mobileDetail: css`
    width: 100%;
    height: 100%;
  `,
}));
