export type RenewalOpportunity = "high" | "medium" | "low";

export type RecommendedProductType =
  | "subject"
  | "language"
  | "competition"
  | "background"
  | "planning"
  | "other";

export type RenewalStudent = {
  id: string;
  studentName: string;
  customerNumber: string;
  phone: string;
  grade: string;
  businessUnit: string;
  courseSystem: string;
  courseItem: string;
  currentProducts: string[];
  renewalOpportunity: RenewalOpportunity;
  aiSuggestion: string;
  recommendedDirection: RecommendedProductType;
  recommendedProduct: string;
  currentAdvisor: {
    name: string;
    employeeNumber: string;
  };
  updatedAt: string;
};

export type RenewalStudentFilters = {
  studentSearch?: string;
  renewalOpportunity?: RenewalOpportunity;
  recommendedProductType?: RecommendedProductType;
  grade?: string;
  currentProduct?: string;
  currentAdvisor?: string;
  current?: number;
  pageSize?: number;
};

export const renewalOpportunityMeta: Record<
  RenewalOpportunity,
  { label: string; color: string }
> = {
  high: { label: "高", color: "success" },
  medium: { label: "中", color: "warning" },
  low: { label: "低", color: "default" },
};

export const recommendedProductTypeMeta: Record<
  RecommendedProductType,
  string
> = {
  subject: "学科课程",
  language: "语言课程",
  competition: "竞赛",
  background: "背景提升",
  planning: "升学规划",
  other: "其他",
};

export const gradeOptions = ["9年级", "10年级", "11年级", "12年级", "大一"].map(
  (value) => ({ label: value, value }),
);

export const currentProductOptions = [
  "A-Level 数学进阶",
  "A-Level 物理进阶",
  "IGCSE 英语强化",
  "雅思精品班",
  "托福强化班",
  "AP 生物",
  "AP 化学",
  "美本升学规划",
  "英本申请规划",
  "学术写作基础",
].map((value) => ({ label: value, value }));

export const currentAdvisorOptions = [
  { label: "周欣（A1024）", value: "A1024" },
  { label: "李辰（A1058）", value: "A1058" },
  { label: "王珊（A1071）", value: "A1071" },
  { label: "陈雨（A1093）", value: "A1093" },
  { label: "张敏（A1116）", value: "A1116" },
];

export const renewalStudents: RenewalStudent[] = [
  {
    id: "renewal-student-001",
    studentName: "林家宁",
    customerNumber: "VA100213",
    phone: "13800002036",
    grade: "12年级",
    businessUnit: "高端",
    courseSystem: "高端竞赛",
    courseItem: "高阶竞赛",
    currentProducts: ["A-Level 数学进阶", "雅思精品班"],
    renewalOpportunity: "high",
    aiSuggestion:
      "近两次测评成绩连续提升，家长主动询问下学期课程安排，续费意向明确。",
    recommendedDirection: "subject",
    recommendedProduct: "A-Level 数学冲刺营",
    currentAdvisor: { name: "周欣", employeeNumber: "A1024" },
    updatedAt: "2026-08-09 18:20",
  },
  {
    id: "renewal-student-002",
    studentName: "陈子轩",
    customerNumber: "VA100246",
    phone: "13900001672",
    grade: "10年级",
    businessUnit: "高端",
    courseSystem: "语言培训",
    courseItem: "托福",
    currentProducts: ["IGCSE 英语强化"],
    renewalOpportunity: "medium",
    aiSuggestion:
      "学生对语言学习保持兴趣，但家长尚未确认标化考试时间，适合先做阶段规划。",
    recommendedDirection: "language",
    recommendedProduct: "托福预备高分班",
    currentAdvisor: { name: "李辰", employeeNumber: "A1058" },
    updatedAt: "2026-08-10 09:10",
  },
  {
    id: "renewal-student-003",
    studentName: "王若曦",
    customerNumber: "VA100278",
    phone: "13700008154",
    grade: "11年级",
    businessUnit: "高端",
    courseSystem: "高端竞赛",
    courseItem: "国际竞赛",
    currentProducts: ["A-Level 物理进阶"],
    renewalOpportunity: "high",
    aiSuggestion:
      "物理学科表现稳定且积极参加校内竞赛，竞赛辅导与当前目标高度匹配。",
    recommendedDirection: "competition",
    recommendedProduct: "BPhO 物理竞赛集训",
    currentAdvisor: { name: "周欣", employeeNumber: "A1024" },
    updatedAt: "2026-08-08 16:45",
  },
  {
    id: "renewal-student-004",
    studentName: "赵清越",
    customerNumber: "VA100301",
    phone: "13600004211",
    grade: "12年级",
    businessUnit: "留学",
    courseSystem: "本科申请",
    courseItem: "港新本科",
    currentProducts: ["雅思精品班"],
    renewalOpportunity: "low",
    aiSuggestion:
      "语言成绩已达申请要求，家长暂无增购课程意向，可围绕申请节点持续跟进。",
    recommendedDirection: "planning",
    recommendedProduct: "港新本科申请全程规划",
    currentAdvisor: { name: "王珊", employeeNumber: "A1071" },
    updatedAt: "2026-08-07 11:30",
  },
  {
    id: "renewal-student-005",
    studentName: "刘思源",
    customerNumber: "VA100326",
    phone: "13500007863",
    grade: "11年级",
    businessUnit: "高端",
    courseSystem: "背景提升",
    courseItem: "科研项目",
    currentProducts: ["AP 生物"],
    renewalOpportunity: "high",
    aiSuggestion:
      "学生主动咨询科研和夏校项目，学术方向清晰，适合衔接背景提升项目。",
    recommendedDirection: "background",
    recommendedProduct: "生物医学在线科研项目",
    currentAdvisor: { name: "陈雨", employeeNumber: "A1093" },
    updatedAt: "2026-08-06 14:05",
  },
  {
    id: "renewal-student-006",
    studentName: "许博文",
    customerNumber: "VA100355",
    phone: "13400003392",
    grade: "9年级",
    businessUnit: "高端",
    courseSystem: "国际课程",
    courseItem: "IGCSE",
    currentProducts: ["IGCSE 英语强化"],
    renewalOpportunity: "medium",
    aiSuggestion:
      "英语基础达标但数学学科衔接存在缺口，建议先安排诊断测评再推进续费。",
    recommendedDirection: "subject",
    recommendedProduct: "IGCSE 数学衔接班",
    currentAdvisor: { name: "张敏", employeeNumber: "A1116" },
    updatedAt: "2026-08-05 17:40",
  },
  {
    id: "renewal-student-007",
    studentName: "张语桐",
    customerNumber: "VA100387",
    phone: "13300005448",
    grade: "大一",
    businessUnit: "留学",
    courseSystem: "硕士申请",
    courseItem: "英硕申请",
    currentProducts: ["学术写作基础"],
    renewalOpportunity: "low",
    aiSuggestion:
      "当前课程出勤率偏低且尚未明确研究生申请计划，建议优先完成学习目标沟通。",
    recommendedDirection: "other",
    recommendedProduct: "学术能力诊断与学习规划",
    currentAdvisor: { name: "王珊", employeeNumber: "A1071" },
    updatedAt: "2026-08-04 10:15",
  },
  {
    id: "renewal-student-008",
    studentName: "周子墨",
    customerNumber: "VA100412",
    phone: "13200006931",
    grade: "10年级",
    businessUnit: "高端",
    courseSystem: "语言培训",
    courseItem: "托福",
    currentProducts: ["托福强化班"],
    renewalOpportunity: "high",
    aiSuggestion:
      "近一个月托福模考提升显著，学生明确提出冲刺目标，高分阶段课程承接顺畅。",
    recommendedDirection: "language",
    recommendedProduct: "托福 110 分冲刺班",
    currentAdvisor: { name: "李辰", employeeNumber: "A1058" },
    updatedAt: "2026-08-03 19:00",
  },
  {
    id: "renewal-student-009",
    studentName: "孙一诺",
    customerNumber: "VA100439",
    phone: "13100008720",
    grade: "12年级",
    businessUnit: "留学",
    courseSystem: "本科申请",
    courseItem: "英国本科",
    currentProducts: ["英本申请规划"],
    renewalOpportunity: "medium",
    aiSuggestion:
      "申请方案基本稳定，家长关注后续面试支持，需要结合目标院校补充服务。",
    recommendedDirection: "planning",
    recommendedProduct: "G5 面试全程辅导",
    currentAdvisor: { name: "陈雨", employeeNumber: "A1093" },
    updatedAt: "2026-08-02 13:25",
  },
  {
    id: "renewal-student-010",
    studentName: "何亦辰",
    customerNumber: "VA100468",
    phone: "13000001169",
    grade: "11年级",
    businessUnit: "高端",
    courseSystem: "国际课程",
    courseItem: "AP",
    currentProducts: ["AP 化学"],
    renewalOpportunity: "low",
    aiSuggestion:
      "当前课程完成度一般，家长对增加学科课程较谨慎，建议先呈现阶段学习成果。",
    recommendedDirection: "subject",
    recommendedProduct: "AP 化学考前精讲班",
    currentAdvisor: { name: "张敏", employeeNumber: "A1116" },
    updatedAt: "2026-08-01 15:50",
  },
];

export function filterRenewalStudents(
  students: RenewalStudent[],
  filters: RenewalStudentFilters,
) {
  const searchText = filters.studentSearch?.trim().toLowerCase();

  return students.filter((student) => {
    const matchesSearch =
      !searchText ||
      student.studentName.toLowerCase().includes(searchText) ||
      student.phone.toLowerCase().includes(searchText);
    const matchesOpportunity =
      !filters.renewalOpportunity ||
      student.renewalOpportunity === filters.renewalOpportunity;
    const matchesRecommendedType =
      !filters.recommendedProductType ||
      student.recommendedDirection === filters.recommendedProductType;
    const matchesGrade = !filters.grade || student.grade === filters.grade;
    const matchesCurrentProduct =
      !filters.currentProduct ||
      student.currentProducts.includes(filters.currentProduct);
    const matchesCurrentAdvisor =
      !filters.currentAdvisor ||
      student.currentAdvisor.employeeNumber === filters.currentAdvisor;

    return (
      matchesSearch &&
      matchesOpportunity &&
      matchesRecommendedType &&
      matchesGrade &&
      matchesCurrentProduct &&
      matchesCurrentAdvisor
    );
  });
}
