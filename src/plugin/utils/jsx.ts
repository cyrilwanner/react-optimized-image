import { JSXElement, JSXAttribute, JSXExpressionContainer, ArrayExpression } from '@babel/types';
import { NodePath } from '@babel/core';

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
