import { CallExpression, ImportSpecifier, ImportDefaultSpecifier, JSXElement } from '@babel/types';
import { Binding, NodePath } from '@babel/traverse';
import { resolveRequireModule, resolveRequireExportName, isImport, getExportName } from './traverse';

/**
 * Resolves the correct export name from an import
 *
 * @param {string} exportName
 * @param {string} importPath
 * @returns {string}
 */
const simplifyExportName = (exportName: string, importPath: string): string => {
  // handle path specific imports like react-optimized-image/lib/components/Svg
  if (exportName === 'default') {
    if (importPath.startsWith('react-optimized-image/lib/components/')) {
      return importPath.replace('react-optimized-image/lib/components/', '');
    }
  }

  return exportName;
};

/**
 * Checks if an import name belongs to the given module
 *
 * @param {string} importName
 * @param {string} module
 * @returns {boolean}
 */
const isModule = (importName: string, module: string): boolean => {
  return importName === module || importName.startsWith(`${module}/`);
};

/**
 * Resolves styled components import
 *
 * @param {CallExpression} node
 * @param {Binding} binding
 * @returns {{ exportName?: string; moduleName?: string } | undefined}
 */
const resolveStyledComponentsImport = (
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
const resolveImport = (binding: Binding | undefined): { exportName?: string; moduleName?: string } | undefined => {
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
const getImportedJsxComponent = (binding: Binding | undefined): string | undefined => {
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
 * Resolves an react-optimized-image JSX component
 *
 * @param {NodePath<JSXElement>} path
 * @returns {string}
 */
const resolveJsxComponent = (path: NodePath<JSXElement>): string | undefined => {
  if (path.node.openingElement.name.type === 'JSXIdentifier') {
    const binding = path.scope.getBinding(path.node.openingElement.name.name);
    const component = getImportedJsxComponent(binding);

    return component;
  }
};

export default resolveJsxComponent;
