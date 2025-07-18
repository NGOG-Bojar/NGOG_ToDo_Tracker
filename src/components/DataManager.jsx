import React,{useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {useTask} from '../contexts/TaskContext';
import {useCategory} from '../contexts/CategoryContext';
import {useProject} from '../contexts/ProjectContext';
import {useEvent} from '../contexts/EventContext';
import {useActivityLogCategory} from '../contexts/ActivityLogCategoryContext';
import {dataService} from '../services/api';
import {format} from 'date-fns';

const {FiDownload,FiUpload,FiFileText,FiAlertTriangle,FiCheck,FiX,FiDatabase,FiRefreshCw}=FiIcons;

function DataManager({isOpen,onClose}) {
const [importStatus,setImportStatus]=useState(null);
const [exportStatus,setExportStatus]=useState(null);
const [showConfirmDialog,setShowConfirmDialog]=useState(false);
const [pendingImportData,setPendingImportData]=useState(null);
const [isExporting,setIsExporting]=useState(false);
const [isImporting,setIsImporting]=useState(false);

const {tasks}=useTask();
const {categories}=useCategory();
const {projects}=useProject();
const {events}=useEvent();
const {activityLogCategories}=useActivityLogCategory();

const exportData=async ()=> {
setIsExporting(true);
setExportStatus(null);

try {
// Export data from Supabase
const exportData=await dataService.exportData();

// Create and download file
const dataStr=JSON.stringify(exportData,null,2);
const dataBlob=new Blob([dataStr],{type: 'application/json'});
const url=URL.createObjectURL(dataBlob);
const link=document.createElement('a');
link.href=url;
link.download=`ngog-todo-tracker-backup-${format(new Date(),'yyyy-MM-dd-HH-mm-ss')}.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

setExportStatus({
type: 'success',
message: 'Data exported successfully!'
});
} catch (error) {
console.error('Export error:',error);
setExportStatus({
type: 'error',
message: 'Failed to export data: ' + error.message
});
} finally {
setIsExporting(false);
setTimeout(()=> setExportStatus(null),5000);
}
};

const handleFileSelect=(event)=> {
const file=event.target.files[0];
if (!file) return;

const reader=new FileReader();
reader.onload=(e)=> {
try {
const importData=JSON.parse(e.target.result);

// Validate file structure
if (!importData.data || !importData.data.tasks || !importData.data.categories) {
throw new Error('Invalid backup file format');
}

// Validate version compatibility
if (importData.version && !isVersionCompatible(importData.version)) {
throw new Error('Backup file version is not compatible with current app version');
}

setPendingImportData(importData);
setShowConfirmDialog(true);
} catch (error) {
setImportStatus({
type: 'error',
message: 'Failed to read backup file: ' + error.message
});
setTimeout(()=> setImportStatus(null),5000);
}
};

reader.readAsText(file);
event.target.value='';// Reset file input
};

const confirmImport=async ()=> {
setIsImporting(true);
setImportStatus(null);

try {
// Import data to Supabase
await dataService.importData(pendingImportData);

setImportStatus({
type: 'success',
message: 'Data imported successfully! The page will refresh to load the new data.'
});

setShowConfirmDialog(false);
setPendingImportData(null);

// Auto-refresh after 2 seconds
setTimeout(()=> {
window.location.reload();
},2000);
} catch (error) {
console.error('Import error:',error);
setImportStatus({
type: 'error',
message: 'Failed to import data: ' + error.message
});
} finally {
setIsImporting(false);
setTimeout(()=> setImportStatus(null),5000);
}
};

const cancelImport=()=> {
setShowConfirmDialog(false);
setPendingImportData(null);
};

const isVersionCompatible=(version)=> {
// Add version compatibility logic here
// For now,accept all versions
return true;
};

const clearAllStatuses=()=> {
setImportStatus(null);
setExportStatus(null);
};

if (!isOpen) return null;

return (
<AnimatePresence>
<motion.div
initial={{opacity: 0}}
animate={{opacity: 1}}
exit={{opacity: 0}}
className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
onClick={onClose}
>
<motion.div
initial={{scale: 0.95,opacity: 0}}
animate={{scale: 1,opacity: 1}}
exit={{scale: 0.95,opacity: 0}}
className="bg-white rounded-lg shadow-xl max-w-md w-full"
onClick={(e)=> e.stopPropagation()}
>
<div className="flex items-center justify-between p-6 border-b">
<h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
<button
onClick={onClose}
className="text-gray-400 hover:text-gray-600 transition-colors"
>
<SafeIcon icon={FiX} className="text-xl" />
</button>
</div>

<div className="p-6 space-y-6">
{/* Export Section */}
<div className="space-y-3">
<h3 className="text-lg font-medium text-gray-900">Export Data</h3>
<p className="text-sm text-gray-600">
Download a backup file containing all your tasks,categories,projects,events,and settings from Supabase.
</p>
<button
onClick={exportData}
disabled={isExporting}
className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
{isExporting ? (
<>
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
<span>Exporting...</span>
</>
) : (
<>
<SafeIcon icon={FiDownload} className="text-lg" />
<span>Export All Data</span>
</>
)}
</button>
</div>

{/* Import Section */}
<div className="space-y-3 pt-6 border-t">
<h3 className="text-lg font-medium text-gray-900">Import Data</h3>
<p className="text-sm text-gray-600">
Restore your data from a previously exported backup file to Supabase.
</p>
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
<div className="flex items-start space-x-2">
<SafeIcon icon={FiAlertTriangle} className="text-yellow-600 text-sm mt-0.5" />
<p className="text-sm text-yellow-800">
<strong>Warning:</strong> This will replace all current data in Supabase. Make sure to export your current data first if needed.
</p>
</div>
</div>
<label className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
<SafeIcon icon={FiUpload} className="text-lg" />
<span>Import Data</span>
<input
type="file"
accept=".json"
onChange={handleFileSelect}
className="hidden"
disabled={isImporting}
/>
</label>
</div>

{/* Data Summary */}
<div className="bg-gray-50 rounded-lg p-4 space-y-2">
<h4 className="font-medium text-gray-900">Current Data Summary</h4>
<div className="grid grid-cols-2 gap-4 text-sm">
<div>
<span className="text-gray-600">Total Tasks:</span>
<span className="ml-2 font-medium">{tasks.length}</span>
</div>
<div>
<span className="text-gray-600">Categories:</span>
<span className="ml-2 font-medium">{categories.length}</span>
</div>
<div>
<span className="text-gray-600">Projects:</span>
<span className="ml-2 font-medium">{projects.length}</span>
</div>
<div>
<span className="text-gray-600">Events:</span>
<span className="ml-2 font-medium">{events.length}</span>
</div>
<div>
<span className="text-gray-600">Completed:</span>
<span className="ml-2 font-medium">{tasks.filter(t=> t.status==='completed').length}</span>
</div>
<div>
<span className="text-gray-600">Active Projects:</span>
<span className="ml-2 font-medium">{projects.filter(p=> !p.archived).length}</span>
</div>
</div>
</div>

{/* Status Messages */}
<AnimatePresence>
{(importStatus || exportStatus) && (
<motion.div
initial={{opacity: 0,y: 10}}
animate={{opacity: 1,y: 0}}
exit={{opacity: 0,y: -10}}
className={`p-3 rounded-lg border ${
(importStatus?.type || exportStatus?.type)==='success'
? 'bg-green-50 border-green-200 text-green-800'
: 'bg-red-50 border-red-200 text-red-800'
}`}
>
<div className="flex items-center space-x-2">
<SafeIcon
icon={(importStatus?.type || exportStatus?.type)==='success' ? FiCheck : FiAlertTriangle}
className="text-sm"
/>
<span className="text-sm">{importStatus?.message || exportStatus?.message}</span>
</div>
</motion.div>
)}
</AnimatePresence>
</div>
</motion.div>
</motion.div>

{/* Confirmation Dialog */}
<AnimatePresence>
{showConfirmDialog && (
<motion.div
initial={{opacity: 0}}
animate={{opacity: 1}}
exit={{opacity: 0}}
className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
>
<motion.div
initial={{scale: 0.95,opacity: 0}}
animate={{scale: 1,opacity: 1}}
exit={{scale: 0.95,opacity: 0}}
className="bg-white rounded-lg shadow-xl max-w-md w-full"
>
<div className="p-6">
<div className="flex items-center space-x-3 mb-4">
<SafeIcon icon={FiAlertTriangle} className="text-red-600 text-2xl" />
<h3 className="text-lg font-semibold text-gray-900">Confirm Data Import</h3>
</div>

<div className="space-y-4">
<p className="text-sm text-gray-600">
This will replace all your current data in Supabase with the imported data. This action cannot be undone.
</p>

{pendingImportData && (
<div className="bg-gray-50 rounded-lg p-3 space-y-2">
<h4 className="font-medium text-gray-900">Import Summary:</h4>
<div className="text-sm space-y-1">
<div>Tasks: {pendingImportData.metadata?.totalTasks || 0}</div>
<div>Categories: {pendingImportData.metadata?.totalCategories || 0}</div>
<div>Projects: {pendingImportData.metadata?.totalProjects || 0}</div>
<div>Events: {pendingImportData.metadata?.totalEvents || 0}</div>
<div>
Export Date: {pendingImportData.exportDate
? format(new Date(pendingImportData.exportDate),'MMM dd,yyyy HH:mm')
: 'Unknown'}
</div>
</div>
</div>
)}

<div className="flex space-x-3">
<button
onClick={cancelImport}
disabled={isImporting}
className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
Cancel
</button>
<button
onClick={confirmImport}
disabled={isImporting}
className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
{isImporting ? (
<div className="flex items-center justify-center space-x-2">
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
<span>Importing...</span>
</div>
) : (
'Import Data'
)}
</button>
</div>
</div>
</div>
</motion.div>
</motion.div>
)}
</AnimatePresence>
</AnimatePresence>
);
}

export default DataManager;