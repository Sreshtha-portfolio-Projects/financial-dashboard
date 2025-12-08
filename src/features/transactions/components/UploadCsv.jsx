import { useState } from 'react';
import httpClient from '../../../lib/httpClient';

export function UploadCsv({ onImportComplete }) {
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: mapping
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [mapping, setMapping] = useState({
    amountField: '',
    typeField: '',
    categoryField: '',
    dateField: '',
    noteField: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    // Read and preview first 10 rows
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').slice(0, 11); // Header + 10 rows
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });

      setPreview({ headers, rows });
      setStep(2);
    };
    reader.readAsText(selectedFile);
  };

  const handleMappingChange = (field, value) => {
    setMapping({ ...mapping, [field]: value });
  };

  const handleImport = async () => {
    if (!mapping.amountField || !mapping.dateField) {
      setError('Amount and Date fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result.split(',')[1]; // Remove data:... prefix

        const response = await httpClient.post('/import/csv', {
          file: base64,
          mapping,
        });

        setResult(response.data);
        setStep(4); // Show results
        if (onImportComplete) {
          onImportComplete();
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Import failed');
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview([]);
    setMapping({
      amountField: '',
      typeField: '',
      categoryField: '',
      dateField: '',
      noteField: '',
    });
    setError('');
    setResult(null);
  };

  if (step === 4 && result) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Import Complete</h3>
        <div className="space-y-2 mb-4">
          <p>Total rows: {result.total_rows}</p>
          <p className="text-green-600">Success: {result.success_rows}</p>
          <p className="text-red-600">Failed: {result.failed_rows}</p>
          <p>Status: {result.status}</p>
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Import Another File
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Import Transactions from CSV</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">{error}</div>
      )}

      {step === 1 && (
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      )}

      {step === 2 && preview && (
        <div>
          <h4 className="font-medium mb-2">Preview (first 10 rows)</h4>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {preview.headers.map((header) => (
                    <th key={header} className="px-2 py-1 text-left border">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {preview.headers.map((header) => (
                      <td key={header} className="px-2 py-1 border">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setStep(3)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Continue to Mapping
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h4 className="font-medium">Map CSV columns to fields</h4>
          <div>
            <label className="block text-sm font-medium mb-1">
              Amount Field <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={mapping.amountField}
              onChange={(e) => handleMappingChange('amountField', e.target.value)}
              className="w-full rounded-md border-gray-300"
            >
              <option value="">Select column</option>
              {preview.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Date Field <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={mapping.dateField}
              onChange={(e) => handleMappingChange('dateField', e.target.value)}
              className="w-full rounded-md border-gray-300"
            >
              <option value="">Select column</option>
              {preview.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type Field (optional)</label>
            <select
              value={mapping.typeField}
              onChange={(e) => handleMappingChange('typeField', e.target.value)}
              className="w-full rounded-md border-gray-300"
            >
              <option value="">Select column (optional)</option>
              {preview.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category Field (optional)</label>
            <select
              value={mapping.categoryField}
              onChange={(e) => handleMappingChange('categoryField', e.target.value)}
              className="w-full rounded-md border-gray-300"
            >
              <option value="">Select column (optional)</option>
              {preview.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note Field (optional)</label>
            <select
              value={mapping.noteField}
              onChange={(e) => handleMappingChange('noteField', e.target.value)}
              className="w-full rounded-md border-gray-300"
            >
              <option value="">Select column (optional)</option>
              {preview.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

