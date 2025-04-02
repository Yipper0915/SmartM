<template>
  <div class="report-list-container">
    <div class="header-section">
      <h2>生产日报列表</h2>
      <el-select v-model="selectedProject" placeholder="选择项目" @change="handleProjectChange">
        <el-option
          v-for="project in projects"
          :key="project.id"
          :label="project.name"
          :value="project.id"
        />
      </el-select>
    </div>

    <el-table
      v-loading="loading"
      :data="reports"
      style="width: 100%"
      border
    >
      <el-table-column prop="created_at" label="日期" width="180">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="user_name" label="生产专员" width="120" />
      <el-table-column prop="production_quantity" label="产量" width="100" />
      <el-table-column prop="material_consumption" label="耗材" width="200" />
      <el-table-column prop="details" label="详细说明">
        <template #default="scope">
          <el-tooltip
            v-if="scope.row.details"
            :content="scope.row.details"
            placement="top"
            :hide-after="0"
          >
            <div class="details-cell">{{ scope.row.details }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000
})

api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

const userStore = useUserStore()
const loading = ref(false)
const projects = ref([])
const reports = ref([])
const selectedProject = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取项目经理的项目列表
const fetchManagerProjects = async () => {
  try {
    const response = await api.get('/api/projects/manager')
    projects.value = response.data.data
    if (projects.value.length > 0) {
      selectedProject.value = projects.value[0].id
      fetchReports()
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ElMessage.error('获取项目列表失败')
  }
}

// 获取日报列表
const fetchReports = async () => {
  if (!selectedProject.value) return
  
  loading.value = true
  try {
    console.log('正在获取项目ID为', selectedProject.value, '的日报列表')
    const response = await api.get('/api/production-reports', {
      params: {
        project_id: selectedProject.value,
        page: currentPage.value,
        page_size: pageSize.value
      }
    })
    console.log('获取到的日报数据:', response.data)
    reports.value = response.data.data.reports
    total.value = response.data.data.total
  } catch (error) {
    console.error('获取日报列表失败:', error)
    ElMessage.error('获取日报列表失败')
    reports.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleProjectChange = () => {
  currentPage.value = 1
  fetchReports()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchReports()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchReports()
}

onMounted(() => {
  fetchManagerProjects()
})
</script>

<style lang="scss" scoped>
.report-list-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .header-section {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    gap: 20px;

    h2 {
      margin: 0;
      white-space: nowrap;
    }

    .el-select {
      width: 500px;
    }
  }

  .details-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style> 