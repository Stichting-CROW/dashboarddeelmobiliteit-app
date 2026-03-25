import { getPrettyVehicleTypeName, getVehicleIconUrl } from './vehicleTypes';

const escapeHtml = (value: string) => {
  const str = String(value ?? '');
  return str.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#039;';
      default:
        return c;
    }
  });
};

export const PERMITS_VEHICLE_TYPE_HEADER_IMG_CLASS = 'permits-vehicle-type-header-img';

export const getVehicleTypeIconSrc = (vehicleTypeId: string | null | undefined): string => {
  const src = getVehicleIconUrl(vehicleTypeId as string);
  return src || getVehicleIconUrl('other') || '';
};

export const getVehicleTypeIconAlt = (vehicleTypeId: string | null | undefined): string => {
  const prettyName = getPrettyVehicleTypeName(vehicleTypeId as string);
  if (!prettyName) return 'Onbekend';

  // The UI uses capitalized Dutch labels.
  return prettyName.charAt(0).toUpperCase() + prettyName.slice(1);
};

export const getVehicleTypeHeaderImgHtml = (
  vehicleTypeId: string | null | undefined,
  className = PERMITS_VEHICLE_TYPE_HEADER_IMG_CLASS,
  style = ''
): string => {
  const src = getVehicleTypeIconSrc(vehicleTypeId);
  if (!src) return '';

  const alt = getVehicleTypeIconAlt(vehicleTypeId);
  const styleAttr = style ? ` style="${escapeHtml(style)}"` : '';

  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(
    alt
  )}" class="${escapeHtml(className)}"${styleAttr} />`;
};

