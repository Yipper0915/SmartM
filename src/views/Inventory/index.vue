<template>
  <div class="inventory-container">
    <div class="header-section">
      <h2>材料管理</h2>
      <div class="actions">
        <el-input
          v-model="searchText"
          placeholder="搜索材料编号/名称/供应商"
          class="search-input"
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleAdd">新增材料</el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="materials"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="material_code" label="材料编号" width="120" />
      <el-table-column prop="name" label="材料名称" width="150" />
      <el-table-column prop="quantity" label="数量" width="100" />
      <el-table-column prop="supplier" label="供应商" width="150" />
      <el-table-column prop="unit_price" label="单价" width="100">
        <template #default="scope">¥{{ scope.row.unit_price }}</template>
      </el-table-column>
      <el-table-column prop="unit" label="计量单位" width="100" />
      <el-table-column prop="image_url" label="图片" width="100">
        <template #default="scope">
          <el-image
            v-if="scope.row.image_url"
            :src="scope.row.image_url"
            fit="cover"
            style="width: 50px; height: 50px"
            :preview-src-list="[scope.row.image_url]"
          />
          <span v-else>无图片</span>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="库存位置" width="120" />
      <el-table-column label="操作" fixed="right" width="280">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleStockIn(scope.row)">入库</el-button>
          <el-button type="warning" size="small" @click="handleStockOut(scope.row)">出库</el-button>
          <el-button type="success" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 新增/编辑材料对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '新增材料' : '编辑材料'"
      v-model="materialDialogVisible"
      width="500px"
    >
      <el-form :model="materialForm" :rules="materialRules" ref="materialFormRef" label-width="100px">
        <el-form-item label="材料编号" prop="material_code">
          <el-input v-model="materialForm.material_code" placeholder="请输入材料编号" />
        </el-form-item>
        <el-form-item label="材料名称" prop="name">
          <el-input v-model="materialForm.name" placeholder="请输入材料名称" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-input v-model="materialForm.supplier" placeholder="请输入供应商" />
        </el-form-item>
        <el-form-item label="单价" prop="unit_price">
          <el-input-number v-model="materialForm.unit_price" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="materialForm.unit" placeholder="请输入计量单位" />
        </el-form-item>
        <el-form-item label="库存位置" prop="location">
          <el-input v-model="materialForm.location" placeholder="请输入库存位置" />
        </el-form-item>
        <el-form-item label="材料图片" prop="image_url">
          <el-upload
            class="avatar-uploader"
            action="http://localhost:3001/api/upload"
            :headers="getUploadHeaders()"
            name="file"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="materialForm.image_url" :src="materialForm.image_url" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">点击上传图片，只能上传jpg/png文件，且不超过2MB</div>
        </el-form-item>
        <el-form-item label="初始数量" prop="quantity" v-if="dialogType === 'add'">
          <el-input-number v-model="materialForm.quantity" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="materialDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMaterialForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 入库对话框 -->
    <el-dialog
      title="材料入库"
      v-model="stockInDialogVisible"
      width="400px"
    >
      <div class="material-info" v-if="currentMaterial">
        <p><strong>材料编号:</strong> {{ currentMaterial.material_code }}</p>
        <p><strong>材料名称:</strong> {{ currentMaterial.name }}</p>
        <p><strong>当前库存:</strong> {{ currentMaterial.quantity }} {{ currentMaterial.unit }}</p>
      </div>
      <el-form :model="stockForm" :rules="stockRules" ref="stockInFormRef" label-width="80px">
        <el-form-item label="入库数量" prop="quantity">
          <el-input-number v-model="stockForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input
            type="textarea"
            v-model="stockForm.description"
            placeholder="请输入入库备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="stockInDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitStockIn">确定入库</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 出库对话框 -->
    <el-dialog
      title="材料出库"
      v-model="stockOutDialogVisible"
      width="500px"
    >
      <div class="material-info" v-if="currentMaterial">
        <p><strong>材料编号:</strong> {{ currentMaterial.material_code }}</p>
        <p><strong>材料名称:</strong> {{ currentMaterial.name }}</p>
        <p><strong>当前库存:</strong> {{ currentMaterial.quantity }} {{ currentMaterial.unit }}</p>
      </div>
      <el-form :model="stockForm" :rules="stockRules" ref="stockOutFormRef" label-width="100px">
        <el-form-item label="所属项目" prop="project_id">
          <el-select v-model="stockForm.project_id" placeholder="请选择项目" style="width: 100%" @change="handleProjectChange">
            <el-option
              v-for="item in managerProjects"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目经理" prop="manager_name">
          <el-input v-model="stockForm.manager_name" placeholder="项目经理" disabled />
        </el-form-item>
        <el-form-item label="出库数量" prop="quantity">
          <el-input-number
            v-model="stockForm.quantity"
            :min="1"
            :max="currentMaterial ? currentMaterial.quantity : 0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input
            type="textarea"
            v-model="stockForm.description"
            placeholder="请输入出库备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="stockOutDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitStockOut">确定出库</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMaterialList,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  stockInMaterial,
  stockOutMaterial
} from '@/api/inventory'
import axios from 'axios'

// 数据列表状态
const loading = ref(false)
const materials = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchText = ref('')

// 表单状态
const materialDialogVisible = ref(false)
const stockInDialogVisible = ref(false)
const stockOutDialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const currentMaterial = ref(null)
const materialFormRef = ref(null)
const stockInFormRef = ref(null)
const stockOutFormRef = ref(null)

// 材料表单
const materialForm = ref({
  material_code: '',
  name: '',
  quantity: 0,
  supplier: '',
  unit_price: 0,
  unit: '',
  image_url: '',
  location: ''
})

// 添加项目相关数据
const managerProjects = ref([])
const projectManagers = ref({}) // 存储项目ID到项目经理的映射

// 入库/出库表单修改
const stockForm = ref({
  quantity: 1,
  description: '',
  project_id: '',
  manager_name: ''
})

// 表单验证规则修改
const materialRules = {
  material_code: [{ required: true, message: '请输入材料编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入材料名称', trigger: 'blur' }],
  unit_price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入计量单位', trigger: 'blur' }]
}

const stockRules = {
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }]
}

// 加载材料列表
const fetchMaterials = async () => {
  loading.value = true
  try {
    const res = await getMaterialList({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchText.value
    })
    materials.value = res.data.materials
    total.value = res.data.total
  } catch (error) {
    console.error('获取材料列表失败:', error)
    ElMessage.error('获取材料列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchMaterials()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchMaterials()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchMaterials()
}

// 新增材料
const handleAdd = () => {
  dialogType.value = 'add'
  materialForm.value = {
    material_code: '',
    name: '',
    quantity: 0,
    supplier: '',
    unit_price: 0,
    unit: '',
    image_url: '',
    location: ''
  }
  materialDialogVisible.value = true
}

// 编辑材料
const handleEdit = (row) => {
  dialogType.value = 'edit'
  materialForm.value = { ...row }
  materialDialogVisible.value = true
}

// 提交材料表单
const submitMaterialForm = async () => {
  if (!materialFormRef.value) return
  
  await materialFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          await createMaterial(materialForm.value)
          ElMessage.success('材料添加成功')
        } else {
          await updateMaterial(materialForm.value.id, materialForm.value)
          ElMessage.success('材料更新成功')
        }
        materialDialogVisible.value = false
        fetchMaterials()
      } catch (error) {
        console.error('提交材料表单失败:', error)
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    }
  })
}

// 删除材料
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除材料 ${row.name} 吗？此操作将不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteMaterial(row.id)
      ElMessage.success('材料删除成功')
      fetchMaterials()
    } catch (error) {
      console.error('删除材料失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 入库处理
const handleStockIn = (row) => {
  currentMaterial.value = row
  stockForm.value = {
    quantity: 1,
    description: ''
  }
  stockInDialogVisible.value = true
}

// 提交入库
const submitStockIn = async () => {
  if (!stockInFormRef.value) return
  
  await stockInFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await stockInMaterial(currentMaterial.value.id, stockForm.value)
        ElMessage.success('入库成功')
        stockInDialogVisible.value = false
        fetchMaterials()
      } catch (error) {
        console.error('入库失败:', error)
        ElMessage.error(error.response?.data?.message || '入库失败')
      }
    }
  })
}

// 加载库存管理员关联的项目
const fetchManagerProjects = async () => {
  try {
    // 创建axios实例并配置
    const apiClient = axios.create({
      baseURL: 'http://localhost:3001/api',
      timeout: 5000,
      headers: getUploadHeaders()
    })
    
    // 获取库存管理员关联的项目
    const response = await apiClient.get('/inventory/manager-projects')
    managerProjects.value = response.data.data
    
    // 提取并存储每个项目的经理信息
    managerProjects.value.forEach(project => {
      projectManagers.value[project.id] = {
        id: project.manager_id,
        name: project.manager_name
      }
    })
  } catch (error) {
    console.error('获取项目信息失败:', error)
    ElMessage.error('获取项目信息失败')
  }
}

// 项目变更处理
const handleProjectChange = (projectId) => {
  if (projectId && projectManagers.value[projectId]) {
    stockForm.value.manager_name = projectManagers.value[projectId].name
  } else {
    stockForm.value.manager_name = ''
  }
}

// 出库处理修改
const handleStockOut = (row) => {
  currentMaterial.value = row
  stockForm.value = {
    quantity: 1,
    description: '',
    project_id: '',
    manager_name: ''
  }
  
  // 如果只有一个项目，默认选中
  if (managerProjects.value.length === 1) {
    stockForm.value.project_id = managerProjects.value[0].id
    handleProjectChange(stockForm.value.project_id)
  }
  
  stockOutDialogVisible.value = true
}

// 提交出库修改
const submitStockOut = async () => {
  if (!stockOutFormRef.value) return
  
  await stockOutFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 添加项目信息
        const outData = {
          quantity: stockForm.value.quantity,
          description: stockForm.value.description,
          project_id: stockForm.value.project_id
        }
        
        await stockOutMaterial(currentMaterial.value.id, outData)
        ElMessage.success('出库成功')
        stockOutDialogVisible.value = false
        fetchMaterials()
      } catch (error) {
        console.error('出库失败:', error)
        ElMessage.error(error.response?.data?.message || '出库失败')
      }
    }
  })
}

// 获取上传组件所需的headers
const getUploadHeaders = () => {
  const token = sessionStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 图片上传相关方法
const handleUploadSuccess = (response) => {
  materialForm.value.image_url = response.data.url
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('图片只能是JPG或PNG格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  return true
}

onMounted(() => {
  fetchMaterials()
  fetchManagerProjects() // 加载项目信息
})
</script>

<style lang="scss" scoped>
.inventory-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
    
    .actions {
      display: flex;
      gap: 10px;
      
      .search-input {
        width: 300px;
      }
    }
  }
  
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .material-info {
    background-color: #f5f7fa;
    padding: 10px 15px;
    border-radius: 4px;
    margin-bottom: 15px;
    
    p {
      margin: 5px 0;
    }
  }
  
  .avatar-uploader {
    display: flex;
    justify-content: center;
    width: 100%;
    
    .avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 178px;
      height: 178px;
      text-align: center;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .avatar {
      width: 178px;
      height: 178px;
      display: block;
      object-fit: cover;
      border-radius: 6px;
    }
  }
  
  .upload-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
    text-align: center;
  }
}
</style> 