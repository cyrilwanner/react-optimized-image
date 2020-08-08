import React from 'react';

const { Svg, Img } = require('react-optimized-image');

export default () => (
  <div>
    <Svg rawSrc={require('./image.svg?include')} />
    <Img
      src={require('./image.jpg')}
      webp
      rawSrc={{
        fallback: {
          original: {
            1: require('./image.jpg?url'),
          },
        },
        webp: {
          original: {
            1: require('./image.jpg?webp'),
          },
        },
      }}
    />
  </div>
);
