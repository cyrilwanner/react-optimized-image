import React from 'react';
import Img, { Svg } from 'react-optimized-image';
import styled from 'styled-components';
import SvgImage from './image.svg';
import JpgImage from './image.jpg';

const StyledSvg = styled(Svg).withConfig({
  displayName: 'pages__Image',
  componentId: 'sc-13drr0w-1',
})(['background-color:red;']);

const StyledImg = styled(Img).withConfig({
  displayName: 'pages__Image',
  componentId: 'sc-13drr0w-1',
})(['background-color:red;']);

export default () => (
  <div>
    <StyledSvg src={SvgImage} />
    <StyledImg src={JpgImage} webp />
  </div>
);
