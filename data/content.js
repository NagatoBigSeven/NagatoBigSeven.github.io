/*
 * Site content data (publications + news), bilingual inline.
 *
 * This is the single place to edit when you publish a paper or post news —
 * add ONE object here (with both `en` and `zh`), no HTML and no parallel
 * i18n.json keys. main.js renders these into #publications / #news-list and
 * re-renders on language switch. Loaded as a plain <script> (before main.js)
 * so it works without fetch/CORS and populates the DOM synchronously.
 *
 * Tag ids are stable across languages and drive the topic filter; reuse an
 * existing id (left of the colon) so papers group under the same chip.
 */

/* Reusable topic tags: id -> { en, zh } */
window.TAGS = {
  adsorption: { en: 'Adsorption', zh: '吸附' },
  multiAgent: { en: 'Multi-Agent Systems', zh: '多智能体系统' },
  heterogeneousCatalysis: { en: 'Heterogeneous Catalysis', zh: '异相催化' },
  digitalTwin: { en: 'Digital Twin', zh: '数字孪生' },
  llm: { en: 'Large Language Models', zh: '大语言模型' },
  aiAgent: { en: 'AI Agent', zh: 'AI 智能体' },
  materialsScience: { en: 'Materials Science', zh: '材料科学' },
  chemistry: { en: 'Chemistry', zh: '化学' }
};

/* Newest first. `cover` is either { img, alt } or { text } (text badge). */
window.PUBLICATIONS = [
  {
    id: 'adsmind',
    date: '2026-06-18',
    year: 2026,
    type: 'preprint',
    cover: { img: 'assets/adsmind-logo.webp', alt: 'AdsMind logo' },
    title: {
      en: 'AdsMind: A Physics-Grounded Multi-Agent System for Self-Correcting Discovery of Adsorption Configurations on Heterogeneous Catalyst Surfaces',
      zh: 'AdsMind：用于异相催化剂表面吸附构型的自校正发现的基于物理的多智能体系统'
    },
    authorsHtml: '<span class="me">Zongmin Zhang</span>, Yuyang Lou, Bowen Zhang, Junwu Chen, Ryo Kuroki, Xuan Vu Nguyen, Edvin Fako, Lixue Cheng, and Philippe Schwaller',
    highlight: {
      en: 'Led the implementation, benchmark design and cross-backend evaluation of AdsMind, a closed-loop, physics-grounded multi-agent system for autonomous adsorption-configuration discovery on heterogeneous catalyst surfaces.',
      zh: '主导了 AdsMind 的实现、基准设计及跨后端评估——一个用于异相催化剂表面吸附构型的自主发现的闭环的、基于物理的多智能体系统。'
    },
    venue: {
      en: 'arXiv preprint arXiv:2606.19152, 2026. Passed editorial screening at Machine Learning: Science and Technology and is now under external peer review.',
      zh: 'arXiv 预印本 arXiv:2606.19152, 2026。已通过 Machine Learning: Science and Technology 编辑初审，现已进入外部同行评审。'
    },
    links: [{ label: 'arXiv', href: 'https://arxiv.org/abs/2606.19152' }],
    tags: ['adsorption', 'multiAgent', 'heterogeneousCatalysis'],
    bibtex: '@article{zhang2026adsmind,\n  title={AdsMind: A Physics-Grounded Multi-Agent System for Self-Correcting Discovery of Adsorption Configurations on Heterogeneous Catalyst Surfaces},\n  author={Zhang, Zongmin and Lou, Yuyang and Zhang, Bowen and Chen, Junwu and Kuroki, Ryo and Nguyen, Xuan Vu and Fako, Edvin and Cheng, Lixue and Schwaller, Philippe},\n  journal={arXiv preprint arXiv:2606.19152},\n  year={2026}\n}'
  },
  {
    id: 'catdt',
    date: '2026-06-04',
    year: 2026,
    type: 'preprint',
    cover: { text: 'CatDT' },
    title: {
      en: 'Autonomous Heterogeneous Catalyst Discovery with a Self-Evolving Multi-Agent Digital Twin',
      zh: '基于自进化多智能体数字孪生的自主异相催化剂发现'
    },
    authorsHtml: 'Zhilong Song, <span class="me">Zongmin Zhang</span>, and Lixue Cheng',
    highlight: {
      en: 'Conducted Codex-based ablation experiments and contributed to the evaluation of CatDT, a self-evolving multi-agent digital-twin framework for autonomous heterogeneous catalyst discovery.',
      zh: '执行了基于 Codex 的消融实验，并参与了 CatDT 的评估——一个用于自主异相催化剂发现的自进化的多智能体数字孪生框架。'
    },
    venue: {
      en: 'arXiv preprint arXiv:2606.05050, 2026. First-round external peer-review reports received from Nature Communications. Major revision requested.',
      zh: 'arXiv 预印本 arXiv:2606.05050, 2026。已收到 Nature Communications 第一轮外部同行评审意见，审稿决定为大修。'
    },
    links: [{ label: 'arXiv', href: 'https://arxiv.org/abs/2606.05050' }],
    tags: ['heterogeneousCatalysis', 'digitalTwin', 'multiAgent'],
    bibtex: '@article{song2026catdt,\n  title={Autonomous Heterogeneous Catalyst Discovery with a Self-Evolving Multi-Agent Digital Twin},\n  author={Song, Zhilong and Zhang, Zongmin and Cheng, Lixue},\n  journal={arXiv preprint arXiv:2606.05050},\n  year={2026}\n}'
  },
  {
    id: 'llm-hackathon',
    date: '2026-05-05',
    year: 2026,
    type: 'preprint',
    cover: { img: 'assets/logo-llm-hackathon.webp', alt: 'LLM hackathon logo' },
    title: {
      en: 'From Knowledge to Action: Outcomes of the 2025 Large Language Model (LLM) Hackathon for Applications in Materials Science and Chemistry',
      zh: '从知识到行动：2025年材料科学与化学应用大语言模型 (LLM) 黑客松成果'
    },
    authorsHtml: 'Aritra Roy et al. (including <span class="me">Zongmin Zhang</span>)',
    highlight: {
      en: 'Large-author community report on LLM-enabled scientific workflows from an international hackathon at the intersection of large language models, materials science, and chemistry.',
      zh: '关于大语言模型赋能的科学工作流的大型社区报告，来自一场聚焦大语言模型、材料科学和化学交叉领域的国际黑客松。'
    },
    venue: {
      en: 'arXiv preprint arXiv:2605.03205, 2026.',
      zh: 'arXiv 预印本 arXiv:2605.03205, 2026。'
    },
    links: [{ label: 'arXiv', href: 'https://arxiv.org/abs/2605.03205' }],
    tags: ['llm', 'aiAgent', 'materialsScience', 'chemistry'],
    bibtex: '@article{roy2026knowledge,\n  title={From Knowledge to Action: Outcomes of the 2025 Large Language Model (LLM) Hackathon for Applications in Materials Science and Chemistry},\n  author={Roy, Aritra and others},\n  journal={arXiv preprint arXiv:2605.03205},\n  year={2026}\n}'
  }
];

/* Newest first. First `newsFeaturedCount` show by default; rest behind "Show more". */
window.NEWS_FEATURED_COUNT = 4;
window.NEWS = [
  {
    date: { en: 'Sep 1, 2026', zh: '2026年9月1日' },
    html: {
      en: 'Co-founded the <strong>HKUST AI for Chemistry Club</strong> as <strong>Vice President (VP)</strong>, a student-led academic community under the Department of Chemistry.',
      zh: '作为<strong>副主席</strong>共同创立<strong>香港科技大学人工智能化学社</strong>（化学系下属之由学生领导的学术社区）。'
    }
  },
  {
    date: { en: 'AY 2026/27', zh: '2026-2027学年' },
    html: {
      en: 'Awarded the <strong>HKSAR Government Scholarship Fund - Scholarship for Outstanding Performance</strong> and <strong>Hong Kong, China-APEC Scholarship</strong> for the 3rd consecutive year.',
      zh: '连续第三年获得<strong>香港特别行政区政府卓越表现奖学金</strong>及<strong>中国香港－亚太经合组织奖学金</strong>。'
    }
  },
  {
    date: { en: 'Jun 18, 2026', zh: '2026年6月18日' },
    html: {
      en: 'Our paper <strong>AdsMind</strong> is now available on <a href="https://arxiv.org/abs/2606.19152" target="_blank" rel="noopener noreferrer">arXiv</a>. It passed editorial screening at <strong>Machine Learning: Science and Technology</strong> and is now under external peer review.',
      zh: '我们的论文 <strong>AdsMind</strong> 现已在 <a href="https://arxiv.org/abs/2606.19152" target="_blank" rel="noopener noreferrer">arXiv</a> 上线。稿件已通过 <strong>Machine Learning: Science and Technology</strong> 编辑初审，现已进入外部同行评审。'
    }
  },
  {
    date: { en: 'Jun 4, 2026', zh: '2026年6月4日' },
    html: {
      en: 'Our paper <strong>CatDT</strong> is now available on <a href="https://arxiv.org/abs/2606.05050" target="_blank" rel="noopener noreferrer">arXiv</a>. First-round external peer-review reports have been received from <strong>Nature Communications</strong>. A <strong>major revision</strong> was requested.',
      zh: '我们的论文 <strong>CatDT</strong> 现已在 <a href="https://arxiv.org/abs/2606.05050" target="_blank" rel="noopener noreferrer">arXiv</a> 上线。已收到 <strong>Nature Communications</strong> 第一轮外部同行评审意见，审稿决定为<strong>大修</strong>。'
    }
  },
  {
    date: { en: 'May 5, 2026', zh: '2026年5月5日' },
    html: {
      en: 'Community report from the <strong>2025 LLM Hackathon for Applications in Materials Science &amp; Chemistry</strong> published on <a href="https://arxiv.org/abs/2605.03205" target="_blank" rel="noopener noreferrer">arXiv</a>.',
      zh: '来自<strong>2025年材料科学与化学应用大语言模型 (LLM) 黑客松</strong>的社区报告现已在 <a href="https://arxiv.org/abs/2605.03205" target="_blank" rel="noopener noreferrer">arXiv</a> 上线。'
    }
  },
  {
    date: { en: 'Feb 2, 2026', zh: '2026年2月2日' },
    html: {
      en: 'Joined the <strong>AI for Physical Sciences (AI4PhysSci) Lab</strong> at <strong>HKUST</strong> as an <strong>Undergraduate Research Assistant (UGRA)</strong>, supervised by <strong>Prof. Lixue Cheng</strong>.',
      zh: '加入<strong>香港科技大学物质科学人工智能实验室 (AI4PhysSci Lab)</strong> 担任<strong>本科生研究助理 (UGRA)</strong>，师从<strong>程立雪教授</strong>。'
    }
  },
  {
    date: { en: 'Feb 1, 2026', zh: '2026年2月1日' },
    html: {
      en: 'Completed exchange semester at <strong>École Polytechnique Fédérale de Lausanne (EPFL)</strong>, <strong>School of Computer and Communication Sciences (IC)</strong>.',
      zh: '完成了在<strong>瑞士洛桑联邦理工学院 (EPFL) 计算机与通信科学学院 (IC) </strong>的交换学期。'
    }
  },
  {
    date: { en: 'Sep 8, 2025', zh: '2025年9月8日' },
    html: {
      en: 'Started as a semester project student at the <strong>Laboratory of Artificial Chemical Intelligence (LIAC)</strong>, <strong>École Polytechnique Fédérale de Lausanne (EPFL)</strong>, supervised by <strong>Prof. Philippe Schwaller</strong> and <strong>Postdoctoral Associate Dr. Edvin Fako</strong>.',
      zh: '开始在<strong>瑞士洛桑联邦理工学院 (EPFL) 人工化学智能实验室 (LIAC)</strong> 担任学期项目学生，师从 <strong>Philippe Schwaller 教授</strong>和<strong>博士后研究员 Edvin Fako 博士</strong>。'
    }
  },
  {
    date: { en: 'AY 2025/26', zh: '2025-2026学年' },
    html: {
      en: 'Awarded the <strong>HKSAR Government Scholarship Fund - Scholarship for Outstanding Performance</strong> and <strong>Hong Kong, China-APEC Scholarship</strong> for the 2nd consecutive year. Also received the <strong>Reaching Out Award (ROA)</strong>.',
      zh: '连续第二年获得<strong>香港特别行政区政府卓越表现奖学金</strong>及<strong>中国香港－亚太经合组织奖学金</strong>。同时获得<strong>香港特别行政区政府外展体验奖（ROA）</strong>。'
    }
  },
  {
    date: { en: 'AY 2024/25', zh: '2024-2025学年' },
    html: {
      en: 'Awarded the <strong>HKSAR Government Scholarship Fund - Scholarship for Outstanding Performance</strong> and <strong>Hong Kong, China-APEC Scholarship</strong> for the first time.',
      zh: '首次获得<strong>香港特别行政区政府卓越表现奖学金</strong>及<strong>中国香港－亚太经合组织奖学金</strong>。'
    }
  }
];

/* ---------------------------------------------------------------------------
 * CV sections (education, research, honors, activities, projects, collaborators).
 * Same idea as PUBLICATIONS/NEWS: edit ONE object here (bilingual where the text
 * is translated; plain strings for language-agnostic content like names/tools).
 * main.js renders the leaf items into the existing section markup and re-renders
 * on language switch. `school` keys map into window.SCHOOLS for the logo.
 * ------------------------------------------------------------------------- */

window.SCHOOLS = {
  "hkust": {
    "logo": "assets/logo-hkust.png",
    "cls": "logo-hkust",
    "alt": "HKUST logomark"
  },
  "epfl": {
    "logo": "assets/logo-epfl.svg",
    "cls": "logo-epfl",
    "alt": "EPFL logo"
  },
  "sjtu": {
    "logo": "assets/logo-sjtu.png",
    "cls": "logo-sjtu",
    "alt": "SJTU seal"
  },
  /* Official group logo from https://www.sansen-group.com/img/logo1.svg. */
  "sansen": {
    "logo": "assets/logo-sansen.svg",
    "cls": "logo-sansen",
    "alt": "Sansen Group official logo"
  },
  /* Official QVRI mark from https://www.qdvri.com/static/img/logo-move-black.bcabbb0a.png. */
  "qvri": {
    "logo": "assets/logo-qvri.png",
    "cls": "logo-qvri",
    "alt": "QVRI official logo"
  },
  /* Historical Lucent Technologies mark sourced from its archived corporate documentation. */
  "lucent": {
    "logo": "assets/logo-lucent.svg",
    "cls": "logo-lucent",
    "alt": "Lucent Technologies logo"
  }
};

window.EDUCATION = [
  {
    "school": "hkust",
    "date": {
      "en": "Sep 2023 - Present",
      "zh": "2023年9月 - 至今"
    },
    "title": {
      "en": "The Hong Kong University of Science and Technology (HKUST), Bachelor of Engineering (BEng) in Computer Science, minor in Chemistry.",
      "zh": "香港科技大学 (HKUST)，工学士（计算机科学），辅修化学。"
    }
  },
  {
    "school": "epfl",
    "date": {
      "en": "Sep 2025 - Feb 2026",
      "zh": "2025年9月 - 2026年2月"
    },
    "title": {
      "en": "HKUST SENG Undergraduate Outbound Exchange Student, École polytechnique fédérale de Lausanne (EPFL), School of Computer and Communication Sciences (IC), Lausanne, Switzerland.",
      "zh": "香港科技大学工学院本科境外交换生，瑞士洛桑联邦理工学院 (EPFL)，计算机与通信科学学院 (IC)，瑞士洛桑。"
    }
  },
  {
    "school": "sjtu",
    "date": {
      "en": "Feb 2025 - Jun 2025",
      "zh": "2025年2月 - 2025年6月"
    },
    "title": {
      "en": "Association of Pacific Rim Universities (APRU) Virtual Student Exchange (VSE) Program, hosted online by Shanghai Jiao Tong University (SJTU), School of Materials Science and Engineering.",
      "zh": "环太平洋大学联盟 (APRU) 虚拟学生交流 (VSE) 项目，由上海交通大学 (SJTU) 线上承办，材料科学与工程学院。"
    }
  }
];

window.RESEARCH = [
  {
    "school": "hkust",
    "date": {
      "en": "2026 - 2027 (expected)",
      "zh": "2026年 - 2027年（预计）"
    },
    "title": {
      "en": "Final Year Thesis (FYT): Embodied Multi-Agent System for High-Stakes Environment Safety: Transferring Autonomous Driving Architectures to Edge-Deployed Labs. Advisors: Prof. Chaojian Li and Prof. Lixue Cheng.",
      "zh": "本科毕业论文（FYT）：面向高风险环境安全的具身多智能体系统——将自动驾驶架构迁移至边缘部署实验室。导师：李朝鉴教授与程立雪教授。"
    }
  },
  {
    "school": "hkust",
    "date": {
      "en": "Feb 2026 - Present",
      "zh": "2026年2月 - 至今"
    },
    "title": {
      "en": "Undergraduate Research Assistant (UGRA), AI for Physical Sciences (AI4PhysSci) Lab, HKUST. Supervisor: Prof. Lixue Cheng.",
      "zh": "本科生研究助理 (UGRA)，香港科技大学 (HKUST) 物质科学人工智能实验室 (AI4PhysSci Lab)。导师：程立雪教授。"
    }
  },
  {
    "school": "epfl",
    "date": {
      "en": "Sep 2025 - Jan 2026",
      "zh": "2025年9月 - 2026年1月"
    },
    "title": {
      "en": "Semester Project Student, Laboratory of Artificial Chemical Intelligence (LIAC), EPFL. Supervisors: Prof. Philippe Schwaller and Dr. Edvin Fako.",
      "zh": "学期项目学生，瑞士洛桑联邦理工学院 (EPFL) 人工化学智能实验室 (LIAC)。导师：Philippe Schwaller 教授与 Edvin Fako 博士。"
    }
  },
  {
    "school": "hkust",
    "date": {
      "en": "Jun 2024 - May 2026",
      "zh": "2024年6月 - 2026年5月"
    },
    "title": {
      "en": "HKUST UROP projects in database knowledge discovery, VR user experience assessment, and orbital-based learning for property prediction.",
      "zh": "香港科技大学本科生研究计划 (UROP) 项目：数据库知识发现、VR用户体验评估以及用于性质预测的基于轨道的学习等。"
    }
  }
];

window.INDUSTRY = [
  {
    "school": "sansen",
    "date": {
      "en": "Jun 2025 - Aug 2025",
      "zh": "2025年6月 - 2025年8月"
    },
    "title": {
      "en": "Computer Vision Algorithm Intern, Sansen Well (Shanghai) Robotics Co., Ltd., Shanghai, China.",
      "zh": "计算机视觉算法实习生，三森威尔（上海）机器人有限公司，中国上海。"
    }
  },
  {
    "school": "qvri",
    "date": {
      "en": "Dec 2024 - Jan 2025",
      "zh": "2024年12月 - 2025年1月"
    },
    "title": {
      "en": "Unity VR Development Intern, Qingdao Virtual Reality Institute (QVRI) Co., Ltd., Qingdao, Shandong, China.",
      "zh": "Unity VR 开发实习生，青岛虚拟现实研究院有限公司，中国山东青岛。"
    }
  },
  {
    "school": "lucent",
    "date": {
      "en": "Aug - Sep 2024",
      "zh": "2024年8月-9月"
    },
    "title": {
      "en": "Front-End Development Intern, Lucent Qingdao R&D Center, Qingdao, Shandong, China.",
      "zh": "前端开发实习生，青岛朗讯科技通讯设备有限公司，中国山东青岛。"
    }
  }
];

window.HONORS = {
  "scholarships": [
    {
      "title": {
        "en": "HKSAR Government Scholarship Fund - Scholarship for Outstanding Performance and Hong Kong, China-APEC Scholarship",
        "zh": "香港特别行政区政府卓越表现奖学金及中国香港－亚太经合组织奖学金"
      },
      "items": [
        {
          "date": { "en": "AY 2026/27", "zh": "2026-2027学年" },
          "text": { "en": "Awarded for the 3rd consecutive year.", "zh": "连续第三年获得。" }
        },
        {
          "date": { "en": "AY 2025/26", "zh": "2025-2026学年" },
          "text": { "en": "Awarded for the 2nd consecutive year.", "zh": "连续第二年获得。" }
        },
        {
          "date": { "en": "AY 2024/25", "zh": "2024-2025学年" },
          "text": { "en": "Awarded for the first time.", "zh": "首次获得。" }
        }
      ]
    },
    {
      "title": {
        "en": "HKUST Study Abroad Funding Support (HK$10,000)",
        "zh": "香港科技大学海外学习资助（HK$10,000）"
      },
      "items": [
        {
          "date": { "en": "Fall 2025", "zh": "2025年秋季" },
          "text": { "en": "HKUST Study Abroad Grant", "zh": "香港科技大学海外学习补助金" }
        },
        {
          "date": { "en": "AY 2025/26", "zh": "2025-2026学年" },
          "text": {
            "en": "HKSAR Government Scholarship Fund - Reaching Out Award (ROA)",
            "zh": "香港特别行政区政府外展体验奖（ROA）"
          }
        }
      ]
    }
  ],
  "honors": [
    {
      "title": {
        "en": "HKUST SENG Dean's List",
        "zh": "香港科技大学工学院院长嘉许名单"
      },
      "items": [
        { "date": { "en": "Spring 2026", "zh": "2026年春季学期" } },
        { "date": { "en": "Spring 2025", "zh": "2025年春季学期" } },
        { "date": { "en": "Fall 2024", "zh": "2024年秋季学期" } },
        { "date": { "en": "Spring 2024", "zh": "2024年春季学期" } },
        { "date": { "en": "Fall 2023", "zh": "2023年秋季学期" } }
      ]
    }
  ],
  "awards": [
    {
      "title": {
        "en": "HKUST GenAI Hackathon Competition on a Putonghua Web Tool",
        "zh": "香港科技大学普通话网络工具生成式人工智能黑客松竞赛（普通话学习编程比赛）"
      },
      "items": [
        {
          "date": { "en": "Mar 2026", "zh": "2026年3月" },
          "text": { "en": "Finalist Award (Team Category)", "zh": "决赛入围奖（团体组）" }
        }
      ]
    },
    {
      "title": {
        "en": "5th National University Students' Data Analysis Popular Science Knowledge Competition Series",
        "zh": "第五届全国大学生数据分析科普竞赛系列活动"
      },
      "items": [
        {
          "date": { "en": "May 2026", "zh": "2026年5月" },
          "text": {
            "en": "First Prize (Theory Track) · Outstanding Volunteer · Data Analysis Professional Skill Certificate",
            "zh": "理论赛一等奖 · 优秀志愿者 · 数据分析专业技能证书"
          }
        }
      ]
    },
    {
      "title": {
        "en": "5th National Students' Science Literacy Knowledge Popularization Activity",
        "zh": "第五届全国学生科学素质知识科普活动"
      },
      "items": [
        {
          "date": { "en": "May 2026", "zh": "2026年5月" },
          "text": {
            "en": "Volunteer · First Prize (University Student Group)",
            "zh": "志愿者 · 大学生组一等奖"
          }
        },
        {
          "date": { "en": "Sep 2026", "zh": "2026年9月" },
          "text": { "en": "Social Practice Activity Certificate", "zh": "社会实践活动证书" }
        }
      ]
    }
  ]
};

window.ACTIVITIES = {
  "leadership": [
    {
      "en": "IOP Trusted Reviewer, Machine Learning: Science and Technology.",
      "zh": "IOP可信赖审稿人，Machine Learning: Science and Technology。"
    },
    {
      "en": "Reviewer, ICML 2026 AI for Science Workshop & NeurIPS 2026 AI for Science Workshop.",
      "zh": "审稿人，ICML 2026 AI for Science 研讨会与 NeurIPS 2026 AI for Science 研讨会。"
    },
    {
      "en": "Co-Founder & Vice President (VP), HKUST AI for Chemistry Club, a student-led academic community under the Department of Chemistry.",
      "zh": "共同创始人兼副主席，香港科技大学人工智能化学社（化学系下属之由学生领导的学术社区）。"
    },
    {
      "en": "Student Representative, HKUST SENG Mainland Undergraduate Recruitment Trip for JEE Main Round Interview Mingling Sessions.",
      "zh": "学生代表，香港科技大学工学院内地招生活动高考面试交流分享。"
    },
    {
      "en": "Student Member of ACS, RSC, and CCS (Chemistry). Student Member of IEEE, ACM, CCF, and HKCS (Computer Science).",
      "zh": "学生会员：美国化学会（ACS）、英国皇家化学学会（RSC）、中国化学会（CCS）（化学方向）。电气电子工程师学会（IEEE）、美国计算机学会（ACM）、中国计算机学会（CCF）、香港电脑学会（HKCS）（计算机方向）。"
    },
    {
      "en": "Member & Participant, Hong Kong Tsingtao Association (HKQDA), HKUST MSSSUG, and CSSA Lausanne.",
      "zh": "成员与参与者：香港青岛同乡联谊会 (HKQDA)、香港科技大学内地学生学者联谊会 (MSSSUG)、洛桑中国学者学生联谊会 (CSSA Lausanne)。"
    }
  ],
  "teaching": [
    {
      "en": "UGTA, HKUST CSE Programming Commons, Fall 2024, Spring 2026, and Fall 2026.",
      "zh": "本科生助教 (UGTA)，香港科技大学计算机科学及工程学系编程研习坊，2024年秋季、2026年春季及2026年秋季学期。"
    },
    {
      "en": "UGTA, HKUST COMP2011 Programming with C++, Spring 2025.",
      "zh": "本科生助教 (UGTA)，香港科技大学 COMP2011 C++程序设计，2025年春季学期。"
    }
  ],
  "techStack": [
    "C/C++, Java, Python, Rust, C#, Scala, R, JavaScript.",
    "PyTorch, TensorFlow, CUDA, TensorRT, NumPy, Keras, scikit-learn.",
    "LangGraph, LangChain, prompt engineering, RAG, MCP, agent tool & skill design.",
    "Codex, Claude Code, harness engineering.",
    "RDKit, ASE, MACE-MP.",
    "OpenCV, YOLO, SAM, 3D Reconstruction, VTK, Unity, Meta XR SDK."
  ],
  "languages": [
    {
      "en": "Mandarin: native.",
      "zh": "中文 (普通话)：母语。"
    },
    {
      "en": "English: full professional proficiency (Gaokao: 142/150).",
      "zh": "英文：专业工作熟练度 (高考英语: 142/150)。"
    },
    {
      "en": "Japanese: approximately JLPT N3 level.",
      "zh": "日语：约相当于 JLPT N3 水平。"
    },
    {
      "en": "French: CEFR A1 (certified by the EPFL Language Centre).",
      "zh": "法语：CEFR A1（获 EPFL 语言中心认证）。"
    },
    {
      "en": "Cantonese: elementary proficiency.",
      "zh": "中文 (广东话)：初级熟练度。"
    }
  ]
};

window.PROJECTS = [
  {
    "title": "AdsMind",
    "desc": {
      "en": "A closed-loop, physics-grounded multi-agent system for autonomous adsorption-configuration discovery on heterogeneous catalyst surfaces.",
      "zh": "一个用于异相催化剂表面吸附构型的自主发现的闭环的、基于物理的多智能体系统。"
    },
    "links": [
      {
        "label": "GitHub",
        "href": "https://github.com/NagatoBigSeven/AdsMind"
      }
    ]
  },
  {
    "title": "eBPF-LLM NetSentinel",
    "desc": {
      "en": "An intelligent network threat-detection system combining eBPF/XDP enforcement, LLM-driven analysis, and human-in-the-loop (HITL) validation.",
      "zh": "一个结合 eBPF/XDP 执行、LLM 驱动分析和人在回路 (HITL) 验证的智能网络威胁检测系统。"
    },
    "links": [
      {
        "label": "GitHub",
        "href": "https://github.com/NagatoBigSeven/eBPF-LLM-NetSentinel"
      }
    ]
  },
  {
    "title": "PSC-Copilot",
    "desc": {
      "en": "A generative-AI (GenAI) examiner and practice assistant for Cantonese-speaking Putonghua Shuiping Ceshi (PSC) examinees.",
      "zh": "一个面向以广东话为母语的普通话水平测试 (PSC) 考生的生成式人工智能 (GenAI) 考官与练习助手。"
    },
    "links": [
      {
        "label": "GitHub",
        "href": "https://github.com/Nine-Three-Cattery/PSC-Copilot"
      }
    ]
  },
  {
    "title": "Agent and Wolf",
    "desc": {
      "en": "A ReAct/RAG role-playing (RP) agent inspired by the heroine - Wise Wolf Holo from Spice and Wolf, built with LangChain, Google Gemini API, ChromaDB, Firestore, and Wikipedia API.",
      "zh": "一个受《狼与香辛料》女主人公贤狼赫萝启发的 ReAct/RAG 角色扮演 (RP) 智能体，结合 LangChain、Google Gemini API、ChromaDB、Firestore 与 Wikipedia API。"
    },
    "links": [
      {
        "label": "GitHub",
        "href": "https://github.com/NagatoBigSeven/Agent-and-Wolf"
      }
    ]
  }
];

window.COLLABORATORS = [
  {
    "name": "Lixue Cheng",
    "affil": "HKUST AI4PhysSci Lab",
    "href": "https://scholar.google.com/citations?user=hy_oauIAAAAJ",
    "avatar": "assets/collab/lixue_cheng.jpg"
  },
  {
    "name": "Zhilong Song",
    "affil": "HKUST AI4PhysSci Lab",
    "href": "https://scholar.google.com/citations?user=3MkXEhUAAAAJ",
    "avatar": "assets/collab/zhilong_song.jpg"
  },
  {
    "name": "Philippe Schwaller",
    "affil": "EPFL LIAC",
    "href": "https://scholar.google.com/citations?user=Tz0I4ywAAAAJ",
    "avatar": "assets/collab/philippe_schwaller.jpg"
  },
  {
    "name": "Edvin Fako",
    "affil": "EPFL LIAC",
    "href": "https://scholar.google.com/citations?user=qcIwmagAAAAJ",
    "avatar": "assets/collab/edvin_fako.jpg"
  },
  {
    "name": "Junwu Chen",
    "affil": "EPFL LIAC",
    "href": "https://scholar.google.com/citations?user=q5Oke7sAAAAJ",
    "avatar": "assets/collab/junwu_chen.jpg"
  },
  {
    "name": "Ryo Kuroki",
    "affil": "EPFL LIAC",
    "href": "https://scholar.google.com/citations?user=MUr5QuYAAAAJ"
  },
  {
    "name": "Xuan Vu Nguyen",
    "affil": "EPFL LIAC",
    "href": "https://scholar.google.com/citations?user=JPVJeFUAAAAJ",
    "avatar": "assets/collab/xuan_vu_nguyen.jpg"
  },
  {
    "name": "Yuyang Lou",
    "affil": "USTC Physics",
    "href": "https://scholar.google.com/citations?user=xF7bl-AAAAAJ"
  }
];
