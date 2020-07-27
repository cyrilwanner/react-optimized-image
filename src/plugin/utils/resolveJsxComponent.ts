import {
  CallExpression,
  ImportSpecifier,
  ImportDefaultSpecifier,
  JSXElement,
  JSXMemberExpression,
  MemberExpression,
  ObjectProperty,
  ObjectExpression,
} from '@babel/types';
import { Binding, NodePath } from '@babel/traverse';
import { resolveFilePathSync, loadFileSync } from 'babel-file-loader';
import { explodeModule } from 'babel-explode-module';
import {
  resolveRequireModule,
  resolveRequireExportName,
  isImport,
  getExportName,
  getRelevantRequireString,
} from './traverse';
import { getAttribute } from './jsx';
import { Babel } from '..';

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

      // handle transpiled styled-components
      if (
        node.init.callee.type === 'CallExpression' &&
        node.init.callee.callee.type === 'MemberExpression' &&
        node.init.callee.callee.object.type === 'CallExpression'
      ) {
        return resolveStyledComponentsImport(node.init.callee.callee.object, binding);
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
 * Resolves a local import
 *
 * @param {Binding | undefined} binding
 * @param {string} moduleName
 * @param {string} exportName
 * @returns {{ exportName?: string; moduleName?: string } | undefined}
 */
const resolveLocalImportBinding = (binding: Binding, moduleName: string, exportName: string): Binding | undefined => {
  if (binding.path.hub.file.opts.filename) {
    // resolve and parse file
    const filePath = resolveFilePathSync(binding.path, moduleName);

    if (!filePath) {
      return undefined;
    }

    const parsedFile = loadFileSync(filePath, binding.path.hub.file.opts.parserOpts);
    const exploded = explodeModule(parsedFile.path.parent);
    const exportStatement = exploded.exports.find((e: { external: string }) => e.external === exportName);

    if (!exportStatement) {
      return undefined;
    }

    return parsedFile.scope.getBinding(exportStatement.local);
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

  // follow local imports
  if (
    resolved &&
    resolved.moduleName &&
    (resolved.moduleName.startsWith('./') || resolved.moduleName.startsWith('../')) &&
    resolved.exportName &&
    binding
  ) {
    const resolvedBinding = resolveLocalImportBinding(binding, resolved.moduleName, resolved.exportName);
    return getImportedJsxComponent(resolvedBinding);
  }

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
 * Resolves a JSXMemberExpression recursively into binding names
 *
 * @param {JSXMemberExpression} node
 * @returns {string}
 */
const resolveJsxMemberExpression = (node: JSXMemberExpression): string[] => {
  let bindings: string[] = [];

  if (node.object.type === 'JSXMemberExpression') {
    bindings = [...resolveJsxMemberExpression(node.object)];
  } else if (node.object.type === 'JSXIdentifier') {
    bindings.push(node.object.name);
  }

  bindings.push(node.property.name);

  return bindings;
};

/**
 * Resolves a MemberExpression recursively into binding names
 *
 * @param {MemberExpression} node
 * @returns {string}
 */
const resolveMemberExpression = (node: MemberExpression): string[] => {
  let bindings: string[] = [];

  if (node.object.type === 'MemberExpression') {
    bindings = [...resolveMemberExpression(node.object)];
  } else if (node.object.type === 'Identifier') {
    bindings.push(node.object.name);
  }

  bindings.push(node.property.name);

  return bindings;
};

/**
 * Resolves a ObjectProperty recursively into binding names
 *
 * @param {NodePath<ObjectExpression>} path
 * @param {ObjectProperty} property
 * @returns {string}
 */
const resolveObjectProperty = (path: NodePath<ObjectExpression>, property: ObjectProperty): string[] => {
  let bindings: string[] = [];
  const parent = path.findParent(() => true);

  if (parent.node.type === 'ObjectProperty') {
    bindings = [...resolveObjectProperty(parent.findParent(() => true) as NodePath<ObjectExpression>, parent.node)];
  } else if (parent.node.type === 'VariableDeclarator' && parent.node.id.type === 'Identifier') {
    bindings.push(parent.node.id.name);
  }

  bindings.push(property.key.name);

  return bindings;
};

/**
 * Checks if two array equal
 *
 * @param {any[]} arr1
 * @param {any[]} arr2
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arraysMatch = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; arr1.length < i; i += 1) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
};

/**
 * Resolves an object into a binding
 *
 * @param {Babel['types']} types
 * @param {NodePath<JSXElement>} path
 * @param {string[]} bindings
 */
const resolveObject = (types: Babel['types'], path: NodePath<JSXElement>, bindings: string[]): Binding | undefined => {
  if (bindings.length < 2) {
    return;
  }

  const variableName = bindings[bindings.length - 1];
  const object = path.scope.getBinding(bindings[0]);
  if (!object) {
    return;
  }

  const program = path.findParent((node) => node.isProgram());
  let declarationPath: any = null; // eslint-disable-line
  let initializer;

  // search for object declaration
  program.traverse({
    // styles.StyledImg = ...
    MemberExpression(exPath: NodePath<MemberExpression>) {
      if (exPath.node.property && exPath.node.property.name === variableName) {
        const exBindings = resolveMemberExpression(exPath.node);

        if (arraysMatch(bindings, exBindings) && exPath.parent.type === 'AssignmentExpression') {
          declarationPath = exPath;
          initializer = exPath.parent.right;
          exPath.stop();
        }
      }
    },

    // const styles = { StyledImg: ... }
    ObjectProperty(opPath: NodePath<ObjectProperty>) {
      if (opPath.node.key && opPath.node.key.type === 'Identifier' && opPath.node.key.name === variableName) {
        const exBindings = resolveObjectProperty(
          opPath.findParent(() => true) as NodePath<ObjectExpression>,
          opPath.node,
        );

        if (arraysMatch(bindings, exBindings)) {
          declarationPath = opPath;
          initializer = opPath.node.value;
          opPath.stop();
        }
      }
    },
  });

  if (!declarationPath) {
    return;
  }

  declarationPath = declarationPath as NodePath<MemberExpression>;

  // mock a binding
  const binding: Partial<Binding> = {
    kind: 'const',
    scope: declarationPath.scope,
    identifier: types.identifier(variableName),
    path: {
      ...(declarationPath as any), // eslint-disable-line
      node: types.variableDeclarator(
        types.objectPattern([types.objectProperty(types.identifier(variableName), types.identifier(variableName))]),
        initializer,
      ),
    },
  };

  return binding as Binding;
};

/**
 * Resolves an react-optimized-image JSX component
 *
 * @param {NodePath<JSXElement>} path
 * @returns {string}
 */
const resolveJsxComponent = (types: Babel['types'], path: NodePath<JSXElement>): string | undefined => {
  // check if it is a possible react-optimized-image component before proceeding further
  const srcAttribute = getAttribute(path, 'src');

  if (!srcAttribute) {
    return;
  }

  const requireName = getRelevantRequireString(types, srcAttribute);

  // check if the imported src is not an image in case an extension is present
  if ((!requireName || !requireName.match(/\.(jpe?g|png|svg|gif|webp)($|\?)/gi)) && requireName !== '') {
    return;
  }

  // it is now likely to be a react-optimized-image component, so start resolving

  // check for a normal opening element (<Img ...)
  if (path.node.openingElement.name.type === 'JSXIdentifier') {
    const binding = path.scope.getBinding(path.node.openingElement.name.name);
    const component = getImportedJsxComponent(binding);

    return component;
  }

  // check for an object opening element (<styles.Img ...)
  if (path.node.openingElement.name.type === 'JSXMemberExpression') {
    const objectBindings = resolveJsxMemberExpression(path.node.openingElement.name);
    const resolvedBinding = resolveObject(types, path, objectBindings);
    const component = getImportedJsxComponent(resolvedBinding);

    return component;
  }
};

export default resolveJsxComponent;
