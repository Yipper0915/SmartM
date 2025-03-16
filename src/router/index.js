import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/index.vue'
import { getAuthRouters } from "@/router/authRouter";
import {getDynamicRoutes} from '@/utils/getData.js'
import { useAuthRouterStore } from '@/stores/authRouter.js'
import { useUserStore } from '@/stores/user'




const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '首页',
      component: Layout, 
      redirect: '/dashboard',
      meta: {
        staticRouter: true // 静态路由
      },
      children: [{
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: {
          breadcrumbName: '首页',
          icon: 'dashboard',
          staticRouter: true // 静态路由
        }
      }]
    },
    {
      path: '/system',
      name: 'system',
      component: Layout,
      meta: {
        breadcrumbName: '系统管理',
        icon: 'Setting',
        staticRouter: true
      },
      children: [
        {
          path: 'user',
          name: 'user',
          component: () => import('@/views/System/UserManage.vue'),
          meta: {
            breadcrumbName: '用户管理',
            icon: 'User',
            staticRouter: true
          }
        },
        {
          path: 'notice',
          name: 'notice',
          component: () => import('@/views/System/NoticeManage.vue'),
          meta: {
            breadcrumbName: '公告管理',
            icon: 'Bell',
            staticRouter: true
          }
        },
       
      ]
    },
    {
      path: '/project',
      name: 'project',
      component: Layout,
      meta: {
        breadcrumbName: '项目管理',
        icon: 'Folder',
        staticRouter: true
      },
      children: [
        {
          path: 'list',
          name: 'projectList',
          component: () => import('@/views/Project/List.vue'),
          meta: {
            breadcrumbName: '项目列表',
            icon: 'List',
            staticRouter: true
          }
        },
        {
          path: 'schedule',
          name: 'projectSchedule',
          component: () => import('@/views/Project/Schedule.vue'),
          meta: {
            breadcrumbName: '项目排期',
            icon: 'Calendar',
            staticRouter: true
          }
        }
      ]
    },
    {
      path: '/profile',
      name: 'profile',
      component: Layout,
      meta: {
        breadcrumbName: '个人中心',
        icon: 'User',
        staticRouter: true
      },
      children: [
        {
          path: 'index',
          name: 'profileIndex',
          component: () => import('@/views/Profile/index.vue'),
          meta: {
            breadcrumbName: '个人资料',
            icon: 'User',
            staticRouter: true
          }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login/index.vue'),
    }
  ],
})

// 验证token
router.beforeEach(async(to, from, next) => {
  const token = sessionStorage.token
  if(to.path !== '/login' && !token) {
    next('/login')
  } else {
    const authRouterStore = useAuthRouterStore()
    const userStore = useUserStore()
    let {routerList} = authRouterStore

    // 如果用户信息不存在，从sessionStorage获取
    if (!userStore.userInfo.id && sessionStorage.getItem('userInfo')) {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))
      userStore.setUserInfo(userInfo)
    }

    if(!routerList.length) {
      let dynamicRoutes = await getDynamicRoutes()
      // 动态添加路由
      let newRoutes = getAuthRouters(dynamicRoutes)
      authRouterStore.addRouterList(newRoutes)
      newRoutes.forEach(val => {
        router.addRoute(val)
      })
      next({ path: to.path })
    } else {
      next()
    }
  }
})
export default router
