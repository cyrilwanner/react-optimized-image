import clone from 'clone';
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
import { ImageConfig } from '../imageConfig';

/**
 * Build the image configuration based on jsx attribute
 *
 * @param {NodePath<JSXElement>} path
 * @returns {ImageConfig}
 */
const buildConfig = (path: NodePath<JSXElement>): ImageConfig => {
  // build config
  const config: ImageConfig = {};

  // check boolean attributes: webp, inline, url, original
  ['webp', 'inline', 'url', 'original'].forEach((attr) => {
    const value = getBooleanAttribute(path, attr);

    if (typeof value !== 'undefined') {
      (config as Record<string, unknown>)[attr] = value;
    }
  });

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
 * @param {Record<string, unknown>} globalQuery
 * @returns {JSXAttribute}
 */
const buildRawSrcAttribute = (
  types: Babel['types'],
  requireArgs: CallExpression['arguments'],
  config: ImageConfig,
  globalQuery: Record<string, string>,
): JSXAttribute => {
  const properties: ObjectProperty[] = [];

  ['fallback', ...(config.webp ? ['webp'] : [])].forEach((type) => {
    const typeProperties: ObjectProperty[] = [];
    const query: Record<string, string> = type === 'webp' ? { ...globalQuery, webp: '' } : { ...globalQuery };

    (config.sizes && config.sizes.length > 0 ? config.sizes : ['original']).forEach((size: number | string) => {
      const sizeProperties: ObjectProperty[] = [];

      (config.densities || [1]).forEach((density) => {
        const sizeQuery: Record<string, string> = {
          ...query,
          ...(typeof size === 'number' ? { width: `${size * density}` } : {}),
        };

        sizeProperties.push(
          types.objectProperty(
            types.numericLiteral(density),
            buildRequireStatement(types, clone(requireArgs), sizeQuery),
          ),
        );
      });

      typeProperties.push(
        types.objectProperty(
          typeof size === 'string' ? types.identifier(size) : types.numericLiteral(size),
          types.objectExpression(sizeProperties),
        ),
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

  const query: Record<string, string> = {};

  // add boolean queries
  ['inline', 'url', 'original'].forEach((attr) => {
    if ((config as Record<string, unknown>)[attr] === true) {
      query[attr] = '';
    }
  });

  // transfer original src attribute if a new query param needs to be set
  if (Object.keys(query).length > 0) {
    (src.get('value') as NodePath).replaceWith(
      types.jsxExpressionContainer(buildRequireStatement(types, clone(requireArgs), query)),
    );
  }

  const rawSrc = buildRawSrcAttribute(types, requireArgs, config, query);
  (path.get('openingElement') as NodePath<JSXOpeningElement>).pushContainer('attributes', rawSrc);
};

export default transformImgComponent;
