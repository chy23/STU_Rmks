import React, { useState, useRef, useEffect } from 'react';
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import * as XLSX from 'xlsx';
import { Upload, Download, Settings, Play, CheckCircle2, Loader2, AlertCircle, Info, ChevronDown, StopCircle, Copy, Users, FileSpreadsheet, Key, Eye, EyeOff, Sparkles, Cpu, AlertTriangle } from 'lucide-react';
import changelogData from './changelog.json';
import './App.css';

const AVAILABLE_MODELS = [
  {
    id: "gemma3-1b-it-q4f16_1-MLC",
    name: "Gemma 3 (1B)",
    vendor: "Google",
    country: "美國",
    size: "1B (約 10 億參數)",
    features: "Google 最新第三代微型模型，架構極新、推論速度極快、繁中短文理解佳。",
    advice: "硬體需求極低（約需 1GB 記憶體），絕大多數手機與無獨立顯卡之文書筆電皆可流暢運行；適合日常輕量任務。"
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 (1B)",
    vendor: "Meta",
    country: "美國",
    size: "1B (約 10 億參數)",
    features: "極度輕量迅速，對結構化指令與格式規範服從性高，反應即時。",
    advice: "硬體需求極低（約需 1GB 記憶體），一般文書機皆可順暢執行；適合快速處理標準化格式內容。"
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    name: "Gemma 2 (2B)",
    vendor: "Google",
    country: "美國",
    size: "2B (約 20 億參數)",
    features: "體積與生成品質兼具的平衡型模型，回答語氣自然，細節掌握度顯著優於 1B 模型。",
    advice: "硬體需求低（約需 1.5~2GB 記憶體），適合近三年內主流筆電與平板；推薦作為日常穩定產出首選。"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 (3B)",
    vendor: "Meta",
    country: "美國",
    size: "3B (約 30 億參數)",
    features: "效能與推論精確度的甜蜜點，邏輯掌握大幅超越 1B 模型，減少幻覺並能穩定遵循長文本脈絡。",
    advice: "硬體需求中等（約需 2.5~3GB 記憶體），建議使用中高階筆電或 Apple 晶片設備；品質精良穩定。"
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    name: "Llama 3.1 (8B)",
    vendor: "Meta",
    country: "美國",
    size: "8B (約 80 億參數)",
    features: "開源界旗艦級大模型，長文本推理、文學修辭與深度因果邏輯表現卓越。",
    advice: "硬體需求高（需 8GB 以上獨立顯存或 Apple M 系列 16GB RAM）；若硬體達標，輸出深度最為完整。"
  },
  {
    id: "gemma-2-9b-it-q4f16_1-MLC",
    name: "Gemma 2 (9B)",
    vendor: "Google",
    country: "美國",
    size: "9B (約 90 億參數)",
    features: "Google 高階大腦容量模型，對繁體中文嚴謹文法與情緒轉折理解最透徹，邏輯綿密。",
    advice: "硬體需求最高（需 8GB 以上獨顯或電競級獨立顯卡 / Apple M 系列高配機）；運算負載重但品質極佳。"
  }
];

const GEMINI_FALLBACK_CHAIN = [
  { 
    id: 'gemini-3.8-flash', 
    name: 'gemini-3.8-flash', 
    role: '第一優先首選模型', 
    behavior: '自動直接調用（極速、最新版）',
    pricing: '支援免費額度；付費 $0.75 / 1M 輸入, $3.75 / 1M 輸出',
    pros: '最聰明之 Flash 模型，長程程式碼、多步驟自主代理與繁中理解極佳，推論極速且費用親民。',
    cons: '面對極深奧之數理科研長論證時，推論深度略遜於 Argon 旗艦。'
  },
  { 
    id: 'gemini-3.7-flash', 
    name: 'gemini-3.7-flash', 
    role: '第 1 順位備援模型', 
    behavior: '若前置失敗則自動切換',
    pricing: '支援免費額度；付費 $0.75 / 1M 輸入, $3.75 / 1M 輸出',
    pros: '大量驗證之成熟版本，指令遵循度高，適合一般代理功能與教學分析任務。',
    cons: '新一代多步驟複雜推理演繹略低於 3.8 Flash。'
  },
  { 
    id: 'gemini-3.6-flash', 
    name: 'gemini-3.6-flash', 
    role: '第 2 順位備援模型', 
    behavior: '若前置失敗則自動切換',
    pricing: '支援免費額度；付費 $0.75 / 1M 輸入, $3.75 / 1M 輸出',
    pros: '穩定性極高的基底模型，速度與多模態兼具，高可用性備援守門員。',
    cons: '版本較早，上下文精確度與推理細節略不及 3.8 / 3.7。'
  },
  { 
    id: 'gemini-4-argon', 
    name: 'gemini-4-argon', 
    role: '旗艦推理首選備援 (最新版)', 
    behavior: '調用前主動彈窗詢問使用者確認 ⚠️', 
    requireConfirm: true,
    pricing: '無免費額度；付費 $2.00 / 1M 輸入, $10.00 / 1M 輸出 (思考型旗艦)',
    pros: 'Google 主打頂級推論模型，深度推理、長解碼無人能及，專為極端複雜任務打造。',
    cons: '價格較高 (約 Flash 的 2.7~3.3 倍) 且生成較久，需彈窗確認以防非預期計費。'
  },
  { 
    id: 'gemini-3.1-pro-preview', 
    name: 'gemini-3.1-pro-preview', 
    role: '旗艦推理次選備援 (最終防線)', 
    behavior: '若略過或前置失敗時的最後防線',
    pricing: '無免費額度；付費 $2.00~$4.00 / 1M 輸入, $12.00~$18.00 / 1M 輸出',
    pros: '第 3 代 Pro 旗艦架構，長上下文穩定性高、多模態理解深入。',
    cons: '無免費額度，長提示詞單價加倍，成本顯著高於 Flash。'
  },
];

const STYLES = [
  { name: "文學大師風格", desc: "以典雅文辭、溫潤意境與修辭隱喻賦予文字生命力；注重品格薰陶與文雅期許，將日常行為轉化為具文學厚度的成長篇章。" },
  { name: "亞里士多德美德風格", desc: "強調「卓越不是一種行為，而是一種習慣」；以「實踐智慧（Phronesis）」與「中庸之道」為軸，引導孩子在過度與不及之間找到理性平衡。" },
  { name: "阿德勒心理學風格", desc: "建構平等的水平夥伴關係，強調「社會興趣」、「不完美的勇氣」與「課題分離」；拒絕定型標籤，引導學生透過「自我決定」承擔行為責任。" },
  { name: "薩提爾教練風格", desc: "穿透表面的防衛行為，探索冰山底層的感受、渴望與自我價值；引導孩子學會自我覺察，建立表裡如一的「一致性溝通」並為自己負責。" },
  { name: "成長型思維風格", desc: "聚焦於「努力的過程」、「策略的調整」與「尚未（Not Yet）」的概念；將錯誤與挫折視為大腦升級的訊號，強調持續迭代與刻意練習。" },
  { name: "科學人系統風格", desc: "運用熱力學、多線程、反饋機制等客觀科學模型，將成長盲點解構為「待調校的系統參數」與「雜訊濾除」，理性且不帶批判色彩。" },
  { name: "愛因斯坦物理探索風格", desc: "以宇宙時空、量子引力、相對坐標與極致的「好奇心與想像力」為底色；引導孩子在靜止坐標系中收斂心神、聚焦能量，探索真理。" },
  { name: "敏捷教練 / PM風格", desc: "以精準、目標導向的專案管理語言撰寫，強調「優先級排序」、「專注衝刺」與「持續複盤」；建立清晰的自我管理檢核機制。" },
  { name: "杜威實用主義風格", desc: "「教育即生活，教育即生長，從做中學」；強調在真實生活經驗中持續進行「反思與重組」，培養民主社群中的主動協作意識。" },
  { name: "亞當斯密經濟學風格", desc: "透過「看不見的手」調控資源分配，探討「自利與利他」的和諧，強調內在資本（專注力、知識）的累積與邊際效益最大化。" },
  { name: "英雄之旅敘事風格", desc: "將成長轉折包裝為「冒險勇者的修練試煉」；將自律與常規轉化為「鍛造防具」，將專注與知識轉化為「磨礪寶劍」，賦予榮譽感與使命感。" },
  { name: "自然生態觀察家風格", desc: "以自然界的花木、根系、季節時序與生態和諧為隱喻，溫和接納生命時鐘；強調「向下深扎根系」的底蘊與「迎向陽光舒展」的主動性。" },
  { name: "老莊道家風格", desc: "順應孩子的天性稟賦，不強求齊一標準；強調「水善利萬物而不爭」的包容，引導孩子在動靜相生中學會「致虛極，守靜篤」，涵養大器。" },
  { name: "斯多葛哲學風格", desc: "聚焦於「控制二分法」——清楚劃分「自己能掌控的」與「無法掌控的」；鍛造內在堡壘與反脆弱的理性力量。" },
  { name: "正念覺察風格", desc: "強調「回到當下」與「非評價式的覺察」；引導孩子在呼吸與感知中安頓跳躍的心念，溫柔接納自己的情緒，將注意力重新聚焦。" },
  { name: "交響樂團風格", desc: "將成長比擬為「交響樂的合奏」；強調個人主旋律的精準、與同儕聲部的諧和共鳴，以及掌握「休止符（靜心聆聽與留白）」的藝術。" },
  { name: "建築美學風格", desc: "將學習與品格視為「建築結構的營造」；強調「地基」的穩固、「梁柱」的承重，以及「開窗採光（人際視野與包容）」的開闊。" },
  { name: "設計思考風格", desc: "以「同理心觀察」、「定義核心問題」、「快速嘗試」與「測試修正」為核心；把生活中的挫折，視為一場有趣的「解題與產品優化」歷程。" },
  { name: "蘇格拉底風格", desc: "核心精神：強調「未經審視的人生不值得過」與產婆術；引導孩子透過自我提問、釐清盲點，從「自以為知」走向「認識自己的無知」，在思辨中喚醒內在智慧。\n適用情境：習慣敷衍了事、不愛深思、回答問題流於表面，或自視甚高而忽視細節的學生。\n核心詞彙：認識自己、產婆術、自我審視、思辨明晰、智慧萌芽。" },
  { name: "康德風格", desc: "核心精神：強調「道德自律與絕對命令」——真正的自由不是隨心所欲，而是依循理性法則掌控自我；把責任與常規當作崇高的內在義務。\n適用情境：需要外力監督才能完成作業、規則意識較弱、易受玩心誘惑而忽視常規的孩子。\n核心詞彙：實踐理性、自律、道德法則、責任承擔、心中的星空。" },
  { name: "尼采風格", desc: "核心精神：強調「重估一切價值」與「成為你自己」；將挫折與平庸視為自我鍛造的淬火，鼓勵孩子在克服軟弱中釋放生命意志。\n適用情境：缺乏鬥志、安於現狀、容易隨波逐流，或遇到困難容易氣餒退縮的學生。\n核心詞彙：自我超越、生命意志、蛻變、鍛造、成為你自己。" },
  { name: "蘇軾風格", desc: "核心精神：體現「回首向來蕭瑟處，也無風雨也無晴」的曠達胸襟；引導孩子在面對挫折與起伏時保持幽默與從容，隨遇而安且堅守本心。\n適用情境：得失心重、容易因一次考試或人際摩擦而悶悶不樂、性格較為緊繃的孩子。\n核心詞彙：豁達、隨物賦形、從容自適、清風徐來、沉著致遠。" },
  { name: "泰戈爾風格", desc: "核心精神：以自然、愛與詩意映照童心；將孩子的小缺點視為晨曦中的微雲，強調「生如夏花之絢爛」的純真與善意。\n適用情境：性情溫柔、感受力豐富、心思細膩但略帶脆弱，需要被溫柔以待與肯定價值的學生。\n核心詞彙：晨曦、生命之光、純真、飛鳥與花朵、溫柔照耀。" },
  { name: "海明威風格", desc: "核心精神：強調「人可以被毀滅，但不能被擊敗」；用簡潔、剛毅的文字，肯定孩子在重重困難前展現的堅忍與骨氣。\n適用情境：體育校隊成員、性格剛烈但屢遭挫折、需要激發不服輸鬥志的高活動量學生。\n核心詞彙：硬漢風骨、無懼風浪、堅毅不屈、沉著迎擊、純粹力量。" },
  { name: "蒙特梭利風格", desc: "核心精神：相信兒童具有自我構建的內在潛能；強調「跟隨孩子」並建立內在秩序感，將自律視為自由探索的基石。\n適用情境：在混亂中找不到節奏、手部操作能力強但缺乏條理性、需要建立個人工作秩序的孩子。\n核心詞彙：內在秩序、自我構建、專注工作、獨立自主、跟隨成長。" },
  { name: "陶行知風格", desc: "核心精神：主張「生活即教育，社會即學校，行是知之始」；強調手腦並用、在真實生活中實踐道德與知識。\n適用情境：具備實務動手能力、熱心服務班級、但在書本死記硬背上較為吃力的學生。\n核心詞彙：知行合一、手腦並用、生活即教育、創造力、腳踏實地。" },
  { name: "皮亞傑風格", desc: "核心精神：將學習視為「同化、調適與平衡」的認知建構歷程；接納孩子目前所處的思維發展階段，引導其向更高階的抽象運思躍升。\n適用情境：在數學邏輯或抽象概念理解上遇到瓶頸、需要一步步搭建思維鷹架的孩子。\n核心詞彙：認知建構、基模調適、動態平衡、抽象思維、漸進發展。" },
  { name: "司馬遷風格", desc: "核心精神：秉持「究天人之際，通古今之變，成一家之言」的宏大格局；將日常的沉潛與忍耐視為累積深厚底蘊的必要歷練。\n適用情境：具備深厚潛力但目前處於低谷、性格沉靜內斂、需要被看見長遠價值的學生。\n核心詞彙：沉潛蓄力、通古今之變、厚積薄發、風骨、大器。" },
  { name: "湯恩比風格", desc: "核心精神：以文明史觀的「挑戰與回應」模型解讀成長；將升上高年級面臨的課業加深與人際考驗，定義為促使個體躍升的關鍵刺激。\n適用情境：即將面臨升學壓力、面對新挑戰容易畏縮、需要建立宏觀視角的學生。\n核心詞彙：挑戰與回應、躍升、文明演進、歷練重生、宏觀格局。" },
  { name: "魏格納風格", desc: "核心精神：運用「大陸漂移」與「板塊構造」隱喻；引導孩子將散落的知識與興趣拼合成完整的大陸，在看似緩慢的位移中積蓄隆起高山的磅礴能量。\n適用情境：涉獵廣泛但知識零散、注意力易轉移、正在摸索自身定位的孩子。\n核心詞彙：板塊漂移、地殼隆起、聚合拼圖、深層能量、造山運動。" },
  { name: "萊爾風格", desc: "核心精神：強調「現在是通往過去的鑰匙」與持續微小力量的沉積作用；不追求一蹴可幾的奇蹟，而是重視每日滴水穿石的恆久累積。\n適用情境：學習步調慢、基底較弱但踏實苦幹、需要被肯定長期努力價值的學生。\n核心詞彙：沉積岩層、滴水穿石、均變漸進、歲月雕琢、堅實基盤。" },
  { name: "居禮夫人風格", desc: "核心精神：如同從數噸瀝青鈾礦中提煉出微量「鐳」元素；讚美在枯燥重複的日常中堅持不懈、專心致志的科學精神。\n適用情境：耐力極佳、能沉浸於單一任務、默默耕耘但缺乏自信光芒的孩子。\n核心詞彙：淬鍊純化、結晶、執著專注、發光發熱、純粹奉獻。" },
  { name: "門得列夫風格", desc: "核心精神：以「元素週期律」為指引；強調每種性格與才華都有其專屬的原子序與位置，只要理清內在邏輯，就能預測並補齊未知的成長空白。\n適用情境：具備邏輯分類天賦、但生活習慣缺乏條理、需要建立規律架構的學生。\n核心詞彙：週期規律、元素定位、化學鍵結、秩序井然、潛能預測。" },
  { name: "牛頓風格", desc: "核心精神：以「慣性、加速度與作用反作用力」解析生活；引導孩子打破怠惰的靜止慣性，給予自己正向的外力加速度。\n適用情境：做事被動拖延、需要外力推動，或在人際互動中言行過激導致反彈的孩子。\n核心詞彙：克服慣性、加速度、作用與反作用、引力中心、動量守恆。" },
  { name: "費曼風格", desc: "核心精神：強調「別鬧了」背後的純粹好奇心與「費曼學習法」——唯有能用最簡單的話解釋清楚，才是真正掌握；在遊戲與探索中享受發現的樂趣。\n適用情境：活潑愛玩、點子極多、討厭死板教學、喜歡打破砂鍋問到底的學生。\n核心詞彙：純粹好奇、發現的樂趣、化繁為簡、探索實驗、靈動玩心。" },
  { name: "笛卡兒風格", desc: "核心精神：以「直角坐標系」將複雜的人生問題分解為微小維度；強調「我思故我在」的理性審視，引導孩子在混亂中建立清晰的坐標原點。\n適用情境：思緒混亂、做事缺乏條理、面對多重任務容易焦慮崩潰的孩子。\n核心詞彙：坐標原點、維度分解、理性審視、條理分明、精準定位。" },
  { name: "高斯風格", desc: "核心精神：追求「數學王子」般的極致簡潔與完美對稱；引導孩子在解題與做人中不走繁複捷徑，以嚴密的邏輯與耐心完成每一步推導。\n適用情境：天資聰穎但作業潦草求快、解題常跳步粗心、缺乏工整耐性的學生。\n核心詞彙：嚴密推導、黃金對稱、簡潔優雅、精確無誤、完美證明。" },
  { name: "達爾文風格", desc: "核心精神：強調「生存下來的不是最強壯的，而是最能適應環境變化的」；鼓勵孩子在面對新環境與新挑戰時，展現強大的適應力與演化彈性。\n適用情境：轉學生、升上高年級適應不良、面對分班或換老師感到焦慮的孩子。\n核心詞彙：環境適應、演化突圍、多樣性、生命韌性、適者生存。" },
  { name: "法布爾風格", desc: "核心精神：以敬畏與細膩的目光凝視微觀生命；讚美孩子身上微小卻閃光的特質，鼓勵其保持耐心，在日常細節中體察生命的精妙。\n適用情境：性格內向、不擅於大場面社交，但對特定事物（如昆蟲、自然、手工）有著驚人專注力的孩子。\n核心詞彙：微觀凝視、細緻觀察、生命奧秘、耐性守候、獨特天賦。" },
  { name: "伽利略風格", desc: "核心精神：手握望遠鏡直視星空，敢於挑戰傳統教條；鼓勵孩子用雙眼和雙手去實證真理，保有獨立思考與勇敢質疑的科學精神。\n適用情境：不盲從威權、具批判性思維、常提出不同觀點但有時略顯叛逆的學生。\n核心詞彙：實證觀測、勇於質疑、衝破迷霧、開闊視野、真理之光。" },
  { name: "卡爾·薩根風格", desc: "核心精神：強調「我們每個人都是由星塵組成的」；以浩瀚宇宙的尺度包容地上的微小紛擾，賦予孩子博大的胸襟與對世界的浪漫好奇。\n適用情境：胸懷大志但容易在人際小事上糾結、需要被開拓眼界與同理心的孩子。\n核心詞彙：星塵之子、浩瀚星河、宇宙視野、謙卑敬畏、浪漫好奇。" },
  { name: "賈伯斯風格", desc: "核心精神：強調「求知若飢，虛懷若愚」與對細節的極致追求（簡約即極致）；激發孩子追求與眾不同（Think Different）的創造力。\n適用情境：具備強烈個人主見、富有設計與藝術天賦、追求完美但脾氣略顯急躁的學生。\n核心詞彙：求知若飢、非同凡想、極致細節、簡約美學、改變世界。" },
  { name: "稻盛和夫風格", desc: "核心精神：秉持「動機至善，私心了無」與六項精進（付出不亞於任何人的努力、謙虛戒驕、天天反省）；強調人格修煉即是最好的修行。\n適用情境：擔任班級核心幹部、具領導潛質但有時過於強勢，需要修煉謙遜與自省品格的孩子。\n核心詞彙：敬天愛人、動機至善、天天反省、磨礪心性、付出努力。" },
  { name: "曼德拉風格", desc: "核心精神：強調「我是我命運的主宰，我是我靈魂的統帥」；在經歷漫長考驗後依然選擇寬容與同理，展現化敵為友的高尚人格。\n適用情境：在班級人際衝突中受委屈、容易心懷怨懟，或需要培養寬宏器量與同理心的學生。\n核心詞彙：寬容和解、不屈意志、靈魂主宰、化解對立、堅韌胸懷。" },
  { name: "宮崎駿風格", desc: "核心精神：用溫暖手繪的筆觸，守護孩子心中的純真、勇敢與對大自然的敬畏；引導孩子在逆境中依然乘風飛翔，保持善意。\n適用情境：富有童心、想像力豐富、善良溫柔但面對成長感到不安與迷惘的孩子。\n核心詞彙：乘風飛翔、純真初心、溫柔勇敢、生命羈絆、向光而行。" },
  { name: "馬斯克風格", desc: "核心精神：回歸事物最本質的物理事實（第一原理思維），拒絕「別人怎麼做我就怎麼做」的慣性類比；強調極致的執行速度、把失敗當作數據反饋，並懷抱宏大願景。\n適用情境：思維跳脫框架、不喜歡照本宣科、做事常因追求速度而出現粗心失誤的孩子。\n核心詞彙：第一原理、極致推進、快速迭代、重構問題、星際遠見、動態演進。" },
  { name: "黃仁勳風格", desc: "核心精神：信奉「奔跑吧，不要慢慢走」的危機感與行動力，並將「承受痛苦與挫折」視為鍛鍊超能力的必經之路；強調為長遠願景持續累積算力。\n適用情境：遇到困難容易氣餒、抗壓性需磨練，或具備強大潛能但需要被激發「全力以赴狂奔」爆發力的學生。\n核心詞彙：全速奔跑、算力累積、耐受挫折、加速進化、核心壁壘、極致專注。" },
  { name: "山姆·奧特曼風格", desc: "核心精神：相信複利效應帶來的「指數級曲線」；強調強大的自我信念、具備高度主動掌控力，並在關鍵破局點上保持極高密度的專注。\n適用情境：目標遠大、渴望有所成就、需要學習把發散的精力收攏聚焦在「高價值關鍵支點」上的學生。\n核心詞彙：指數級躍升、高自主性、複利效應、破局點、大膽押注。" },
  { name: "貝佐斯風格", desc: "核心精神：永遠保持創業第一天的活力、好奇與敏捷；以「飛輪效應」將日常微小的自律與累積轉化為自我驅動的強大動能，專注於不變的長期價值。\n適用情境：學習表現穩定但容易自我滿足、缺乏持續突破的動力，或是需要建立正向循環的孩子。\n核心詞彙：Day 1 心態、飛輪效應、長期主義、逆向推導、持續驅動、自我造血。" },
  { name: "彼得·提爾風格", desc: "核心精神：追求「從 0 到 1 的原創突破」，拒絕在既有框架下進行平庸複製；強調逆向思維，鼓勵孩子在同儕中勇敢堅持自己的獨特性，打造不可替代的個人壁壘。\n適用情境：極具個人風格、不隨波逐流、思維特立獨行，需要被肯定其獨特性並引導將其轉化為原創實力的學生。\n核心詞彙：從0到1、逆向思維、非共識原則、不可替代、原創突破。" },
  { name: "納德拉風格", desc: "核心精神：強調人生隨時可以「點擊刷新」；推動思維從「自以為無所不知」向「渴望無所不學」轉變，將同理心與協同合作視為最強大的成長動能。\n適用情境：平時聰明但偶顯自滿傲慢、難以聽進同儕建議，或在遭遇挫折後需要重拾信心的孩子。\n核心詞彙：點擊刷新、無所不學、同理心協同、開放思維、文化重塑。" },
  { name: "柯比·布萊恩風格", desc: "核心精神：以「凌晨四點的太陽」為象徵的極致自律；對基本功有著近乎偏執的雕琢，將熱愛轉化為日復一日的苦練，把質疑與失敗當作淬鍊自我的燃料。\n適用情境：天資聰穎但缺乏持久毅力、遇到挫折容易氣餒，或需要被激發「極致專注與求勝意志」的學生。\n核心詞彙：曼巴精神、極致自律、雕琢細節、無懼挑戰、內在驅動。" },
  { name: "麥可·喬丹風格", desc: "核心精神：信奉「我一生中失敗過無數次，這正是我成功的原因」；敢於在關鍵時刻承擔最後一擊的責任，以嚴格的自我要求帶動整個團隊向前。\n適用情境：害怕犯錯不敢嘗試、缺乏抗壓性，或在班級中具備領袖潛質、需要學會挺身擔當大任的學生。\n核心詞彙：失敗為師、關鍵時刻、王者風骨、當仁不讓、迎難而上。" },
  { name: "拉斐爾·納達爾風格", desc: "核心精神：永遠將眼前的「這一分」當作人生最後一球來拼搶；擁有鋼鐵般的心理素質，無論比分落後多少都絕不放棄，嚴格遵守球場常規與尊重對手。\n適用情境：做事容易虎頭蛇尾、缺乏專注耐力、習慣隨便應付差事，需要培養「全力以赴、善始善終」態度的孩子。\n核心詞彙：每一球都全力以赴、鋼鐵意志、善始善終、尊重常規、專注當下。" },
  { name: "大谷翔平風格", desc: "核心精神：打破不可能的「二刀流（文武兼備）」界線；運用「曼陀羅九宮格計畫表」將宏大目標細化為每日微習慣，強調「撿起地上的垃圾就是撿起好運」的極致謙遜與品德修養。\n適用情境：身兼多項校隊與才藝、需要兼顧學業與體育，或是生活常規與人際態度需要更細緻、謙遜的孩子。\n核心詞彙：二刀流、目標九宮格、累積運氣、謙遜沉穩、文武雙全。" },
  { name: "史蒂芬·柯瑞風格", desc: "核心精神：不被傳統身材與框架限制，靠著成千上萬次的肌肉記憶刻意練習，將超長距離三分球變為常規武器；以微笑、快樂與無私的信任感染全隊。\n適用情境：先天條件或基礎較弱而缺乏自信、思維靈活但基本功欠缺扎實磨練、需要享受學習樂趣的孩子。\n核心詞彙：改寫規則、刻意練習、極致精準、自信微笑、團隊信任。" },
  { name: "戴資穎風格", desc: "核心精神：不拘泥於死板套路，以神乎其技的假動作與靈活球路克敵制勝；在逆境落後時依然能保持「享受每一顆球」的強大心理韌性。\n適用情境：思維靈活、不喜歡死記硬背，但容易因考試失誤或分數落後而心浮氣躁、得失心過重的學生。\n核心詞彙：靈動應變、享受當下、逆風翻盤、強大心理素質、不落窠臼。" },
  { name: "艾力克斯·霍諾德風格", desc: "核心精神：零容錯率的絕對專注，將雜訊完全濾除；極致的前期拆解與演練，將路線拆解為肌肉記憶；馴服恐懼而非忽視恐懼，以理性和技術將不確定性降到最低。\n適用情境：平時容易分心、粗心大意，或面對挑戰時容易焦慮恐慌，需要建立「把小事做到極致精準」心態的學生。\n核心詞彙：徒手獨攀、零容錯率、極致專注、路線拆解、肌肉記憶、馴服恐懼、精準踩點。" },
  { name: "其他", desc: "" }
];

const WORD_COUNTS = [
  "50字內",
  "50-100字",
  "100-150字",
  "150-200字",
  "200-250字",
  "300字內"
];

function App() {
  const [engine, setEngine] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [toasts, setToasts] = useState([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const [loadProgressObj, setLoadProgressObj] = useState(null);

  const [students, setStudents] = useState([]);
  const [originalAoa, setOriginalAoa] = useState(null);
  const [headerRowIndex, setHeaderRowIndex] = useState(-1);
  
  // Settings
  const [style, setStyle] = useState(STYLES[0].name);
  const [customStyle, setCustomStyle] = useState("");
  const [wordCount, setWordCount] = useState(WORD_COUNTS[1]);
  const [remarks, setRemarks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI?.isDesktop;
  const [desktopStatus, setDesktopStatus] = useState(null);
  const [selectedDesktopModel, setSelectedDesktopModel] = useState('Llama-3.2-3B-Instruct-Q4_K_M.gguf');
  const [desktopLoading, setDesktopLoading] = useState(false);
  const [isDesktopModelDropdownOpen, setIsDesktopModelDropdownOpen] = useState(false);
  const desktopModelDropdownRef = useRef(null);

  // Engine Mode: 'desktop', 'local' (WebLLM), or 'api' (Gemini)
  const [engineMode, setEngineMode] = useState(() => {
    const saved = localStorage.getItem('stu_rmks_engine_mode');
    if (saved) return saved;
    return (typeof window !== 'undefined' && window.electronAPI?.isDesktop) ? 'desktop' : 'local';
  });
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('stu_rmks_gemini_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelConfirmDialog, setModelConfirmDialog] = useState(null);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const shouldStopRef = useRef(false);
  const apiAbortControllerRef = useRef(null);

  const confirmModelUsage = (modelName) => {
    return new Promise((resolve) => {
      setModelConfirmDialog({
        modelName,
        resolve,
      });
    });
  };

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast("已複製評語！");
    }).catch(() => {
      addToast("複製失敗", "error");
    });
  };

  const stopGeneration = () => {
    shouldStopRef.current = true;
    if (engine && typeof engine.interruptGenerate === 'function') {
      engine.interruptGenerate();
    }
    if (apiAbortControllerRef.current) {
      apiAbortControllerRef.current.abort();
    }
    if (isDesktop && window.electronAPI?.stopGeneration) {
      window.electronAPI.stopGeneration();
    }
    if (modelConfirmDialog) {
      modelConfirmDialog.resolve('cancel');
      setModelConfirmDialog(null);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (isDesktop && window.electronAPI?.getModelsStatus) {
      window.electronAPI.getModelsStatus().then(status => {
        setDesktopStatus(status);
        if (status.currentLoadedModel) {
          setSelectedDesktopModel(status.currentLoadedModel);
        }
      }).catch(err => console.error("無法取得桌面模型狀態:", err));
    }
  }, [isDesktop]);

  const handleLoadDesktopModel = async () => {
    if (!isDesktop || !window.electronAPI) return;
    setDesktopLoading(true);
    try {
      const res = await window.electronAPI.loadModel(selectedDesktopModel);
      if (res.success) {
        addToast(`離線模型已就緒 (${res.gpu?.toUpperCase() || 'GPU'} 硬體加速)`);
        const status = await window.electronAPI.getModelsStatus();
        setDesktopStatus(status);
      } else {
        alert("模型載入失敗: " + res.error);
      }
    } catch (e) {
      alert("模型載入失敗: " + e.message);
    } finally {
      setDesktopLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
      if (desktopModelDropdownRef.current && !desktopModelDropdownRef.current.contains(event.target)) {
        setIsDesktopModelDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsLogOpen(false);
        if (modelConfirmDialog) {
          modelConfirmDialog.resolve('cancel');
          setModelConfirmDialog(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modelConfirmDialog]);

  const translateProgress = (text) => {
    let t = text;
    t = t.replace('Fetching param cache', '下載模型參數快取');
    t = t.replace('MB fetched.', 'MB 已下載。');
    t = t.replace('completed,', '完成，');
    t = t.replace('secs elapsed.', '秒經過。');
    t = t.replace('It can take a while when we first visit this page to populate the cache.', '初次載入需要較長時間下載數 GB 的模型檔案。');
    t = t.replace('Later refreshes will become faster.', '未來再次開啟網頁將會直接從本機快取讀取，速度會大幅加快。');
    t = t.replace('Loading model from cache', '從本機快取讀取模型');
    t = t.replace('Finish loading', '載入完成');
    return t;
  };

  const handleInitModel = async () => {
    if (engine) return;
    setModelLoading(true);
    try {
      const newEngine = await CreateMLCEngine(selectedModel, {
        initProgressCallback: (progress) => {
          console.log(progress);
          setLoadProgress(translateProgress(progress.text));
          setLoadProgressObj(progress);
        }
      });
      setEngine(newEngine);
      addToast("模型載入完成！");
    } catch (err) {
      console.error(err);
      alert("載入模型失敗，請確認您的硬體是否支援 WebGPU，或更換較小的模型。");
    } finally {
      setModelLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      let headerRowIdx = -1;
      let nameColIdx = -1;
      let traitsColIdx = -1;

      for (let i = 0; i < Math.min(data.length, 30); i++) {
        const row = data[i];
        if (!Array.isArray(row)) continue;
        
        const nIdx = row.findIndex(c => typeof c === 'string' && (c.replace(/\s+/g, '') === '姓名' || c.replace(/\s+/g, '') === 'Name'));
        if (nIdx !== -1) {
          headerRowIdx = i;
          nameColIdx = nIdx;
          traitsColIdx = row.findIndex(c => typeof c === 'string' && (c.includes('特質') || c.includes('評語') || c.includes('日常') || c.includes('表現')));
          break;
        }
      }

      if (headerRowIdx === -1) {
        alert("找不到「姓名」欄位，請確定上傳的檔案中有包含學生姓名的標題行。");
        return;
      }

      const mappedStudents = [];
      for (let i = headerRowIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!Array.isArray(row) || !row[nameColIdx]) continue;

        const name = String(row[nameColIdx]).trim();
        if (!name) continue;

        let traits = "";
        if (traitsColIdx !== -1 && row[traitsColIdx]) {
          traits = String(row[traitsColIdx]);
        } else {
          traits = row.filter((c, idx) => idx !== nameColIdx && typeof c === 'string' && c.length > 2).join(' ');
        }

        mappedStudents.push({
          id: i,
          name: name,
          traits: traits || "無",
          originalRowIndex: i,
          generatedComment: "",
          status: "idle"
        });
      }

      setOriginalAoa(data);
      setHeaderRowIndex(headerRowIdx);
      setStudents(mappedStudents);
    };
    reader.readAsBinaryString(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const generatePrompt = (student) => {
    let finalStyle = style;
    let styleDesc = "";
    if (style === "其他") {
      finalStyle = customStyle;
    } else {
      const s = STYLES.find(x => x.name === style);
      if (s && s.desc) styleDesc = `\n此風格的核心精神為：${s.desc}`;
    }

    return `你是一位專業且充滿熱忱的教育工作者。請根據學生的特質與過去評語，用【${finalStyle}】的風格寫出一段給學生的期末評語。${styleDesc}
字數限制為：${wordCount}。
特別備註：${remarks || "無"}。

【絕對要求】：無論使用何種風格，用詞必須正向、帶有期許。若有不足之處，請提供具有建設性的調適方向，絕不可出現負面批評或嚴厲責罵。

學生姓名：${student.name}
特質/過去評語：${student.traits}

請直接輸出評語內容，不要包含其他問候語或解釋。`;
  };

  const generateWithGemini = async (student, studentId) => {
    if (!apiKey.trim()) {
      alert("請先輸入有效的 Gemini API Key！");
      return false;
    }

    const prompt = generatePrompt(student);
    apiAbortControllerRef.current = new AbortController();
    const signal = apiAbortControllerRef.current.signal;

    let successText = "";
    let lastError = null;

    for (const modelItem of GEMINI_FALLBACK_CHAIN) {
      if (shouldStopRef.current) break;

      const modelName = modelItem.id;

      if (modelItem.requireConfirm) {
        const decision = await confirmModelUsage(modelName);
        if (decision === 'cancel') {
          shouldStopRef.current = true;
          return false;
        }
        if (decision === 'skip') {
          console.warn(`使用者選擇略過 ${modelName}，切換至下一個備援模型...`);
          continue;
        }
      }

      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
              }
            }),
            signal
          }
        );

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error("模型未回傳評語內容");
        }

        successText = text.trim();
        break;
      } catch (err) {
        if (err.name === 'AbortError' || shouldStopRef.current) {
          return false;
        }
        console.warn(`模型 ${modelName} 失敗，嘗試下一個備援...`, err.message);
        lastError = err;
      }
    }

    if (shouldStopRef.current) return false;

    if (successText) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, generatedComment: successText, status: "done" } : s));
      return true;
    } else {
      console.error("Gemini 備援鏈全部失敗:", lastError);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "error" } : s));
      addToast(`生成失敗：${lastError?.message || "所有備援模型皆無法回應"}`, "error");
      return false;
    }
  };

  const generateForStudent = async (studentId) => {
    if (engineMode === 'local' && !engine) {
      alert("請先載入 AI 模型！");
      return;
    }
    if (engineMode === 'api' && !apiKey.trim()) {
      alert("請先輸入有效的 Gemini API Key！");
      return;
    }
    
    if (engineMode === 'desktop') {
      if (!isDesktop || !window.electronAPI) {
        alert("桌面端 API 未就緒！");
        return;
      }
      if (!desktopStatus || desktopStatus.currentLoadedModel !== selectedDesktopModel) {
        alert("請先在上方點擊「載入離線模型」完成模型初始化！");
        return;
      }

      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "generating", generatedComment: "" } : s));
      const student = students.find(s => s.id === studentId);
      const prompt = generatePrompt(student);

      let currentText = "";
      const cleanupChunk = window.electronAPI.onChunk((chunk) => {
        if (shouldStopRef.current) return;
        currentText += chunk;
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, generatedComment: currentText } : s));
      });

      try {
        const res = await window.electronAPI.generateComment({ prompt });
        cleanupChunk();
        if (res.success) {
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "done" } : s));
        } else if (res.aborted) {
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "idle" } : s));
        } else {
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "error" } : s));
          addToast("生成失敗: " + (res.error || "未知錯誤"), "error");
        }
      } catch (err) {
        cleanupChunk();
        console.error(err);
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "error" } : s));
      }
      return;
    }

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "generating", generatedComment: "" } : s));
    const student = students.find(s => s.id === studentId);

    if (engineMode === 'api') {
      await generateWithGemini(student, studentId);
      return;
    }

    const prompt = generatePrompt(student);

    try {
      const messages = [{ role: "user", content: prompt }];
      
      const asyncChunkGenerator = await engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.7,
      });

      let currentText = "";
      for await (const chunk of asyncChunkGenerator) {
        if (shouldStopRef.current) {
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "idle" } : s));
          return;
        }
        currentText += chunk.choices[0]?.delta?.content || "";
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, generatedComment: currentText } : s));
      }
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "done" } : s));
    } catch (err) {
      console.error(err);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: "error" } : s));
    }
  };

  const generateAll = async () => {
    if (engineMode === 'desktop') {
      if (!isDesktop || !window.electronAPI) {
        alert("桌面端 API 未就緒！");
        return;
      }
      if (!desktopStatus || desktopStatus.currentLoadedModel !== selectedDesktopModel) {
        alert("請先在上方點擊「載入離線模型」完成模型初始化！");
        return;
      }
    } else if (engineMode === 'local' && !engine) {
      alert("請先載入 AI 模型！");
      return;
    } else if (engineMode === 'api' && !apiKey.trim()) {
      alert("請先輸入有效的 Gemini API Key！");
      return;
    }

    setIsGenerating(true);
    shouldStopRef.current = false;
    for (const student of students) {
      if (shouldStopRef.current) break;
      await generateForStudent(student.id);
    }
    setIsGenerating(false);
  };

  const exportExcel = () => {
    if (students.length === 0 || !originalAoa) return;
    
    const exportAoa = originalAoa.map(row => Array.isArray(row) ? [...row] : []);
    
    const targetHeaderRow = exportAoa[headerRowIndex];
    targetHeaderRow.push("AI生成評語");
    const aiCommentColIdx = targetHeaderRow.length - 1;

    students.forEach(s => {
      while (exportAoa[s.originalRowIndex].length <= aiCommentColIdx) {
        exportAoa[s.originalRowIndex].push("");
      }
      exportAoa[s.originalRowIndex][aiCommentColIdx] = s.generatedComment;
    });
    
    const ws = XLSX.utils.aoa_to_sheet(exportAoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "評語結果");
    XLSX.writeFile(wb, "學生評語生成結果.xlsx");
  };

  return (
    <div className="app-container">
      <div className="watermark top-right">網站建立自楊家驊老師</div>
      <div className="watermark bottom-right">網站建立自楊家驊老師</div>

      <header className="app-header">
        <h1><img src="./favicon.jpg" alt="logo" style={{width: '40px', height: '40px', verticalAlign: 'middle', marginRight: '10px', borderRadius: '8px'}}/>學生評語生成系統</h1>
        <p>基於 WebLLM 技術，確保您的資料 100% 在本地處理，無隱私外洩風險。</p>
        <button className="btn outline small mt-2" onClick={() => setIsLogOpen(true)}>
          <Info size={14} /> 更新紀錄 ({changelogData.length > 0 ? changelogData[0].version : 'v1.0.0'})
        </button>
      </header>

      <main className="app-main">
        {/* Model Section */}
        <section className="card">
          <div className="card-header">
            <h2>AI 模型設定</h2>
          </div>

          <div className="engine-mode-selector">
            {isDesktop && (
              <button 
                type="button"
                className={`engine-tab-btn ${engineMode === 'desktop' ? 'active' : ''}`}
                onClick={() => {
                  setEngineMode('desktop');
                  localStorage.setItem('stu_rmks_engine_mode', 'desktop');
                }}
              >
                <Cpu size={16} /> 桌面原生離線模型 (Metal / Vulkan 加速 ⚡)
              </button>
            )}
            <button 
              type="button"
              className={`engine-tab-btn ${engineMode === 'local' ? 'active' : ''}`}
              onClick={() => {
                setEngineMode('local');
                localStorage.setItem('stu_rmks_engine_mode', 'local');
              }}
            >
              <Cpu size={16} /> 瀏覽器本機離線 (WebLLM - 免費)
            </button>
            <button 
              type="button"
              className={`engine-tab-btn ${engineMode === 'api' ? 'active' : ''}`}
              onClick={() => {
                setEngineMode('api');
                localStorage.setItem('stu_rmks_engine_mode', 'api');
              }}
            >
              <Sparkles size={16} /> 雲端付費 API 模式 (Gemini - 極速備援)
            </button>
          </div>

          {engineMode === 'desktop' && (
            <div>
              <div className="model-controls">
                <div className="custom-select-wrapper" ref={desktopModelDropdownRef} style={{flex: 1}}>
                  <div className="custom-select-trigger" onClick={() => !desktopLoading && setIsDesktopModelDropdownOpen(!isDesktopModelDropdownOpen)}>
                    <span style={{fontWeight: 500}}>
                      {selectedDesktopModel === 'Llama-3.2-3B-Instruct-Q4_K_M.gguf' ? 'Llama 3.2 (3B) Instruct (Meta - 離線原生)' : 'Gemma 4 (12B) Instruct (Google - 旗艦深度)'}
                      <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
                        ({selectedDesktopModel === 'Llama-3.2-3B-Instruct-Q4_K_M.gguf' ? '2.0 GB · 極速流暢推薦' : '7.7 GB · Google 旗艦大模型'})
                      </span>
                    </span>
                    <ChevronDown size={18} color="var(--text-muted)" />
                  </div>
                  {isDesktopModelDropdownOpen && (
                    <div className="custom-select-menu" role="listbox">
                      <div 
                        className={`custom-select-option ${selectedDesktopModel === 'Llama-3.2-3B-Instruct-Q4_K_M.gguf' ? 'selected' : ''}`}
                        onClick={() => { 
                          setSelectedDesktopModel('Llama-3.2-3B-Instruct-Q4_K_M.gguf'); 
                          setIsDesktopModelDropdownOpen(false); 
                        }}
                      >
                        <div className="option-title">Llama 3.2 (3B) Instruct (Meta, 美國) - 2.0 GB</div>
                        <div className="option-desc" style={{ marginTop: '4px' }}>
                          【特點】極速流暢、記憶體佔用低。Apple Silicon M 系列或一般 Windows 電腦均可秒速響應，日常評語最佳首選。
                        </div>
                      </div>
                      <div 
                        className={`custom-select-option ${selectedDesktopModel === 'gemma-4-12B-it-Q4_K_M.gguf' ? 'selected' : ''}`}
                        onClick={() => { 
                          setSelectedDesktopModel('gemma-4-12B-it-Q4_K_M.gguf'); 
                          setIsDesktopModelDropdownOpen(false); 
                        }}
                      >
                        <div className="option-title">Gemma 4 (12B) Instruct (Google, 美國) - 7.7 GB</div>
                        <div className="option-desc" style={{ marginTop: '4px' }}>
                          【特點】Google DeepMind 最新世代旗艦開源模型，具備 256K 超長上下文與強大推理文采，詞藻細緻典雅，適合深度長篇評語。需 10GB 以上記憶體。
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  className={`btn primary ${desktopStatus?.currentLoadedModel === selectedDesktopModel ? 'success' : ''}`}
                  onClick={handleLoadDesktopModel} 
                  disabled={desktopLoading}
                >
                  {desktopStatus?.currentLoadedModel === selectedDesktopModel ? (
                    <><CheckCircle2 size={16}/> 模型已就緒 ({desktopStatus?.gpuEngine?.toUpperCase() || 'GPU'} 加速)</>
                  ) : desktopLoading ? (
                    <><Loader2 className="spin" size={16}/> 載入中...</>
                  ) : (
                    '載入離線模型'
                  )}
                </button>
              </div>

              <div className="alert info" style={{ marginTop: '1rem' }}>
                <CheckCircle2 size={16} />
                <span>
                  <b>桌面原生硬體加速 ({desktopStatus?.gpuEngine === 'metal' ? 'Apple Silicon Metal ⚡' : (desktopStatus?.gpuEngine || 'GPU').toUpperCase()})</b>：
                  模型直接於本機硬體執行，免聯網、零 API 費用，學生資料 100% 留存在您的電腦中。
                </span>
              </div>
            </div>
          )}

          {engineMode === 'local' && (
            <div>
              <div className="model-controls">
                <div className="custom-select-wrapper" ref={modelDropdownRef} style={{flex: 1}}>
                  <div className="custom-select-trigger" onClick={() => !engine && !modelLoading && setIsModelDropdownOpen(!isModelDropdownOpen)}>
                    <span style={{fontWeight: 500}}>
                      {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
                      <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
                        ({AVAILABLE_MODELS.find(m => m.id === selectedModel)?.vendor} · {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.country} · {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.size})
                      </span>
                    </span>
                    <ChevronDown size={18} color="var(--text-muted)" />
                  </div>
                  {isModelDropdownOpen && (
                    <div className="custom-select-menu" role="listbox" id="style-options">
                      {AVAILABLE_MODELS.map(m => (
                        <div 
                          key={m.id} 
                          className={`custom-select-option ${selectedModel === m.id ? 'selected' : ''}`}
                          onClick={() => { setSelectedModel(m.id); setIsModelDropdownOpen(false); }}
                        >
                          <div className="option-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <strong>{m.name}</strong>
                            <span style={{ fontSize: '0.75rem', padding: '1px 6px', background: '#E0E7FF', color: '#4338CA', borderRadius: '4px' }}>
                              🏢 {m.vendor} ({m.country})
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '1px 6px', background: '#F1F5F9', color: '#475569', borderRadius: '4px' }}>
                              ⚖️ {m.size}
                            </span>
                          </div>
                          <div className="option-desc" style={{ marginTop: '6px', fontSize: '0.8rem', lineHeight: '1.5' }}>
                            <div><strong style={{ color: '#059669' }}>✨ 特點：</strong>{m.features}</div>
                            <div><strong style={{ color: '#0284C7' }}>💡 建議：</strong>{m.advice}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  className={`btn primary ${engine ? 'success' : ''}`}
                  onClick={handleInitModel} 
                  disabled={engine || modelLoading}
                >
                  {engine ? <><CheckCircle2 size={16}/> 模型已就緒</> : modelLoading ? <><Loader2 className="spin" size={16}/> 載入中...</> : '載入模型'}
                </button>
              </div>

              {/* 目前選用模型之詳細規格卡片 */}
              {(() => {
                const cur = AVAILABLE_MODELS.find(m => m.id === selectedModel);
                if (!cur) return null;
                return (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.35rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <span>🏢 廠商：{cur.vendor}</span>
                      <span>🌍 國家：{cur.country}</span>
                      <span>⚖️ 參數大小：{cur.size}</span>
                    </div>
                    <div style={{ color: '#059669', marginBottom: '0.2rem' }}><strong>✨ 核心特點：</strong>{cur.features}</div>
                    <div style={{ color: '#0284C7' }}><strong>💡 設備與使用建議：</strong>{cur.advice}</div>
                  </div>
                );
              })()}

              {loadProgress && !engine && (
                <div className="progress-text">
                  <div style={{ marginBottom: '8px' }}>{loadProgress}</div>
                  {loadProgressObj && loadProgressObj.progress !== undefined && (
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${Math.round(loadProgressObj.progress * 100)}%` }}></div>
                    </div>
                  )}
                </div>
              )}
              <div className="alert info">
                <AlertCircle size={16}/>
                初次載入需下載數GB模型檔至瀏覽器快取，請耐心等候。建議使用具備獨立顯卡或大記憶體之設備。
              </div>
            </div>
          )}

          {engineMode === 'api' && (
            <div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Gemini API Key</span>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline' }}
                  >
                    取得免費 / 付費 API Key ↗
                  </a>
                </label>
                <div className="api-key-wrapper">
                  <input 
                    type={showApiKey ? "text" : "password"} 
                    placeholder="輸入您的 Google Gemini API Key (AIzaSy...)" 
                    value={apiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setApiKey(val);
                      localStorage.setItem('stu_rmks_gemini_api_key', val);
                    }}
                  />
                  <button 
                    type="button" 
                    className="toggle-visibility-btn" 
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? "隱藏" : "顯示"}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="fallback-chain-container">
                <div className="fallback-chain-title">
                  <Sparkles size={15} color="var(--primary)" /> 目前完整的 AI 模型使用順序（自動嘗試與備援）：
                </div>
                <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th width="10%">順位</th>
                        <th width="28%">模型名稱</th>
                        <th width="27%">定位與說明</th>
                        <th width="35%">調用行為</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GEMINI_FALLBACK_CHAIN.map((item, idx) => (
                        <tr key={item.id} style={item.id === 'gemini-4-argon' ? { backgroundColor: '#F5F3FF' } : {}}>
                          <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{idx + 1}</td>
                          <td>
                            <code style={{ 
                              backgroundColor: item.id === 'gemini-4-argon' ? '#EDE9FE' : '#F2EFE9', 
                              color: item.id === 'gemini-4-argon' ? '#6D28D9' : '#854D0E',
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              fontWeight: item.id === 'gemini-4-argon' ? 'bold' : 'normal'
                            }}>
                              {item.name}
                            </code>
                          </td>
                          <td style={{ fontWeight: item.id === 'gemini-4-argon' ? 'bold' : 'normal' }}>{item.role}</td>
                          <td>
                            {item.id === 'gemini-4-argon' ? (
                              <span style={{ color: '#7C3AED', fontWeight: 'bold' }}>{item.behavior}</span>
                            ) : (
                              item.behavior
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 模型費用與優劣分析備註區塊 */}
                <div style={{ marginTop: '0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.82rem', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
                    <Info size={15} color="#4F46E5" />
                    <span>各模型費用與優劣分析備註（參考 Google 官方定價標準）</span>
                  </div>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {GEMINI_FALLBACK_CHAIN.map((item, idx) => (
                      <div key={item.id} style={{ 
                        padding: '0.5rem 0.75rem', 
                        background: item.id === 'gemini-4-argon' ? '#FAF5FF' : '#FFFFFF', 
                        border: `1px solid ${item.id === 'gemini-4-argon' ? '#DDD6FE' : '#F1F5F9'}`,
                        borderRadius: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: item.id === 'gemini-4-argon' ? '#7C3AED' : '#0F172A' }}>
                            {idx + 1}. {item.name} ({item.role})
                          </span>
                          <span style={{ fontSize: '0.75rem', background: item.id === 'gemini-4-argon' ? '#EDE9FE' : '#F1F5F9', color: item.id === 'gemini-4-argon' ? '#6D28D9' : '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            💰 {item.pricing}
                          </span>
                        </div>
                        <div style={{ color: '#059669' }}><strong>👍 優點：</strong>{item.pros}</div>
                        <div style={{ color: '#B45309' }}><strong>⚠️ 限制：</strong>{item.cons}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="alert info" style={{ marginTop: '1rem' }}>
                <CheckCircle2 size={16} />
                {apiKey.trim() ? (
                  <span>API Key 已設定完成！可直接於下方點擊「全部生成」，極速調用雲端模型，無需預載數 GB 檔案。</span>
                ) : (
                  <span>請先於上方輸入您的 Gemini API Key 即可啟動雲端極速模式。Key 僅儲存於您的本機瀏覽器。</span>
                )}
              </div>
            </div>
          )}

          {students.length > 0 && (
            <div className="actions-footer">
              {!isGenerating ? (
                <button className="btn primary" onClick={generateAll} disabled={engineMode === 'desktop' ? (desktopStatus?.currentLoadedModel !== selectedDesktopModel) : engineMode === 'local' ? !engine : !apiKey.trim()}>
                  <Play size={16} /> 全部生成
                </button>
              ) : (
                <button className="btn danger" onClick={stopGeneration}>
                  <StopCircle size={16} /> 停止生成
                </button>
              )}
              <button className="btn outline" onClick={exportExcel} disabled={students.length === 0 || students.every(s => s.status !== 'done')}>
                <Download size={16} /> 匯出 Excel
              </button>
            </div>
          )}
        </section>

        {/* Upload & Settings Section */}
        <div className="grid-2">
          <section className="card">
            <div className="card-header">
              <h2>上傳學生名單</h2>
            </div>
            <div 
              className={`upload-area ${isDragging ? 'drag-active' : ''}`} 
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload size={32} />
              <p>點擊或拖曳 Excel 檔案上傳</p>
              <span>(.xlsx / .csv)，需包含「姓名」與「特質」欄位</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }} 
              />
            </div>
            {students.length > 0 && (
              <p className="success-text">✅ 成功載入 {students.length} 筆資料</p>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <h2>生成條件設定</h2>
            </div>
            <div className="form-group">
              <label>評語風格：</label>
              
              <div className="custom-select-wrapper" ref={dropdownRef}>
                <div 
                  className="custom-select-trigger" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsDropdownOpen(!isDropdownOpen);
                    } else if (e.key === 'Escape') {
                      setIsDropdownOpen(false);
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (!isDropdownOpen) {
                        setIsDropdownOpen(true);
                        return;
                      }
                      const currentIndex = STYLES.findIndex(s => s.name === style);
                      let nextIndex = currentIndex;
                      if (e.key === 'ArrowDown') {
                        nextIndex = (currentIndex + 1) % STYLES.length;
                      } else {
                        nextIndex = (currentIndex - 1 + STYLES.length) % STYLES.length;
                      }
                      setStyle(STYLES[nextIndex].name);
                    }
                  }}
                  tabIndex={0}
                  role="combobox"
                  aria-expanded={isDropdownOpen}
                  aria-controls="style-options"
                >
                  <span>{style}</span>
                  <ChevronDown size={16} />
                </div>
                
                {isDropdownOpen && (
                  <div className="custom-select-menu" role="listbox" id="style-options">
                    {STYLES.map(s => (
                      <div 
                        key={s.name} 
                        className={`custom-select-option ${style === s.name ? 'selected' : ''}`}
                        onClick={() => {
                          setStyle(s.name);
                          setIsDropdownOpen(false);
                        }}
                        role="option"
                        aria-selected={style === s.name}
                      >
                        <div className="option-title">{s.name}</div>
                        {s.desc && <div className="option-desc">{s.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {style !== "其他" && STYLES.find(s => s.name === style)?.desc && (
                <div className="style-description-box">
                  <Info size={16} className="icon" />
                  <span>{STYLES.find(s => s.name === style)?.desc}</span>
                </div>
              )}
              {style === "其他" && (
                <input type="text" placeholder="輸入自訂風格..." value={customStyle} onChange={e => setCustomStyle(e.target.value)} className="mt-2" />
              )}
            </div>
            <div className="form-group">
              <label>字數限制：</label>
              <select value={wordCount} onChange={e => setWordCount(e.target.value)}>
                {WORD_COUNTS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>全班共同備註 / 提醒事項：</label>
              <textarea 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)}
                placeholder="例如：這學期班上共同表現活潑，請加入鼓勵他們多閱讀的建議..."
                rows={3}
              ></textarea>
            </div>
          </section>
        </div>

        {/* Data Table Section */}
        <section className="card full-width">
          <div className="card-header">
            <h2>預覽與生成</h2>
            
          </div>
          
          {students.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>尚未載入學生資料</h3>
              <p>請先在上方上傳 Excel 檔案</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th width="10%">姓名</th>
                    <th width="35%">特質/過往評語</th>
                    <th width="45%">AI 生成評語</th>
                    <th width="10%">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td><div className="scroll-cell">{student.traits}</div></td>
                      <td>
                        <div className={`scroll-cell generated ${student.status}`}>
                          {student.generatedComment || (student.status === 'idle' ? <span className="text-muted">等待生成...</span> : '')}
                        </div>
                        {student.status === 'done' && (
                          <button className="copy-btn" onClick={() => handleCopy(student.generatedComment)} title="複製評語">
                            <Copy size={14} /> 複製
                          </button>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn small" 
                          onClick={() => generateForStudent(student.id)}
                          disabled={student.status === 'generating' || (engineMode === 'desktop' ? (desktopStatus?.currentLoadedModel !== selectedDesktopModel) : engineMode === 'local' ? !engine : !apiKey.trim())}
                        >
                          {student.status === 'generating' ? <Loader2 className="spin" size={14}/> : '生成'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {students.length > 0 && (
            <div className="actions-footer">
              {!isGenerating ? (
                <button className="btn primary" onClick={generateAll} disabled={engineMode === 'desktop' ? (desktopStatus?.currentLoadedModel !== selectedDesktopModel) : engineMode === 'local' ? !engine : !apiKey.trim()}>
                  <Play size={16} /> 全部生成
                </button>
              ) : (
                <button className="btn danger" onClick={stopGeneration}>
                  <StopCircle size={16} /> 停止生成
                </button>
              )}
              <button className="btn outline" onClick={exportExcel} disabled={students.length === 0 || students.every(s => s.status !== 'done')}>
                <Download size={16} /> 匯出 Excel
              </button>
            </div>
          )}
        </section>
      </main>


      {/* Model Confirmation Modal */}
      {modelConfirmDialog && (
        <div 
          className="confirm-modal-overlay" 
          onClick={() => {
            modelConfirmDialog.resolve('cancel');
            setModelConfirmDialog(null);
          }}
        >
          <div 
            className="confirm-modal-card" 
            onClick={e => e.stopPropagation()}
          >
            <div className="confirm-modal-icon">
              <Sparkles size={28} />
            </div>

            <h3 className="confirm-modal-title">調用模型確認</h3>

            <div className="confirm-modal-badge-box">
              <div className="confirm-modal-badge-label">
                <span>目標備援模型</span>
                <span className="confirm-model-tag">
                  {modelConfirmDialog.modelName}
                </span>
              </div>
              <p className="confirm-modal-desc">
                前序快速模型暫無法回應，系統準備切換至最新高階備援模型 <b>{modelConfirmDialog.modelName}</b> 進行評語生成。
              </p>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              此模型為最新的旗艦級模型，請問是否同意調用？
            </p>

            <div className="confirm-modal-actions">
              <button 
                onClick={() => {
                  const res = modelConfirmDialog.resolve;
                  setModelConfirmDialog(null);
                  res('confirm');
                }}
                className="btn primary"
                style={{ width: '100%' }}
              >
                同意並調用 {modelConfirmDialog.modelName}
              </button>

              <button 
                onClick={() => {
                  const res = modelConfirmDialog.resolve;
                  setModelConfirmDialog(null);
                  res('skip');
                }}
                className="btn outline"
                style={{ width: '100%' }}
              >
                略過此模型，嘗試下一個備援
              </button>

              <button 
                onClick={() => {
                  const res = modelConfirmDialog.resolve;
                  setModelConfirmDialog(null);
                  res('cancel');
                }}
                className="btn outline small"
                style={{ width: '100%', border: 'none', color: 'var(--text-muted)' }}
              >
                取消本次生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Log Modal */}
      {isLogOpen && (
        <div className="modal-overlay" onClick={() => setIsLogOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>系統更新紀錄</h2>
              <button className="close-btn" onClick={() => setIsLogOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {changelogData.map(log => (
                <div key={log.hash} className="log-entry">
                  <div className="log-version-date">
                    <span className="log-version">{log.version}</span>
                    <span className="log-date">{log.date}</span>
                  </div>
                  <h3 className="log-title">{log.title}</h3>
                  {log.details && <p className="log-details">{log.details}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
