import { bootstrapStructive, config } from "../structive.js";

config.autoLoadFromImportMap = true;
config.enableShadowDom = false;
config.locale = "de";
bootstrapStructive();
