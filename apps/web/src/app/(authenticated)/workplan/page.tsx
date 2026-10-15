'use client';
import ActivityModal from './components/activity-modal';
import { useState, useEffect } from 'react';
import { request } from '@/lib/api';

interface WorkPlan {
  id: number;
  yearId: number;
  name: string;
  description?: string;
  status: string;
  approvalStatus: string;
  orgUnit?: { id: number; name: string };
  activities: Activity[];
  _count: { activities: number };
}

interface Activity {
  id: number;
  yearId: number;
  workPlanId?: number;
  title: string;
  description?: string;
  quarter?: string;
  startDate?: string;
  dueDate?: string;
  plannedQuantity?: number;
  unit?: string;
  priority: string;
  implementationStatus: string;
  approvalStatus: string;
  progress: number;
  budget?: string;
  orgUnit?: { id: number; name: string };
  employee?: { id: number; name: string };
  workPlan?: { id: number; name: string };
  subTasks: SubTask[];
  deliverables: Deliverable[];
  _count: { subTasks: number; deliverables: number };
}

interface SubTask {
  id: number;
  title: string;
  progress: number;
  status: string;
}

interface Deliverable {
  id: number;
  title: string;
  status: string;
  dueDate?: string;
}

interface Statistics {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalBudget: number;
  averageProgress: number;
  completionRate: number;
}

interface PlanningYear {
  id: number;
  year: number;
  label?: string;
  status?: string;
}

export default function WorkPlanPage() {
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<PlanningYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchData();
    }
  }, [selectedYear, selectedOrgUnit]);

  const fetchYears = async () => {
    try {
      const data = await request<any>('/planning/years');
      const list: PlanningYear[] = Array.isArray(data) ? data : data.data || [];
      setYears(list);
      const active = list.find((y: any) => y.status === 'active');
      if (active) {
        setSelectedYear(active.id);
      } else if (list.length > 0) {
        setSelectedYear(list[0]?.id || 0);
      }
    } catch (err) {
      console.error('Failed to fetch years:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ yearId: selectedYear.toString() });
      if (selectedOrgUnit) params.append('orgUnitId', selectedOrgUnit.toString());

      const [plansData, actsData, statsData] = await Promise.all([
        request<any>(`/workplan/plans?${params}`),
        request<any>(`/workplan/activities?${params}`),
        request<any>(`/workplan/statistics/${selectedYear}${selectedOrgUnit ? '?orgUnitId=' + selectedOrgUnit : ''}`),
      ]);

      setWorkPlans(Array.isArray(plansData) ? plansData : (plansData.data || []));
      setActivities(Array.isArray(actsData) ? actsData : (actsData.data || []));
      setStats(statsData.data || statsData);
    } catch (error) {
      console.error('Failed to fetch work plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft':
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproveActivity = async (activityId: number) => {
    try {
      await request(`/workplan/activities/${activityId}/approve`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve activity');
    }
  };

  const handleRejectActivity = async (activityId: number) => {
    const comments = prompt('Reason for rejection:');
    if (comments === null) return;
    try {
      await request(`/workplan/activities/${activityId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject activity');
    }
  };

  const handleSubmitActivity = async (activityId: number) => {
    try {
      await request(`/workplan/activities/${activityId}/submit`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit activity');
    }
  };

  const handleResubmitActivity = async (activityId: number) => {
    try {
      await request(`/workplan/activities/${activityId}/resubmit`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to resubmit activity');
    }
  };

  const filteredActivities = activities.filter(a => {
    if (statusFilter && a.implementationStatus !== statusFilter) return false;
    if (priorityFilter && a.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Annual Work Plan</h1>
            <p className="text-gray-600 mt-1">Manage activities, tasks, and deliverables</p>
          </div>
          <button
            onClick={() => setShowActivityModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            + New Activity
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || 0)}
                className="border rounded-md px-3 py-2"
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.year} {y.label ? `(${y.label})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="">All</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-2 rounded ${viewMode === 'board' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded ${viewMode === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Total</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Progress</h3>
              <p className="text-2xl font-bold text-indigo-600">{stats.averageProgress}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quarter</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Approval</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center">Loading...</td></tr>
                ) : filteredActivities.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center">No activities found</td></tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{activity.title}</div>
                        <div className="text-xs text-gray-500">{activity.orgUnit?.name || 'Unassigned'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {activity.workPlan?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {activity.quarter || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium capitalize ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${activity.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{activity.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.implementationStatus)}`}>
                          {activity.implementationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApprovalStatusColor(activity.approvalStatus || 'draft')}`}>
                          {(activity.approvalStatus || 'draft').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedActivity(activity); setShowActivityModal(true); }}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            Edit
                          </button>
                          {activity.approvalStatus === 'draft' && (
                            <button
                              onClick={() => handleSubmitActivity(activity.id)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                              title="Submit for approval"
                            >
                              Submit
                            </button>
                          )}
                          {activity.approvalStatus === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleApproveActivity(activity.id)}
                                className="text-green-600 hover:text-green-900 text-sm"
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectActivity(activity.id)}
                                className="text-red-600 hover:text-red-900 text-sm"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {activity.approvalStatus === 'rejected' && (
                            <button
                              onClick={() => handleResubmitActivity(activity.id)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                              title="Resubmit"
                            >
                              Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Board View */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-4 gap-4">
            {['not_started', 'in_progress', 'completed', 'cancelled'].map((status) => {
              const statusActivities = filteredActivities.filter(a => a.implementationStatus === status);
              return (
                <div key={status} className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 capitalize">
                    {status.replace('_', ' ')} ({statusActivities.length})
                  </h3>
                  <div className="space-y-3">
                    {statusActivities.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No activities</p>
                    ) : (
                      statusActivities.map((activity) => (
                        <div key={activity.id} className="bg-white rounded-lg shadow p-3">
                          <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{activity.orgUnit?.name || 'Unassigned'}</p>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full"
                                style={{ width: `${activity.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 mt-1">{activity.progress}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Calendar/Timeline View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quarterly Timeline</h2>
            <div className="grid grid-cols-4 gap-4">
              {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => {
                const quarterActivities = filteredActivities.filter(a => a.quarter === quarter);
                return (
                  <div key={quarter} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">{quarter}</h3>
                    <div className="space-y-2">
                      {quarterActivities.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No activities</p>
                      ) : (
                        quarterActivities.map((activity) => (
                          <div key={activity.id} className="border-l-2 border-indigo-500 pl-2">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-gray-500">
                              {activity.startDate && new Date(activity.startDate).toLocaleDateString()} -
                              {activity.dueDate && new Date(activity.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Modal */}
        {showActivityModal && (
          <ActivityModal
            yearId={selectedYear}
            orgUnits={[]}
            onClose={() => setShowActivityModal(false)}
            onSuccess={() => { setShowActivityModal(false); fetchData(); }}
          />
        )}

        {/* Edit Activity Modal */}
        {selectedActivity && (
          <ActivityModal
            activity={selectedActivity}
            yearId={selectedYear}
            orgUnits={[]}
            onClose={() => setSelectedActivity(null)}
            onSuccess={() => { setSelectedActivity(null); fetchData(); }}
          />
        )}
      </div>
    </div>
  );
}
