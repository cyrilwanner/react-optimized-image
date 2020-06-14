import appRoot from 'app-root-path';

export interface ImageConfig {
  webp?: boolean;
  sizes?: number[];
  densities?: number[];
  breakpoints?: number[];
  inline?: boolean;
  url?: boolean;
  original?: boolean;
}

export interface GlobalConfig {
  default?: ImageConfig;
  types?: Record<string, ImageConfig>;
}

/**
 * Get global image config
 *
 * @returns {GlobalConfig}
 */
export const getGlobalConfig = (): GlobalConfig => {
  try {
    return require(`${appRoot}/images.config.js`); // eslint-disable-line
  } catch {
    return {};
  }
};
