<template>
  <div class="dashboard-container">
    <!-- 顶部欢迎栏 -->
    <div class="welcome-card">
      <div class="welcome-left">
        <el-avatar :size="64" :src="avatarUrl" />
        <div class="welcome-info">
          <h2 class="greeting">{{ userInfo.greeting }}，{{ userInfo.full_name }}，今天也要加油哦！</h2>
          <div class="location-weather">
            <span class="location">
              <el-icon><Location /></el-icon>
              {{ location }}
            </span>
            <span class="weather">
              <el-icon><Sunny /></el-icon>
              {{ weather }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in displayStats" :key="index">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.bgColor }">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ stat.value }}
                  <template v-if="stat.urgentTasks && stat.urgentTasks.length > 0">
                    <el-tooltip
                      effect="dark"
                      placement="top"
                      :content="getUrgentTasksTooltip(stat.urgentTasks)"
                    >
                      <el-icon class="urgent-tasks-icon"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <template v-if="stat.lowStockMaterials && stat.lowStockMaterials.length > 0">
                    <el-tooltip
                      effect="dark"
                      placement="top"
                      :content="getLowStockMaterialsTooltip(stat.lowStockMaterials)"
                    >
                      <el-icon class="urgent-tasks-icon"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                </div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 公告和项目动态 -->
    <div class="info-container">
      <el-row :gutter="20">
        <!-- 公告内容 -->
        <el-col :span="12">
          <el-card class="notice-card">
            <template #header>
              <div class="card-header">
                <span>公告内容</span>
                <el-button text>查看更多</el-button>
              </div>
            </template>
            <div class="notice-list">
              <template v-if="notices.length">
                <div v-for="notice in notices" 
                     :key="notice.id" 
                     class="notice-item"
                     @click="handleNoticeClick(notice.id)">
                  <div class="notice-title">
                    <el-icon><InfoFilled /></el-icon>
                    <span>{{ notice.title }}</span>
                  </div>
                  <div class="notice-content">{{ notice.content }}</div>
                  <div class="notice-footer">
                    <span class="notice-time">{{ new Date(notice.created_at).toLocaleString() }}</span>
                    <el-button link @click="handleDetail(row)" type="primary" size="small">
                      查看详情
                      <el-icon class="el-icon--right"><arrow-right /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
              <div v-else class="empty-placeholder">暂无公告内容</div>
            </div>
          </el-card>
        </el-col>

        <!-- 项目动态 -->
        <el-col :span="12">
          <el-card class="project-card">
            <template #header>
              <div class="card-header">
                <span>项目动态</span>
                <el-button text>查看更多</el-button>
              </div>
            </template>
            <div class="project-list" v-loading="projectActivitiesLoading">
              <template v-if="projectActivities.length">
                <div v-for="activity in projectActivities" :key="activity.id" class="activity-item">
                  <div class="activity-title">
                    <el-tag size="small" type="info">{{ activity.project_name }}</el-tag>
                    <span class="activity-user">{{ activity.user_name }}</span>
                  </div>
                  <div class="activity-content">{{ activity.description }}</div>
                  <div class="activity-time">{{ new Date(activity.created_at).toLocaleString() }}</div>
                </div>
              </template>
              <div v-else class="empty-placeholder">暂无项目动态</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Location, Sunny, Document, Histogram, User, Check, InfoFilled, ArrowRight } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'  // 导入 user store
import defaultAvatar from '@/assets/default-avatar.png'  // 导入默认头像
import { useRouter } from 'vue-router'

// 创建新的 axios 实例，避免影响全局配置
const api = axios.create({
  baseURL: 'http://localhost:3001',  // 更新为正确的后端 API 地址
  timeout: 5000
})

// 添加请求拦截器
api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('token')
    console.log('当前token:', token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('请求头:', config.headers)
    } else {
      console.warn('未找到token')
    }
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 用户信息
const userInfo = ref({
  full_name: '加载中...',
  avatar: '',
  greeting: '你好'
})

// 位置和天气信息（后续可以通过API获取）
const location = ref('广州市')
const weather = ref('晴 26°C')

// 统计数据
const statistics = ref([
  {
    label: '订单数',
    value: '8',
    icon: Document,
    bgColor: '#409EFF'
  },
  {
    label: '项目进度',
    value: '50%',
    icon: Histogram,
    bgColor: '#67C23A'
  },
  {
    label: '在职员工',
    value: '0',
    icon: User,
    bgColor: '#E6A23C'
  },
  {
    label: '项目完成率',
    value: '2/8',
    icon: Check,
    bgColor: '#F56C6C'
  }
])

// 生产专员的统计数据
const productionStats = ref([
  {
    label: '总任务数',
    value: '0',
    icon: Document,
    bgColor: '#409EFF'
  },
  {
    label: '进行中任务',
    value: '0',
    icon: Histogram,
    bgColor: '#67C23A'
  },
  {
    label: '异常任务',
    value: '0',
    icon: User,
    bgColor: '#E6A23C'
  },
  {
    label: '即将截止',
    value: '0',
    icon: Check,
    bgColor: '#F56C6C',
    urgentTasks: [] // 添加即将截止任务的详细信息
  }
])

// 库存管理员的统计数据
const inventoryStats = ref([
  {
    label: '关联项目数',
    value: '0',
    icon: Document,
    bgColor: '#409EFF'
  },
  {
    label: '出库记录',
    value: '0',
    icon: Histogram,
    bgColor: '#67C23A'
  },
  {
    label: '入库记录',
    value: '0',
    icon: User,
    bgColor: '#E6A23C'
  },
  {
    label: '材料紧缺',
    value: '0',
    icon: InfoFilled,
    bgColor: '#F56C6C',
    lowStockMaterials: [] // 添加库存紧缺材料的详细信息
  }
])

// 公告列表
const notices = ref([])

// 项目动态列表
const projectActivities = ref([])
const projectActivitiesLoading = ref(false)

// 添加头像URL的计算属性
const avatarUrl = computed(() => {
  if (!userInfo.value.avatar) return defaultAvatar
  if (userInfo.value.avatar.startsWith('http')) return userInfo.value.avatar
  // 确保使用正确的服务器地址
  return `http://localhost:3001${userInfo.value.avatar}`
})

// 获取用户角色
const userStore = useUserStore()
const userRole = computed(() => {
  console.log('计算用户角色，store中的userInfo:', userStore.userInfo)
  console.log('用户角色数组:', JSON.stringify(userStore.userInfo?.roles))
  // 从 roles 数组中获取第一个角色
  const roles = Array.isArray(userStore.userInfo?.roles) ? userStore.userInfo.roles : []
  const roleName = roles[0]
  console.log('计算得到的角色名称:', roleName)
  return roleName || null
})

// 根据用户角色显示不同的统计数据
const displayStats = computed(() => {
  console.log('计算显示统计数据，当前用户角色:', userRole.value)
  console.log('是否显示生产专员统计:', userRole.value === 'production_specialist')
  if (userRole.value === 'production_specialist') {
    return productionStats.value
  } else if (userRole.value === 'inventory_manager') {
    return inventoryStats.value
  } else {
    return statistics.value
  }
})

const router = useRouter()

// 获取生产专员的统计数据
const fetchProductionStats = async () => {
  try {
    console.log('开始获取生产专员统计数据...')
    const response = await api.get('/api/tasks/stats')
    console.log('获取到的统计数据:', response.data)
    const stats = response.data.data
    
    productionStats.value[0].value = stats.total_tasks
    productionStats.value[1].value = stats.in_progress_tasks
    productionStats.value[2].value = stats.abnormal_tasks
    productionStats.value[3].value = stats.urgent_tasks
    productionStats.value[3].urgentTasks = stats.urgent_tasks_details || []
    
    console.log('更新后的生产专员统计数据:', productionStats.value)
  } catch (error) {
    console.error('获取生产专员统计数据失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      console.error('状态码:', error.response.status)
    }
  }
}

// 获取库存管理员统计数据
const fetchInventoryStats = async () => {
  try {
    console.log('开始获取库存管理员统计数据...')
    const response = await api.get('/api/inventory/stats')
    console.log('获取到的库存统计数据:', response.data)
    const stats = response.data.data
    
    inventoryStats.value[0].value = stats.project_count
    inventoryStats.value[1].value = stats.stock_out_count
    inventoryStats.value[2].value = stats.stock_in_count
    inventoryStats.value[3].value = stats.low_stock_count
    inventoryStats.value[3].lowStockMaterials = stats.low_stock_materials || []
    
    console.log('更新后的库存管理员统计数据:', inventoryStats.value)
  } catch (error) {
    console.error('获取库存管理员统计数据失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      console.error('状态码:', error.response.status)
    }
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    console.log('开始获取用户信息...')
    
    // 如果 store 中已有用户信息，直接使用
    if (userStore.userInfo && Object.keys(userStore.userInfo).length > 0) {
      console.log('从 store 获取用户信息:', userStore.userInfo)
      console.log('用户角色数组:', JSON.stringify(userStore.userInfo.roles))
      userInfo.value = { ...userStore.userInfo }
    } else {
      // 否则从 API 获取
      const response = await api.get('/api/users/current')
      console.log('从 API 获取的用户信息:', response.data)
      
      if (response.data.data) {
        const userData = response.data.data
        console.log('API返回的用户数据:', userData)
        console.log('用户角色:', JSON.stringify(userData.roles))
        
        userInfo.value = {
          full_name: userData.full_name,
          avatar: userData.avatar,
          greeting: '你好'
        }
        // 更新 store，保持原有的数据结构
        userStore.setUserInfo(userData)
        console.log('更新后的store:', userStore.userInfo)
      }
    }

    // 设置问候语
    const hour = new Date().getHours()
    let greeting = '早上好'
    if (hour >= 12 && hour < 18) {
      greeting = '下午好'
    } else if (hour >= 18) {
      greeting = '晚上好'
    }
    userInfo.value.greeting = greeting
    
    console.log('更新后的用户信息:', userInfo.value)
    const roles = Array.isArray(userStore.userInfo?.roles) ? userStore.userInfo.roles : []
    console.log('当前store中的用户角色:', roles[0])

    // 根据用户角色获取对应的统计数据
    if (roles[0] === 'production_specialist') {
      console.log('检测到生产专员，开始获取统计数据')
      await fetchProductionStats()
    } else if (roles[0] === 'inventory_manager') {
      console.log('检测到库存管理员，开始获取统计数据')
      await fetchInventoryStats()
    } else {
      console.log('使用默认统计数据')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      console.error('状态码:', error.response.status)
    }
  }
}

// 获取公告列表
const fetchNotices = async () => {
  try {
    console.log('开始获取公告列表...')
    const response = await api.get('/api/notices')
    notices.value = response.data.data
  } catch (error) {
    console.error('获取公告列表失败:', error)
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
      console.error('错误状态码:', error.response.status)
      if (error.response.status === 401) {
        console.error('认证失败，可能需要重新登录')
      }
    }
  }
}

// 获取项目动态
const fetchProjectActivities = async () => {
  try {
    projectActivitiesLoading.value = true
    console.log('开始获取项目动态...')
    const response = await api.get('/api/project-activities/latest')
    projectActivities.value = response.data.data
    console.log('获取到的项目动态:', projectActivities.value)
  } catch (error) {
    console.error('获取项目动态失败:', error)
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
      console.error('错误状态码:', error.response.status)
    }
  } finally {
    projectActivitiesLoading.value = false
  }
}

// 获取在职员工数量
const fetchEmployeeCount = async () => {
  try {
    console.log('开始获取在职员工数量...')
    const response = await api.get('/api/users/count')
    console.log('获取到的在职员工数量:', response.data)
    if (response.data.data) {
      statistics.value[2].value = response.data.data
    }
  } catch (error) {
    console.error('获取在职员工数量失败:', error)
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
      console.error('错误状态码:', error.response.status)
    }
  }
}

// 处理公告点击
const handleNoticeClick = (noticeId) => {
  router.push(`/notice/${noticeId}`)
}

// 获取即将截止任务的提示信息
const getUrgentTasksTooltip = (tasks) => {
  return tasks.map(task => task.project_name).join('\n')
}

// 获取库存紧缺材料的提示信息
const getLowStockMaterialsTooltip = (materials) => {
  return materials.map(mat => `${mat.material_code} - ${mat.name}: ${mat.quantity}${mat.unit}`).join('\n')
}

// 在组件挂载时获取数据
onMounted(() => {
  console.log('Dashboard组件已挂载，开始获取数据...')
  fetchUserInfo()
  fetchNotices()
  fetchEmployeeCount()  // 添加获取在职员工数量
  fetchProjectActivities()  // 添加获取项目动态
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
  box-sizing: border-box;
}

.welcome-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.welcome-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.greeting {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.location-weather {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.location, .weather {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 8px;

  .urgent-tasks-icon {
    font-size: 16px;
    color: #F56C6C;
    cursor: pointer;
  }
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.info-container .el-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 16px;
  font-weight: 500;
}

.empty-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.notice-list {
  padding: 0 16px;
  overflow-y: auto; /* 开启垂直滚动 */
  height: 300px; /* 固定高度 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e4e7ed;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f5f7fa;
  }
}

.notice-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f5f7fa;
    padding: 16px 10px;
    margin: 0 -10px;
  }
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;

  .el-icon {
    color: #409EFF;
  }
}

.notice-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.notice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.notice-time {
  color: #909399;
}

.project-list {
  height: calc(100% - 24px);
  padding: 0 16px;
  overflow-y: auto; /* 开启垂直滚动 */
  height: 300px; /* 固定高度 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e4e7ed;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f5f7fa;
  }
}

.activity-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  transition: all 0.3s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f5f7fa;
    padding: 16px 10px;
    margin: 0 -10px;
  }
}

.activity-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.activity-user {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.activity-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.activity-time {
  color: #909399;
  font-size: 12px;
}
</style>