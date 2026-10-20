'use client';

import React, { useState } from 'react';
import { CalendarClock, Plus, Play, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function TasksPage() {
  const { workspaceSlug, scheduledTasks, refreshWorkspace } = useWorkspace();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [lastOutput, setLastOutput] = useState<string | null>(null);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;
    await fetch('/api/ai/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug,
        title,
        prompt,
        frequency,
        timeOfDay,
        timezone: 'UTC',
      }),
    });
    setTitle('');
    setPrompt('');
    setDrawerOpen(false);
    await refreshWorkspace();
  }

  async function handleRunTaskNow(taskId: string) {
    setRunningTaskId(taskId);
    const res = await fetch('/api/ai/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug,
        action: 'run_now',
        taskId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setLastOutput(data.output);
      await refreshWorkspace();
    }
    setRunningTaskId(null);
  }

  return (
    <div data-testid="tasks-page" className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-[#191918]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#191918]">Scheduled AI Agents (Tasks)</h1>
            <p className="text-xs text-[#6B6B68]">
              Automate recurring research briefs, inbox digests, and workspace summaries
            </p>
          </div>
        </div>

        <button
          data-testid="new-ai-agent-btn"
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> New AI Agent
        </button>
      </div>

      {lastOutput && (
        <div
          data-testid="agent-run-output-banner"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5"
        >
          <div className="font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Scheduled AI Agent executed & saved a new Digest Note to your Workspace!
            </span>
            <button type="button" onClick={() => setLastOutput(null)} className="text-emerald-700">
              Dismiss
            </button>
          </div>
          <div className="whitespace-pre-wrap line-clamp-4 text-[11px]">{lastOutput}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduledTasks.map((task) => (
          <div
            key={task.id}
            data-testid={`scheduled-task-card-${task.id}`}
            className="p-5 rounded-2xl bg-white border border-[#E6E6E3] flex flex-col justify-between gap-4 shadow-2xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#191918] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#45BAF9]" /> {task.title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#F3F3F1] text-[10px] font-semibold">
                  {task.frequency} · {task.timeOfDay}
                </span>
              </div>
              <p className="text-xs text-[#6B6B68]">{task.prompt}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E6E6E3]/60 text-[11px] text-[#6B6B68]">
              <span>
                {task.lastRunAt
                  ? `Last run: ${new Date(task.lastRunAt).toLocaleTimeString()}`
                  : 'Ready to run'}
              </span>
              <button
                data-testid={`run-task-now-${task.id}`}
                type="button"
                disabled={runningTaskId === task.id}
                onClick={() => handleRunTaskNow(task.id)}
                className="px-3 py-1.5 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Play className="w-3 h-3" />
                {runningTaskId === task.id ? 'Running...' : 'Run now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over New AI Agent Drawer */}
      {drawerOpen && (
        <div
          data-testid="new-ai-agent-drawer"
          className="fixed inset-0 z-50 bg-black/40 flex justify-end"
        >
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E6E3] pb-3">
                <h3 className="font-semibold text-base">New Scheduled AI Agent</h3>
                <button type="button" onClick={() => setDrawerOpen(false)}>
                  <X className="w-4 h-4 text-[#6B6B68]" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B6B68] mb-1">Agent Name</label>
                <input
                  data-testid="agent-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Daily Executive Research Digest"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B6B68] mb-1">Instructions / Prompt</label>
                <textarea
                  data-testid="agent-prompt-input"
                  required
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Summarize new notes, PDFs, and bookmarks added in the last 24 hours and highlight action items."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B68] mb-1">Frequency</label>
                  <select
                    data-testid="agent-frequency-select"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as 'Daily' | 'Weekly' | 'Monthly')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6B6B68] mb-1">Time (UTC)</label>
                  <input
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E6E6E3]">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E6E3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                data-testid="save-ai-agent-submit"
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Create AI Agent
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
