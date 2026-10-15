'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { request } from '@/lib/api';

interface EmployeeDetail {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  OrgUnit?: { id: number; name: string };
  User?: { id: number; username: string; fullName: string };
}

interface RelatedRecord {
  id: number;
  title: string;
  status: string;
  date?: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = Number(params.id);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedKpis, setRelatedKpis] = useState<RelatedRecord[]>([]);
  const [relatedActivities, setRelatedActivities] = useState<RelatedRecord[]>([]);
  const [relatedProjects, setRelatedProjects] = useState<RelatedRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [empData, kpis, activities, projects] = await Promise.all([
          request<EmployeeDetail>(`/organization/employees/employee/${employeeId}`),
          request<RelatedRecord[]>(`/kpi?employeeId=${employeeId}`).catch(() => []),
          request<RelatedRecord[]>(`/workplan/activities?employeeId=${employeeId}`).catch(() => []),
          request<RelatedRecord[]>(`/project/projects?managerEmployeeId=${employeeId}`).catch(() => []),
        ]);
        setEmployee(empData);
        setRelatedKpis(Array.isArray(kpis) ? kpis : []);
        setRelatedActivities(Array.isArray(activities) ? activities : []);
        setRelatedProjects(Array.isArray(projects) ? projects : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetchData();
  }, [employeeId]);

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

  if (error || !employee) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Employee not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Employee Profile</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{employee.fullName}</h1>
        {employee.jobTitle && <p className="text-sm text-gray-500 mt-1">{employee.jobTitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className={`text-lg font-semibold ${employee.active ? 'text-green-600' : 'text-red-600'}`}>
            {employee.active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Organization Unit</p>
          <p className="text-lg font-semibold text-gray-900">{employee.OrgUnit?.name || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Account</p>
          <p className="text-lg font-semibold text-gray-900">{employee.User ? employee.User.username : 'No account'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-900">{employee.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-sm font-medium text-gray-900">{employee.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900">{new Date(employee.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-sm font-medium text-gray-900">{new Date(employee.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Related KPIs</h3>
          {relatedKpis.length === 0 ? (
            <p className="text-sm text-gray-500">No KPIs assigned</p>
          ) : (
            <ul className="space-y-2">
              {relatedKpis.slice(0, 5).map((kpi) => (
                <li key={kpi.id} className="text-sm">
                  <a href={`/kpi?id=${kpi.id}`} className="text-blue-600 hover:underline">{kpi.title}</a>
                  <span className="text-gray-500 text-xs ml-2">{kpi.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Related Activities</h3>
          {relatedActivities.length === 0 ? (
            <p className="text-sm text-gray-500">No activities assigned</p>
          ) : (
            <ul className="space-y-2">
              {relatedActivities.slice(0, 5).map((activity) => (
                <li key={activity.id} className="text-sm">
                  <a href={`/workplan?activityId=${activity.id}`} className="text-blue-600 hover:underline">{activity.title}</a>
                  <span className="text-gray-500 text-xs ml-2">{activity.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Related Projects</h3>
          {relatedProjects.length === 0 ? (
            <p className="text-sm text-gray-500">No projects managed</p>
          ) : (
            <ul className="space-y-2">
              {relatedProjects.slice(0, 5).map((project) => (
                <li key={project.id} className="text-sm">
                  <a href={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.title}</a>
                  <span className="text-gray-500 text-xs ml-2">{project.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
