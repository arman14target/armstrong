import { absoluteAssetUrl } from "@/lib/siteUrl";

export const OG_IMAGE_PATH = "/og-image.jpg";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function buildOgImage(alt: string) {
  const url = absoluteAssetUrl(OG_IMAGE_PATH);
  return {
    url,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}
