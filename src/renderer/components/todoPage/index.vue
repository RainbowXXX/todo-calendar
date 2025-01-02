<template>
  <div id="todoMain">
    <div style="display: flex; justify-content: end; margin-bottom: 20px;">
      <el-button type="primary" @click="handleAddOrUpdateDrawer(-1)">+ todo</el-button>
<!--      <el-button @click="getTodoList">刷新</el-button>-->
    </div>
    <el-table :data="todoList" style="width: 100%">
      <el-table-column align="center" prop="timeRange" label="时间段" min-width="90">
        <template #default="scope">
          {{ [scope.row.timeRange.split(' ')[1], scope.row.timeRange.split(' ')[2], scope.row.timeRange.split(' ')[4]].join(' ') }}
        </template>
      </el-table-column>
      <el-table-column align="center" prop="event" label="事件" min-width="100" />
      <el-table-column align="center" prop="remindTime" label="提醒时间">
        <template #default="scope">
          {{ scope.row.remindTime.split(' ')[1] }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作">
        <template #default="scope">
          <el-button type="text" @click="handleAddOrUpdateDrawer(scope.row.todoId)">详情</el-button>
          <el-button type="text" @click="handleDeleteTodoEvent(scope.row.todoId)">删除</el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="启动">
        <template #default="scope">
          <el-switch
              v-model="scope.row.remindActive"
              active-text="启动"
              @change="handleTodoRemind(scope.row)"
          />
        </template>
      </el-table-column>
    </el-table>
    <AddOrUpdateDrawer ref="addOrUpdateDrawerRef" :reGetTidoList="getTodoList"></AddOrUpdateDrawer>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue';
import AddOrUpdateDrawer from './addOrUpdateDrawer.vue';
import {ElMessage} from "element-plus";

const todoList = reactive<TodoEvent[]>([]);

interface TodoEvent {
  todoId: number;
  timeRange: string,
  event: string,
  eventDetails: string,
  remindTime: string,
  remindActive: boolean
}

const addOrUpdateDrawerRef = ref<{start: Function}>({start: () => {}});

onMounted(() => {
  getTodoList();
});

const getTodoList = async () => {
  // console.log('获取表格数据')
  const response = await window.electronAPI?.getTodolist();
  if (response.code === 0) {
    todoList.splice(0, todoList.length,...response.data);
  } else {
    ElMessage.error(response.message)
  }
  // console.log(response);
}

const handleAddOrUpdateDrawer = (todoId: number) => {
  if (addOrUpdateDrawerRef.value) {
    addOrUpdateDrawerRef.value?.start(todoId);
  }
};

const handleDeleteTodoEvent = async (todoId: number) => {
  const response = await window.electronAPI?.deleteTodoEvent(todoId);
  if (response.code === 0) {
    ElMessage({
      message: response.message,
      type: 'success',
    })
    await getTodoList();
  } else {
    ElMessage.error(response.message)
  }
}

const handleTodoRemind = async (todoEvent: TodoEvent) => {
  // console.log('更新提醒', todoEvent)
  const response = await window.electronAPI?.updateTodoEvent({...todoEvent});
  if (response.code === 0) {
    ElMessage({
      message: response.message,
      type: 'success',
    })
  } else {
    ElMessage.error(response.message)
  }
}
</script>

<style scoped>
#todoMain {
  width: 100%;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
}
</style>
