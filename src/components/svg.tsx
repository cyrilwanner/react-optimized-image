import React, { ReactElement } from 'react';

export interface SvgProps {
  src: string;
}

const Svg = ({ src }: SvgProps): ReactElement => {
  return <span dangerouslySetInnerHTML={{ __html: src }} />; // eslint-disable-line react/no-danger
};

export default Svg;
