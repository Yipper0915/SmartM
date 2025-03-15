// 模拟获取动态路由数据
export const getDynamicRoutes = () => {
    return new Promise((resolve) => {
        // 模拟异步获取路由
        const routes = [
            {
                path: '/system',
                name: 'system',
                meta: {
                    breadcrumbName: '系统管理',
                    icon: 'Setting'
                },
                children: [
                    {
                        path: 'user',
                        name: 'user',
                        meta: {
                            breadcrumbName: '用户管理',
                            icon: 'User'
                        }
                    },
                    {
                        path: 'notice',
                        name: 'notice',
                        meta: {
                            breadcrumbName: '公告管理',
                            icon: 'Bell'
                        }
                    }
                ]
            },
            {
                path: '/profile',
                name: 'profile',
                meta: {
                    breadcrumbName: '个人中心',
                    icon: 'User'
                },
                children: [
                    {
                        path: 'index',
                        name: 'profileIndex',
                        meta: {
                            breadcrumbName: '个人资料',
                            icon: 'User'
                        }
                    }
                ]
            }
        ]
        resolve(routes)
    })
}