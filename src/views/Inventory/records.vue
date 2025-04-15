<template>
  <div class="records-container">
    <div class="header-section">
      <h2>库存记录</h2>
      <el-select
        v-model="selectedMaterial"
        filterable
        clearable
        placeholder="选择材料筛选"
        class="material-select"
        @change="handleMaterialChange"
      >
        <el-option
          v-for="item in materials"
          :key="item.id"
          :label="`${item.material_code} - ${item.name}`"
          :value="item.id"
        />
      </el-select>
    </div>

    <el-table
      v-loading="loading"
      :data="records"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="material_code" label="材料编号" width="120" />
      <el-table-column prop="material_name" label="材料名称" width="150" />
      <el-table-column prop="record_type" label="操作类型" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.record_type === 'in' ? 'success' : 'danger'">
            {{ scope.row.record_type === 'in' ? '入库' : '出库' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="100" />
      <el-table-column prop="project_name" label="所属项目" width="150">
        <template #default="scope">
          {{ scope.row.record_type === 'in' ? '/' : (scope.row.project_name || '/') }}
        </template>
      </el-table-column>
      <el-table-column prop="project_manager" label="项目经理" width="120">
        <template #default="scope">
          {{ scope.row.record_type === 'in' ? '/' : (scope.row.project_manager || '/') }}
        </template>
      </el-table-column>
      <el-table-column prop="operator_name" label="操作人" width="120" />
      <el-table-column prop="created_at" label="操作时间" width="180">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="备注" />
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
import { getInventoryRecords, getMaterialList } from '@/api/inventory'

// 数据列表状态
const loading = ref(false)
const records = ref([])
const materials = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedMaterial = ref('')

// 加载库存记录
const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    if (selectedMaterial.value) {
      params.material_id = selectedMaterial.value
    }
    
    const res = await getInventoryRecords(params)
    records.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('获取库存记录失败:', error)
    ElMessage.error('获取库存记录失败')
  } finally {
    loading.value = false
  }
}

// 加载材料列表(用于筛选)
const fetchMaterials = async () => {
  try {
    const res = await getMaterialList({ page_size: 1000 }) // 获取所有材料用于选择
    materials.value = res.data.materials
  } catch (error) {
    console.error('获取材料列表失败:', error)
    ElMessage.error('获取材料列表失败')
  }
}

// 材料选择变更
const handleMaterialChange = () => {
  currentPage.value = 1
  fetchRecords()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchRecords()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchRecords()
}

onMounted(() => {
  fetchMaterials()
  fetchRecords()
})
</script>

<style lang="scss" scoped>
.records-container {
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
    
    .material-select {
      width: 300px;
    }
  }
  
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style> 