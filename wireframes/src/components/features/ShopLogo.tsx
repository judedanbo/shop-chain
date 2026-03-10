import React from 'react';

interface ShopData {
  logoUrl?: string | null;
  name?: string;
  icon?: string;
}

interface ShopLogoProps {
  shop: ShopData;
  size?: number;
  borderRadius?: number;
  fontSize?: number;
  style?: React.CSSProperties;
}

export const ShopLogo: React.FC<ShopLogoProps> = ({ shop, size = 40, borderRadius = 12, fontSize, style = {} }) => {
  const fs = fontSize || Math.round(size * 0.55);

  if (shop?.logoUrl) {
    return (
      <div
        className="border-border shrink-0 overflow-hidden border-[1.5px]"
        style={{
          width: size,
          height: size,
          borderRadius,
          ...style,
        }}
      >
        <img src={shop.logoUrl} alt={shop.name || 'Shop'} className="block h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="bg-primary-bg border-primary/[0.19] flex shrink-0 items-center justify-center border-2"
      style={{
        width: size,
        height: size,
        borderRadius,
        fontSize: fs,
        ...style,
      }}
    >
      {shop?.icon || '🏪'}
    </div>
  );
};
