<template>
  <div class="project-schedule">
    <div class="schedule-container">
      <!-- 左侧项目列表 -->
      <div class="project-list">
        <div class="list-header">
          <h3>项目列表</h3>
        </div>
        <el-menu
          :default-active="activeProjectId?.toString() || ''"
          class="project-menu"
          @select="handleProjectSelect"
        >
          <el-menu-item
            v-for="project in projectList"
            :key="project.id"
            :index="project.id.toString()"
          >
            
            <span>{{ project.project_name }}</span>
          </el-menu-item>
        </el-menu>
      </div>

      
      <div class="gantt-container" v-if="activeProjectId">
        <div class="gantt-header">
          <div class="header-left">
            <h3>{{ activeProject?.project_name }} - 任务进度</h3>
          </div>
          <div class="header-right">
            <el-button type="default" @click="handleAddStep" class="mr-2">
              <el-icon class="mr-5"><component :is="icons.Plus" /></el-icon>新增步骤
            </el-button>
            <el-button type="primary" @click="handleAddTask">
              <el-icon class="mr-5"><component :is="icons.Plus" /></el-icon>新增任务
            </el-button>
          </div>
        </div>

        
        <!-- step展示区-->
        <div class="step-display-area">
          <div class="step-section">
            <div class="tasks-container">
              <div v-for="task in getTasksByStep(1)" 
                   :key="task.id" 
                   class="task-card"
                   :style="{ backgroundColor: task.task_color }">
                <div class="task-header">
                  <div class="task-title">{{ task.task_name }}</div>
                  <div class="status-wrapper">
                    <span v-if="task.type_id===2" class="green-tag">绿通</span>
                    <div class="task-status" :class="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </div>
                  </div>
                </div>
                <div class="task-info">
                  <span class="task-dates">{{ formatDate(task.start_date) }} - {{ formatDate(task.end_date) }}</span>
                  <span class="task-assignee">{{ task.assignee_name }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="step-section">
            <div class="tasks-container">
              <div v-for="task in getTasksByStep(2)" 
                   :key="task.id" 
                   class="task-card"
                   :style="{ backgroundColor: task.task_color }">
                <div class="task-header">
                  <div class="task-title">{{ task.task_name }}</div>
                  <div class="status-wrapper">
                    <span v-if="task.type_id===2" class="green-tag">绿通</span>
                    <div class="task-status" :class="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </div>
                  </div>
                </div>
                <div class="task-info">
                  <span class="task-dates">{{ formatDate(task.start_date) }} - {{ formatDate(task.end_date) }}</span>
                  <span class="task-assignee">{{ task.assignee_name }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="step-section">
            <div class="tasks-container">
              <div v-for="task in getTasksByStep(3)" 
                   :key="task.id" 
                   class="task-card"
                   :style="{ backgroundColor: task.task_color }">
                <div class="task-header">
                  <div class="task-title">{{ task.task_name }}</div>
                  <div class="status-wrapper">
                    <span v-if="task.type_id===2" class="green-tag">绿通</span>
                    <div class="task-status" :class="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </div>
                  </div>
                </div>
                <div class="task-info">
                  <span class="task-dates">{{ formatDate(task.start_date) }} - {{ formatDate(task.end_date) }}</span>
                  <span class="task-assignee">{{ task.assignee_name }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="step-section">
            <div class="tasks-container">
              <div v-for="task in getTasksByStep(4)" 
                   :key="task.id" 
                   class="task-card"
                   :style="{ backgroundColor: task.task_color }">
                <div class="task-header">
                  <div class="task-title">{{ task.task_name }}</div>
                  <div class="status-wrapper">
                    <span v-if="task.type_id===2" class="green-tag">绿通</span>
                    <div class="task-status" :class="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </div>
                  </div>
                </div>
                <div class="task-info">
                  <span class="task-dates">{{ formatDate(task.start_date) }} - {{ formatDate(task.end_date) }}</span>
                  <span class="task-assignee">{{ task.assignee_name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增任务' : '编辑任务'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskRules"
        label-width="100px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker
            v-model="taskForm.start_date"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker
            v-model="taskForm.end_date"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="任务类型" prop="type_id">
          <el-select v-model="taskForm.type_id" placeholder="请选择任务类型" style="width: 100%">
            <el-option
              v-for="type in taskTypes"
              :key="type.id"
              :label="type.description"
              :value="type.id"
            >
              <div class="type-option">
                <div class="color-block" :style="{ backgroundColor: type.color }" />
                {{ type.description }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属步骤" prop="step_id">
          <el-select v-model="taskForm.step_id" placeholder="请选择所属步骤" style="width: 100%">
            <el-option
              v-for="step in availableSteps"
              :key="step"
              :label="'步骤 ' + step"
              :value="step"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="重要程度" prop="priority_id">
          <el-select v-model="taskForm.priority_id" placeholder="请选择重要程度" style="width: 100%">
            <el-option
              v-for="priority in taskPriorities"
              :key="priority.id"
              :label="priority.description"
              :value="priority.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assignee_id">
          <el-select
            v-model="taskForm.assignee_id"
            filterable
            placeholder="请选择负责人"
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.full_name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTaskForm" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, markRaw, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjectList } from '@/api/project'
import { getUserList } from '@/api/user'
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskTypes,
  getTaskPriorities,
  getProjectSteps,
  createProjectStep,
  updateSteps
} from '@/api/task'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VGanttChart from 'v-gantt-chart'
import dayjs from 'dayjs'

// 标记图标为非响应式
const icons = markRaw({
  Folder: ElementPlusIconsVue.Folder,
  Plus: ElementPlusIconsVue.Plus,
  Calendar: ElementPlusIconsVue.Calendar
})

// 数据定义
const projectList = ref([])
const activeProjectId = ref(null)
const taskList = ref([])
const taskTypes = ref([])
const taskPriorities = ref([])
const userList = ref([])
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitting = ref(false)
const currentTaskId = ref(null)
const projectSteps = ref(0)

// 表单相关
const taskFormRef = ref(null)
const taskForm = reactive({
  name: '',
  start_date: '',
  end_date: '',
  type_id: undefined,
  priority_id: undefined,
  assignee_id: undefined,
  step_id: undefined,
  description: ''
})

const taskRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  type_id: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  priority_id: [{ required: true, message: '请选择重要程度', trigger: 'change' }],
  assignee_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  step_id: [{ required: true, message: '请选择所属步骤', trigger: 'change' }]
}

// 计算属性
const activeProject = computed(() => {
  const project = projectList.value.find(p => p.id === activeProjectId.value)
  console.log('当前选中的项目:', project)
  return project
})

const formattedTasks = computed(() => {
  console.log('格式化任务列表, 原始数据:', taskList.value)
  return taskList.value.map(task => ({
    id: task.id,
    text: task.task_name,
    startDate: dayjs(task.start_date).format('YYYY-MM-DD'),
    endDate: dayjs(task.end_date).format('YYYY-MM-DD'),
    progress: 0,
    backgroundColor: task.task_color,
    textColor: '#ffffff',
    assignee: task.assignee_name,
    borderRadius: 4
  }))
})

const availableSteps = computed(() => {
  const steps = []
  for (let i = 1; i <= projectSteps.value; i++) {
    steps.push(i)
  }
  return steps
})

// 方法定义
const fetchData = async () => {
  try {
    console.log('开始获取数据...')
    const [projectRes, typesRes, prioritiesRes, usersRes] = await Promise.all([
      getProjectList(),
      getTaskTypes(),
      getTaskPriorities(),
      getUserList()
    ])
    console.log('获取到的数据:', {
      projects: projectRes.data,
      types: typesRes.data,
      priorities: prioritiesRes.data,
      users: usersRes.data
    })
    
    projectList.value = projectRes.data
    taskTypes.value = typesRes.data
    taskPriorities.value = prioritiesRes.data
    userList.value = usersRes.data

    if (projectList.value.length > 0) {
      console.log('选择第一个项目:', projectList.value[0])
      activeProjectId.value = projectList.value[0].id
      await fetchTasks(activeProjectId.value)
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  }
}

const fetchTasks = async (projectId) => {
  try {
    console.log('开始获取任务列表, projectId:', projectId)
    const res = await getProjectTasks(projectId)
    console.log('获取到的任务列表:', res.data)
    taskList.value = res.data
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  }
}

const fetchProjectSteps = async (projectId) => {
  try {
    const res = await getProjectSteps(projectId)
    projectSteps.value = res.data || 0
    console.log('步骤数',res.data);
  } catch (error) {
    console.error('获取项目步骤失败:', error)
    ElMessage.error('获取项目步骤失败')
    projectSteps.value = 0
  }
}

const handleProjectSelect = async (index) => {
  activeProjectId.value = parseInt(index)
  await Promise.all([
    fetchTasks(activeProjectId.value),
    fetchProjectSteps(activeProjectId.value)
  ])
}

const handleAddTask = () => {
  if (projectSteps.value === 0) {
    ElMessage.warning('请先添加项目步骤')
    return
  }
  dialogType.value = 'add'
  currentTaskId.value = null
  taskForm.name = ''
  taskForm.start_date = ''
  taskForm.end_date = ''
  taskForm.type_id = undefined
  taskForm.priority_id = undefined
  taskForm.assignee_id = undefined
  taskForm.step_id = undefined
  taskForm.description = ''
  dialogVisible.value = true
}

const handleTaskClick = (task) => {
  // 任务点击事件处理
  console.log('Task clicked:', task)
}

const handleTaskDblClick = async (task) => {
  const taskDetail = taskList.value.find(t => t.id === task.id)
  if (!taskDetail) return

  dialogType.value = 'edit'
  currentTaskId.value = task.id
  taskForm.name = taskDetail.task_name
  taskForm.start_date = taskDetail.start_date
  taskForm.end_date = taskDetail.end_date
  taskForm.type_id = taskTypes.value.find(t => t.name === taskDetail.type_name)?.id
  taskForm.priority_id = taskPriorities.value.find(p => p.name === taskDetail.priority_name)?.id
  taskForm.assignee_id = taskDetail.assignee_id
  taskForm.step_id = taskDetail.step_id
  taskForm.description = taskDetail.description
  dialogVisible.value = true
}

const submitTaskForm = async () => {
  if (!taskFormRef.value) return

  try {
    await taskFormRef.value.validate()
    submitting.value = true

    const data = {
      project_id: activeProjectId.value,
      ...taskForm
    }

    if (dialogType.value === 'add') {
      await createTask(data)
      ElMessage.success('创建成功')
    } else {
      await updateTask(currentTaskId.value, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    await fetchTasks(activeProjectId.value)
  } catch (error) {
    console.error(dialogType.value === 'add' ? '创建失败:' : '更新失败:', error)
    ElMessage.error(error.response?.data?.message || (dialogType.value === 'add' ? '创建失败' : '更新失败'))
  } finally {
    submitting.value = false
  }
}

// 处理添加步骤
const handleAddStep = () => {
  projectSteps.value++
  // 这里需要调用后端API更新steps值
  updateProjectSteps(activeProjectId.value, projectSteps.value)
  ElMessage({
    message: `当前共有 ${projectSteps.value} 个步骤`,
    type: 'success',
    duration: 2000
  })
}

// 新增更新步骤的函数
const updateProjectSteps = async (projectId, steps) => {
  try {
    await updateSteps(projectId, { steps })
    ElMessage.success('步骤更新成功')
  } catch (error) {
    console.error('更新步骤失败:', error)
    ElMessage.error('更新步骤失败')
    // 如果失败则回滚steps值
    projectSteps.value--
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('MM-DD')
}

// 根据步骤获取任务
const getTasksByStep = (step) => {
  return taskList.value.filter(task => task.step_id === step)
}

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case 3: // 已完成
      return 'completed'
    case 4: // 异常
      return 'overdue'
    default:
      return ''
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 1:
      return '未开始'
    case 2:
      return '进行中'
    case 3:
      return '已完成'
    case 4:
      return '异常'
    default:
      return '进行中'
  }
}

// 初始化
onMounted(() => {
  fetchData()
})

</script>

<style scoped>
.project-schedule {
  height: 100%;
  padding: 20px;
}

.schedule-container {
  display: flex;
  height: calc(100vh - 120px);
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.project-list {
  width: 180px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;

  .list-header {
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #f5f7fa;

    h3 {
      margin: 0;
      font-size: 14px;
      color: #303133;
    }
  }

  .project-menu {
    flex: 1;
    overflow-y: auto;
  }
}

.gantt-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .gantt-header {
    height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #f5f7fa;

    h3 {
      margin: 0;
      font-size: 14px;
      color: #303133;
    }
  }

  .step-display-area {
    display: flex;
    flex: 1;
    padding: 20px;
    gap: 0;
  }
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #909399;
  font-size: 14px;
}

:deep(.gantt-chart) {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

:deep(.gantt-header) {
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

:deep(.gantt-body) {
  padding: 4px 0;
}

:deep(.gantt-table) {
  border-spacing: 2px;
}

:deep(.gantt-timeline-items) {
  border-left: 1px solid #ebeef5;
}

:deep(.gantt-timeline-day),
:deep(.gantt-timeline-month) {
  background-color: #f8fafc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  font-weight: 500;
}

:deep(.gantt-task) {
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

:deep(.gantt-task-content) {
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
}

:deep(.gantt-table-header) {
  th {
    background-color: #f8fafc;
    border-bottom: 1px solid #ebeef5;
    padding: 8px 12px;
    font-weight: 500;
    color: #606266;
  }
}

:deep(.gantt-table-content) {
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f2f5;
  }
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .color-block {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  line-height: 40px;
  font-size: 12px;
  padding: 0 12px !important;
}

.step-display-area {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 0;
}

.step-section {
  flex: 1;
  padding: 15px;
  
  h4 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #303133;
    padding-bottom: 10px;
    border-bottom: 1px solid #e4e7ed;
  }
}

.divider {
  width: 1px;
  background-color: #e4e7ed;
  margin: 10px 0;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card {
  padding: 12px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  margin-right: 8px;
}

.status-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.green-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  background: #67C23A;
  color: white;
}

.task-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
}

.task-status.completed {
  background: #409EFF;  /* 蓝色 */
}

.task-status.pending {
  background: #E6A23C;
}

.task-status.overdue {
  background: #F56C6C;  /* 红色 */
}

.task-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.9;
}

.task-dates {
  font-size: 12px;
}

.task-assignee {
  font-size: 12px;
  font-weight: 500;
}
</style> 