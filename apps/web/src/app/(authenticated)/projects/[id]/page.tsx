'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { request } from '@/lib/api';

interface ProjectDetail {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: string;
  progress: number;
  budget: number;
  spend: number;
  manager?: string;
  type: string;
  risks: number;
  startDate?: string;
  endDate?: string;
  OrgUnit?: { id: number; name: string };
  activities?: Array<{ id: number; title: string; status: string }>;
  milestones?: Array<{ id: number; title: string; dueDate?: string; status: string }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await request<ProjectDetail>(`/project/projects/${projectId}`);
        setProject(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Project not found'}</p>
        </div>
      </div>
    );
  }

  const budgetUtilization = project.budget ? ((project.spend / project.budget) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Project Detail</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{project.name}</h1>
        {project.code && <p className="text-sm text-gray-500 mt-1">Code: {project.code}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">{project.status.replace('_', ' ')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Progress</p>
          <p className="text-lg font-semibold text-gray-900">{project.progress}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Budget Utilization</p>
          <p className="text-lg font-semibold text-gray-900">{budgetUtilization}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Organization Unit</p>
            <p className="text-sm font-medium text-gray-900">{project.OrgUnit?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Manager</p>
            <p className="text-sm font-medium text-gray-900">{project.manager || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="text-sm font-medium text-gray-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="text-sm font-medium text-gray-900">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Budget</p>
            <p className="text-sm font-medium text-gray-900">{project.budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Spend</p>
            <p className="text-sm font-medium text-gray-900">{project.spend.toLocaleString()}</p>
          </div>
        </div>
        {project.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-sm text-gray-900 mt-1">{project.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Related Records</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href={`/workplan?projectId=${project.id}`} className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <h3 className="font-medium text-gray-900">Activities</h3>
            <p className="text-sm text-gray-500">View project activities</p>
          </a>
          <a href={`/budget?projectId=${project.id}`} className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <h3 className="font-medium text-gray-900">Budget</h3>
            <p className="text-sm text-gray-500">View project budget</p>
          </a>
          <a href={`/risk-compliance?projectId=${project.id}`} className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <h3 className="font-medium text-gray-900">Risks</h3>
            <p className="text-sm text-gray-500">View project risks</p>
          </a>
        </div>
      </div>
    </div>
  );
}
