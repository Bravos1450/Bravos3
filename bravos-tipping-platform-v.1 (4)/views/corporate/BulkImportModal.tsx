
import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { Associate, ActionType } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface BulkImportModalProps {
  corporateId: string;
  onClose: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ corporateId, onClose }) => {
  const { dispatch } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      setFile(null);
      dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Please select a valid .csv file.', type: 'error' } });
    }
  };

  const handleImport = async () => {
    if (!file) {
      dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'No file selected.', type: 'error' } });
      return;
    }
    if (!db) {
        dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Database not available.', type: 'error' } });
        return;
    }
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split(/\r\n|\n/);
      const headers = lines[0].split(',').map(h => h.trim());
      
      const requiredHeaders = ['email', 'name', 'role', 'aboutMe'];
      if (!requiredHeaders.every(h => headers.includes(h))) {
          dispatch({ type: ActionType.SHOW_TOAST, payload: { message: `CSV must contain headers: ${requiredHeaders.join(', ')}`, type: 'error' } });
          setIsImporting(false);
          return;
      }

      const associatesToImport: Omit<Associate, 'id' | 'authUid'>[] = [];
      const emailsToImport: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const data = lines[i].split(',');
        const associateData: any = {};
        headers.forEach((header, index) => {
            associateData[header] = data[index]?.trim() || '';
        });
        
        if (associateData.email && associateData.name) {
            associatesToImport.push({
                email: associateData.email,
                name: associateData.name,
                role: associateData.role || 'Team Member',
                aboutMe: associateData.aboutMe || `Proud member of the team.`,
                isCorporate: true,
                corporateId: corporateId,
                avatarUrl: `https://picsum.photos/seed/${associateData.name.toLowerCase().replace(/\s/g, '-')}/200`,
                allowTips: true,
            });
            emailsToImport.push(associateData.email);
        }
      }

      if (associatesToImport.length === 0) {
        dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'No valid associates found in the file to import.', type: 'error' } });
        setIsImporting(false);
        return;
      }
      
      try {
        // Check for existing emails in this corporation
        const q = db.collection('associates').where('corporateId', '==', corporateId).where('email', 'in', emailsToImport);
        const existingDocs = await q.get();
        const existingEmails = new Set(existingDocs.docs.map(doc => doc.data().email));
        
        const batch = db.batch();
        let importedCount = 0;

        associatesToImport.forEach(assoc => {
            if (!existingEmails.has(assoc.email)) {
                const newAssociateRef = db.collection('associates').doc();
                batch.set(newAssociateRef, assoc);
                importedCount++;
            }
        });

        await batch.commit();
        dispatch({ type: ActionType.SHOW_TOAST, payload: { message: `${importedCount} associates imported. ${existingEmails.size} skipped as duplicates.`, type: 'success' } });
        onClose();
      } catch (err) {
        console.error("Error during bulk import:", err);
        dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'An error occurred during the import process.', type: 'error' } });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-dark-text">Bulk Import Associates</h3>
          <p className="text-medium-text mt-1">Upload a CSV file to add multiple team members at once.</p>
        </div>
        <div className="p-6 bg-light-bg space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold">CSV Format Instructions:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Your file must be a .csv file.</li>
              <li>The first row must be a header row containing: <code className="font-mono bg-blue-100 p-1 rounded">email,name,role,aboutMe</code></li>
              <li>Each subsequent row should represent one associate.</li>
            </ul>
            <a href="/template.csv" download="bravos_template.csv" className="font-semibold text-primary hover:underline mt-2 inline-block">
              Download Template CSV
            </a>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-text mb-1">Upload CSV File</label>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange} 
              className="block w-full text-sm text-dark-text file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
            />
          </div>
        </div>
        <div className="p-4 bg-gray-100 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-dark-text font-semibold hover:bg-gray-300">
            Close
          </button>
          <button 
            type="button" 
            onClick={handleImport} 
            disabled={!file || isImporting}
            className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-hover font-semibold disabled:bg-gray-400"
          >
            {isImporting ? 'Importing...' : 'Import Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
