// Avatar color variations for users without profile pictures
export const getAvatarColor = (userId, name) => {
  const SOFT_COLORS = [
    '#7B8CDE', '#9BA5E1', '#B5A8E5', '#C89FD8', '#E89FC8',
    '#A8B5E6', '#C8D4F0', '#D5B4E8', '#E0B8D8', '#D8B8A8',
  ];
  
  // Use userId or name to generate consistent color index
  const seed = userId || name || 'default';
  const hash = seed.toString().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % SOFT_COLORS.length;
  const baseColor = SOFT_COLORS[index];
  
  // Return single color for solid backgrounds or create gradient
  return [baseColor, baseColor];
};