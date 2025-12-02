export const BUILT_IN_PRODUCT_IMAGES: Record<string, string> = {
  'Wireless Mouse': '/mouse.jpg',
  'Mechanical Keyboard': 'https://images.unsplash.com/photo-1595044426077-d36d9236a9c0?auto=format&fit=crop&w=600&q=75',
  'Noise-Cancelling Headphones': 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=600&q=75',
  Router: '/router.png',
  Keyboard: '/keyboard.jpg',
  Headphone: '/headphone.jpg',
  Screen: '/screen.jpg',
  Laptop: '/laptop.jpg',
};

Object.values(BUILT_IN_PRODUCT_IMAGES).forEach(imagePath => {
  const fileName = imagePath.split('/').filter(Boolean).pop();
  if (fileName && !BUILT_IN_PRODUCT_IMAGES[fileName]) {
    BUILT_IN_PRODUCT_IMAGES[fileName] = imagePath;
  }
});

const normaliseImagePath = (imagePath: string) =>
  imagePath.startsWith('/') || imagePath.startsWith('http') ? imagePath : `/${imagePath}`;

export const registerProductImage = (key: string, imagePath: string) => {
  if (!key || !imagePath) {
    return;
  }

  const trimmedKey = key.trim();
  if (!trimmedKey) {
    return;
  }

  const normalisedPath = normaliseImagePath(imagePath.trim());

  BUILT_IN_PRODUCT_IMAGES[trimmedKey] = normalisedPath;

  const fileName = normalisedPath.split('/').filter(Boolean).pop();
  if (fileName && !BUILT_IN_PRODUCT_IMAGES[fileName]) {
    BUILT_IN_PRODUCT_IMAGES[fileName] = normalisedPath;
  }
};
