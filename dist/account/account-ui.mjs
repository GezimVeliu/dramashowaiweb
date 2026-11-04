const colors = ['#d6ed73', '#f2a66f', '#8fc9c1', '#c3a5e8', '#e88f9d', '#91b8ed'];

export function avatarProfile(user = {}) {
  const source = String(user.user_metadata?.display_name || user.user_metadata?.full_name || user.email || 'BONC').trim();
  const words = source.includes('@') ? [source.split('@')[0]] : source.split(/\s+/);
  const initials = words.slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'B';
  let seed = 0;
  for (const char of String(user.id || user.email || source)) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return { initials, color: colors[seed % colors.length] };
}
