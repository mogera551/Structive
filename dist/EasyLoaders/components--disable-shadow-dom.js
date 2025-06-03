import { bootstrapStructive, config } from "../structive.js";

config.autoLoadFromImportMap = true;
config.enableMainWrapper = false;
config.enableRouter = false;
config.enableShadowDom = false;
bootstrapStructive();
