import React from 'react';
import Img from 'react-optimized-image';
import styled from 'styled-components';
import Image from './image.jpg';
const StyledImg = styled(Img)`
  background-color: red;
`;
const StyledImage = styled(StyledImg)`
  font-size: 16px;
`;
export default () => (
  <div>
    <StyledImage
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
