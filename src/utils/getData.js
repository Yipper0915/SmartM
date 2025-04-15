// 模拟获取动态路由数据
export const getDynamicRoutes = () => {
    return new Promise((resolve) => {
        // 从sessionStorage获取用户信息
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
        const roleIds = userInfo.roleIds || [];
        
        // 只有系统管理员(role_id=1)可以看到系统管理路由
        const routes = [];
        
        // 系统管理员可以看到系统管理路由
        if (roleIds.includes(1)) {
            routes.push({
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
            });
        }

        // 项目经理可以看到完整的项目管理路由
        if (roleIds.includes(2)) {
            routes.push({
                path: '/project',
                name: 'project',
                meta: {
                    breadcrumbName: '项目管理',
                    icon: 'Folder'
                },
                children: [
                    {
                        path: 'list',
                        name: 'projectList',
                        meta: {
                            breadcrumbName: '项目列表',
                            icon: 'List'
                        }
                    },
                    {
                        path: 'schedule',
                        name: 'projectSchedule',
                        meta: {
                            breadcrumbName: '项目排期',
                            icon: 'List'
                        }
                    }
                ]
            });
        }
        // 普通用户只能看到项目排期
        else {
            routes.push({
                path: '/project',
                name: 'project',
                meta: {
                    breadcrumbName: '项目管理',
                    icon: 'Folder'
                },
                children: [
                    {
                        path: 'schedule',
                        name: 'projectSchedule',
                        meta: {
                            breadcrumbName: '项目排期',
                            icon: 'List'
                        }
                    }
                ]
            });
        }

        // 生产专员和项目经理可以看到生产日报
        if (roleIds.includes(2) || roleIds.includes(3)) {
            routes.push({
                path: '/production-report',
                name: 'productionReport',
                meta: {
                    breadcrumbName: '生产日报',
                    icon: 'Document'
                },
                children: roleIds.includes(3) ? [
                    // 生产专员可以看到填写日报
                    {
                        path: 'write',
                        name: 'productionReportIndex',
                        meta: {
                            breadcrumbName: '填写日报',
                            icon: 'Edit'
                        }
                    }
                ] : [
                    // 项目经理可以看到日报列表
                    {
                        path: 'list',
                        name: 'productionReportList',
                        meta: {
                            breadcrumbName: '日报列表',
                            icon: 'List'
                        }
                    }
                ]
            });
        }

        // 库存管理员可以看到库存管理路由
        if (roleIds.includes(4)) {
            routes.push({
                path: '/inventory',
                name: 'inventory',
                meta: {
                    breadcrumbName: '库存管理',
                    icon: 'Box'
                },
                children: [
                    {
                        path: 'materials',
                        name: 'InventoryMaterials',
                        meta: {
                            breadcrumbName: '材料管理',
                            icon: 'Goods'
                        }
                    },
                    {
                        path: 'records',
                        name: 'InventoryRecords',
                        meta: {
                            breadcrumbName: '出入库记录',
                            icon: 'Document'
                        }
                    }
                ]
            });
        }

        // 所有用户都可以看到个人中心
        routes.push({
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
        });

        resolve(routes);
    });
}