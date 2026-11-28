// Conjunto de iconos vectoriales (24×24, trazo) para estadísticas y controles.
const paths={
  hp:'<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" fill="currentColor" fill-opacity=".25"/>',
  leech:'<path d="M12 3.5c3 4.2 5.5 7.4 5.5 10.6a5.5 5.5 0 0 1-11 0C6.5 10.9 9 7.7 12 3.5Z" fill="currentColor" fill-opacity=".3"/><path d="M9.4 13.2l1.3 2.4 1.3-2.4 1.3 2.4 1.3-2.4"/>',
  ward:'<path d="M12 3.2 19 6v5.4c0 4.6-3 7.9-7 9.4-4-1.5-7-4.8-7-9.4V6Z" fill="currentColor" fill-opacity=".2"/><path d="M12 7v10"/>',
  initiative:'<path d="M13.5 2.8 6 13.2h5.2L10 21.2l8-11h-5.3Z" fill="currentColor" fill-opacity=".25"/>',
  mp:'<path d="M8 4.5c1.6 0 2.4 1.6 2.4 3.6S9.6 12 8 12 5.6 10 5.6 8.1 6.4 4.5 8 4.5Z" fill="currentColor" fill-opacity=".25"/><path d="M6 14.5h4"/><path d="M16 9.5c1.6 0 2.4 1.6 2.4 3.6S17.6 17 16 17s-2.4-2-2.4-3.9.8-3.6 2.4-3.6Z" fill="currentColor" fill-opacity=".25"/><path d="M14 19.5h4"/>',
  ap:'<path d="M12 3.2 20.8 12 12 20.8 3.2 12Z" fill="currentColor" fill-opacity=".25"/><path d="M12 8 16 12 12 16 8 12Z" fill="currentColor"/>',
  attack:'<path d="m5 19 9.5-9.5M14.5 4.5 19.5 4.5 19.5 9.5 10 19M3.5 15.5l5 5M6.5 17.5l-3 3"/>',
  physical:'<path d="M5.5 18.5 17 7l1.5-3.5L15 5 3.5 16.5M3 14.5l6.5 6.5M4.5 19.5l-1.5 1.5"/>',
  fire:'<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.8 3.5-5.4 3.5-9.4 2.4 1.3 4 3.4 4 5.8.9-.6 1.5-1.7 1.6-3 1.9 1.5 2.9 3.9 2.9 6.6 0 3.2-2.4 5.6-6 5.6Z" fill="currentColor" fill-opacity=".25"/><path d="M12 21c-1.5 0-2.5-1-2.5-2.4 0-1.6 1.4-2.3 2.5-3.8 1.1 1.5 2.5 2.2 2.5 3.8 0 1.4-1 2.4-2.5 2.4Z"/>',
  ice:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.6 12 6.6l2.5-2M9.5 19.4l2.5-2 2.5 2"/>',
  arcane:'<path d="M12 3.5 13.9 10.1 20.5 12 13.9 13.9 12 20.5 10.1 13.9 3.5 12 10.1 10.1Z" fill="currentColor" fill-opacity=".25"/><circle cx="18.5" cy="5.5" r="1.2" fill="currentColor"/>',
  shadow:'<path d="M15.5 4.2A8 8 0 1 0 19.8 15 6.5 6.5 0 0 1 15.5 4.2Z" fill="currentColor" fill-opacity=".25"/>',
  vitality:'<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" fill="currentColor" fill-opacity=".25"/><path d="M12 10.5v5M9.5 13h5"/>',
  reach:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  range:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  critical:'<path d="M12 2.8 13.7 8.6 19.6 6.6 15.6 11.2 21 14.4 14.8 14.8 15.4 21 12 16 8.6 21 9.2 14.8 3 14.4 8.4 11.2 4.4 6.6 10.3 8.6Z" fill="currentColor" fill-opacity=".25"/>',
  movement:'<path d="M8 4.5c1.6 0 2.4 1.6 2.4 3.6S9.6 12 8 12 5.6 10 5.6 8.1 6.4 4.5 8 4.5Z" fill="currentColor" fill-opacity=".25"/><path d="M16 9.5c1.6 0 2.4 1.6 2.4 3.6S17.6 17 16 17s-2.4-2-2.4-3.9.8-3.6 2.4-3.6Z" fill="currentColor" fill-opacity=".25"/>',
  action:'<path d="M12 3.2 20.8 12 12 20.8 3.2 12Z" fill="currentColor" fill-opacity=".25"/><path d="M12 8 16 12 12 16 8 12Z" fill="currentColor"/>',
  level:'<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z" fill="currentColor" fill-opacity=".2"/><path d="m8.5 13.5 3.5-3.5 3.5 3.5"/>',
  poison:'<path d="M12 3.5c3 4 5.5 7 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 10.5 9 7.5 12 3.5Z" fill="currentColor" fill-opacity=".25"/><circle cx="10" cy="14" r="1.2" fill="currentColor"/><circle cx="14" cy="16" r=".9" fill="currentColor"/>',
  expose:'<path d="M12 3.2 19 6v5.4c0 4.6-3 7.9-7 9.4-4-1.5-7-4.8-7-9.4V6Z"/><path d="m13 6.5-2.5 5 3 1-2 5"/>',
  weak:'<circle cx="12" cy="11" r="6.5"/><path d="M9 9.5l1.5 1.5M10.5 9.5 9 11M13.5 9.5l1.5 1.5M15 9.5 13.5 11M9.5 14.5c1.5-1 3.5-1 5 0M12 17.5v3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  magic:'<path d="M12 3.5 13.9 10.1 20.5 12 13.9 13.9 12 20.5 10.1 13.9 3.5 12 10.1 10.1Z" fill="currentColor" fill-opacity=".25"/><circle cx="18.5" cy="5.5" r="1.2" fill="currentColor"/><circle cx="5.5" cy="18.5" r=".9" fill="currentColor"/>',
  lightning:'<path d="M13.5 2.8 5.5 13.2h5.4l-1.4 8 8-10.4h-5.4Z" fill="currentColor" fill-opacity=".3"/>',
  chaos:'<path d="M12 4.2c4.3 0 7.8 3.5 7.8 7.8s-3.5 7.8-7.8 7.8"/><path d="M12 19.8c-4.3 0-7.8-3.5-7.8-7.8S7.7 4.2 12 4.2"/><path d="M12 8.2a3.8 3.8 0 1 1 0 7.6 1.9 1.9 0 0 1 0-3.8" fill="currentColor" fill-opacity=".25"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
  forge:'<path d="M4 9.5h11.5c0 2.5-2 4-4.5 4H9.5l-.8 3.5H14v2.5H6v-2.5h1.4l.8-3.5C5.8 13.5 4 12 4 9.5Z" fill="currentColor" fill-opacity=".25"/><path d="M15.5 9.5h2.2l2.3-2"/><path d="M13 4.5l2.5 2.5M15 3l1.5 1.5"/>',
  burn:'<path d="M12 3c.6 3.2 4.8 5 4.8 9.6A4.8 4.8 0 0 1 12 17.4a4.8 4.8 0 0 1-4.8-4.8c0-2 1-3.2 2.2-4.2.2 1.4.9 2.2 1.8 2.6C11 9 11.1 5.6 12 3Z" fill="currentColor" fill-opacity=".3"/><path d="M10.5 20.5h3"/>',
  pause:'<rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" fill-opacity=".35"/><rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" fill-opacity=".35"/>',
  dice:'<rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" fill-opacity=".15"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/>',
  slow:'<rect x="3.5" y="9" width="8" height="6" rx="3"/><rect x="12.5" y="9" width="8" height="6" rx="3"/><path d="M9.5 12h5"/>',
  glyph:'<path d="M12 2.8 20.5 12 12 21.2 3.5 12Z"/><path d="M12 7.5v9M7.5 12h9"/>',
  gold:'<path d="M3.5 19.5c1.2-3.6 4.4-6.8 8.5-6.8s7.3 3.2 8.5 6.8Z" fill="currentColor" fill-opacity=".55"/><path d="M3 19.5h18"/><circle cx="7.5" cy="10" r=".9" fill="currentColor"/><circle cx="16.5" cy="8.5" r=".8" fill="currentColor"/><circle cx="12" cy="6" r="1" fill="currentColor"/><circle cx="9.5" cy="15.5" r=".6" fill="#fff"/><circle cx="14" cy="16.2" r=".5" fill="#fff"/>',
  xp:'<path d="M12 3.5 14.5 9l6 .6-4.5 4 1.3 6-5.3-3.1-5.3 3.1 1.3-6-4.5-4 6-.6Z" fill="currentColor" fill-opacity=".25"/>',
  bag:'<path d="M5 9h14l-1 11H6Z" fill="currentColor" fill-opacity=".2"/><path d="M9 9V7a3 3 0 0 1 6 0v2M9.5 13h5"/>',
  sound:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" fill-opacity=".25"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" fill-opacity=".25"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  cube:'<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  grid:'<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
  zoomIn:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/>',
  zoomOut:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6"/>',
  shop:'<path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5c0 1.4 1.1 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.1 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1 2.5 2.6 2.5S20 10.9 20 9.5"/><path d="M5.5 12v8h13v-8M10 20v-4.5h4V20"/>',
  exit:'<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  copy:'<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-3a1.5 1.5 0 0 0-1.5-1.5H6a1.5 1.5 0 0 0-1.5 1.5V14A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  log:'<path d="M6 3.5h12v17H6Z" fill="currentColor" fill-opacity=".15"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  move:'<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  sword:'<path d="M5.5 18.5 17 7l1.5-3.5L15 5 3.5 16.5M3 14.5l6.5 6.5M4.5 19.5l-1.5 1.5"/>',
  users:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.5 14.2c2.4 0 4.3 1.6 5 4.8"/>',
  play:'<path d="M7 4.5v15l12-7.5Z" fill="currentColor" fill-opacity=".3"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
  skull:'<path d="M12 3.5c-4.4 0-7.5 3-7.5 7 0 2.4 1.1 4.2 3 5.3V19h9v-3.2c1.9-1.1 3-2.9 3-5.3 0-4-3.1-7-7.5-7Z" fill="currentColor" fill-opacity=".2"/><circle cx="9" cy="11" r="1.6" fill="currentColor"/><circle cx="15" cy="11" r="1.6" fill="currentColor"/><path d="M10.5 19v-2M13.5 19v-2"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  heal:'<path d="M12 5v14M5 12h14"/>',
  crown:'<path d="M4 17.5 3 7.5l5 4 4-6.5 4 6.5 5-4-1 10Z" fill="currentColor" fill-opacity=".25"/><path d="M4.5 20.5h15"/>',
  question:'<circle cx="12" cy="12" r="8.5" fill="currentColor" fill-opacity=".15"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5M12 16.8v.2"/>',
  elite:'<path d="M12 3.5c-4.4 0-7.5 3-7.5 7 0 2.4 1.1 4.2 3 5.3V19h9v-3.2c1.9-1.1 3-2.9 3-5.3 0-4-3.1-7-7.5-7Z" fill="currentColor" fill-opacity=".25"/><path d="m7 9 3 1.5M17 9l-3 1.5"/><circle cx="9.3" cy="12" r="1.3" fill="currentColor"/><circle cx="14.7" cy="12" r="1.3" fill="currentColor"/><path d="M10.5 19v-2M13.5 19v-2"/>',
  water:'<path d="M3 10c2 0 2-1.5 4.5-1.5S9.5 10 12 10s2.5-1.5 4.5-1.5S19 10 21 10M3 15c2 0 2-1.5 4.5-1.5S9.5 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15"/>',
  spikes:'<path d="M3 20h18M5 20l2-9 2 9M10 20l2-12 2 12M15 20l2-9 2 9" fill="currentColor" fill-opacity=".2"/>',
  gas:'<path d="M5 15a3.5 3.5 0 0 1 1-6.8A5 5 0 0 1 15.5 7 4 4 0 0 1 19 15Z" fill="currentColor" fill-opacity=".25"/><path d="M7 19h4M13 19h4"/>',
  lock:'<rect x="5.5" y="10.5" width="13" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  cleanse:'<path d="M12 3.5 14 9.5l6 .5-4.6 3.9L17 20l-5-3.3L7 20l1.6-6.1L4 10l6-.5Z"/>'
};
paths.dash=paths.shadow;paths.venom=paths.poison;paths.blast=paths.fire;paths.push=paths.mp;paths.damage=paths.attack;

/** Devuelve un elemento <svg> con el icono pedido. */
export function icon(name,className=''){
  const holder=document.createElement('span');
  holder.className='icon icon-'+name+(className?' '+className:'');
  holder.setAttribute('aria-hidden','true');
  holder.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||paths.info)+'</svg>';
  return holder;
}
export const hasIcon=name=>name in paths;
