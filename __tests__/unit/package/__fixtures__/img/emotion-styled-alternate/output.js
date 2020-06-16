import React from 'react';
import Img from 'react-optimized-image';
import styled from '@emotion/styled';
import Image from './image.jpg';
const StyledImg = styled(Img)({
  backgroundColor: 'red',
});
export default () => (
  <div>
    <StyledImg
      src={Image}
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
