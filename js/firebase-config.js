// ============================================================
// هواتف ماركت - إعدادات Firebase
// ============================================================

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCyZ5mBrgTyGcGtOxkCd9X9ehMhPZ4vwwM",
    authDomain: "phones-market.firebaseapp.com",
    databaseURL: "https://phones-market-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "phones-market",
    storageBucket: "phones-market.firebasestorage.app",
    messagingSenderId: "1059312114207",
    appId: "1:1059312114207:web:df55121ec1e716e038532a",
    measurementId: "G-SJSS09QPWT"
};

// تهيئة Firebase
firebase.initializeApp(FIREBASE_CONFIG);

// مراجع Firebase
const db = firebase.database();
const storage = firebase.storage();
const auth = firebase.auth();

// مراجع قاعدة البيانات
const DB_REF = {
    products: 'products',
    orders: 'orders',
    settings: 'settings',
    shippingRates: 'shippingRates',
    stats: 'stats'
};

// ============================================================
// دوال مساعدة عامة
// ============================================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
    return amount.toLocaleString('ar-DZ') + ' DA';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toastMsg');
    if (!toast) {
        const newToast = document.createElement('div');
        newToast.id = 'toastMsg';
        newToast.className = 'toast';
        document.body.appendChild(newToast);
    }
    const toastEl = document.getElementById('toastMsg');
    toastEl.innerText = message;
    toastEl.className = `toast show ${type}`;
    setTimeout(() => {
        toastEl.className = 'toast';
    }, 3000);
}

async function isAdmin() {
    const user = auth.currentUser;
    if (!user) return false;
    const token = await user.getIdTokenResult();
    return token.claims.admin === true || user.email === 'admin@phonesmarket.dz';
}

// ============================================================
// قائمة الولايات (58 ولاية)
// ============================================================

const WILAYAS = [
    {code:"01",name:"أدرار",home:900,office:700},{code:"02",name:"الشلف",home:600,office:400},
    {code:"03",name:"الأغواط",home:600,office:400},{code:"04",name:"أم البواقي",home:550,office:350},
    {code:"05",name:"باتنة",home:550,office:350},{code:"06",name:"بجاية",home:550,office:350},
    {code:"07",name:"بسكرة",home:600,office:400},{code:"08",name:"بشار",home:800,office:600},
    {code:"09",name:"البليدة",home:450,office:250},{code:"10",name:"البويرة",home:500,office:300},
    {code:"11",name:"تمنراست",home:1000,office:800},{code:"12",name:"تبسة",home:600,office:400},
    {code:"13",name:"تلمسان",home:600,office:400},{code:"14",name:"تيارت",home:600,office:400},
    {code:"15",name:"تيزي وزو",home:500,office:300},{code:"16",name:"الجزائر العاصمة",home:400,office:200},
    {code:"17",name:"الجلفة",home:600,office:400},{code:"18",name:"جيجل",home:550,office:350},
    {code:"19",name:"سطيف",home:500,office:300},{code:"20",name:"سعيدة",home:600,office:400},
    {code:"21",name:"سكيكدة",home:550,office:350},{code:"22",name:"سيدي بلعباس",home:600,office:400},
    {code:"23",name:"عنابة",home:550,office:350},{code:"24",name:"قالمة",home:550,office:350},
    {code:"25",name:"قسنطينة",home:500,office:300},{code:"26",name:"المدية",home:550,office:350},
    {code:"27",name:"مستغانم",home:600,office:400},{code:"28",name:"المسيلة",home:550,office:350},
    {code:"29",name:"معسكر",home:600,office:400},{code:"30",name:"ورقلة",home:700,office:500},
    {code:"31",name:"وهران",home:550,office:350},{code:"32",name:"البيض",home:700,office:500},
    {code:"33",name:"إليزي",home:1000,office:800},{code:"34",name:"برج بوعريريج",home:500,office:300},
    {code:"35",name:"بومرداس",home:450,office:250},{code:"36",name:"الطارف",home:600,office:400},
    {code:"37",name:"تندوف",home:1000,office:800},{code:"38",name:"تسمسيلت",home:600,office:400},
    {code:"39",name:"الوادي",home:650,office:450},{code:"40",name:"خنشلة",home:600,office:400},
    {code:"41",name:"سوق أهراس",home:600,office:400},{code:"42",name:"تيبازة",home:500,office:300},
    {code:"43",name:"ميلة",home:550,office:350},{code:"44",name:"عين الدفلى",home:550,office:350},
    {code:"45",name:"النعامة",home:700,office:500},{code:"46",name:"عين تموشنت",home:600,office:400},
    {code:"47",name:"غرداية",home:650,office:450},{code:"48",name:"غليزان",home:600,office:400},
    {code:"49",name:"تيميمون",home:900,office:700},{code:"50",name:"برج باجي مختار",home:1100,office:900},
    {code:"51",name:"أولاد جلال",home:650,office:450},{code:"52",name:"بني عباس",home:850,office:650},
    {code:"53",name:"عين صالح",home:950,office:750},{code:"54",name:"عين قزام",home:1100,office:900},
    {code:"55",name:"تقرت",home:700,office:500},{code:"56",name:"جانت",home:1100,office:900},
    {code:"57",name:"المنيعة",home:750,office:550},{code:"58",name:"إن قزام",home:1100,office:900}
];

// ============================================================
// خريطة الألوان
// ============================================================

const COLOR_HEX_MAP = {
    "أسود":"#1a1a1a","أبيض":"#f5f5f5","أزرق":"#3b82f6","أحمر":"#ef4444",
    "أخضر":"#10b981","ذهبي":"#f5b041","فضي":"#c0c0c0","رمادي":"#6b7280",
    "بنفسجي":"#8b5cf6","وردي ذهبي":"#e8b4b8","تيتانيوم":"#878681",
    "تيتانيوم أسود":"#2c2c2c","تيتانيوم أزرق":"#394867","تيتانيوم أبيض":"#e0e0e0",
    "كحلي":"#1e3a5f","أزرق فاتح":"#7dd3fc","أصفر":"#fbbf24","برتقالي":"#fb923c",
    "أزرق داكن":"#1e40af","Midnight":"#0a0e1a","Starlight":"#e8e4d8",
    "Natural Titanium":"#878681","Blue Titanium":"#394867","Desert Titanium":"#c8a882",
    "Phantom Black":"#1a1a1a","Phantom White":"#f5f5f5","Graphite":"#4a4a4a",
    "Cream":"#fffdd0","Lavender":"#b19cd9","Mint":"#98ff98","Sage":"#9caf88",
    "Sky Blue":"#87ceeb","Cobalt":"#0047ab","Titanium Gray":"#878681",
    "تيتانيوم رمادي":"#878681","تيتانيوم بنفسجي":"#6b4e7d","تيتانيوم أصفر":"#c8a824","وردي":"#f472b6"
};

// تصدير للاستخدام العام
window.CONFIG = { FIREBASE_CONFIG, DB_REF, WILAYAS, COLOR_HEX_MAP };
window.db = db;
window.storage = storage;
window.auth = auth;
window.generateId = generateId;
window.formatCurrency = formatCurrency;
window.showToast = showToast;
window.isAdmin = isAdmin;
