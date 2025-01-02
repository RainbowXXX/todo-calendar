<template>
  <el-drawer
    v-model="drawer"
    :direction="direction"
    :size="'50%'">
    <template #header>
      <div>{{ title }}</div>
      <el-button v-if="title !== '新增'" type="primary" @click="editType = !editType" style="margin-right: 20px;" >{{ editType ? '返回' : '编辑'}}</el-button>
    </template>
    <el-form :model="form" label-width="auto" >
      <el-form-item label="时间区段">
        <div v-if="!editType">{{ form.timeRangeText }}</div>
        <el-time-picker
            v-else
            v-model="form.timeRange"
            is-range
            range-separator="To"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item label="简略事件">
        <div v-if="!editType">{{ form.eventText }}</div>
        <el-input
            v-else
            v-model="form.event"
            maxlength="10"
            style="width: 100%"
            placeholder="请输入"
            show-word-limit
            rows="1"
            type="textarea"
        />
      </el-form-item>
      <el-form-item label="详细事件">
        <div v-if="!editType">{{ form.eventDetailsText }}</div>
        <el-input
            v-else
            v-model="form.eventDetails"
            maxlength="100"
            style="width: 100%"
            placeholder="请输入"
            show-word-limit
            rows="6"
            type="textarea"
        />
      </el-form-item>
      <el-form-item label="提醒时间">
        <div v-if="!editType">{{ form.remindTimeText }}</div>
        <el-time-picker
            v-else
            v-model="form.remindTime"
            placeholder="请选择"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawer = false">取消</el-button>
      <el-button type="primary" @click="handleConfirmSubmit" :disabled="!editType">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { reactive } from 'vue'
import {DrawerProps, ElMessage} from 'element-plus';

let title = '新增'
const drawer = ref(false);
const editType = ref(true);
const direction = ref<DrawerProps['direction']>('rtl');
let form = reactive({
  todoId: -1,
  timeRange: ['', ''],
  event: '',
  eventDetails: '',
  remindTime: '',
  timeRangeText: '',
  remindTimeText: '',
  eventText: '',
  eventDetailsText: '',
  remindActive: false
})
let props = defineProps({
  reGetTidoList: {type: Function}
})

// Drawer启动
const start = async (todoId: number) => {
  if (todoId !== -1) {
    title = '详情';
    editType.value = false;
    const response = await window.electronAPI?.getTodoDetails(todoId);
    if (response.code === 0) {
      // console.log(response.data);
      const [startStr, endStr] = response.data.timeRange.split(' - ');
      // console.log(startStr, endStr);
      form = reactive({
        ...response.data,
        timeRange: [ new Date(startStr), new Date(endStr) ],
        remindTime: new Date(response.data.remindTime),
        timeRangeText: [response.data.timeRange.split(' ')[1], response.data.timeRange.split(' ')[2], response.data.timeRange.split(' ')[4]].join(' '),
        remindTimeText: response.data.remindTime.split(' ')[1],
        eventText: response.data.event,
        eventDetailsText: response.data.eventDetails,
        remindActive: response.data.remindActive
      });
    } else {
      ElMessage.error(response.message)
    }
  } else {
    title = '新增';
    editType.value = true;
    form = reactive({
      todoId: todoId,
      timeRange: ['', ''],
      event: '',
      eventDetails: '',
      remindTime: '',
      timeRangeText: '',
      remindTimeText: '',
      eventText: '',
      eventDetailsText: '',
      remindActive: false
    })
  }
  drawer.value = true;
}

// 处理点击确认事件（新增/修改）
const handleConfirmSubmit = async () => {
  // console.log('点击确认', form)
  const todoEvent = {
    todoId: form.todoId,
    event: form.event,
    eventDetails: form.eventDetails,
    timeRange: formatTime(form.timeRange[0]) + ' - ' + formatTime(form.timeRange[1]),
    remindTime: formatTime(form.remindTime),
    remindActive: form.remindActive,
  };
  const response = await window.electronAPI?.updateTodoEvent(todoEvent);
  // console.log(response)
  if (response.code === 0) {
    if (props.reGetTidoList) {
      ElMessage({
        type: 'success',
        message: response.message,
        duration: 1000,
        onClose: () => {
          if (props.reGetTidoList) {
            props.reGetTidoList();
          }
          drawer.value = false;
        }
      })
    } else {
      ElMessage.error('未找到回调执行方法')
    }
  } else {
    ElMessage.error(response.message)
  }

}

// 事件格式转换
function formatTime(timeStr: string) {
  const date = new Date(timeStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 暴露该组件的方法供父组件使用
defineExpose({ start })
</script>

<style scoped>

</style>
