import { NodePath } from '@babel/core';
import { JSXElement } from '@babel/types';
import { Babel } from '..';
import { getAttribute, getRequireArguments, buildRequireStatement } from '../util';

/**
 * Adds ?include query param to the src attribute of the Svg component
 */
const transformSvgComponent = (types: Babel['types'], path: NodePath<JSXElement>): void => {
  const src = getAttribute(path, 'src');

  if (!src) {
    return src;
  }

  // update require argument
  const requireArgs = getRequireArguments(types, src);
  if (requireArgs) {
    const requireStatement = buildRequireStatement(types, requireArgs, { include: '' });
    src.get('value').replaceWith(types.jsxExpressionContainer(requireStatement));
  }
};

export default transformSvgComponent;
