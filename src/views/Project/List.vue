<template>
  <div class="project-list">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-20">
      <el-col :span="10">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Calendar /></el-icon>
              <span>本季度项目完成情况</span>
            </div>
          </template>
          <div class="stat-content">
            <div class="stat-info">
              <div class="completion-ratio">
                <span class="completed">{{ stats.completed_projects_quarter || 0 }}</span>
                <span class="separator">/</span>
                <span class="total">{{ stats.total_projects_quarter || 0 }}</span>
              </div>
              <div class="ratio-label">已完成/总数</div>
            </div>
            <div class="stat-chart">
              <el-progress
                type="circle"
                :percentage="getProgressPercentage(stats.completed_projects_quarter, stats.total_projects_quarter)"
                :stroke-width="10"
                :width="50"
                :show-text="false"
                status="success"
              />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="7">
        <el-card shadow="hover" class="stat-card info compact">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Collection /></el-icon>
              <span>项目总数</span>
            </div>
          </template>
          <div class="stat-content center">
            <div class="stat-info">
              <div class="single-number">{{ stats.total_projects_all || 0 }}</div>
              <div class="ratio-label">个项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="7">
        <el-card shadow="hover" class="stat-card warning compact">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Warning /></el-icon>
              <span>异常项目</span>
            </div>
          </template>
          <div class="stat-content center">
            <div class="stat-info">
              <div class="single-number danger">{{ stats.abnormal_projects_all || 0 }}</div>
              <div class="ratio-label">个项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 项目列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="list-header">
          <div class="header-left">
            <el-icon class="mr-5"><List /></el-icon>
            <span class="title">项目列表</span>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchQuery"
              placeholder="搜索项目"
              class="search-input mr-10"
              :prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @input="handleSearch"
            />
            <el-button type="primary" @click="handleAdd">
              <el-icon class="mr-5"><Plus /></el-icon>新增项目
            </el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="filteredProjects" 
        border 
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa' }"
        row-key="id"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="project_name" label="项目名称" min-width="180">
          <template #default="scope">
            <div class="project-name">
              <el-icon class="mr-5"><Folder /></el-icon>
              {{ scope.row.project_name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="duration_days" label="项目周期" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getDurationTagType(scope.row.duration_days)" effect="plain">
              {{ scope.row.duration_days }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="项目起止时间" min-width="220" align="center">
          <template #default="scope">
            <div class="date-range">
              <el-icon class="mr-5"><Timer /></el-icon>
              {{ formatDate(scope.row.start_date) }} 至 {{ formatDate(scope.row.end_date) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status_description" label="项目状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status_name)" effect="dark">
              <el-icon class="mr-5">
                <component :is="getStatusIcon(scope.row.status_name)" />
              </el-icon>
              {{ scope.row.status_description }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inventory_managers" label="关联库存管理员" min-width="180">
          <template #default="scope">
            <div class="managers-list">
              <span v-for="(manager, index) in scope.row.inventory_managers" :key="manager">
                {{ manager }}
                <span v-if="index < scope.row.inventory_managers.length - 1">, </span>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button-group>
              <el-tooltip content="编辑项目" placement="top">
                <el-button type="primary" :icon="Edit" circle @click="handleEdit(scope.row)" />
              </el-tooltip>
              <el-tooltip content="删除项目" placement="top">
                <el-button type="danger" :icon="Delete" circle @click="handleDelete(scope.row)" />
              </el-tooltip>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增项目' : '编辑项目'"
      width="600px"
      destroy-on-close
      class="project-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input 
            v-model="form.name" 
            placeholder="请输入项目名称"
            :prefix-icon="Document"
          />
        </el-form-item>
        <el-form-item label="完成时间" prop="duration_days">
          <el-input-number 
            v-model="form.duration_days" 
            :min="1" 
            placeholder="请输入天数"
            :prefix-icon="Timer"
          />
        </el-form-item>
        <el-form-item label="起止时间" prop="date_range">
          <el-date-picker
            v-model="form.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :prefix-icon="Calendar"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="项目状态" prop="status_id">
          <el-select v-model="form.status_id" placeholder="请选择项目状态" style="width: 100%">
            <el-option
              v-for="(status, index) in statusOptions"
              :key="index + 1"
              :label="status.label"
              :value="index + 1"
            >
              <el-icon class="mr-5">
                <component :is="status.icon" />
              </el-icon>
              {{ status.label }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="库存管理员" prop="inventory_managers">
          <el-select
            v-model="form.inventory_managers"
            multiple
            filterable
            :loading="loading"
            placeholder="请选择库存管理员"
            style="width: 100%"
          >
            <el-option
              v-for="manager in inventoryManagerOptions"
              :key="manager.id"
              :label="manager.full_name"
              :value="manager.id"
            >
              {{ manager.full_name }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            rows="3"
            placeholder="请输入项目描述"
            :prefix-icon="Document"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getProjectStats, 
  getProjectList, 
  createProject, 
  updateProject, 
  deleteProject
} from '@/api/project'
import { getUsersByRole } from '@/api/user'
import {
  Calendar,
  CircleCheckFilled,
  Collection,
  Warning,
  List,
  Search,
  Plus,
  Folder,
  Timer,
  Document,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 数据定义
const stats = ref({})
const projectList = ref([])
const inventoryManagerOptions = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const currentId = ref(null)
const searchQuery = ref('')
const submitting = ref(false)

// 状态选项配置
const statusOptions = [
  { label: '未开始', icon: 'InfoFilled', color: '#909399' },
  { label: '进行中', icon: 'Loading', color: '#E6A23C' },
  { label: '已完成', icon: 'CircleCheckFilled', color: '#67C23A' },
  { label: '异常', icon: 'CircleCloseFilled', color: '#F56C6C' }
]

const formRef = ref(null)
const form = reactive({
  name: '',
  duration_days: 30,
  date_range: [],
  status_id: 1,
  inventory_managers: [],
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  duration_days: [{ required: true, message: '请输入完成时间', trigger: 'blur' }],
  date_range: [{ required: true, message: '请选择起止时间', trigger: 'change' }],
  status_id: [{ required: true, message: '请选择项目状态', trigger: 'change' }],
  inventory_managers: [{ required: true, message: '请选择库存管理员', trigger: 'change' }]
}

// 计算属性：过滤后的项目列表
const filteredProjects = computed(() => {
  if (!searchQuery.value) return projectList.value
  const query = searchQuery.value.toLowerCase()
  return projectList.value.filter(project => 
    project.project_name.toLowerCase().includes(query) ||
    project.status_description.toLowerCase().includes(query) ||
    (project.inventory_managers || []).some(manager => 
      manager.toLowerCase().includes(query)
    )
  )
})

// 获取数据
const fetchData = async () => {
  try {
    const [statsRes, listRes] = await Promise.all([
      getProjectStats(),
      getProjectList()
    ])
    stats.value = statsRes.data
    console.log('stats',stats.value);
    projectList.value = listRes.data
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  }
}

// 获取库存管理员列表
const searchInventoryManagers = async (query) => {
  loading.value = true
  try {
    const res = await getUsersByRole({ search: query })
    inventoryManagerOptions.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('搜索库存管理员失败:', error)
    ElMessage.error('搜索库存管理员失败')
  } finally {
    loading.value = false
  }
}

// 初始化时获取默认的库存管理员列表
const fetchInventoryManagers = async () => {
  loading.value = true
  try {
    const res = await getUsersByRole({})
    inventoryManagerOptions.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('获取库存管理员列表失败:', error)
    ElMessage.error('获取库存管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 新增项目
const handleAdd = () => {
  dialogType.value = 'add'
  form.name = ''
  form.duration_days = 30
  form.date_range = []
  form.status_id = 1
  form.inventory_managers = []
  form.description = ''
  dialogVisible.value = true
}

// 编辑项目
const handleEdit = async (row) => {
  dialogType.value = 'edit'
  currentId.value = row.id
  form.name = row.project_name
  form.duration_days = row.duration_days
  form.date_range = [row.start_date, row.end_date]
  form.status_id = getStatusId(row.status_name)
  form.description = row.description

  // 确保在打开对话框前已经加载了库存管理员列表
  await fetchInventoryManagers()
  
  // 从后端获取的数据可能是名字数组，需要找到对应的id
  const managerIds = inventoryManagerOptions.value
    .filter(manager => row.inventory_managers.includes(manager.full_name))
    .map(manager => manager.id)
  
  form.inventory_managers = managerIds
  dialogVisible.value = true
}

// 删除项目
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该项目?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteProject(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (valid) {
      submitting.value = true
      const data = {
        name: form.name,
        duration_days: form.duration_days,
        start_date: form.date_range[0],
        end_date: form.date_range[1],
        status_id: form.status_id,
        inventory_manager_ids: form.inventory_managers,
        description: form.description
      }

      console.log('Creating project with data:', data)  // 添加调试日志

      if (dialogType.value === 'add') {
        await createProject(data)
        ElMessage.success('添加成功')
      } else {
        await updateProject(currentId.value, data)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      fetchData()
    }
  } catch (error) {
    console.error(dialogType.value === 'add' ? '添加失败:' : '更新失败:', error)
    ElMessage.error(dialogType.value === 'add' ? '添加失败' : '更新失败')
  } finally {
    submitting.value = false
  }
}

// 工具函数
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

const getStatusType = (status) => {
  const types = {
    'not_started': 'info',
    'in_progress': 'warning',
    'completed': 'success',
    'abnormal': 'danger'
  }
  return types[status] || 'info'
}

const getStatusIcon = (status) => {
  const icons = {
    'not_started': 'InfoFilled',
    'in_progress': 'Loading',
    'completed': 'CircleCheckFilled',
    'abnormal': 'CircleCloseFilled'
  }
  return icons[status] || 'InfoFilled'
}

const getStatusId = (status) => {
  const ids = {
    'not_started': 1,
    'in_progress': 2,
    'completed': 3,
    'abnormal': 4
  }
  return ids[status] || 1
}

const getDurationTagType = (days) => {
  if (days <= 30) return 'success'
  if (days <= 90) return 'warning'
  return 'danger'
}

const getProgressPercentage = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

const getRowClassName = ({ row }) => {
  if (row.status_name === 'abnormal') return 'error-row'
  return ''
}

// 初始化
onMounted(() => {
  fetchData()
  fetchInventoryManagers()
})
</script>

<style scoped>
.project-list {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mr-5 {
  margin-right: 5px;
}

.mr-10 {
  margin-right: 10px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #606266;
    padding: 0px 10px;

    .header-icon {
      margin-right: 8px;
      font-size: 16px;
    }
  }

  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    min-height: 70px;

    &.center {
      justify-content: center;
      text-align: center;
    }

    .stat-info {
      flex: 1;

      .completion-ratio {
        font-size: 22px;
        font-weight: bold;
        display: flex;
        align-items: baseline;
        gap: 5px;

        .completed {
          color: #67C23A;
        }

        .warning-number {
          color: #E6A23C;
        }

        .separator {
          color: #909399;
          font-size: 18px;
        }

        .total {
          color: #909399;
        }
      }

      .single-number {
        font-size: 28px;
        font-weight: bold;
        color: #409EFF;

        &.danger {
          color: #F56C6C;
        }
      }

      .ratio-label {
        font-size: 12px;
        color: #909399;
        margin-top: 3px;
      }
    }

    .stat-chart {
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  &.compact {
    .stat-content {
      padding: 10px 15px;
    }
  }
}

.list-card {
  border-radius: 12px;

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: bold;
      }
    }

    .header-right {
      display: flex;
      align-items: center;

      .search-input {
        width: 200px;
      }
    }
  }
}

.project-name {
  display: flex;
  align-items: center;
  color: #409EFF;
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
}

.managers-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  color: #606266;
}

:deep(.el-table) {
  border-radius: 8px;
  margin-top: 10px;

  .el-table__header th {
    background-color: #f5f7fa;
    color: #606266;
    font-weight: bold;
  }

  .error-row {
    background-color: #fef0f0;
  }
}

:deep(.el-dialog) {
  border-radius: 12px;

  .el-dialog__header {
    margin: 0;
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    border-top: 1px solid #e4e7ed;
    padding: 15px 20px;
  }
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-button-group) {
  .el-button {
    margin: 0 5px;
  }
}

:deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}
</style> 