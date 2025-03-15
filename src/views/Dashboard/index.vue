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
        <el-col :span="6" v-for="(stat, index) in statistics" :key="index">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.bgColor }">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
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
                <div v-for="notice in notices" :key="notice.id" class="notice-item">
                  <div class="notice-title">
                    <el-icon><InfoFilled /></el-icon>
                    <span>{{ notice.title }}</span>
                  </div>
                  <div class="notice-content">{{ notice.content }}</div>
                  <div class="notice-footer">
                    <span class="notice-time">{{ new Date(notice.created_at).toLocaleString() }}</span>
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
            <div class="project-list">
              <!-- 这里放项目动态列表 -->
              <div class="empty-placeholder">暂无项目动态</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Location, Sunny, Document, Histogram, User, Check, InfoFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'  // 导入 user store
import defaultAvatar from '@/assets/default-avatar.png'  // 导入默认头像

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
    value: '0',
    icon: Document,
    bgColor: '#409EFF'
  },
  {
    label: '项目进度',
    value: '0%',
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
    value: '0/0',
    icon: Check,
    bgColor: '#F56C6C'
  }
])

// 公告列表
const notices = ref([])

// 添加头像URL的计算属性
const avatarUrl = computed(() => {
  if (!userInfo.value.avatar) return defaultAvatar
  if (userInfo.value.avatar.startsWith('http')) return userInfo.value.avatar
  // 确保使用正确的服务器地址
  return `http://localhost:3001${userInfo.value.avatar}`
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    console.log('开始获取用户信息...')
    const userStore = useUserStore()
    
    // 如果 store 中已有用户信息，直接使用
    if (userStore.userInfo && Object.keys(userStore.userInfo).length > 0) {
      console.log('从 store 获取用户信息:', userStore.userInfo)
      userInfo.value = { ...userStore.userInfo }
    } else {
      // 否则从 API 获取
      const response = await api.get('/api/users/current')
      console.log('从 API 获取的用户信息:', response.data)
      
      if (response.data.data) {
        userInfo.value = response.data.data
        // 更新 store
        userStore.setUserInfo(response.data.data)
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
    console.log('获取到的公告列表:', response.data)
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

// 在组件挂载时获取数据
onMounted(() => {
  console.log('Dashboard组件已挂载，开始获取数据...')
  fetchUserInfo()
  fetchNotices()
  fetchEmployeeCount()  // 添加获取在职员工数量
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
  overflow-y: auto;
  height: calc(100% - 24px);
}

.notice-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
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
}
</style>