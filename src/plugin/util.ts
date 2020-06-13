import {
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
  JSXElement,
  JSXAttribute,
  JSXExpressionContainer,
  CallExpression,
  StringLiteral,
  BinaryExpression,
  TemplateLiteral,
  TemplateElement,
  Identifier,
} from '@babel/types';
import { NodePath } from '@babel/core';
import { Binding } from '@babel/traverse';
import { Babel } from '.';

/**
 * Check if the node path is an import statement
 *
 * @param {NodePath} path
 * @returns {boolean}
 */
export const isImport = (path: NodePath): boolean => {
  return path.type === 'ImportSpecifier' || path.type === 'ImportDefaultSpecifier';
};

/**
 * Check if the import statement belongs to the specified package
 *
 * @param {ImportDeclaration} node
 * @param {string} packageName
 * @returns {boolean}
 */
export const isImportedFromPackage = (node: ImportDeclaration, packageName: string): boolean => {
  return node.source.value === packageName || node.source.value.startsWith(`${packageName}/`);
};

/**
 * Get the original export name of an import statement
 *
 * @param {ImportSpecifier | ImportDefaultSpecifier} node
 * @returns {string}
 */
export const getExportName = (node: ImportSpecifier | ImportDefaultSpecifier): string => {
  if (node.type === 'ImportDefaultSpecifier') {
    return 'default';
  }

  return node.imported.name;
};

/**
 * Check if the import statement belongs to a JSX Component
 *
 * @param {Binding} [binding]
 * @param {string} component
 * @returns {boolean}
 */
export const isImportedJsxComponent = (binding: Binding | undefined, component: string): boolean => {
  // handle import statements
  if (
    binding &&
    binding.kind === 'module' &&
    isImport(binding.path) &&
    binding.path.parent.type === 'ImportDeclaration' &&
    isImportedFromPackage(binding.path.parent as ImportDeclaration, 'react-optimized-image')
  ) {
    const exportName = getExportName(binding.path.node as ImportSpecifier | ImportDefaultSpecifier);

    // handle path specific imports like react-optimized-image/lib/Svg
    if (exportName === 'default') {
      if (binding.path.parent.source.value.startsWith('react-optimized-image/lib/')) {
        return binding.path.parent.source.value.replace('react-optimized-image/lib/', '') === component;
      }
    }

    return exportName === component;
  }

  // todo: also handle require statements at the top of the file instead of imports

  return false;
};

/**
 * Gets the src attribute of a JSX component
 *
 * @param {NodePath<JSXElement>} path
 * @returns {NodePath<JSXAttribute> | undefined}
 */
export const getSrcAttribute = (path: NodePath<JSXElement>): NodePath<JSXAttribute> | undefined => {
  if (path.node.openingElement.attributes) {
    let attribue;

    path.get('openingElement').traverse({
      JSXAttribute(attributePath) {
        if (attributePath.node.name.name === 'src') {
          attribue = attributePath;
          attributePath.stop();
        }
      },
    });

    return attribue;
  }

  return undefined;
};

/**
 * Adds a query param to an import statement within the src attribute of a JSX component
 *
 * @param {Babel['types']} types
 * @param {NodePath<JSXAttribute>} path
 * @param {string} key
 * @param {string} [value]
 */
export const addImportQueryParam = (
  types: Babel['types'],
  path: NodePath<JSXAttribute>,
  key: string,
  value?: string,
): void => {
  const addQuery = (currentValue: string) =>
    `${currentValue}${currentValue.indexOf('?') >= 0 ? '&' : '?'}${key}${
      typeof value !== 'undefined' ? `=${value}` : ''
    }`;

  // check for inline-require statement
  if (
    path.node.value &&
    path.node.value.type === 'JSXExpressionContainer' &&
    path.node.value.expression.type === 'CallExpression' &&
    path.node.value.expression.callee.type === 'Identifier' &&
    path.node.value.expression.callee.name === 'require' &&
    path.node.value.expression.arguments.length > 0
  ) {
    const arg = path.node.value.expression.arguments[0];

    // single string
    if (arg.type === 'StringLiteral') {
      const newValue = addQuery(arg.value);

      (((path.get('value') as NodePath<JSXExpressionContainer>).get('expression') as NodePath<CallExpression>).get(
        'arguments.0',
      ) as NodePath<StringLiteral>).replaceWith(types.stringLiteral(newValue));
    }

    // concatenated string
    if (arg.type === 'BinaryExpression' && arg.right.type === 'StringLiteral') {
      const newValue = addQuery(arg.right.value);

      (((path.get('value') as NodePath<JSXExpressionContainer>).get('expression') as NodePath<CallExpression>).get(
        'arguments.0',
      ) as NodePath<BinaryExpression>)
        .get('right')
        .replaceWith(types.stringLiteral(newValue));
    }

    // template literal
    if (arg.type === 'TemplateLiteral' && arg.quasis.length > 0) {
      const newValue = addQuery(arg.quasis[arg.quasis.length - 1].value.raw);

      ((((path.get('value') as NodePath<JSXExpressionContainer>).get('expression') as NodePath<CallExpression>).get(
        'arguments.0',
      ) as NodePath<TemplateLiteral>).get(`quasis.${arg.quasis.length - 1}`) as NodePath<TemplateElement>).replaceWith(
        types.templateElement(
          {
            raw: newValue,
            cooked: newValue,
          },
          arg.quasis[arg.quasis.length - 1].tail,
        ),
      );
    }
  }

  // check for import reference
  if (
    path.node.value &&
    path.node.value.type === 'JSXExpressionContainer' &&
    path.node.value.expression.type === 'Identifier'
  ) {
    const variableName = path.node.value.expression.name;
    const binding = path.scope.getBinding(variableName);

    if (
      binding &&
      binding.kind === 'module' &&
      isImport(binding.path) &&
      binding.path.parent.type === 'ImportDeclaration'
    ) {
      const newValue = addQuery(binding.path.parent.source.value);

      ((path.get('value') as NodePath<JSXExpressionContainer>).get('expression') as NodePath<Identifier>).replaceWith(
        types.callExpression(types.identifier('require'), [types.stringLiteral(newValue)]),
      );
    }
  }
};
