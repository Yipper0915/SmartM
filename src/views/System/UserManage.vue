<template>
  <div class="user-manage">
    <div class="header-actions mb-20">
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
    </div>
    
    <el-table 
      :data="tableData" 
      border 
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa' }"
      :cell-style="{ padding: '8px 0' }"
    >
      <el-table-column prop="id" label="ID" min-width="80" />
      <el-table-column prop="username" label="账号" min-width="120" />
      <el-table-column prop="full_name" label="姓名" min-width="120" />
      <el-table-column prop="gender" label="性别" min-width="80" />
      <el-table-column prop="position" label="岗位" min-width="150" />
      <el-table-column prop="department" label="部门" min-width="150" />
      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          <el-button size="small" type="warning" @click="handleResetPassword(scope.row)">
            <el-icon><Key /></el-icon>
            重置密码
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="form.full_name" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" prop="position">
          <el-select v-model="form.position" placeholder="请选择岗位" style="width: 100%">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.description"
              :value="role.description"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, getRoleList, resetUserPassword } from '@/api/user'
import { Key } from '@element-plus/icons-vue'

const tableData = ref([])
const dialogVisible = ref(false)
const dialogType = ref('add')
const currentId = ref(null)
const roleList = ref([])

const formRef = ref(null)
const form = reactive({
  username: '',
  full_name: '',
  gender: '',
  position: '',
  department: ''
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  full_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  position: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }]
}

// 获取角色列表
const getRoles = async () => {
  try {
    console.log('开始获取角色列表...');
    const res = await getRoleList();
    console.log('获取到的角色列表:', res);
    if (res.data && Array.isArray(res.data)) {
      roleList.value = res.data;
      console.log('更新后的角色列表:', roleList.value);
    } else {
      console.error('角色列表数据格式错误:', res);
      ElMessage.error('获取角色列表失败');
    }
  } catch (error) {
    console.error('获取角色列表失败:', error);
    ElMessage.error('获取角色列表失败');
  }
}

// 获取用户列表
const getUsers = async () => {
  try {
    console.log('开始获取用户列表...');
    const res = await getUserList();
    console.log('获取到的用户列表:', res);
    if (res.data && Array.isArray(res.data)) {
      tableData.value = res.data;
    } else {
      console.error('用户列表数据格式错误:', res);
      ElMessage.error('获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  }
}

// 新增用户
const handleAdd = async () => {
  dialogType.value = 'add';
  form.username = '';
  form.full_name = '';
  form.gender = '';
  form.position = '';
  form.department = '';
  await getRoles();
  dialogVisible.value = true;
}

// 编辑用户
const handleEdit = async (row) => {
  dialogType.value = 'edit';
  currentId.value = row.id;
  await getRoles(); // 重新获取角色列表
  Object.assign(form, row);
  dialogVisible.value = true;
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该用户?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id);
      ElMessage.success('删除成功');
      getUsers();
    } catch (error) {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  });
}

// 重置密码
const handleResetPassword = (row) => {
  ElMessageBox.confirm('确认重置该用户密码为123?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resetUserPassword(row.id);
      ElMessage.success('密码重置成功');
    } catch (error) {
      console.error('密码重置失败:', error);
      ElMessage.error('密码重置失败');
    }
  });
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  try {
    const valid = await formRef.value.validate();
    if (valid) {
      if (dialogType.value === 'add') {
        await createUser(form);
        ElMessage.success('添加成功');
      } else {
        await updateUser(currentId.value, form);
        ElMessage.success('更新成功');
      }
      dialogVisible.value = false;
      getUsers();
    }
  } catch (error) {
    console.error(dialogType.value === 'add' ? '添加失败:' : '更新失败:', error);
    ElMessage.error(dialogType.value === 'add' ? '添加失败' : '更新失败');
  }
}

// 监听对话框显示状态
watch(dialogVisible, (newVal) => {
  if (newVal) {
    getRoles(); // 当对话框打开时重新获取角色列表
  }
});

// 初始化
onMounted(() => {
  getRoles();
  getUsers();
})
</script>

<style scoped>
.user-manage {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
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

.cursor-pointer {
  cursor: pointer;
}
</style> 