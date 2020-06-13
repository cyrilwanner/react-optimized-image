import { NodePath } from '@babel/core';
import { JSXElement, JSXAttribute, JSXOpeningElement, CallExpression, ObjectProperty } from '@babel/types';
import { Babel } from '..';
import {
  getAttribute,
  getBooleanAttribute,
  getNumberedArrayAttribute,
  buildRequireStatement,
  getRequireArguments,
} from '../util';
import { ImageConfig } from '../types';

/**
 * Build the image configuration based on jsx attribute
 *
 * @param {NodePath<JSXElement>} path
 * @returns {ImageConfig}
 */
const buildConfig = (path: NodePath<JSXElement>): ImageConfig => {
  // build config
  const config: ImageConfig = {};

  // check if it should get converted to webp
  const webp = getBooleanAttribute(path, 'webp');

  if (typeof webp !== 'undefined') {
    config.webp = webp;
  }

  // get sizes
  const sizes = getNumberedArrayAttribute(path, 'sizes');

  if (typeof sizes !== 'undefined') {
    config.sizes = sizes;
  }

  // get densities
  const densities = getNumberedArrayAttribute(path, 'densities');

  if (typeof densities !== 'undefined') {
    config.densities = densities;
  }

  return config;
};

/**
 * Build the rawSrc attribute according to the image config
 *
 * @param {Babel['types']} types
 * @param {CallExpression['arguments']} requireArgs
 * @param {ImageConfig} config
 * @returns {JSXAttribute}
 */
const buildRawSrcAttribute = (
  types: Babel['types'],
  requireArgs: CallExpression['arguments'],
  config: ImageConfig,
): JSXAttribute => {
  const properties: ObjectProperty[] = [];

  ['fallback', ...(config.webp ? ['webp'] : [])].forEach((type) => {
    const typeProperties: ObjectProperty[] = [];

    (config.densities || [1]).forEach((density) => {
      const densityProperties: ObjectProperty[] = [];
      const query: Record<string, string> = type === 'webp' ? { webp: '' } : {};

      if (!config.sizes || config.sizes.length === 0) {
        densityProperties.push(
          types.objectProperty(types.identifier('original'), buildRequireStatement(types, requireArgs, query)),
        );
      } else {
        config.sizes.forEach((size) => {
          densityProperties.push(
            types.objectProperty(
              types.numericLiteral(size),
              buildRequireStatement(types, requireArgs, { ...query, width: `${size * density}` }),
            ),
          );
        });
      }

      typeProperties.push(
        types.objectProperty(types.numericLiteral(density), types.objectExpression(densityProperties)),
      );
    });

    properties.push(types.objectProperty(types.identifier(type), types.objectExpression(typeProperties)));
  });

  return types.jsxAttribute(
    types.jsxIdentifier('rawSrc'),
    types.jsxExpressionContainer(types.objectExpression(properties)),
  );
};

/**
 * Process attribute on the img component and convert them to raw sources
 */
const transformImgComponent = (types: Babel['types'], path: NodePath<JSXElement>): void => {
  // abort if it has already the rawSrc attribute
  if (getAttribute(path, 'rawSrc')) {
    return;
  }

  // get src attribute
  const src = getAttribute(path, 'src');
  const requireArgs = src ? getRequireArguments(types, src) : undefined;

  if (!src || !requireArgs) {
    return;
  }

  const config = buildConfig(path);
  const rawSrc = buildRawSrcAttribute(types, requireArgs, config);
  (path.get('openingElement') as NodePath<JSXOpeningElement>).pushContainer('attributes', rawSrc);
};

export default transformImgComponent;
