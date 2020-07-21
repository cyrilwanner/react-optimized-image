import React from 'react';

const { Svg: Icon, Img: Image } = require('react-optimized-image');

export default () => (
  <div>
    <Icon src={require('./image.svg?include')} />
    <Image
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
