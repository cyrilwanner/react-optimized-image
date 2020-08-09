import React, { ReactElement } from 'react';
import { ImgSrc } from './types';

export interface SvgProps extends React.SVGProps<SVGSVGElement> {
  src: ImgSrc;
}

interface SvgInnerProps extends React.SVGProps<SVGSVGElement> {
  rawSrc: { default: React.ElementType };
}

const Svg = ({ src, ...props }: SvgProps): ReactElement => {
  const inner = ({ src, ...props } as unknown) as SvgInnerProps;

  if (!inner.rawSrc) {
    throw new Error(
      "Babel plugin 'react-optimized-image/plugin' not installed or this component could not be recognized by it.",
    );
  }

  const SvgComponent: React.ElementType = inner.rawSrc.default || inner.rawSrc;

  if (typeof SvgComponent !== 'function') {
    throw new Error(
      "No react component generated. Please set `includeStrategy` option of optimized-images-loader to 'react'",
    );
  }

  return <SvgComponent {...props} />;
};

export default Svg;
