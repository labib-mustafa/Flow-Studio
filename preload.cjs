const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  fs: {
    getDrives: () => ipcRenderer.invoke('fs:getDrives'),
    getQuickAccess: () => ipcRenderer.invoke('fs:getQuickAccess'),
    listFiles: (reqPath, mode, forceRefresh) => ipcRenderer.invoke('fs:listFiles', reqPath, mode, forceRefresh),
    readFileString: (reqPath, mode) => ipcRenderer.invoke('fs:readFileString', reqPath, mode),
    readFileBase64: (reqPath, mode, options) => ipcRenderer.invoke('fs:readFileBase64', reqPath, mode, options),
    mkdir: (targetPath, name, mode) => ipcRenderer.invoke('fs:mkdir', targetPath, name, mode),
    rename: (oldPath, newPath, mode) => ipcRenderer.invoke('fs:rename', oldPath, newPath, mode),
    copy: (sourcePath, targetPath, mode) => ipcRenderer.invoke('fs:copy', sourcePath, targetPath, mode),
    delete: (delPath, mode) => ipcRenderer.invoke('fs:delete', delPath, mode),
    trash: (delPath, mode) => ipcRenderer.invoke('fs:trash', delPath, mode),
    openDefault: (reqPath, mode) => ipcRenderer.invoke('fs:openDefault', reqPath, mode),
    getProperties: (reqPath, mode) => ipcRenderer.invoke('fs:getProperties', reqPath, mode),
    createFile: (targetPath, name, mode) => ipcRenderer.invoke('fs:createFile', targetPath, name, mode),
    upload: (targetPath, mode, arrayBuffer) => ipcRenderer.invoke('fs:upload', targetPath, mode, arrayBuffer),
    selectFolder: (defaultPath) => ipcRenderer.invoke('fs:selectFolder', defaultPath)
  },
  projects: {
    getFolder: (projectId, projectName) => ipcRenderer.invoke('projects:getFolder', projectId, projectName),
    createFolder: (projectId, projectName) => ipcRenderer.invoke('projects:createFolder', projectId, projectName),
    renameFolder: (projectId, newProjectName) => ipcRenderer.invoke('projects:renameFolder', projectId, newProjectName),
    openFolder: (projectId, projectName) => ipcRenderer.invoke('projects:openFolder', projectId, projectName)
  }
});
