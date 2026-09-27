import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Icon } from '../lib/icons';

export default function CategoryChips({ active, onChange }) {
  const { categories } = useStore();
  return (
    <nav id="cats">
      <div className="wrap row">
        <button className={'chip' + (active === 'all' ? ' active' : '')} onClick={() => onChange('all')}>Tudo</button>
        {categories.map(c => (
          <button key={c.id} className={'chip' + (active === c.id ? ' active' : '')} onClick={() => onChange(c.id)}>
            <Icon name={c.icon} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
