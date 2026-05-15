/** 기존 .jsx 모듈에 대한 TypeScript 타입 선언. */
declare module "*/components/AdminLayout" {
  import type { ReactNode } from "react";
  const AdminLayout: React.FC<{ children?: ReactNode }>;
  export default AdminLayout;
}

declare module "*/components/editor/MarkdownEditField" {
  const MarkdownEditField: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    minHeight?: number;
  }>;
  export default MarkdownEditField;
}
