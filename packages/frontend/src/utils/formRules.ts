import type { Rule } from 'antd/es/form';

/**
 * 通用表单验证规则
 * 提供常用的表单验证规则，确保整个应用的验证逻辑一致
 */

export const formRules = {
  /**
   * 必填字段
   */
  required: (message?: string): Rule => ({
    required: true,
    message: message || '此字段为必填项',
  }),

  /**
   * 邮箱验证
   */
  email: (message?: string): Rule => ({
    type: 'email',
    message: message || '请输入有效的邮箱地址',
  }),

  /**
   * 最小长度
   */
  minLength: (min: number, message?: string): Rule => ({
    min,
    message: message || `至少需要${min}个字符`,
  }),

  /**
   * 最大长度
   */
  maxLength: (max: number, message?: string): Rule => ({
    max,
    message: message || `最多${max}个字符`,
  }),

  /**
   * 长度范围
   */
  lengthRange: (min: number, max: number, message?: string): Rule => ({
    min,
    max,
    message: message || `长度应在${min}-${max}个字符之间`,
  }),

  /**
   * 最小值
   */
  min: (min: number, message?: string): Rule => ({
    type: 'number',
    min,
    message: message || `最小值为${min}`,
  }),

  /**
   * 最大值
   */
  max: (max: number, message?: string): Rule => ({
    type: 'number',
    max,
    message: message || `最大值为${max}`,
  }),

  /**
   * 数值范围
   */
  range: (min: number, max: number, message?: string): Rule => ({
    type: 'number',
    min,
    max,
    message: message || `值应在${min}-${max}之间`,
  }),

  /**
   * 正整数
   */
  positiveInteger: (message?: string): Rule => ({
    type: 'number',
    min: 1,
    message: message || '请输入正整数',
    transform: (value) => (value ? Number(value) : value),
  }),

  /**
   * 非负整数
   */
  nonNegativeInteger: (message?: string): Rule => ({
    type: 'number',
    min: 0,
    message: message || '请输入非负整数',
    transform: (value) => (value ? Number(value) : value),
  }),

  /**
   * URL验证
   */
  url: (message?: string): Rule => ({
    type: 'url',
    message: message || '请输入有效的URL',
  }),

  /**
   * 手机号验证（中国）
   */
  phone: (message?: string): Rule => ({
    pattern: /^1[3-9]\d{9}$/,
    message: message || '请输入有效的手机号',
  }),

  /**
   * 用户名验证（字母、数字、下划线，3-20位）
   */
  username: (message?: string): Rule => ({
    pattern: /^[a-zA-Z0-9_]{3,20}$/,
    message: message || '用户名应为3-20位字母、数字或下划线',
  }),

  /**
   * 密码强度验证（至少8位，包含字母和数字）
   */
  password: (message?: string): Rule => ({
    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
    message: message || '密码至少8位，需包含字母和数字',
  }),

  /**
   * 自定义正则验证
   */
  pattern: (pattern: RegExp, message: string): Rule => ({
    pattern,
    message,
  }),

  /**
   * 自定义验证函数
   */
  custom: (
    validator: (rule: any, value: any) => Promise<void>,
    message?: string
  ): Rule => ({
    validator,
    message,
  }),

  /**
   * 确认密码验证
   */
  confirmPassword: (passwordField: string = 'password'): Rule => ({
    validator: (_, value) => {
      return Promise.resolve();
    },
    message: '两次输入的密码不一致',
  }),

  /**
   * 数组非空验证
   */
  arrayNotEmpty: (message?: string): Rule => ({
    type: 'array',
    min: 1,
    message: message || '请至少选择一项',
  }),

  /**
   * 日期范围验证
   */
  dateRange: (
    startField: string,
    endField: string,
    message?: string
  ): Rule => ({
    validator: (_, value) => {
      return Promise.resolve();
    },
    message: message || '结束日期必须晚于开始日期',
  }),
};

/**
 * 组合多个验证规则
 */
export function combineRules(...rules: Rule[]): Rule[] {
  return rules;
}

/**
 * 常用的规则组合
 */
export const commonRuleSets = {
  /**
   * 必填的邮箱
   */
  requiredEmail: (): Rule[] => [
    formRules.required('请输入邮箱'),
    formRules.email(),
  ],

  /**
   * 必填的用户名
   */
  requiredUsername: (): Rule[] => [
    formRules.required('请输入用户名'),
    formRules.username(),
  ],

  /**
   * 必填的密码
   */
  requiredPassword: (): Rule[] => [
    formRules.required('请输入密码'),
    formRules.password(),
  ],

  /**
   * 必填的手机号
   */
  requiredPhone: (): Rule[] => [
    formRules.required('请输入手机号'),
    formRules.phone(),
  ],

  /**
   * 必填的URL
   */
  requiredUrl: (): Rule[] => [
    formRules.required('请输入URL'),
    formRules.url(),
  ],

  /**
   * 必填的正整数
   */
  requiredPositiveInteger: (message?: string): Rule[] => [
    formRules.required(message),
    formRules.positiveInteger(),
  ],

  /**
   * 必填的非负整数
   */
  requiredNonNegativeInteger: (message?: string): Rule[] => [
    formRules.required(message),
    formRules.nonNegativeInteger(),
  ],
};
