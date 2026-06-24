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
      en: 'arXiv preprint arXiv:2606.19152, 2026. Journal manuscript under review.',
      zh: 'arXiv 预印本 arXiv:2606.19152, 2026。期刊稿件审稿中。'
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
      en: 'arXiv preprint arXiv:2606.05050, 2026. Journal manuscript under review.',
      zh: 'arXiv 预印本 arXiv:2606.05050, 2026。期刊稿件审稿中。'
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
    date: { en: 'Jun 18, 2026', zh: '2026年6月18日' },
    html: {
      en: 'Our paper <strong>AdsMind</strong> is now available on <a href="https://arxiv.org/abs/2606.19152" target="_blank" rel="noopener noreferrer">arXiv</a>. Journal manuscript under review.',
      zh: '我们的论文 <strong>AdsMind</strong> 现已在 <a href="https://arxiv.org/abs/2606.19152" target="_blank" rel="noopener noreferrer">arXiv</a> 上线。期刊稿件审稿中。'
    }
  },
  {
    date: { en: 'Jun 4, 2026', zh: '2026年6月4日' },
    html: {
      en: 'Our paper <strong>CatDT</strong> is now available on <a href="https://arxiv.org/abs/2606.05050" target="_blank" rel="noopener noreferrer">arXiv</a>. Journal manuscript under review.',
      zh: '我们的论文 <strong>CatDT</strong> 现已在 <a href="https://arxiv.org/abs/2606.05050" target="_blank" rel="noopener noreferrer">arXiv</a> 上线。期刊稿件审稿中。'
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
      en: 'Joined the <strong>AI for Physical Sciences (AI4PhysSci) Lab</strong> at <strong>HKUST</strong> as an <strong>Undergraduate Research Assistant (UGRA)</strong>, supervised by <strong>Prof. Sherry Lixue Cheng</strong>.',
      zh: '加入<strong>香港科技大学物质科学人工智能实验室 (AI4PhysSci Lab)</strong> 担任<strong>本科生研究助理 (UGRA)</strong>，师从<strong>程立雪教授</strong>。'
    }
  },
  {
    date: { en: 'Jan 28, 2026', zh: '2026年1月28日' },
    html: {
      en: 'Completed exchange semester at <strong>École Polytechnique Fédérale de Lausanne (EPFL)</strong>, <strong>School of Computer and Communication Sciences (IC)</strong>.',
      zh: '完成了在<strong>瑞士洛桑联邦理工学院 (EPFL) 计算机与通信科学学院 (IC) </strong>的交换学期。'
    }
  },
  {
    date: { en: 'Sep 8, 2025', zh: '2025年9月8日' },
    html: {
      en: 'Started as project student at the <strong>Laboratory of Artificial Chemical Intelligence (LIAC)</strong>, <strong>École Polytechnique Fédérale de Lausanne (EPFL)</strong>, supervised by <strong>Prof. Philippe Schwaller</strong> and <strong>Postdoctoral Associate Dr. Edvin Fako</strong>.',
      zh: '开始在<strong>瑞士洛桑联邦理工学院 (EPFL) 人工化学智能实验室 (LIAC)</strong> 担任项目学生，师从 <strong>Philippe Schwaller 教授</strong>和<strong>博士后研究员 Edvin Fako 博士</strong>。'
    }
  },
  {
    date: { en: '2025/26', zh: '2025/26' },
    html: {
      en: 'Received <strong>HKSAR Government Scholarship</strong>, <strong>Hong Kong, China-APEC Scholarship</strong>, and <strong>Reaching Out Award (ROA)</strong>.',
      zh: '荣获<strong>香港特别行政区政府奖学金</strong>、<strong>中国香港－亚太经合组织奖学金</strong>以及<strong>外展体验奖</strong>。'
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
      "en": "Feb 2026 - Present",
      "zh": "2026年2月 - 至今"
    },
    "title": {
      "en": "Undergraduate Research Assistant (UGRA), AI for Physical Sciences (AI4PhysSci) Lab, HKUST. Supervisor: Prof. Sherry Lixue Cheng.",
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
      "en": "Project student, Laboratory of Artificial Chemical Intelligence (LIAC), EPFL. Supervisors: Prof. Philippe Schwaller and Dr. Edvin Fako.",
      "zh": "项目学生，瑞士洛桑联邦理工学院 (EPFL) 人工化学智能实验室 (LIAC)。导师：Philippe Schwaller 教授与 Edvin Fako 博士。"
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

window.HONORS = {
  "scholarships": [
    {
      "en": "HKSAR Government Scholarship - Continuing Awards, 2025/26",
      "zh": "香港特别行政区政府奖学金——卓越表现奖, 2025-26学年度"
    },
    {
      "en": "HKSAR Government Scholarship - Continuing Awards, 2024/25",
      "zh": "香港特别行政区政府奖学金——卓越表现奖, 2024-25学年度"
    },
    {
      "en": "Hong Kong, China-APEC Scholarship, 2025/26",
      "zh": "中国香港－亚太经合组织奖学金, 2025-26学年度"
    },
    {
      "en": "Hong Kong, China-APEC Scholarship, 2024/25",
      "zh": "中国香港－亚太经合组织奖学金, 2024-25学年度"
    },
    {
      "en": "HKSAR Government Scholarship - Reaching Out Award (ROA), 2025/26",
      "zh": "香港特别行政区政府奖学金——外展体验奖 (ROA), 2025-26学年度"
    },
    {
      "en": "HKUST Study Abroad Grant",
      "zh": "香港科技大学海外学习补助金"
    }
  ],
  "honors": [
    {
      "en": "HKUST SENG Dean's List, Spring 2025",
      "zh": "香港科技大学工学院院长嘉许名单, 2025年春季学期"
    },
    {
      "en": "HKUST SENG Dean's List, Fall 2024",
      "zh": "香港科技大学工学院院长嘉许名单, 2024年秋季学期"
    },
    {
      "en": "HKUST SENG Dean's List, Spring 2024",
      "zh": "香港科技大学工学院院长嘉许名单, 2024年春季学期"
    },
    {
      "en": "HKUST SENG Dean's List, Fall 2023",
      "zh": "香港科技大学工学院院长嘉许名单, 2023年秋季学期"
    }
  ],
  "awards": [
    {
      "en": "Finalist Award, HKUST GenAI Hackathon Competition on a Putonghua Web Tool",
      "zh": "决赛入围奖 (团体组), 香港科技大学普通话网络工具生成式人工智能黑客松竞赛 (普通话学习编程比赛)"
    },
    {
      "en": "First Prize, The 5th National University Students' Data Analysis Popular Science Knowledge Competition (Theory Track)",
      "zh": "一等奖, 第五届全国大学生数据分析科普竞赛系列活动之理论赛"
    }
  ]
};

window.ACTIVITIES = {
  "leadership": [
    {
      "en": "Reviewer, ICML 2026 AI for Science Workshop.",
      "zh": "审稿人，国际机器学习会议 (ICML) 2026 AI for Science 专题研讨会。"
    },
    {
      "en": "Founding Organizer, HKUST AI for Chemistry Club, a student-led academic community supported by the Department of Chemistry.",
      "zh": "创始组织者，香港科技大学人工智能化学俱乐部（由化学系支持的学生主导的学术社区）。"
    },
    {
      "en": "Student Representative, HKUST SENG Mainland Undergraduate Recruitment Trip for JEE Main Round Interview Mingling Sessions.",
      "zh": "学生代表，香港科技大学工学院内地招生活动高考面试交流分享。"
    }
  ],
  "teaching": [
    {
      "en": "UGTA, HKUST COMP2011 Programming with C++, Spring 2025.",
      "zh": "本科生助教 (UGTA)，香港科技大学 COMP2011 C++程序设计，2025年春季学期。"
    },
    {
      "en": "UGTA, HKUST CSE Programming Commons, Fall 2024 and Spring 2026.",
      "zh": "本科生助教 (UGTA)，香港科技大学计算机科学及工程学系编程研习坊，2024年秋季学期及2026年春季学期。"
    }
  ],
  "techStack": [
    "C/C++, Java, Python, Scala, C#, JavaScript, Rust.",
    "PyTorch, TensorRT, NumPy, OpenCV, VTK, YOLO, SAM.",
    "LangChain, LangGraph, ReAct, RAG, MCP, skills.",
    "Codex, Claude Code, OpenClaw, Hermès Agent.",
    "RDKit, ASE.",
    "Linux, bash, zsh."
  ],
  "languages": [
    {
      "en": "Mandarin: native.",
      "zh": "中文 (普通话)：母语。"
    },
    {
      "en": "English: professional working proficiency.",
      "zh": "英文：专业工作熟练度。"
    },
    {
      "en": "Japanese: approximately JLPT N3 level.",
      "zh": "日语：约相当于 JLPT N3 水平。"
    },
    {
      "en": "French: approximately CEFR A1 level.",
      "zh": "法语：约相当于 CEFR A1 水平。"
    },
    {
      "en": "Cantonese: basic.",
      "zh": "中文 (广东话)：基础。"
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
    "name": "Sherry Lixue Cheng",
    "affil": "HKUST AI4PhysSci Lab",
    "href": "https://scholar.google.com/citations?user=hy_oauIAAAAJ",
    "avatar": "assets/collab/sherry_lixue_cheng.jpg"
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
  }
];
