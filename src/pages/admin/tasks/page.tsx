"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { Field, inputCls, Modal, Pill, TableWrap } from "@/components/admin/ui";

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: string;
  status: string;
  due_at: string | null;
  created_at: string;
}

const STATUSES = ["pending", "in_progress", "done"];
const EMPTY = { id: "", title: "", description: "", assignee: "", priority: "medium", status: "pending", due_at: "" };

function TasksAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Task[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ tasks: Task[] }>(slug, "/tasks");
    if (res.ok && res.data?.tasks) setRows(res.data.tasks);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    await adminFetch(slug, "/tasks", {
      method: "POST",
      body: JSON.stringify({
        ...(editing.id ? { id: editing.id } : {}),
        title: editing.title,
        description: editing.description || null,
        assignee: editing.assignee || null,
        priority: editing.priority,
        status: editing.status,
        due_at: editing.due_at ? new Date(editing.due_at).toISOString() : null,
      }),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const setStatus = async (task: Task, status: string) => {
    await adminFetch(slug, "/tasks", { method: "POST", body: JSON.stringify({ ...task, status }) });
    await load();
  };

  const remove = async (id: string) => {
    await adminFetch(slug, `/tasks?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Tasks</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + New task
        </button>
      </div>
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Task</th>
              <th className="px-4 py-2.5 text-left font-medium">Assignee</th>
              <th className="px-4 py-2.5 text-left font-medium">Priority</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Due</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr key={task.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                  {task.description && <div className="text-xs text-gray-500">{task.description}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{task.assignee ?? "--"}</td>
                <td className="px-4 py-3"><Pill status={task.priority} /></td>
                <td className="px-4 py-3"><Pill status={task.status} /></td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {task.due_at ? new Date(task.due_at).toLocaleDateString() : "--"}
                </td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  {task.status !== "done" && (
                    <button onClick={() => setStatus(task, "done")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Complete
                    </button>
                  )}
                  {task.status === "pending" && (
                    <button onClick={() => setStatus(task, "in_progress")} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                      Start
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setEditing({
                        id: task.id,
                        title: task.title,
                        description: task.description ?? "",
                        assignee: task.assignee ?? "",
                        priority: task.priority,
                        status: task.status,
                        due_at: task.due_at ? task.due_at.slice(0, 10) : "",
                      })
                    }
                    className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(task.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && (
        <Modal title={editing.id ? "Edit task" : "New task"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Title *">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Assignee">
                <input value={editing.assignee} onChange={(e) => setEditing({ ...editing, assignee: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Due date">
                <input type="date" value={editing.due_at} onChange={(e) => setEditing({ ...editing, due_at: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <select value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value })} className={inputCls}>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className={inputCls}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {saving ? "Saving…" : "Save task"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminTasksPage() {
  return (
    <AdminShell>
      <TasksAdmin />
    </AdminShell>
  );
}
