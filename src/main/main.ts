import { app, BrowserWindow, ipcMain, session, Notification } from 'electron';
import { join} from 'path';
import { ipcMain as ipc } from 'electron-better-ipc';
import * as fs from "node:fs";

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

ipcMain.on('message', (event, message) => {
  console.log(message);
})

// 代办事项数组
let todoList: TodoEvent[] = [];

interface TodoEvent {
  todoId: number;
  timeRange: string,
  event: string,
  eventDetails: string,
  remindTime: string,
  remindActive: boolean
}

// 待提醒消息数组
let reminderList: reminder[] = [];

interface reminder {
  remindId: number;
  remindTitle: string,
  remindBody: string,
  remindTime: Date,
  remindActive: boolean
}

// 返回Todo列表数据
ipc.answerRenderer('get-todo-list', async () => {
  try {
    return await new Promise((resolve, reject) => {
      fsReadFile(() => {
        // console.log(todoList);
        const currentDate = new Date();
        const currentDay = currentDate.toLocaleDateString();
        const currentTodoList = todoList.filter((item: TodoEvent) => {
          const [start, end] = item.timeRange.split(' - ');
          const startDay = new Date(start).toLocaleDateString();
          const endDay = new Date(end).toLocaleDateString();
          // console.log(start, end, startDay, endDay, currentDay);
          return startDay === currentDay && endDay === currentDay;
        }).sort((a, b) =>
            new Date(a.timeRange.split(' - ')[0]).getTime() - new Date(b.timeRange.split(' - ')[0]).getTime()
        );
        resolve({code: 0, data: currentTodoList, message: null});
      }, () => {
        reject({code: -1, data: null, message: '文件读写失败'});
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      return { code: -1, data: null, message: `获取列表数据失败: ${error.message}` };
    } else {
      return { code: -1, data: null, message: '未知类型的错误' };
    }
  }
});

// 返回特定todoId的Todo事件详情
ipc.answerRenderer('get-todo-details', (todoId: number) => {
  try {
    const foundItem = todoList.find(item => item.todoId === todoId);
    if (foundItem) {
      return { code: 0, data: foundItem };
    } else {
      return { code: 1, data: null };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { code: -1, data: null, message: `获取详情失败: ${error.message}` };
    } else {
      return { code: -1, data: null, message: '未知类型的错误' };
    }
  }
});

// 更新Todo事件 （包括 新增）
ipc.answerRenderer('update-todo-event', async (todoEvent: TodoEvent) => {
  // console.log(todoEvent);
  try {
    const todoId = todoEvent.todoId;
    if (todoId === -1) {
      let newTodoId = 1;
      todoList.forEach(item => {
        if (item.todoId === newTodoId) newTodoId++;
      });
      todoList.push({...todoEvent, todoId: newTodoId});
    } else {
      const index = todoList.findIndex(item => item.todoId === todoEvent.todoId);
      if (index !== -1) {
        todoList[index] = todoEvent;
      } else {
        // 处理未找到对应 todoId 的情况
        return {code: 1, data: null, message: '未找到对应的 Todo 事件'};
      }
    }
    return await new Promise((resolve, reject) => {
      fsWriteFile(() => {
        resolve({code: 0, data: null, message: '更新成功'});
      }, () => {
        reject({code: -1, data: null, message: '文件读写失败'});
      });
    });
  } catch (error) {
    // 处理异常情况
    if (error instanceof Error) {
      // 处理异常情况
      return {code: -1, data: null, message: `更新失败: ${error.message}`};
    } else {
      return {code: -1, data: null, message: '未知类型的错误'};
    }
  }
});

// 珊瑚Todo事件
ipc.answerRenderer('delete-todo-event', async (todoId: number) => {
  try {
    const index = todoList.findIndex(item => item.todoId === todoId);
    if (index !== -1) {
      todoList.splice(index, 1);
      return await new Promise((resolve, reject) => {
        fsWriteFile(() => {
          resolve({code: 0, data: null, message: '删除成功'});
        }, () => {
          reject({code: -1, data: null, message: '文件读写失败'});
        });
      });
    } else {
      return {code: 1, data: null, message: '未找到要删除的 Todo 事件'};
    }
  } catch (error) {
    if (error instanceof Error) {
      return {code: -1, data: null, message: `删除失败: ${error.message}`};
    } else {
      return {code: -1, data: null, message: '未知类型的错误'};
    }
  }
});

// 写入文件
const fsWriteFile = (successCallback: Function, failureCallback: Function) => {
  const jsonContent = JSON.stringify(todoList);
  fs.writeFile('C:\\Users\\86135\\Desktop\\test.txt', jsonContent, (err) => {
    if (err) {
      console.error(err);
      failureCallback();
      return;
    }
    console.log('文件写入成功');
    updateReminderList();
    successCallback();
  });
}

// 读取文件
const fsReadFile = (successCallback: Function, failureCallback: Function) => {
  fs.readFile('C:\\Users\\86135\\Desktop\\test.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      failureCallback();
      return;
    }

    todoList = JSON.parse(data);
    console.log('文件读出成功');
    updateReminderList();
    successCallback();
  });
}

// 消息提醒/
app.on('ready', () => {

  const checkReminders = () => {
    // console.log('检查消息提醒');
    for (let item of reminderList) {
      const currentDate = new Date();
      if (currentDate.getTime() >= item.remindTime.getTime()) {
        const notification = new Notification({
          title: item.remindTitle,
          body: item.remindBody
        });
        item.remindActive = false;
        notification.show();
      } else break;
    }
    reminderList = reminderList.filter(item => item.remindActive);
  }
  // 每隔一段时间检查一次（例如每 1 秒）
  setInterval(checkReminders, 1000);
});

// 维护消息提醒数组
const updateReminderList = () => {
  const currentDate = new Date();
  const currentDay = currentDate.toLocaleDateString();

  reminderList = todoList.filter(item => {
    const [start, end] = item.timeRange.split(' - ');
    const startDay = new Date(start).toLocaleDateString();
    const endDay = new Date(end).toLocaleDateString();
    const remindDate = new Date(item.remindTime);
    // console.log(startDay, endDay, currentDay, item.remindActive, remindDate.getTime(), currentDate.getTime())
    return startDay === currentDay && endDay === currentDay && item.remindActive && remindDate.getTime() > currentDate.getTime();
  }).map(item => {
    return {
      remindId: item.todoId,
      remindTitle: 'todo消息提醒',
      remindBody: item.event,
      remindTime: new Date(item.remindTime),
      remindActive: true
    }
  }).sort((a, b) =>
      a.remindTime.getTime() - b.remindTime.getTime()
  );

  // console.log(reminderList)
}
