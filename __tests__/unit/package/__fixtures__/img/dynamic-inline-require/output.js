import React from 'react';
import Img from 'react-optimized-image';
const imageName = 'image';
export default () => (
  <div>
    <Img
      src={require('./' + imageName + '.png')}
      sizes={[400, 800]}
      rawSrc={{
        fallback: {
          400: {
            1: require('./' + imageName + '.png?width=400'),
          },
          800: {
            1: require('./' + imageName + '.png?width=800'),
          },
        },
      }}
    />
  </div>
);
