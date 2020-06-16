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
  VariableDeclarator,
  ObjectProperty,
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
 * Resolves the correct export name from an import
 *
 * @param {string} exportName
 * @param {string} importPath
 * @returns {string}
 */
export const simplifyExportName = (exportName: string, importPath: string): string => {
  // handle path specific imports like react-optimized-image/lib/components/Svg
  if (exportName === 'default') {
    if (importPath.startsWith('react-optimized-image/lib/components/')) {
      return importPath.replace('react-optimized-image/lib/components/', '');
    }
  }

  return exportName;
};

/**
 * Gets the module name of a require call
 *
 * @param {CallExpression} node
 * @returns {string | undefined}
 */
export const resolveRequireModule = (node: CallExpression): string | undefined => {
  if (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length > 0 &&
    node.arguments[0].type === 'StringLiteral'
  ) {
    return node.arguments[0].value;
  }
};

/**
 * Get the imported export name
 *
 * @param {VariableDeclarator} node
 * @param {Binding} binding
 * @returns {string | undefined}
 */
export const resolveRequireExportName = (node: VariableDeclarator, binding: Binding): string | undefined => {
  // check for const { Svg } = require('react-optimized-image') calls
  if (node.id.type === 'ObjectPattern') {
    return (node.id.properties.find(
      (property) =>
        property.type === 'ObjectProperty' &&
        property.value.type === 'Identifier' &&
        property.value.name === binding.identifier.name,
    ) as ObjectProperty).key.name;
  }

  // check for require('react-optimized-image').default calls
  if (
    node.init &&
    node.init.type === 'MemberExpression' &&
    node.init.object.type === 'CallExpression' &&
    node.init.property.type === 'Identifier'
  ) {
    return node.init.property.name;
  }
};

/**
 * Checks if an import name belongs to the given module
 *
 * @param {string} importName
 * @param {string} module
 * @returns {boolean}
 */
export const isModule = (importName: string, module: string): boolean => {
  return importName === module || importName.startsWith(`${module}/`);
};

/**
 * Resolves styled components import
 *
 * @param {CallExpression} node
 * @param {Binding} binding
 * @returns {{ exportName?: string; moduleName?: string } | undefined}
 */
export const resolveStyledComponentsImport = (
  node: CallExpression,
  binding: Binding,
): { exportName?: string; moduleName?: string } | undefined => {
  if (node.callee.type !== 'Identifier') {
    return;
  }

  const resolved = resolveImport(binding.scope.getBinding(node.callee.name)); // eslint-disable-line no-use-before-define

  if (
    resolved &&
    resolved.moduleName &&
    (isModule(resolved.moduleName, 'styled-components') || isModule(resolved.moduleName, '@emotion/styled'))
  ) {
    if (node.arguments.length > 0 && node.arguments[0].type === 'Identifier') {
      return resolveImport(binding.scope.getBinding(node.arguments[0].name)); // eslint-disable-line no-use-before-define
    }
  }
};

/**
 * Resolves an import or require statement
 *
 * @param {Binding | undefined} binding
 * @returns {{ exportName?: string; moduleName?: string } | undefined}
 */
export const resolveImport = (
  binding: Binding | undefined,
): { exportName?: string; moduleName?: string } | undefined => {
  // handle import statements
  if (
    binding &&
    binding.kind === 'module' &&
    isImport(binding.path) &&
    binding.path.parent.type === 'ImportDeclaration'
  ) {
    return {
      moduleName: binding.path.parent.source.value,
      exportName: getExportName(binding.path.node as ImportSpecifier | ImportDefaultSpecifier),
    };
  }

  // handle require statements and other libraries like styled-components
  if (binding && binding.kind !== 'module' && binding.path.node.type === 'VariableDeclarator') {
    const { node } = binding.path;

    // check for require('react-optimized-image').default calls
    if (node.init && node.init.type === 'MemberExpression' && node.init.object.type === 'CallExpression') {
      return {
        moduleName: resolveRequireModule(node.init.object),
        exportName: resolveRequireExportName(node, binding),
      };
    }

    // check for `const { Svg } = require('react-optimized-image')` or `styled(Img)({})  calls
    if (node.init && node.init.type === 'CallExpression') {
      // handle styled-components
      if (node.init.callee.type === 'CallExpression' && node.init.callee.callee.type === 'Identifier') {
        return resolveStyledComponentsImport(node.init.callee, binding);
      }

      return {
        moduleName: resolveRequireModule(node.init),
        exportName: resolveRequireExportName(node, binding),
      };
    }

    // handle styled-components (styled(Img)`...`)
    if (
      node.init &&
      node.init.type === 'TaggedTemplateExpression' &&
      node.init.tag.type === 'CallExpression' &&
      node.init.tag.callee.type === 'Identifier'
    ) {
      return resolveStyledComponentsImport(node.init.tag, binding);
    }

    // handle recursiveness
    if (node.init && node.init.type === 'Identifier') {
      return resolveImport(binding.scope.getBinding(node.init.name));
    }
  }

  return undefined;
};

/**
 * Gets the JSX component name belonging to the import statement
 *
 * @param {Binding} [binding]
 * @returns {string}
 */
export const getImportedJsxComponent = (binding: Binding | undefined): string | undefined => {
  const resolved = resolveImport(binding);

  if (
    resolved &&
    resolved.exportName &&
    resolved.moduleName &&
    isModule(resolved.moduleName, 'react-optimized-image')
  ) {
    return simplifyExportName(resolved.exportName, resolved.moduleName);
  }
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
    throw attribute.get('value').buildCodeFrameError('Only static boolean values are allowed');
  }

  return undefined;
};

/**
 * Returns and validates the type argument
 *
 * @param {NodePath<JSXElement>} path
 * @param {string[]} types
 * @returns {string|undefined}
 */
export const getTypeAttribute = (path: NodePath<JSXElement>, types: string[]): string | undefined => {
  const attribute = getAttribute(path, 'type');

  if (attribute && attribute.node.value && attribute.node.value.type === 'StringLiteral') {
    const type = attribute.node.value.value;

    if (types.indexOf(type) < 0) {
      throw (attribute.get('value') as NodePath<JSXExpressionContainer>).buildCodeFrameError(
        `Type ${type} not found in images.config.js`,
      );
    }

    return type;
  }

  if (attribute && attribute.node) {
    throw (attribute.get('value') as NodePath).buildCodeFrameError('Only static string values are allowed');
  }
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
          throw (((attribute.get('value') as NodePath<JSXExpressionContainer>).get('expression') as NodePath<
            ArrayExpression
          >).get(`elements.${i}`) as NodePath).buildCodeFrameError('Only static number values are allowed');
        }
      });

      return values;
    }

    // todo: better error message with link to docs when ready & create test for this error
    throw attribute.get('value').buildCodeFrameError('Only static array with number values is allowed');
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
