import site from "./data/settings/site.json";
import footer from "./data/settings/footer.json";
import navigation from "./data/settings/navigation.json";
import {
  siteSettingsSchema,
  footerSettingsSchema,
  navigationSettingsSchema,
} from "./settings.schema.js";

export const siteSettings = siteSettingsSchema.parse(site);
export const footerSettings = footerSettingsSchema.parse(footer);
export const navigationSettings = navigationSettingsSchema.parse(navigation);
