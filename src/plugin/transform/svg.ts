import { NodePath } from '@babel/core';
import { JSXElement, JSXAttribute, JSXOpeningElement, CallExpression } from '@babel/types';
import clone from 'clone';
import { Babel } from '..';
import { getRequireArguments } from '../utils/traverse';
import { getAttribute } from '../utils/jsx';
import { buildRequireStatement } from '../utils/transform';

/**
 * Build the rawSrc attribute
 *
 * @param {Babel['types']} types
 * @param {CallExpression['arguments']} requireArgs
 * @returns {JSXAttribute}
 */
const buildRawSrcAttribute = (types: Babel['types'], requireArgs: CallExpression['arguments']): JSXAttribute => {
  return types.jsxAttribute(
    types.jsxIdentifier('rawSrc'),
    types.jsxExpressionContainer(buildRequireStatement(types, clone(requireArgs), { include: '' })),
  );
};

/**
 * Adds ?include query param to the rawSrc attribute of the Svg component
 */
const transformSvgComponent = (types: Babel['types'], path: NodePath<JSXElement>): void => {
  // abort if it has already the rawSrc attribute
  if (getAttribute(path, 'rawSrc')) {
    return;
  }

  const src = getAttribute(path, 'src');
  const requireArgs = src ? getRequireArguments(types, src) : undefined;

  if (!src || !requireArgs) {
    return;
  }

  const rawSrc = buildRawSrcAttribute(types, requireArgs);
  (path.get('openingElement') as NodePath<JSXOpeningElement>).pushContainer('attributes', rawSrc);
  src.remove();
};

export default transformSvgComponent;
