export const getColorFromName = (name) => {
    // Generate a hash from the name and convert it to a color
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = `hsl(${hash % 360}, 100%, 80%)`;
    return color;
};