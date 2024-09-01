export const getImageUrl = (path) => {
    return new URL(`../assets/${path}`, import.meta.url).href;
};  

export const getCroppedImg = (imageSrc, pixelCrop, size) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();

    canvas.width = size;
    canvas.height = size;

    return new Promise((resolve, reject) => {
        image.onload = () => {
            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                size,
                size
            );
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                blob.name = 'croppedImage.png';
                resolve(blob);
            }, 'image/png');
        };
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = imageSrc;
    });
}

export const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = reject;
    });
};