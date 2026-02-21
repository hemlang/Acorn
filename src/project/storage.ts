/**
 * IndexedDB persistence for Acorn projects via idb-keyval.
 *
 * Stores the current project and a list of saved projects.
 */

import { get, set, del, keys } from "idb-keyval";
import { AcornProject } from "./format.js";

const CURRENT_KEY = "acorn:current";
const PROJECT_PREFIX = "acorn:project:";

/** Save a project to IndexedDB. */
export async function saveProject(project: AcornProject): Promise<void> {
  const key = PROJECT_PREFIX + project.name;
  await set(key, JSON.parse(JSON.stringify(project)));
  await set(CURRENT_KEY, project.name);
}

/** Load a project by name from IndexedDB. */
export async function loadProject(
  name: string
): Promise<AcornProject | null> {
  const key = PROJECT_PREFIX + name;
  const data = await get<AcornProject>(key);
  return data ?? null;
}

/** Delete a project from IndexedDB. */
export async function deleteProject(name: string): Promise<void> {
  const key = PROJECT_PREFIX + name;
  await del(key);
}

/** List all saved project names. */
export async function listProjects(): Promise<string[]> {
  const allKeys = await keys();
  return allKeys
    .filter((k): k is string =>
      typeof k === "string" && k.startsWith(PROJECT_PREFIX)
    )
    .map((k) => k.slice(PROJECT_PREFIX.length));
}

/** Get the name of the last opened project. */
export async function getLastProjectName(): Promise<string | null> {
  return (await get<string>(CURRENT_KEY)) ?? null;
}

/** Export a project as a downloadable .acorn file. */
export function exportProject(project: AcornProject): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name}.acorn`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import a project from a .acorn file. */
export function importProject(file: File): Promise<AcornProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const project = JSON.parse(reader.result as string) as AcornProject;
        if (!project.formatVersion || !project.name) {
          reject(new Error("Invalid .acorn file format"));
          return;
        }
        resolve(project);
      } catch (e) {
        reject(new Error(`Failed to parse project file: ${e}`));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
