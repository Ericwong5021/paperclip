import { appsToolsLocaleMessages } from "./apps-tools-messages";
import { appsToolsResidualLocaleMessages } from "./apps-tools-residual-messages";

export const toolsProfilesLocaleMessages = {
  en: {
    toolsProfiles: {
      ...appsToolsLocaleMessages.en.appsTools,
      ...appsToolsResidualLocaleMessages.en.appsToolsResidual,
    },
  },
  "zh-CN": {
    toolsProfiles: {
      ...appsToolsLocaleMessages["zh-CN"].appsTools,
      ...appsToolsResidualLocaleMessages["zh-CN"].appsToolsResidual,
    },
  },
};
