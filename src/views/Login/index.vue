<template>
  <div class="login-container flex">
    <img src="../../../public/img/login-left.png" class="login-left" />
    <div class="login-right flex flex-col">
      <div class="fz-20 text-center text-bold">欢迎登录SmartM平台</div>
      <div class="text-center mb-20">WELCOME</div>
      <el-form :model="form" :rules="rules" ref="ruleForm">
        <el-form-item class="login-input flex" prop="username">
          <el-icon class="flex1"><User /></el-icon>
          <el-input
            class="login-input-right"
            v-model="form.username"
            placeholder="请输入账号"
          />
        </el-form-item>
        <el-form-item class="login-input flex" prop="password">
          <el-icon class="flex1"><Lock /></el-icon>
          <el-input
            class="login-input-right"
            type="password"
            v-model="form.password"
            placeholder="请输入密码"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox class="login-remember mb-10" v-model="remember" label="记住密码" />
        </el-form-item>
        <el-form-item>
          <el-button class="login-btn w-p-100" type="primary" @click="onSubmit()" :loading="loading">
            立即登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import { ref, reactive } from "vue";
import { getDynamicRoutes } from '@/utils/getData.js'
import { getAuthRouters } from '@/router/authRouter.js'
import { useAuthRouterStore } from '@/stores/authRouter.js'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/auth'
import { ElMessage } from 'element-plus'

const authRouterStore = useAuthRouterStore()
const userStore = useUserStore()
const ruleForm = ref(null)
const loading = ref(false)

const form = reactive({
  username: "",
  password: "",
});

const remember = ref(false)

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
}

const onSubmit = () => {
  ruleForm.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        const res = await login(form)
        // 登录成功，保存token
        sessionStorage.setItem('token', res.token)
        
        // 保存用户信息
        userStore.setUserInfo({
          full_name: res.user.fullName,
          // 其他用户信息字段
        })
        
        // 获取动态路由
        let dynamicRoutes = await getDynamicRoutes()

        // 动态添加路由
        let newRoutes = getAuthRouters(dynamicRoutes)
        authRouterStore.addRouterList(newRoutes)
        newRoutes.forEach(val => {
          router.addRoute(val)
        })

        ElMessage({
          type: 'success',
          message: '登录成功'
        })

        router.push('/dashboard')
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: url("../../../public/img/login.png") no-repeat;
  background-size: cover;
}
.login-left {
  width: 58%;
  height: 100%;
}
.login-right {
  width: 25%;
  height: 56%;
  background-color: #fff;
  margin: auto;
  border-radius: 10px;
  box-shadow: #b3d2fb 1px 1px 15px 1px;
  padding: 40px 30px;
}
.login-input {
  height: 50px;
  border: 1px solid #b3d2fb;
  border-radius: 5px;
  background: rgba(231, 241, 253, 0.4);
}
.login-input-right {
  width: 80%;
  height: 60%;
  border-left: 1px solid #ccc;
}
.login-remember {
  font-size: 12px;
}
.login-btn {
  height: 40px;
}
</style>

<style>
.login-input-right .el-input__wrapper {
  border: none !important;
  box-shadow: none !important;
  background: transparent;
}
.login-remember .el-checkbox__label {
  font-size: 12px;
  color: #aaa;
}
</style>