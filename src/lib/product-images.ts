import type { StaticImageData } from "next/image";
import bagImage from "@/images/mis-bag.jpeg";
import boxImage from "@/images/mis-box.jpeg";
import hatImage from "@/images/mis-hat.jpeg";
import keychainImage from "@/images/mis-keychain.jpeg";
import lanyardImage from "@/images/mis-lanyard.jpeg";
import spandukImage from "@/images/mis-spanduk.jpeg";
import stickerImage from "@/images/mis-sticker.jpeg";
import tshirtImage from "@/images/mis-tshirt.jpeg";

const PRODUCT_NAME_IMAGES: {
  keywords: string[];
  image: StaticImageData;
  overrideUploaded?: boolean;
}[] = [
  {
    keywords: ["gantungan kunci", "keychain", "key chain"],
    image: keychainImage,
    overrideUploaded: true,
  },
  {
    keywords: ["trucker jaring"],
    image: hatImage,
    overrideUploaded: true,
  },
  { keywords: ["lanyard", "tali id", "tali-id", "id card", "idcard"], image: lanyardImage },
  { keywords: ["paper bag", "goodie bag", "tote bag", "totebag", "tas", "bag"], image: bagImage },
  { keywords: ["topi", "cap"], image: hatImage },
  { keywords: ["kaos", "t-shirt", "tshirt", "tee shirt", "apparel"], image: tshirtImage },
  { keywords: ["stiker", "sticker", "label"], image: stickerImage },
  {
    keywords: ["spanduk", "banner"],
    image: spandukImage,
    overrideUploaded: true,
  },
  { keywords: ["box", "kardus", "kotak", "kemasan"], image: boxImage },
];

const PRODUCT_TYPE_IMAGES: Record<string, StaticImageData> = {
  tas: bagImage,
  box: boxImage,
  kemasan: boxImage,
  stiker: stickerImage,
  label: stickerImage,
  cetak: spandukImage,
};

function normalizeProductText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(text: string, keyword: string) {
  return ` ${text} `.includes(` ${normalizeProductText(keyword)} `);
}

export function getProductImage(
  name: string,
  type?: string,
): { image: StaticImageData; overrideUploaded: boolean } | null {
  const normalizedName = normalizeProductText(name);
  const nameMatch = PRODUCT_NAME_IMAGES.find(({ keywords }) =>
    keywords.some((keyword) => containsKeyword(normalizedName, keyword)),
  );

  if (nameMatch) {
    return {
      image: nameMatch.image,
      overrideUploaded: nameMatch.overrideUploaded ?? false,
    };
  }

  const typeImage = type ? PRODUCT_TYPE_IMAGES[normalizeProductText(type)] : null;
  return typeImage ? { image: typeImage, overrideUploaded: false } : null;
}
