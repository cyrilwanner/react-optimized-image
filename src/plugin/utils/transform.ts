import querystring from 'querystring';
import { CallExpression } from '@babel/types';
import { Babel } from '..';

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
