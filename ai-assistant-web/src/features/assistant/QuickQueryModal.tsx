import { useEffect, useState } from "react";
import {
  ModalForm,
  ProFormSelect,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { assistantApi } from "../../api/client";
import type { QueryContext, StudentOption } from "../../api/contracts";
import {
  buildQuerySubmission,
  quickActionLabels,
  type QuickAction,
} from "./query";

type QuickQueryModalProps = {
  action?: QuickAction;
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, context: QueryContext) => void;
};

type QueryFormValues = {
  studentId: string;
  parentMessage?: string;
};

export function QuickQueryModal({
  action,
  open,
  onClose,
  onSubmit,
}: QuickQueryModalProps) {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [searching, setSearching] = useState(false);

  async function searchStudents(keyword = "") {
    setSearching(true);
    try {
      setStudents(await assistantApi.searchStudents(keyword));
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (open) void searchStudents();
  }, [open]);

  if (!action) return null;

  const isReply = action === "parentReply";
  const submitText = isReply ? "生成草稿" : "查询";

  async function submit(values: QueryFormValues) {
    const selectedStudent = students.find(
      (student) => student.id === values.studentId,
    );
    if (!selectedStudent) return false;

    const submission = buildQuerySubmission(
      action!,
      selectedStudent,
      values.parentMessage ?? "",
    );
    onSubmit(submission.text, submission.context);
    return true;
  }

  return (
    <ModalForm<QueryFormValues>
      key={action}
      open={open}
      title={quickActionLabels[action]}
      preserve={false}
      autoFocusFirstInput
      modalProps={{ destroyOnHidden: true }}
      submitter={{
        searchConfig: { submitText },
        resetButtonProps: false,
        submitButtonProps: { "aria-label": submitText },
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      onFinish={submit}
    >
      <ProFormSelect
        name="studentId"
        label="学生"
        placeholder="输入姓名查找"
        options={students.map((student) => ({
          value: student.id,
          label: student.name,
        }))}
        rules={[{ required: true, message: "请选择学生" }]}
        fieldProps={{
          "aria-label": "选择学生",
          showSearch: true,
          filterOption: false,
          loading: searching,
          onSearch: (value) => void searchStudents(value),
        }}
      />

      {isReply && (
        <ProFormTextArea
          name="parentMessage"
          label="家长消息"
          placeholder="粘贴需要回复的消息"
          rules={[{ required: true, whitespace: true, message: "请输入家长消息" }]}
          fieldProps={{
            "aria-label": "家长消息",
            autoSize: { minRows: 4, maxRows: 7 },
          }}
        />
      )}
    </ModalForm>
  );
}
