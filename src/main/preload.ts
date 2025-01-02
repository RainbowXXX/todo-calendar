import {contextBridge, ipcRenderer} from 'electron';
import {ipcRenderer as ipc} from 'electron-better-ipc';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  // 获取Todo列表数据
  getTodolist: () => (async () => {
    return await ipc.callMain('get-todo-list');
  })(),
  // 获取Todo事件详情
  getTodoDetails: (todoId: number) => (async () => {
    return await ipc.callMain('get-todo-details', todoId);
  })(),
  // 更新Todo事件（也包括新增）
  updateTodoEvent: (todoEvent: object) => (async () => {
    return await ipc.callMain('update-todo-event', todoEvent);
  })(),
  // 删除Todo事件
  deleteTodoEvent: (todoId: number) => (async () => {
    return await ipc.callMain('delete-todo-event', todoId);
  })(),
})


