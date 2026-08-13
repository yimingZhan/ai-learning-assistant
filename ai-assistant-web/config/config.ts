import { defineConfig } from "@umijs/max";
import defaultSettings from "./defaultSettings";
import routes from "./routes";

export default defineConfig({
  hash: true,
  history: {
    type: "hash",
  },
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  routes,
  title: "唯寻 AI",
  layout: {
    locale: true,
    ...defaultSettings,
  },
  locale: {
    default: "zh-CN",
    antd: true,
    baseNavigator: false,
  },
  antd: {
    appConfig: {},
    configProvider: {
      variant: "filled",
    },
  },
  initialState: {},
  model: {},
  request: {},
  mock: false,
  utoopack: {},
  define: {
    "process.env.API_BASE_URL": process.env.API_BASE_URL ?? "",
    "process.env.DATA_MODE": process.env.DATA_MODE ?? "mock",
  },
});
