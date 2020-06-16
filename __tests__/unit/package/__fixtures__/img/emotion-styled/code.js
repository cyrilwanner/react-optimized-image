import React from 'react';
import Img from 'react-optimized-image';
import styled from '@emotion/styled';
import Image from './image.jpg';

const StyledImg = styled(Img)`
  background-color: red;
`;

export default () => (
  <div>
    <StyledImg src={Image} webp />
  </div>
);
