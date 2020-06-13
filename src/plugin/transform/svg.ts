import { NodePath } from '@babel/core';
import { JSXElement } from '@babel/types';
import { Babel } from '..';
import { getSrcAttribute, addImportQueryParam } from '../util';

/**
 * Adds ?include query param to the src attribute of the Svg component
 */
const transformSvgComponent = (types: Babel['types'], path: NodePath<JSXElement>): void => {
  const src = getSrcAttribute(path);

  if (!src) {
    return src;
  }

  addImportQueryParam(types, src, 'include');
};

export default transformSvgComponent;
