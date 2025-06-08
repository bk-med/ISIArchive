import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange, className = '' }) => {
  return (
    <div className={`flex rounded-lg border border-secondary-300 ${className}`}>
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded-l-lg transition-colors ${
          view === 'grid'
            ? 'bg-primary-600 text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50'
        }`}
        title="Vue grille"
      >
        <Grid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded-r-lg transition-colors ${
          view === 'list'
            ? 'bg-primary-600 text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50'
        }`}
        title="Vue liste"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ViewToggle; 