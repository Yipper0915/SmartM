<template>
  <div class="common-layout h-p-100 w-p-100">
    <el-container class="h-p-100 w-p-100">
      <el-aside :width="isCollapse?'60px':'180px'" class="common-aside w-p-100">
        <MyMenu :isCollapse="isCollapse"></MyMenu>
      </el-aside>
      <el-container>
        <el-header class="common-header flex align-center">
          <el-icon :size="24" color="#409efc" @click="isCollapse=!isCollapse">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <Breadcrumb class="ml-10"></Breadcrumb>
          <Personal class="flex-item-right"></Personal>
        </el-header>
        <el-main class="flex-col">
          <Tag></Tag>
          <div class="flex1 bg-white common-main">
            <router-view></router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
  <script setup>
   import { ref } from 'vue'
  import MyMenu from './components/menu.vue'
  import Tag from './components/tag.vue'
  import Breadcrumb from './components/breadcrumb.vue'
  import Personal from './components/personal.vue'
  const isCollapse = ref(false)
</script>
<style scoped>
.common-aside {
    position: fixed;
    height: 100%;
    background: #fff;
    box-shadow: #d8d8d8 1px 1px 15px 1px;
    z-index: 1;
    transition: width 0.2s ease-in-out;
}

.common-header {
    position: fixed;
    top: 0;
    left: 180px;
    right: 0;
    background: #fff;
    box-shadow: #d8d8d8 1px 1px 5px 1px;
    z-index: 1;
    height: 60px;
}

.el-main {
    margin-top: 60px;
    margin-left: 180px;
    padding: 0;
    transition: margin-left 0.2s ease-in-out;
}

/* 菜单折叠时调整主内容区域的边距 */
.el-aside[style*="width: 60px"] + .el-container .el-main {
    margin-left: 60px;
}

.el-aside[style*="width: 60px"] + .el-container .common-header {
    left: 60px;
}

.common-main {
    background: #fff;
    border-radius: 5px;
    height: 100%;
    overflow-y: auto;
}

.flex-col {
    display: flex;
    flex-direction: column;
}

.flex1 {
    flex: 1;
}
</style>