import { useState, useCallback } from 'react';

export interface UseModalStateReturn<T = any> {
  visible: boolean;
  data: T | null;
  open: (initialData?: T) => void;
  close: () => void;
  setData: (data: T | null) => void;
}

/**
 * 通用Modal状态管理Hook
 * 
 * @example
 * const editModal = useModalState<User>();
 * 
 * // 打开模态框并传入数据
 * editModal.open(user);
 * 
 * // 在Modal中使用
 * <Modal visible={editModal.visible} onCancel={editModal.close}>
 *   {editModal.data && <UserForm user={editModal.data} />}
 * </Modal>
 */
export function useModalState<T = any>(): UseModalStateReturn<T> {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((initialData?: T) => {
    if (initialData !== undefined) {
      setData(initialData);
    }
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    // 延迟清空数据，避免关闭动画时数据消失
    setTimeout(() => {
      setData(null);
    }, 300);
  }, []);

  return {
    visible,
    data,
    open,
    close,
    setData,
  };
}

/**
 * 管理多个Modal状态的Hook
 * 
 * @example
 * const modals = useMultipleModals(['edit', 'delete', 'view']);
 * 
 * modals.edit.open(user);
 * modals.delete.open(user);
 */
export function useMultipleModals<K extends string>(
  keys: K[]
): Record<K, UseModalStateReturn> {
  const modals = {} as Record<K, UseModalStateReturn>;

  keys.forEach((key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    modals[key] = useModalState();
  });

  return modals;
}
