/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  sendMessage: (message: string) => void,
  getTodolist: () => Promise<any>,
  getTodoDetails: (todoId: number) => Promise<any>,
  updateTodoEvent: (todoEvent: object) => Promise<any>,
  deleteTodoEvent: (todoId: number) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronApi,
  }
}
