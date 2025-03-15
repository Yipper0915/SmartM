<template>
  <div class="notice-manage">
    <!-- 列表视图 -->
    <div v-if="!showDetail" class="list-view">
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增公告
        </el-button>
      </div>

      <el-table :data="noticeList" style="width: 100%">
        <el-table-column prop="title" label="公告标题" />
        <el-table-column prop="content" label="公告内容" show-overflow-tooltip />
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="attachments" label="附件" width="120">
          <template #default="scope">
            <el-button v-if="scope.row.attachments && scope.row.attachments.length" 
              type="primary" link @click="handleViewAttachments(scope.row)">
              查看附件
            </el-button>
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" link @click="handleDetail(scope.row)">详情</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情/编辑视图 -->
    <div v-else class="notice-detail">
      <div class="detail-header">
        <el-button @click="showDetail = false" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <div class="detail-actions">
          <template v-if="currentNotice.id">
            <el-button v-if="!isEditing" type="primary" @click="startEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <template v-else>
              <el-button type="success" @click="saveEdit">
                <el-icon><Check /></el-icon>
                保存并发布
              </el-button>
              <el-button @click="cancelEdit">
                取消
              </el-button>
            </template>
          </template>
          <template v-else>
            <el-button type="success" @click="saveEdit">
              <el-icon><Check /></el-icon>
              发布公告
            </el-button>
            <el-button @click="showDetail = false">
              取消
            </el-button>
          </template>
        </div>
      </div>
      <div class="notice-header">
        <template v-if="!isEditing && currentNotice.id">
          <h1 class="notice-title">{{ currentNotice.title }}</h1>
          <div class="notice-meta">
            <span>发布时间：{{ formatDate(currentNotice.created_at) }}</span>
          </div>
        </template>
        <template v-else>
          <el-input v-model="editForm.title" placeholder="请输入公告标题" class="edit-title" />
        </template>
      </div>
      <div class="notice-content">
        <template v-if="!isEditing && currentNotice.id">
          {{ currentNotice.content }}
        </template>
        <template v-else>
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入公告内容"
            class="edit-content"
          />
        </template>
      </div>
      <div class="notice-attachments">
        <h3>附件列表：</h3>
        <template v-if="!isEditing && currentNotice.id">
          <div v-if="currentNotice.attachments && currentNotice.attachments.length" >
            <div v-for="(file, index) in currentNotice.attachments" :key="index" class="attachment-item">
              <el-link :href="file.url" target="_blank" type="primary">
                <el-icon><Document /></el-icon>
                {{ file.name }}
              </el-link>
            </div>
          </div>
          <div v-else>暂无附件</div>
        </template>
        <template v-else>
          <el-upload
            class="upload-demo"
            action="/api/notices/upload"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :file-list="fileList"
            multiple
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持jpg、png、pdf等格式文件
              </div>
            </template>
          </el-upload>
        </template>
      </div>
    </div>

    <!-- 查看附件对话框 -->
    <el-dialog
      title="附件列表"
      v-model="attachmentDialogVisible"
      width="400px"
    >
      <div v-for="(file, index) in currentAttachments" :key="index" class="attachment-item">
        <el-link :href="file.url" target="_blank" type="primary">{{ file.name }}</el-link>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, ArrowLeft, Edit, Check, Plus } from '@element-plus/icons-vue'
import { getNotices, addNotice, updateNotice, deleteNotice } from '@/api/notice'

const showDetail = ref(false)
const currentNotice = ref({})
const noticeList = ref([])
const dialogVisible = ref(false)
const attachmentDialogVisible = ref(false)
const dialogType = ref('add')
const currentAttachments = ref([])
const fileList = ref([])
const isEditing = ref(false)
const editForm = ref({
  title: '',
  content: '',
  attachments: []
})

// 上传组件的headers
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${sessionStorage.getItem('token')}`
}))

const form = ref({
  title: '',
  content: '',
  attachments: []
})

const rules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' }
  ]
}

const formRef = ref(null)

// 获取公告列表
const fetchNotices = async () => {
  try {
    const res = await getNotices()
    noticeList.value = res.data
  } catch (error) {
    console.error('获取公告列表失败:', error)
    ElMessage.error('获取公告列表失败')
  }
}

// 新增公告
const handleAdd = () => {
  showDetail.value = true
  isEditing.value = true
  currentNotice.value = {}
  editForm.value = {
    title: '',
    content: '',
    attachments: []
  }
  fileList.value = []
}

// 编辑公告
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  fileList.value = row.attachments?.map(item => ({
    name: item.name,
    url: item.url
  })) || []
  dialogVisible.value = true
}

// 删除公告
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该公告吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteNotice(row.id)
      ElMessage.success('删除成功')
      fetchNotices()
    } catch (error) {
      console.error('删除公告失败:', error)
      ElMessage.error('删除公告失败')
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          ...form.value,
          attachments: fileList.value.map(file => ({
            name: file.name,
            url: file.url
          }))
        }

        if (dialogType.value === 'add') {
          await addNotice(submitData)
          ElMessage.success('新增成功')
        } else {
          await updateNotice(submitData)
          ElMessage.success('更新成功')
        }

        dialogVisible.value = false
        fetchNotices()
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败')
      }
    }
  })
}

// 查看附件
const handleViewAttachments = (row) => {
  currentAttachments.value = row.attachments || []
  attachmentDialogVisible.value = true
}

// 上传成功回调
const handleUploadSuccess = (response, file) => {
  fileList.value.push({
    name: file.name,
    url: response.url
  })
}

// 移除文件
const handleRemove = (file) => {
  const index = fileList.value.findIndex(item => item.url === file.url)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 查看详情
const handleDetail = (row) => {
  currentNotice.value = row
  showDetail.value = true
  isEditing.value = false
  editForm.value = { ...row }
}

// 开始编辑
const startEdit = () => {
  isEditing.value = true
  editForm.value = {
    ...currentNotice.value,
    attachments: currentNotice.value.attachments || []
  }
  fileList.value = currentNotice.value.attachments?.map(item => ({
    name: item.name,
    url: item.url
  })) || []
}

// 保存编辑
const saveEdit = async () => {
  if (!editForm.value.title || !editForm.value.content) {
    ElMessage.warning('标题和内容不能为空')
    return
  }

  try {
    const submitData = {
      title: editForm.value.title,
      content: editForm.value.content,
      attachments: fileList.value.map(file => ({
        name: file.name,
        url: file.url
      }))
    }

    if (currentNotice.value.id) {
      // 更新公告
      submitData.id = currentNotice.value.id
      await updateNotice(submitData)
      ElMessage.success('更新成功')
    } else {
      // 新增公告
      await addNotice(submitData)
      ElMessage.success('发布成功')
    }

    isEditing.value = false
    showDetail.value = false
    // 刷新列表
    fetchNotices()
  } catch (error) {
    console.error(currentNotice.value.id ? '更新失败:' : '发布失败:', error)
    ElMessage.error(currentNotice.value.id ? '更新失败' : '发布失败')
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editForm.value = { ...currentNotice.value }
  fileList.value = currentNotice.value.attachments?.map(item => ({
    name: item.name,
    url: item.url
  })) || []
}

onMounted(() => {
  fetchNotices()
})
</script>

<style scoped>
.notice-manage {
  padding: 20px;
  width: 100%;
  min-height: calc(100vh - 120px); /* 减去头部和导航的高度 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
  padding: 10px 0;
}

/* 列表视图容器 */
.list-view {
  height: calc(100vh - 180px); /* 调整高度以适应内容 */
  overflow-y: auto;
}

/* 详情视图容器 */
.notice-detail {
  height: calc(100vh - 180px);
  overflow-y: auto;
  background: #fff;
  border-radius: 4px;
  padding: 10px;
}

/* 详情页样式 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.edit-title {
  margin-bottom: 15px;
}

.edit-title :deep(.el-input__inner) {
  font-size: 24px;
  font-weight: bold;
}

.edit-content {
  width: 100%;
}

.edit-content :deep(.el-textarea__inner) {
  font-size: 16px;
  line-height: 1.8;
}

.notice-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.notice-title {
  font-size: 24px;
  color: #303133;
  margin: 0 0 15px 0;
}

.notice-meta {
  color: #909399;
  font-size: 14px;
}

.notice-content {
  line-height: 1.8;
  font-size: 16px;
  color: #606266;
  margin: 20px 0;
  white-space: pre-wrap;
  min-height: 200px;  /* 确保内容区域有最小高度 */
}

.notice-attachments {
  margin: 30px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.notice-attachments h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

:deep(.el-table) {
  width: 100% !important;
}

:deep(.el-table__body) {
  width: 100% !important;
}

:deep(.el-table__header) {
  width: 100% !important;
}

:deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

:deep(.el-dialog__body) {
  padding: 20px 40px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.dialog-footer) {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.attachment-item {
  margin-bottom: 10px;
}
</style> 