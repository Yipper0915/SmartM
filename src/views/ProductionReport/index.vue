<template>
  <div class="production-report-container">
    <div class="header">
      <h2>生产日报</h2>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>

    <el-alert
      v-if="!projects.length"
      title="您尚未分配任何项目任务"
      type="warning"
      description="请联系项目经理为您分配任务，或使用测试接口创建测试任务。接口: POST /api/production-reports/create-test-task，参数: {user_id: 3, project_id: 5}"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-form :model="reportForm" :rules="rules" ref="reportFormRef" label-width="120px">
      <el-form-item label="选择项目" prop="project_id">
        <el-select v-model="reportForm.project_id" placeholder="请选择项目">
          <el-option
            v-for="project in projects"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          />
        </el-select>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="今日产量" prop="production_quantity">
            <el-input-number 
              v-model="reportForm.production_quantity" 
              :min="0"
              placeholder="请输入今日产量"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="今日耗材" prop="material_consumption">
            <el-input 
              v-model="reportForm.material_consumption"
              placeholder="请输入今日耗材"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="详细说明" prop="details">
        <el-input
          type="textarea"
          v-model="reportForm.details"
          :rows="6"
          placeholder="请输入详细说明"
        />
      </el-form-item>
    </el-form>
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

// 添加请求拦截器
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
const projects = ref([])
const reportFormRef = ref(null)

const reportForm = ref({
  project_id: '',
  production_quantity: 0,
  material_consumption: '',
  details: ''
})

const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  production_quantity: [{ required: true, message: '请输入今日产量', trigger: 'blur' }],
  material_consumption: [{ required: true, message: '请输入今日耗材', trigger: 'blur' }]
}

// 获取用户可参与的项目列表
const fetchUserProjects = async () => {
  try {
    console.log('正在获取生产专员可参与的项目列表...')
    const response = await api.get('/api/production-reports/projects/user')
    console.log('获取到的项目数据:', response.data)
    projects.value = response.data.data
    
    if (projects.value.length > 0) {
      console.log('自动选择第一个项目:', projects.value[0])
      reportForm.value.project_id = projects.value[0].id
    } else {
      console.log('没有可用的项目')
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ElMessage.error('获取项目列表失败')
  }
}

// 保存日报
const handleSave = async () => {
  if (!reportFormRef.value) return
  
  await reportFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        console.log('正在提交日报数据:', reportForm.value)
        const response = await api.post('/api/production-reports', reportForm.value)
        console.log('提交成功，响应:', response.data)
        ElMessage.success('日报保存成功')
        
        // 重置表单
        reportFormRef.value.resetFields()
        reportForm.value = {
          project_id: projects.value.length > 0 ? projects.value[0].id : '',
          production_quantity: 0,
          material_consumption: '',
          details: ''
        }
      } catch (error) {
        console.error('保存失败:', error.response?.data || error)
        ElMessage.error(error.response?.data?.message || '保存失败，请稍后重试')
      }
    } else {
      console.log('表单验证失败')
      ElMessage.warning('请完善表单信息')
    }
  })
}

onMounted(() => {
  fetchUserProjects()
})
</script>

<style lang="scss" scoped>
.production-report-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
  }
}
</style> 