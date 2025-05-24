import { bootstrapStructive, config } from "structive";

config.autoLoadFromImportMap = true;
config.enableMainWrapper = false;
config.enableRouter = false;
config.enableShadowDom = false;
config.locale = "es";
bootstrapStructive();
