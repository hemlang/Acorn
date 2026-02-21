/**
 * Main application layout manager.
 *
 * Creates the panel structure: toolbar, asset panel, workspace, properties.
 */

export interface LayoutElements {
  toolbar: HTMLElement;
  assetPanel: HTMLElement;
  workspace: HTMLElement;
  workspaceTabs: HTMLElement;
  workspaceContent: HTMLElement;
  codePreview: HTMLElement;
  codePreviewBody: HTMLElement;
  propertiesPanel: HTMLElement;
}

export function createLayout(container: HTMLElement): LayoutElements {
  container.innerHTML = "";

  // Toolbar placeholder
  const toolbar = document.createElement("div");
  toolbar.id = "toolbar-mount";
  container.appendChild(toolbar);

  // Main area
  const main = document.createElement("div");
  main.className = "acorn-main";
  container.appendChild(main);

  // Asset panel (left)
  const assetPanel = document.createElement("div");
  assetPanel.id = "asset-panel-mount";
  main.appendChild(assetPanel);

  // Center workspace
  const workspace = document.createElement("div");
  workspace.className = "acorn-workspace";
  main.appendChild(workspace);

  // Workspace tabs
  const workspaceTabs = document.createElement("div");
  workspaceTabs.className = "workspace-tabs";
  workspace.appendChild(workspaceTabs);

  // Workspace content area
  const workspaceContent = document.createElement("div");
  workspaceContent.className = "workspace-content";
  workspace.appendChild(workspaceContent);

  // Code preview (bottom of workspace)
  const codePreview = document.createElement("div");
  codePreview.className = "acorn-code-preview";
  workspace.appendChild(codePreview);

  const codePreviewHeader = document.createElement("div");
  codePreviewHeader.className = "code-preview-header";
  codePreviewHeader.textContent = "Generated Hemlock Code";
  codePreview.appendChild(codePreviewHeader);

  const codePreviewBody = document.createElement("div");
  codePreviewBody.className = "code-preview-body";
  codePreviewBody.textContent = "// Select a sprite and add blocks to see generated code";
  codePreview.appendChild(codePreviewBody);

  // Properties panel (right)
  const propertiesPanel = document.createElement("div");
  propertiesPanel.id = "properties-panel-mount";
  main.appendChild(propertiesPanel);

  return {
    toolbar,
    assetPanel,
    workspace,
    workspaceTabs,
    workspaceContent,
    codePreview,
    codePreviewBody,
    propertiesPanel,
  };
}
