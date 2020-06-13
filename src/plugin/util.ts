import querystring from 'querystring';
import {
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
  JSXElement,
  JSXAttribute,
  JSXExpressionContainer,
  CallExpression,
  ArrayExpression,
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
  return (
    node.source.value === packageName ||
    node.source.value === `${packageName}/lib` ||
    node.source.value.startsWith(`${packageName}/`)
  );
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
 * Gets the JSX component name belonging to the import statement
 *
 * @param {Binding} [binding]
 * @returns {string}
 */
export const getImportedJsxComponent = (binding: Binding | undefined): string | undefined => {
  // handle import statements
  if (
    binding &&
    binding.kind === 'module' &&
    isImport(binding.path) &&
    binding.path.parent.type === 'ImportDeclaration' &&
    isImportedFromPackage(binding.path.parent as ImportDeclaration, 'react-optimized-image')
  ) {
    const exportName = getExportName(binding.path.node as ImportSpecifier | ImportDefaultSpecifier);

    // handle path specific imports like react-optimized-image/lib/components/Svg
    if (exportName === 'default') {
      if (binding.path.parent.source.value.startsWith('react-optimized-image/lib/components/')) {
        return binding.path.parent.source.value.replace('react-optimized-image/lib/components/', '');
      }
    }

    return exportName;
  }

  // todo: also handle require statements at the top of the file instead of imports

  return undefined;
};

/**
 * Gets the specified attribute of a JSX component
 *
 * @param {NodePath<JSXElement>} path
 * @param {string} attributeName
 * @returns {NodePath<JSXAttribute> | undefined}
 */
export const getAttribute = (path: NodePath<JSXElement>, attributeName: string): NodePath<JSXAttribute> | undefined => {
  if (path.node.openingElement.attributes) {
    let attribue;

    path.get('openingElement').traverse({
      JSXAttribute(attributePath) {
        if (attributePath.node.name.name === attributeName) {
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
 * Gets the value of a boolean JSX attribute
 *
 * @param {NodePath<JSXElement>} path
 * @param {string} attributeName
 * @returns {boolean | undefined}
 */
export const getBooleanAttribute = (path: NodePath<JSXElement>, attributeName: string): boolean | undefined => {
  const attribute = getAttribute(path, attributeName);

  if (attribute) {
    if (attribute.node.value === null) {
      return true;
    }

    if (
      attribute.node.value.type === 'JSXExpressionContainer' &&
      attribute.node.value.expression.type === 'BooleanLiteral'
    ) {
      return attribute.node.value.expression.value;
    }

    // todo: better error message with link to docs when ready & create test for this error
    attribute.get('value').buildCodeFrameError('Only static boolean values are allowed');
  }

  return undefined;
};

/**
 * Gets the value of a numbered array JSX attribute
 *
 * @param {NodePath<JSXElement>} path
 * @param {string} attributeName
 * @returns {number[] | undefined}
 */
export const getNumberedArrayAttribute = (path: NodePath<JSXElement>, attributeName: string): number[] | undefined => {
  const attribute = getAttribute(path, attributeName);

  if (attribute) {
    if (
      attribute.node.value &&
      attribute.node.value.type === 'JSXExpressionContainer' &&
      attribute.node.value.expression.type === 'ArrayExpression'
    ) {
      const values: number[] = [];

      attribute.node.value.expression.elements.forEach((element, i) => {
        if (element && element.type === 'NumericLiteral') {
          values.push(element.value);
        } else if (element) {
          // todo: better error message with link to docs when ready & create test for this error
          (((attribute.get('value') as NodePath<JSXExpressionContainer>).get('expression') as NodePath<
            ArrayExpression
          >).get(`elements.${i}`) as NodePath).buildCodeFrameError('Only static number values are allowed');
        }
      });

      return values;
    }

    // todo: better error message with link to docs when ready & create test for this error
    attribute.get('value').buildCodeFrameError('Only static array with number values is allowed');
  }

  return undefined;
};

/**
 * Get all arguments of a require call.
 * If it references a variable from an import statement, it converts it to require arguments.
 *
 * @param {Babel['types']} types
 * @param {NodePath<JSXAttribute>} path
 * @returns {CallExpression['arguments'] | undefined}
 */
export const getRequireArguments = (
  types: Babel['types'],
  path: NodePath<JSXAttribute>,
): CallExpression['arguments'] | undefined => {
  // check for inline-require statement
  if (
    path.node.value &&
    path.node.value.type === 'JSXExpressionContainer' &&
    path.node.value.expression.type === 'CallExpression' &&
    path.node.value.expression.callee.type === 'Identifier' &&
    path.node.value.expression.callee.name === 'require' &&
    path.node.value.expression.arguments.length > 0
  ) {
    return path.node.value.expression.arguments;
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
      return [types.stringLiteral(binding.path.parent.source.value)];
    }
  }
};

/**
 * Add new query params to an existing require string
 *
 * @param {string} currentValue
 * @param {Record<string, unknown>} query
 * @returns {string}
 */
export const addQueryToString = (currentValue: string, query: Record<string, string>): string => {
  const parts = currentValue.split('?');
  const existing = parts.length > 1 ? querystring.parse(parts[1]) : {};
  const newQuery = { ...existing, ...query };

  if (Object.keys(newQuery).length === 0) {
    return parts[0];
  }

  const stringified = Object.keys(newQuery)
    .map((key) => {
      const value = newQuery[key];

      if (Array.isArray(value)) {
        value.map(
          (singleValue) =>
            `${querystring.escape(key)}${
              typeof singleValue !== 'undefined' && singleValue !== '' ? `=${querystring.escape(singleValue)}` : ''
            }`,
        );
      }

      return `${querystring.escape(key)}${
        typeof value !== 'undefined' && value !== '' ? `=${querystring.escape(`${value}`)}` : ''
      }`;
    })
    .join('&');

  return `${parts[0]}?${stringified}`;
};

/**
 * Builds a new require statement with the given arguments and query params
 *
 * @param {Babel['types']} types
 * @param {CallExpression['arguments']} existingArguments
 * @param {Record<string, unkown>} query
 * @returns {CallExpression}
 */
export const buildRequireStatement = (
  types: Babel['types'],
  existingArguments: CallExpression['arguments'],
  query: Record<string, string>,
): CallExpression => {
  const args = [...existingArguments];

  if (args.length > 0) {
    // single string
    if (args[0].type === 'StringLiteral') {
      const newValue = addQueryToString(args[0].value, query);
      args[0] = types.stringLiteral(newValue);
    }

    // concatenated string
    if (args[0].type === 'BinaryExpression' && args[0].right.type === 'StringLiteral') {
      const newValue = addQueryToString(args[0].right.value, query);
      args[0].right = types.stringLiteral(newValue);
    }

    // template literal
    if (args[0].type === 'TemplateLiteral' && args[0].quasis.length > 0) {
      const newValue = addQueryToString(args[0].quasis[args[0].quasis.length - 1].value.raw, query);
      args[0].quasis[args[0].quasis.length - 1] = types.templateElement(
        { raw: newValue, cooked: newValue },
        args[0].quasis[args[0].quasis.length - 1].tail,
      );
    }
  }

  return types.callExpression(types.identifier('require'), args);
};
