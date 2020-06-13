import * as BabelTypes from '@babel/types';
import { Visitor, NodePath } from '@babel/traverse';
import babelPluginSyntaxJsx from 'babel-plugin-syntax-jsx';
import { getImportedJsxComponent } from './util';
import transformSvgComponent from './transform/svg';

export interface Babel {
  types: typeof BabelTypes;
}

interface PluginOptions {
  file: {
    path: NodePath;
  };
}

export default function ({ types }: Babel): { visitor: Visitor<PluginOptions>; inherits: unknown } {
  return {
    inherits: babelPluginSyntaxJsx,
    visitor: {
      JSXElement(path) {
        if (path.node.openingElement.name.type === 'JSXIdentifier') {
          const binding = path.scope.getBinding(path.node.openingElement.name.name);
          const component = getImportedJsxComponent(binding);

          // handle svg component
          if (component === 'Svg') {
            transformSvgComponent(types, path);
          }
        }
      },
    },
  };
}
