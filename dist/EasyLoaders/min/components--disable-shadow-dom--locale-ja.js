import { bootstrapStructive, config } from "../../structive.min.js";

config.autoLoadFromImportMap = true;
config.enableMainWrapper = false;
config.enableRouter = false;
config.enableShadowDom = false;
config.locale = "ja";
bootstrapStructive();
