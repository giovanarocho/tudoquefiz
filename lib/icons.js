export const ICONS = {
  textil: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="24" cy="24" r="15"/><path d="M12 24c4-6 10-9 12-9s-2 8-6 11 8 3 12-2"/></svg>',
  ceramica: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h14l-2 10c4 3 6 8 6 12 0 7-6.5 10-11 10s-11-3-11-10c0-4 2-9 6-12z"/><path d="M17 8c0 3 3 4 7 4s7-1 7-4"/></svg>',
  papelaria: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 12c-3-2-9-3-14-2v26c5-1 11 0 14 2 3-2 9-3 14-2V10c-5-1-11 0-14 2z"/><path d="M24 12v26"/></svg>',
  pintura: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M35 8c3 0 5 2 5 5 0 4-9 12-16 19-2 2-6 3-8 1s-1-6 1-8c7-7 15-16 18-17z"/><circle cx="14" cy="35" r="5"/></svg>',
  madeira: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="16" width="34" height="16" rx="3"/><path d="M7 24h34M14 16v16M28 16v16"/></svg>',
  velas: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 9c3 4 3 6 0 9-3-3-3-5 0-9z"/><rect x="16" y="18" width="16" height="21" rx="3"/><path d="M16 26h16"/></svg>',
  joias: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="M14 12h20l7 9-17 17L7 21z"/><path d="M14 12l10 9 10-9M7 21h34"/></svg>',
  moda: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 12a4 4 0 1 1 4 4"/><path d="M24 16 9 24l3 6 6-3v12h20V27l6 3 3-6z"/></svg>',
  infantil: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><rect x="8" y="24" width="14" height="14" rx="2"/><rect x="26" y="24" width="14" height="14" rx="2"/><rect x="17" y="10" width="14" height="14" rx="2"/></svg>',
  decoracao: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><rect x="9" y="9" width="30" height="30" rx="3"/><path d="M9 30l9-9 7 6 6-8 8 11"/></svg>',
  reciclagem: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8l7 8h-5l6 12M24 8l-7 8h5"/><path d="M13 25l-5 9h11M13 25l-4 7"/><path d="M35 25l5 9H29"/></svg>',
  servicos: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8v4M8 24h4M36 24h4M13 13l3 3M32 16l3-3M13 35l3-3"/><path d="M17 27a7 7 0 1 1 14 0c0 3-2 4-2 7h-10c0-3-2-4-2-7z"/></svg>',
  outros: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="M8 16l16-8 16 8-16 8z"/><path d="M8 16v16l16 8 16-8V16M24 24v16"/></svg>'
};

export function Icon({ name, ...props }) {
  return <span {...props} dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.outros }} />;
}
