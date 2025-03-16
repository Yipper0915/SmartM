/**
 * 根据用户菜单权限设置路由
 * @param menuData
 */
/* -------------------------------------分割线-------------------------------------------- */
import Layout from '@/layout/index.vue'

// 预定义组件映射
const componentMap = {
  user: () => import('@/views/System/UserManage.vue'),
  notice: () => import('@/views/System/NoticeManage.vue'),
  profileIndex: () => import('@/views/Profile/index.vue'),
  projectList: () => import('@/views/Project/List.vue'),
  projectSchedule: () => import('@/views/Project/Schedule.vue')
}

const iconList = {
  formTemplate: 'Tickets',
  tableTemplate: 'CopyDocument'
}
/**
 * 动态添加用户路由权限
 * @param menuData json格式的字符串
 * @returns {[]}
 */
export function getAuthRouters(routes) {
  const authRouters = []
  routes.forEach(route => {
    const router = {
      path: route.path,
      name: route.name,
      component: Layout,
      meta: route.meta,
      children: []
    }
    if (route.children) {
      route.children.forEach(child => {
        router.children.push({
          path: child.path,
          name: child.name,
          component: componentMap[child.name],
          meta: child.meta
        })
      })
    }
    authRouters.push(router)
  })
  return authRouters
}


