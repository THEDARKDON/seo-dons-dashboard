'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Flag,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  };
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  };
  deal?: {
    id: string;
    deal_name: string;
    deal_value: number;
  };
}

const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: Circle, color: 'text-gray-500' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'text-red-500' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
  });

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      const url = filter === 'all'
        ? '/api/tasks'
        : `/api/tasks?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
        loadTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const groupedTasks = {
    overdue: tasks.filter(
      t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()
    ),
    today: tasks.filter(
      t => t.status !== 'completed' && t.due_date &&
      format(new Date(t.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ),
    upcoming: tasks.filter(
      t => t.status !== 'completed' && t.due_date && new Date(t.due_date) > new Date() &&
      format(new Date(t.due_date), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
    ),
    noDueDate: tasks.filter(t => t.status !== 'completed' && !t.due_date),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">Manage your personal to-do list</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createTask} disabled={!newTask.title.trim()}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { value: 'all', label: 'All Tasks' },
          { value: 'todo', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-sm">
              ({tab.value === 'all' ? tasks.length : tasks.filter(t => t.status === tab.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Task Groups */}
      {filter === 'all' && (
        <div className="space-y-6">
          {groupedTasks.overdue.length > 0 && (
            <TaskGroup
              title="Overdue"
              icon={<AlertCircle className="h-5 w-5 text-red-500" />}
              tasks={groupedTasks.overdue}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
            />
          )}
          {groupedTasks.today.length > 0 && (
            <TaskGroup
              title="Due Today"
              icon={<Calendar className="h-5 w-5 text-orange-500" />}
              tasks={groupedTasks.today}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
            />
          )}
          {groupedTasks.upcoming.length > 0 && (
            <TaskGroup
              title="Upcoming"
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              tasks={groupedTasks.upcoming}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
            />
          )}
          {groupedTasks.noDueDate.length > 0 && (
            <TaskGroup
              title="No Due Date"
              icon={<Flag className="h-5 w-5 text-gray-500" />}
              tasks={groupedTasks.noDueDate}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
            />
          )}
          {groupedTasks.completed.length > 0 && (
            <TaskGroup
              title="Completed"
              icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              tasks={groupedTasks.completed}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
            />
          )}
          {tasks.length === 0 && (
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No tasks yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first task to get started</p>
            </Card>
          )}
        </div>
      )}

      {/* Filtered View */}
      {filter !== 'all' && (
        <TaskGroup
          title=""
          tasks={tasks}
          onStatusChange={updateTaskStatus}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

function TaskGroup({
  title,
  icon,
  tasks,
  onStatusChange,
  onDelete,
}: {
  title: string;
  icon?: React.ReactNode;
  tasks: Task[];
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">({tasks.length})</span>
        </div>
      )}
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}) {
  const StatusIcon = STATUS_CONFIG[task.status].icon;
  const statusColor = STATUS_CONFIG[task.status].color;
  const priorityColor = PRIORITY_CONFIG[task.priority].color;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <button
          onClick={() => {
            const newStatus = task.status === 'completed' ? 'todo' :
                            task.status === 'in_progress' ? 'completed' : 'in_progress';
            onStatusChange(task.id, newStatus);
          }}
          className="mt-0.5"
        >
          <StatusIcon className={`h-5 w-5 ${statusColor}`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded ${priorityColor}`}>
              {PRIORITY_CONFIG[task.priority].label}
            </span>

            {task.due_date && (
              <span className={`text-xs px-2 py-1 rounded ${
                new Date(task.due_date) < new Date() && task.status !== 'completed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            )}

            {task.lead && (
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                Lead: {task.lead.first_name} {task.lead.last_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
