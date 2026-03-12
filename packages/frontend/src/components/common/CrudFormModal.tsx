import React, { useEffect } from 'react';
import { Modal, Form } from 'antd';
import type { ModalProps, FormProps, FormInstance } from 'antd';

export interface CrudFormModalProps<T = any> {
  open: boolean;
  title: React.ReactNode;
  okText?: string;
  cancelText?: string;
  initialValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  onCancel: () => void;
  width?: number;
  formProps?: FormProps;
  modalProps?: ModalProps;
  children: React.ReactNode;
}

export function CrudFormModal<T = any>({
  open,
  title,
  okText = '保存',
  cancelText = '取消',
  initialValues,
  onSubmit,
  onCancel,
  width = 600,
  formProps,
  modalProps,
  children,
}: CrudFormModalProps<T>) {
  const [innerForm] = Form.useForm();
  const form: FormInstance = (formProps?.form as FormInstance) || innerForm;

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues as any);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const handleFinish = async (values: any) => {
    await onSubmit(values as T);
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={okText}
      cancelText={cancelText}
      width={width}
      destroyOnClose
      {...modalProps}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues}
        {...formProps}
      >
        {children}
      </Form>
    </Modal>
  );
}