import {
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
  JSXAttribute,
  CallExpression,
  VariableDeclarator,
  ObjectProperty,
} from '@babel/types';
import { NodePath } from '@babel/core';
import { Binding } from '@babel/traverse';
import { Babel } from '..';

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
 * Returns the relevant string of a require or import statement
 *
 * @param {Babel['types]} types
 * @param {NodePath<JSXAttribute>} path
 * @returns {string}
 */
export const getRelevantRequireString = (types: Babel['types'], path: NodePath<JSXAttribute>): string | undefined => {
  const args = getRequireArguments(types, path);
  if (args && args.length > 0) {
    // stringle string
    if (args[0].type === 'StringLiteral') {
      return args[0].value;
    }

    // concatenated string
    if (args[0].type === 'BinaryExpression' && args[0].right.type === 'StringLiteral') {
      return args[0].right.value;
    }

    // template literal
    if (args[0].type === 'TemplateLiteral' && args[0].quasis.length > 0) {
      return args[0].quasis[args[0].quasis.length - 1].value.raw;
    }
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
