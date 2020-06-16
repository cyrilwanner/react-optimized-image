import React from 'react';

const { default: Img } = require('react-optimized-image');

export default () => (
  <div>
    <Img
      src={require('./image.jpg')}
      webp
      rawSrc={{
        fallback: {
          original: {
            1: require('./image.jpg'),
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
