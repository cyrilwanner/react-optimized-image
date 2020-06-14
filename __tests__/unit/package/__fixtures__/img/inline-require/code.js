import React from 'react';
import Img from 'react-optimized-image';

export default () => (
  <div>
    <Img src={require('./image.png')} sizes={[400, 800]} />
  </div>
);
