<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="avatar-section">
        <el-avatar :size="120" :src="avatarUrl" />
        <el-upload
          class="avatar-uploader"
          action="http://localhost:3001/api/users/avatar"
          :headers="uploadHeaders"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
          name="file"
        >
          <el-button size="small" class="change-avatar-btn">更换头像</el-button>
        </el-upload>
      </div>
      <div class="actions">
        <el-button type="primary" @click="handleEdit" v-if="!isEditing">
          <el-icon><Edit /></el-icon>
          编辑资料
        </el-button>
        <template v-else>
          <el-button type="success" @click="handleSave">
            <el-icon><Check /></el-icon>
            保存
          </el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </template>
      </div>
    </div>

    <div class="profile-content">
      <el-descriptions :column="2" border v-if="!isEditing">
        <el-descriptions-item label="账号">{{ userInfo.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ userInfo.full_name }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ userInfo.department }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ userInfo.gender === 1 ? '男' : '女' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ userInfo.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
      </el-descriptions>

      <el-form v-else ref="formRef" :model="editForm" :rules="rules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="editForm.full_name" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="editForm.department" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="editForm.password" type="password" show-password placeholder="不修改请留空" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Check } from '@element-plus/icons-vue'
import defaultAvatar from '@/assets/default-avatar.png'
import { getCurrentUser, updateProfile, updateAvatar } from '@/api/user'

const userInfo = ref({})
const isEditing = ref(false)
const formRef = ref(null)

const editForm = ref({
  username: '',
  full_name: '',
  department: '',
  gender: 1,
  phone: '',
  email: '',
  password: ''
})

const rules = {
  full_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  password: [{ min: 6, message: '密码长度不能小于6位', trigger: 'blur' }]
}

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${sessionStorage.getItem('token')}`
}))

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
    const res = await getCurrentUser()
    userInfo.value = res.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 开始编辑
const handleEdit = () => {
  isEditing.value = true
  editForm.value = {
    ...userInfo.value,
    password: ''
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editForm.value = { ...userInfo.value }
}

// 保存编辑
const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = { ...editForm.value }
        if (!submitData.password) {
          delete submitData.password
        }
        await updateProfile(submitData)
        ElMessage.success('保存成功')
        isEditing.value = false
        fetchUserInfo()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    }
  })
}

// 上传头像前的验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传成功的回调
const handleAvatarSuccess = (response) => {
  if (response.url) {
    userInfo.value.avatar = response.url
    // 强制刷新用户信息
    fetchUserInfo()
    ElMessage.success('头像更新成功')
  } else {
    ElMessage.error('头像更新失败')
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.change-avatar-btn {
  width: 100px;
}

.profile-content {
  max-width: 800px;
}

:deep(.el-descriptions) {
  margin-bottom: 20px;
}

:deep(.el-form) {
  max-width: 500px;
}
</style> 