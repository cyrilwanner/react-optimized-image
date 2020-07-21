import React from 'react';

const Icon = require('react-optimized-image').Svg;

const Img = require('react-optimized-image').default;

export default () => (
  <div>
    <Icon src={require('./image.svg?include')} />
    <Img
      src={require('./image.png')}
      sizes={[400, 800]}
      rawSrc={{
        fallback: {
          400: {
            1: require('./image.png?width=400'),
          },
          800: {
            1: require('./image.png?width=800'),
          },
        },
      }}
    />
  </div>
);
