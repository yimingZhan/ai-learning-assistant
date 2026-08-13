import type { ProLayoutProps } from "@ant-design/pro-components";

const defaultSettings: ProLayoutProps = {
  navTheme: "light",
  colorPrimary: "#1677ff",
  layout: "side",
  contentWidth: "Fluid",
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: "唯寻 AI",
  logo: false,
  contentStyle: {
    paddingBlock: 0,
    paddingInline: 0,
  },
  token: {
    header: {
      heightLayoutHeader: 56,
    },
  },
};

export default defaultSettings;
