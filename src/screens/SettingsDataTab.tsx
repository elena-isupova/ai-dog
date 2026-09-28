import { useState } from 'react';
import { Card, Button } from '../components/ui';
import { TrainingSettings } from '../types';
import { Download, Trash2 } from 'lucide-react';

export function DataTab({ dog, actions }: { dog: any; actions: any }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const data = actions.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-dog-export-${dog.name}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        actions.importData(data);
      } catch (err) {
        alert('Failed to import: invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-4">Export Data</h2>
        <p className="text-body text-[var(--text-secondary)] mb-5">
          Download all your data (dog profile, sessions, progress, settings) as a JSON file.
          Useful for sharing with your vet or trainer, or for backup.
        </p>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? 'Exporting…' : 'Export All Data'}
        </Button>
      </Card>

      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-4">Import Data</h2>
        <p className="text-body text-[var(--text-secondary)] mb-4">
          Restore from a previously exported JSON file. This will replace all current data.
        </p>
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="sr-only"
          />
          <Button variant="secondary" size="lg" className="w-full">
            Choose File to Import
          </Button>
        </label>
      </Card>

      <Card padding="lg" variant="outlined">
        <h2 className="text-h3 text-[var(--text-primary)] mb-3 text-[var(--distress)]">Danger Zone</h2>
        <p className="text-body text-[var(--text-secondary)] mb-4">
          This will permanently delete your dog's profile, all training sessions, progress data, and settings. This cannot be undone.
        </p>
        <Button variant="destructive" size="lg" onClick={() => actions.resetAllData()} className="w-full">
          <Trash2 size={18} strokeWidth={2.5} className="mr-2" />
          Delete All Data
        </Button>
      </Card>
    </div>
  );
}