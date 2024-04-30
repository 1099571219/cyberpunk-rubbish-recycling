import { useState } from 'react'
import { create } from 'zustand'

// 1. 创建 store
// 函数参数必须返回一个对象  对象内部编写状态数据和方法
// set 是用来修改数据的专门方法必须调用它来修改数据
// 语法1： 参数是函数  需要用到旧数据时
// 语法2： 参数直接时一个对象 set({count:100})
type StateData = { count: number }
export const createUserStore = create(
    (set: (fn: (state: StateData) => StateData) => void) => {
        return {
            // 状态数据
            count: 0,
            //修改状态数据的方法
            inc: () => {
                set((state) => ({ count: state.count + 1 }))
            },
            setCount: () => {
                set(() => ({ count: 100 }))
            },
        }
    }
)
