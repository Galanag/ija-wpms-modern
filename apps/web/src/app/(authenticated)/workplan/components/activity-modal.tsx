'use client';
import { useState } from 'react';
import { request } from '@/lib/api';

interface Activity {
  id?: number;
  title: string;
  description?: string;
  quarter?: string;
  startDate?: string;
  dueDate?: string;
  plannedQuantity?: number;
  unit?: string;
  priority: string;
  implementationStatus: string;
}

interface Props {
  activity?: Activity | null;
  yearId: number;
  orgUnits: {id: number; name: string}[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActivityModal({ activity, yearId, orgUnits, onClose, onSuccess }: Props) {
  const isEdit = !!activity?.id;
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">{isEdit ? 'Edit Activity' : 'Add New Activity'}</h2>
        {submitError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{submitError}</p>}
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const data = {
            title: fd.get('title'),
            description: fd.get('description'),
            quarter: fd.get('quarter'),
            startDate: fd.get('startDate'),
            dueDate: fd.get('dueDate'),
            plannedQuantity: parseFloat(fd.get('plannedQuantity') as string) || 0,
            unit: fd.get('unit'),
            priority: fd.get('priority'),
            implementationStatus: fd.get('implementationStatus'),
            yearId,
            orgUnitId: parseInt(fd.get('orgUnitId') as string) || undefined,
          };
           try {
             const path = isEdit ? `/workplan/activities/${activity!.id}` : '/workplan/activities';
             await request(path, {
               method: isEdit ? 'PUT' : 'POST',
               body: JSON.stringify(data),
             });
             onSuccess();
           } catch (err: any) {
             console.error(err);
             setSubmitError(err?.message || 'Failed to save activity. Please try again.');
           }
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input type="text" name="title" defaultValue={activity?.title} required className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" rows={2} defaultValue={activity?.description} className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quarter</label>
                <select name="quarter" defaultValue={activity?.quarter || 'Q1'} className="mt-1 block w-full border rounded-md px-3 py-2">
                  <option value="Q1">Q1</option><option value="Q2">Q2</option>
                  <option value="Q3">Q3</option><option value="Q4">Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Org Unit</label>
                <select name="orgUnitId" className="mt-1 block w-full border rounded-md px-3 py-2">
                  <option value="">Select Unit</option>
                  {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" name="startDate" defaultValue={activity?.startDate} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input type="date" name="dueDate" defaultValue={activity?.dueDate} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" name="plannedQuantity" step="any" defaultValue={activity?.plannedQuantity} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <input type="text" name="unit" defaultValue={activity?.unit} className="mt-1 block w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select name="priority" defaultValue={activity?.priority || 'medium'} className="mt-1 block w-full border rounded-md px-3 py-2">
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="implementationStatus" defaultValue={activity?.implementationStatus || 'not_started'} className="mt-1 block w-full border rounded-md px-3 py-2">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{isEdit ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
