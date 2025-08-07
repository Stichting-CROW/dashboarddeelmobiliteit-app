/* Based on https://www.npmjs.com/package/@cloudfour/simple-svg-placeholder */

interface CreateSvgPlaceholderOptions {
  width?: number;
  height?: number;
  text?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  dy?: number;
  bgColor?: string;
  textColor?: string;
  dataUri?: boolean;
  charset?: string;
  radius?: number | false;
}

function createSvgPlaceholder({
  width = 300,
  height = 150,
  text,
  fontFamily = 'sans-serif',
  fontWeight = 'bold',
  fontSize,
  dy,
  bgColor = '#ddd',
  textColor = 'rgba(0,0,0,0.5)',
  dataUri = true,
  charset = 'UTF-8',
  radius = false,
}: CreateSvgPlaceholderOptions = {}): string {
  const resolvedFontSize = fontSize !== undefined ? fontSize : Math.floor(Math.min(width, height) * 0.2);
  const resolvedDy = dy !== undefined ? dy : resolvedFontSize * 0.35;
  const resolvedText = text !== undefined ? text : `${width}×${height}`;

  const str = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="${bgColor}" width="${width}" height="${height}" ${radius!==false ? `rx="${radius}"` : ''}/>
    <text fill="${textColor}" font-family="${fontFamily}" font-size="${resolvedFontSize}" dy="${resolvedDy}" font-weight="${fontWeight}" x="50%" y="50%" text-anchor="middle">${resolvedText}</text>
  </svg>`;

  // Thanks to: filamentgroup/directory-encoder
  const cleaned = str
    .replace(/[\t\n\r]/gim, '') // Strip newlines and tabs
    .replace(/\s\s+/g, ' ') // Condense multiple spaces
    .replace(/'/gim, '\\i'); // Normalize quotes

  if (dataUri) {
    const encoded = encodeURIComponent(cleaned)
      .replace(/\(/g, '%28') // Encode brackets
      .replace(/\)/g, '%29');

    return `data:image/svg+xml;charset=${charset},${encoded}`;
  }

  return cleaned;
}

export default createSvgPlaceholder;