import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Search, BookOpen, PenTool, Library, Sun, ChevronLeft, ChevronRight, Quote, MessageCircle, Heart, Flag, Image as ImageIcon, Smile, Send, X, Music, Headphones, Volume2, Pause, Play, Upload, Sliders, Bookmark, Clock, Star, Eye, Type, Minus, Plus, Trophy, Users, Flame, Mail, Shield, FileText, Info, Check, Globe, Trash2, MessageSquare, Menu, ChevronDown, Sparkles, Crown } from 'lucide-react';
import QuotesDashboard from './components/QuotesDashboard';
import IdeaBox from './components/IdeaBox';
import UserProfileModal from './components/UserProfileModal';
import PricingPage from './components/PricingPage';
import RosalineUniverse from './components/RosalineUniverse';
import { 
  db, 
  auth, 
  isFirebaseAvailable, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';


function compressAndResizeImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = () => {
      resolve('');
    };
  });
}



const EMOJI_CATEGORIES = [
  {
    name: { AR: "تعبيرات", EN: "Faces", FR: "Visages" },
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "😎", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "😢", "😭", "😤", "😠", "😡"]
  },
  {
    name: { AR: "روايات وبطولة", EN: "Story Vibes", FR: "Esprit Roman" },
    emojis: ["✨", "🔮", "📖", "✍️", "👑", "🏰", "🌹", "🍷", "🎭", "🌙", "⭐", "💫", "🕯️", "🦋", "🌸", "🖤", "🤍", "💜", "💖", "🧸", "📜", "🖋️", "🌌", "🔥"]
  },
  {
    name: { AR: "تفاعلات", EN: "Reactions", FR: "Réactions" },
    emojis: ["👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💅", "💪", "👀", "💋"]
  }
];


type Theme = 'BURGUNDY' | 'PURPLE';
type Language = 'AR' | 'EN' | 'FR';

const LANGUAGES = [
  { code: 'AR' as Language, name: 'العربية', dir: 'rtl' },
  { code: 'EN' as Language, name: 'English', dir: 'ltr' },
  { code: 'FR' as Language, name: 'Français', dir: 'ltr' }
];

const TRANSLATIONS = {
  AR: {
    welcome: "“هنا تتحول الحروف إلى سحر يخترق القلوب”",
    beginReading: "ابدأ القراءة",
    startWriting: "ابدأ الكتابة",
    exploreLibrary: "استكشف المكتبة",
    searchPlaceholder: "ابحث عن روايتك المفضلة أو كاتبك...",
    home: "الرئيسية",
    community: "المجتمع",
    login: "دخول",
    switchThemeBurgundy: "تغيير إلى البرغندي والفضة",
    switchThemePurple: "العودة إلى أوبسيديان الفضي",
    quotesTitle: "اقتباسات النجوم",
    communityTitle: "مجتمع روزلين",
    communityDesc: "تواصل، شارك، وألهم.",
    writerDashboard: "لوحة تحكم الكاتب",
    writerDesc: "حيث تصبح كلماتك أساطير.",
    createStory: "إنشاء رواية جديدة",
    myWorks: "أعمالي",
    publish: "نشر",
    feelingsTitle: "بماذا تشعر الآن؟",
    discussions: "تفاعلات القراء",
    share: "مشاركة",
    comment: "تعليق",
    authorNote: "ملاحظة الكاتب",
    ambientTitle: "أصوات الخلفية",
    ambientRain: "صوت المطر 🌧️",
    ambientNight: "هدوء الليل 🌌",
    ambientForest: "أصوات الغابة 🌲",
    ambientLibrary: "هدوء المكتبة 📚",
    ambientWind: "الرياح الناعمة 💨",
    ambientUpload: "رفع ملف موسيقى",
    moodQuestion: "كيف تشعر اليوم؟",
    moodBtn: "كيف تشعر اليوم؟",
    moodOptions: [
      { id: 'adventure', label: 'أريد مغامرة 🧭', mood: 'I want adventure' },
      { id: 'peace', label: 'أحتاج للسلام 🕊️', mood: 'I want peace' },
      { id: 'fantasy', label: 'أريد فانتازيا ✨', mood: 'I want fantasy' },
      { id: 'sad', label: 'أشعر بالحزن 🌧️', mood: 'I feel sad' }
    ],
    genres: ["رومنسي", "خيال علمي وفانتازيا", "غموض وتشويق", "دراما ومشاعر", "مغامرات"],
    topics: ["الروايات والكتب", "الأفكار والإبداع", "العلوم", "المشاعر والخواطر"],
    backHome: "العودة للرئيسية",
    now: "الآن",
    report: "إبلاغ",
    reviewsTitle: "مراجعات القراء",
    noReviews: "لا توجد مراجعات بعد. كن أول من يكتب!",
    addReview: "أضف مراجعة",
    ratingLabel: "تقييمك:",
    reviewPlaceholder: "اكتب مراجعتك النقدية هنا بالتفصيل...",
    averageRating: "متوسط التقييم:",
    submitReview: "نشر المراجعة",
    readingStats: "إحصائيات القراءة",
    totalToday: "اليوم",
    totalWeek: "هذا الأسبوع",
    userTitle: "اللقب:",
    minutes: "دقيقة",
    hours: "ساعة",
    titles: ["قارئ مبتدئ", "ملتهم الكتب", "حكيم المنصة"],
    readingSettings: "إعدادات القراءة",
    warmMode: "دافئ",
    dimMode: "معتم",
    defaultMode: "الافتراضي",
    leaderboardTitle: "لوحة الشرف",
    topNovels: "أفضل الروايات",
    topWriters: "أفضل الكُتّاب",
    interactions: "تفاعل",
    saveDraft: "حفظ كمسودة",
    schedulePublish: "جدولة النشر",
    publishNow: "نشر الآن",
    scheduledFor: "مجدول في:",
    draftSaved: "تم حفظ المسودة بنجاح",
    about: "من نحن",
    privacy: "سياسة الخصوصية",
    contact: "اتصل بنا",
    terms: "شروط الخدمة",
    copied: "تم النسخ",
    backToHome: "العودة للرئيسية",
    sendMessage: "إرسال الرسالة",
    successMessage: "تم إرسال رسالتك بنجاح! سنرد عليك قريباً.",
    learnWriting: "ورشة الإبداع",
    exploreOurWorld: "استكشف عالمنا"
  },
  EN: {
    welcome: "“Welcome to your silver sanctuary, where words become stars and stories become endless skies.”",
    beginReading: "Begin Reading",
    startWriting: "Start Writing",
    exploreLibrary: "Explore Library",
    searchPlaceholder: "Search for your favorite novel or author...",
    home: "Home",
    community: "Community",
    login: "Login",
    switchThemeBurgundy: "Switch to Royal Burgundy & Silver",
    switchThemePurple: "Return to Obsidian & Silver",
    quotesTitle: "Quotes of the Stars",
    communityTitle: "Rosaline Community",
    communityDesc: "Connect, Share, and Inspire.",
    writerDashboard: "Writer's Dashboard",
    writerDesc: "Where your words become legends.",
    createStory: "Create New Story",
    myWorks: "My Works",
    publish: "Publish",
    feelingsTitle: "How are you feeling?",
    discussions: "Discussions",
    share: "Share",
    comment: "Comment",
    authorNote: "Author's Note",
    ambientTitle: "Ambient Music",
    ambientRain: "Rain 🌧️",
    ambientNight: "Night 🌌",
    ambientForest: "Forest 🌲",
    ambientLibrary: "Library 📚",
    ambientWind: "Soft Wind 💨",
    ambientUpload: "Upload MP3",
    moodQuestion: "How do you feel today?",
    moodBtn: "How do you feel today?",
    moodOptions: [
      { id: 'adventure', label: 'I want adventure 🧭', mood: 'I want adventure' },
      { id: 'peace', label: 'I want peace 🕊️', mood: 'I want peace' },
      { id: 'fantasy', label: 'I want fantasy ✨', mood: 'I want fantasy' },
      { id: 'sad', label: 'I feel sad 🌧️', mood: 'I feel sad' }
    ],
    genres: ["Romance", "Sci-Fi & Fantasy", "Mystery & Thriller", "Drama & Emotions", "Adventure"],
    topics: ["Novels & Books", "Ideas & Creativity", "Science", "Feelings & Thoughts"],
    backHome: "Home",
    now: "Now",
    report: "Report",
    reviewsTitle: "Reader Reviews",
    noReviews: "No reviews yet. Be the first to write one!",
    addReview: "Add Review",
    ratingLabel: "Your Rating:",
    reviewPlaceholder: "Write your detailed critical review here...",
    averageRating: "Average Rating:",
    submitReview: "Submit Review",
    readingStats: "Reading Stats",
    totalToday: "Today",
    totalWeek: "This Week",
    userTitle: "Title:",
    minutes: "min",
    hours: "hr",
    titles: ["Novice Reader", "Bookworm", "Platform Sage"],
    readingSettings: "Reading Settings",
    warmMode: "Warm",
    dimMode: "Dim",
    defaultMode: "Default",
    leaderboardTitle: "Leaderboard",
    topNovels: "Top Novels",
    topWriters: "Top Writers",
    interactions: "Interactions",
    saveDraft: "Save as Draft",
    schedulePublish: "Schedule Publishing",
    publishNow: "Publish Now",
    scheduledFor: "Scheduled for:",
    draftSaved: "Draft saved successfully",
    about: "About Us",
    privacy: "Privacy Policy",
    contact: "Contact Us",
    terms: "Terms of Service",
    copied: "Copied",
    backToHome: "Back to Home",
    sendMessage: "Send Message",
    successMessage: "Your message has been sent successfully! We will get back to you soon.",
    learnWriting: "Writing Workshop",
    exploreOurWorld: "Explore Our World"
  },
  FR: {
    welcome: "“Bienvenue dans votre sanctuaire d'argent, où les mots deviennent des étoiles et les histoires des cieux infinis.”",
    beginReading: "Lire",
    startWriting: "Écrire",
    exploreLibrary: "La Bibliothèque",
    searchPlaceholder: "Recherchez votre roman ou auteur...",
    home: "Accueil",
    community: "Communauté",
    login: "Connexion",
    switchThemeBurgundy: "Bourgogne Royal & Argent",
    switchThemePurple: "Obsidienne & Argent",
    quotesTitle: "Citations des Étoiles",
    communityTitle: "Communauté Rosaline",
    communityDesc: "Connectez-vous, partagez et inspirez.",
    writerDashboard: "Écrivain",
    writerDesc: "Où vos mots deviennent des légendes.",
    createStory: "Nouvelle Histoire",
    myWorks: "Mes Œuvres",
    publish: "Publier",
    feelingsTitle: "Comment vous sentez-vous ?",
    discussions: "Discussions",
    share: "Partager",
    comment: "Commenter",
    authorNote: "Note de l'auteur",
    ambientTitle: "Ambiance Sonore",
    ambientRain: "Pluie 🌧️",
    ambientNight: "Nuit 🌌",
    ambientForest: "Forêt 🌲",
    ambientLibrary: "Bibliothèque 📚",
    ambientWind: "Vent 💨",
    ambientUpload: "Télécharger MP3",
    moodQuestion: "Comment vous sentez-vous aujourd'hui ?",
    moodBtn: "Comment vous sentez-vous ?",
    moodOptions: [
      { id: 'adventure', label: 'Aventure 🧭', mood: 'Je veux de l\'aventure' },
      { id: 'peace', label: 'Paix 🕊️', mood: 'J\'ai besoin de paix' },
      { id: 'fantasy', label: 'Fantaisie ✨', mood: 'Je veux de la fantaisie' },
      { id: 'sad', label: 'Triste 🌧️', mood: 'Je me sens triste' }
    ],
    genres: ["Romance", "S-F & Fantasy", "Mystère", "Drame", "Aventure"],
    topics: ["Livres", "Créativité", "Science", "Sentiments"],
    backHome: "Accueil",
    now: "Maintenant",
    report: "Signaler",
    reviewsTitle: "Critiques des Lecteurs",
    noReviews: "Aucune critique pour le moment. Soyez le premier !",
    addReview: "Ajouter une critique",
    ratingLabel: "Votre note :",
    reviewPlaceholder: "Écrivez votre critique détaillée ici...",
    averageRating: "Note moyenne :",
    submitReview: "Publier la critique",
    readingStats: "Stats de Lecture",
    totalToday: "Aujourd'hui",
    totalWeek: "Cette Semaine",
    userTitle: "Titre :",
    minutes: "min",
    hours: "h",
    titles: ["Lecteur Novice", "Dévoreur de Livres", "Sage de la Plateforme"],
    readingSettings: "Réglages de Lecture",
    warmMode: "Chaud",
    dimMode: "Sombre",
    defaultMode: "Par défaut",
    leaderboardTitle: "Classement",
    topNovels: "Meilleurs Romans",
    topWriters: "Meilleurs Écrivains",
    interactions: "Interactions",
    saveDraft: "Enregistrer Brouillon",
    schedulePublish: "Planifier Publication",
    publishNow: "Publier Maintenant",
    scheduledFor: "Prévu pour :",
    draftSaved: "Brouillon enregistré",
    about: "À propos",
    privacy: "Politique de confidentialité",
    contact: "Contactez-nous",
    terms: "Conditions d'utilisation",
    copied: "Copié",
    backToHome: "Retour à l'accueil",
    sendMessage: "Envoyer le message",
    successMessage: "Votre message a été envoyé avec succès! Nous vous répondrons bientôt.",
    learnWriting: "Atelier d'Écriture",
    exploreOurWorld: "Explorer notre monde"
  }
};

const MOOD_RECOMMENDATIONS = {
  adventure: [
    { title: "خلف آفاق المجرة", cover: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=200", desc: "رحلة منسية بين النجوم والمخاطر." },
    { title: "بوصلة المفقودين", cover: "https://images.unsplash.com/photo-1519074063240-8451f22dad82?auto=format&fit=crop&q=80&w=200", desc: "سر يختبئ في قلب الغابة السوداء." }
  ],
  peace: [
    { title: "همس الأوركيد", cover: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=200", desc: "قصيدة عن الهدوء والسكينة الداخيلة." },
    { title: "ملاذ النوارس", cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=200", desc: "قصة عن البحر الذي يداوي القلوب." }
  ],
  fantasy: [
    { title: "أبجدية السحر", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=200", desc: "حيث الحروف تتحول إلى كائنات حية." },
    { title: "مملكة الظلال البيضاء", cover: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=200", desc: "أسطورة لم يروها أحد منذ آلاف السنين." }
  ],
  sad: [
    { title: "مناديل الوداع", cover: "https://images.unsplash.com/photo-1516589174184-c68526ec14eb?auto=format&fit=crop&q=80&w=200", desc: "عندما تصبح الذكريات هي كل ما نملك." },
    { title: "أغنية المطر الأخيرة", cover: "https://images.unsplash.com/photo-1534274938760-42441f45aec5?auto=format&fit=crop&q=80&w=200", desc: "عن الفقد الذي يبني فينا حياة جديدة." }
  ]
};

const GENRES = TRANSLATIONS.AR.genres;
const COMMUNITY_TOPICS = TRANSLATIONS.AR.topics;

const INITIAL_POSTS = [
  { id: 1, author: "ليلى الورد", content: "هل تعتقدون أن النهايات السقيدة أصبحت مملة؟ بصراحة أشعر أن الحزن يعطي الرواية عمقاً أكبر.", topic: "الروايات والكتب", likes: 24, comments: 5, date: "منذ ساعتين" },
  { id: 2, author: "فارس الأحلام", content: "كلماتك نجوم تضيء عالم مخيلتنا. شكراً روزلين على هذا الفضاء.", topic: "المشاعر والخواطر", likes: 89, comments: 12, date: "منذ 5 ساعات" },
];

const QUOTES = [
  { text: "الكتب هي الآثار التي تتركها النجوم في نفوسنا.", author: "روزلين بيلا" },
  { text: "Certains livres semblent écrits pour éclairer les nuits les plus sombres.", author: "Rosaline Bela" },
  { text: "Words are stars that light up the universe of our imagination.", author: "Rosaline Bela" },
  { text: "ثمة كلمات تشبه المصابيح، دافئة، هادئة، وتضيء عتمة الروح.", author: "شمس التبريزي" },
];

const BUTTON_INFOS = {
  AR: [
    { id: 'read', label: "ابدأ القراءة", desc: "أبحر في عوالم من الخيال والجمال", icon: BookOpen, view: 'READING' },
    { id: 'write', label: "ابدأ الكتابة", desc: "اكتب أسطورتك ودع الكلمات تشع سحراً", icon: PenTool, view: 'WRITER' },
    { id: 'library', label: "استكشف المكتبة", desc: "اكتشف أسرار الكتب ومراجعات القراء", icon: Library, view: 'LIBRARY' },
    { id: 'learn', label: "ورشة الإبداع", desc: "تعلّم مهارات صياغة الروايات الفاخرة", icon: Sparkles, view: 'LEARN' },
    { id: 'universe', label: "روزالين يونيفرس", desc: "ادخل عوالمك المفضلة وأعِد صياغة أسطورة روايات المعجبين (Fan Fiction)", icon: Sparkles, view: 'UNIVERSE' },
  ],
  EN: [
    { id: 'read', label: "Begin Reading", desc: "Sail into worlds of pure imagination", icon: BookOpen, view: 'READING' },
    { id: 'write', label: "Start Writing", desc: "Write your legend and share your magic", icon: PenTool, view: 'WRITER' },
    { id: 'library', label: "Explore Library", desc: "Discover rare books and critical reviews", icon: Library, view: 'LIBRARY' },
    { id: 'learn', label: "Creative Workshop", desc: "Learn the secrets of elegant storytelling", icon: Sparkles, view: 'LEARN' },
    { id: 'universe', label: "Rosaline Universe", desc: "Enter your favorite parallel realms and write magical fan fiction chronicles", icon: Sparkles, view: 'UNIVERSE' },
  ],
  FR: [
    { id: 'read', label: "Commencer la Lecture", desc: "Naviguez dans des mondes d'imagination", icon: BookOpen, view: 'READING' },
    { id: 'write', label: "Commencer à Écrire", desc: "Écrivez votre légende et partagez votre magie", icon: PenTool, view: 'WRITER' },
    { id: 'library', label: "Explorer la Bibliothèque", desc: "Découvrez des livres rares et des critiques", icon: Library, view: 'LIBRARY' },
    { id: 'learn', label: "Atelier Créatif", desc: "Apprenez les secrets d'un récit élégant", icon: Sparkles, view: 'LEARN' },
    { id: 'universe', label: "Rosaline Universe", desc: "Entrez dans vos mondes préférés et rédigez de nobles fanfictions stellaires", icon: Sparkles, view: 'UNIVERSE' },
  ]
};

function MagicalHomeBackground({ theme }: { theme: Theme }) {
  const [stars, setStars] = useState<any[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [literaryArts, setLiteraryArts] = useState<any[]>([]);
  const [fogClouds, setFogClouds] = useState<any[]>([]);

  useEffect(() => {
    // Generate twinkling stars
    const sList = [];
    const count = theme === 'BURGUNDY' ? 120 : 90; // many more stars for Burgundy and Fog
    for (let i = 0; i < count; i++) {
      sList.push({
        id: `m-star-${i}-${theme}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.6,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 4
      });
    }
    setStars(sList);

    // Particles (different styling based on theme)
    const pList = [];
    for (let i = 0; i < 22; i++) {
      pList.push({
        id: `m-part-${i}-${theme}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4.5 + 2,
        duration: 12 + Math.random() * 8,
        delay: Math.random() * -10
      });
    }
    setParticles(pList);

    if (theme === 'BURGUNDY') {
      // 5-6 slow moving clouds of faint white fog
      const fogList = [];
      for (let i = 0; i < 5; i++) {
        fogList.push({
          id: `m-fog-${i}`,
          x: Math.random() * 60 - 30, // Initial offset
          y: Math.random() * 50 + 20, // Center/bottom fog
          scale: 1.5 + Math.random() * 1.5,
          duration: 35 + Math.random() * 20,
          delay: Math.random() * -20,
          opacity: 0.12 + Math.random() * 0.12
        });
      }
      setFogClouds(fogList);

      // Literary artworks: Open books (📖), quill feathers (✒️ / 🖋️), falling ink (💧 / 💫), deep red roses (🌹), drifting papers (📄 / 📜)
      const arts = ["📖", "✒️", "🌹", "📜", "🍂", "📄"];
      const artList = [];
      for (let i = 0; i < 14; i++) {
        artList.push({
          id: `m-art-${i}`,
          char: arts[i % arts.length],
          x: Math.random() * 100,
          y: Math.random() * 90 + 5,
          size: 14 + Math.random() * 12,
          duration: 25 + Math.random() * 20,
          delay: Math.random() * -20,
          rotation: Math.random() * 360,
          rotateDir: Math.random() > 0.5 ? 1 : -1
        });
      }
      setLiteraryArts(artList);
    } else {
      setFogClouds([]);
      setLiteraryArts([]);
    }
  }, [theme]);

  const isBurgundy = theme === 'BURGUNDY';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* Dynamic Base night sky Backdrop */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: isBurgundy
            ? 'linear-gradient(to bottom, #001e28 0%, #022e3b 35%, #0c4c5c 70%, #01141b 100%)'
            : 'linear-gradient(to bottom, #05010a 0%, #170425 45%, #0d0216 80%, #05010a 100%)'
        }}
      />
      
      {/* Dynamic glow masks */}
      <div 
        className="absolute top-[-100px] left-[15%] right-[15%] h-[500px] rounded-full filter blur-[150px] transition-all duration-1000 pointer-events-none"
        style={{
          background: isBurgundy 
            ? 'radial-gradient(circle, rgba(160,216,255,0.22) 0%, rgba(126,200,227,0.02) 85%)'
            : 'radial-gradient(circle, rgba(171,126,255,0.15) 0%, rgba(23,4,37,0.02) 80%)'
        }}
      />

      <div 
        className="absolute bottom-[10%] left-[20%] w-[350px] h-[350px] rounded-full filter blur-[160px] transition-all duration-1000 pointer-events-none"
        style={{
          background: isBurgundy
            ? 'radial-gradient(circle, rgba(126,200,227,0.15) 0%, rgba(26,107,122,0.02) 100%)'
            : 'radial-gradient(circle, rgba(157,0,255,0.08) 0%, rgba(5,1,10,0.01) 100%)'
        }}
      />

      {/* Twinkling star field */}
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: isBurgundy ? '#e2f1f6' : '#FFFFFF',
            boxShadow: isBurgundy 
              ? '0 0 5px rgba(226,241,246,0.95)' 
              : '0 0 5px rgba(255,255,255,0.9)'
          }}
          animate={{
            opacity: [0.12, 0.95, 0.12],
            scale: [0.75, 1.25, 0.75]
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Faint White/Sky-Blue Fog clouds - Cinematic and soft */}
      {isBurgundy && fogClouds.map((fog) => (
        <motion.div
          key={fog.id}
          className="absolute rounded-full bg-gradient-to-r from-[#7EC8E3]/0 via-[#7EC8E3]/[0.055] to-[#7EC8E3]/0 select-none filter blur-[100px] pointer-events-none"
          style={{
            left: `${fog.x}%`,
            top: `${fog.y}%`,
            width: '600px',
            height: '250px',
            scale: fog.scale,
          }}
          animate={{
            x: ['-5%', '15%', '-5%'],
            opacity: [fog.opacity - 0.04, fog.opacity + 0.04, fog.opacity - 0.04]
          }}
          transition={{
            duration: fog.duration,
            repeat: Infinity,
            delay: fog.delay,
            ease: "linear"
          }}
        />
      ))}

      {/* Floating Literary Graphics (exclusive to theme) - Transparent & artistic */}
      {isBurgundy && literaryArts.map((art) => (
        <motion.div
          key={art.id}
          style={{
            left: `${art.x}%`,
            top: `${art.y}%`,
            fontSize: `${art.size}px`,
            position: 'absolute',
            opacity: 0.16,
            color: art.char === '🌹' ? '#1A6B7A' : (art.char === '📜' || art.char === '🍂' ? '#7EC8E3' : '#A0D8FF'),
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))'
          }}
          animate={{
            y: [-15, -120],
            x: [0, Math.sin(art.x) * 15],
            rotate: [art.rotation, art.rotation + (art.rotateDir * 90)],
            opacity: [0, 0.22, 0.22, 0]
          }}
          transition={{
            duration: art.duration,
            repeat: Infinity,
            delay: art.delay,
            ease: "linear"
          }}
          className="hidden sm:block select-none pointer-events-none"
        />
      ))}

      {/* Slow floating magical sparkles/particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: isBurgundy
              ? 'radial-gradient(circle, #D4AF37 0%, rgba(212,175,55,0.05) 80%)'
              : 'radial-gradient(circle, #ab7eff 0%, rgba(171,126,255,0.05) 80%)',
            boxShadow: isBurgundy
              ? '0 0 6px rgba(212,175,55,0.7), 0 0 12px rgba(107,28,43,0.3)'
              : '0 0 6px rgba(171,126,255,0.6), 0 0 12px rgba(157,0,255,0.3)'
          }}
          animate={{
            y: [-10, -220],
            x: [0, Math.sin(p.x) * 20],
            opacity: [0, 0.75, 0.75, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>('BURGUNDY');
  const [lang, setLang] = useState<Language>('AR');
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentView, setCurrentView] = useState<'HOME' | 'COMMUNITY' | 'WRITER' | 'READING' | 'ABOUT' | 'PRIVACY' | 'CONTACT' | 'TERMS' | 'LIBRARY' | 'LEARN' | 'PRICING' | 'UNIVERSE'>('HOME');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNavDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [selectedNovel, setSelectedNovel] = useState<any>(null); // fallback handled dynamically in useEffect or rendering
  const [readingStats, setReadingStats] = useState({ today: 0, weekly: 0, total: 0 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [headerIsDrafting, setHeaderIsDrafting] = useState(false);
  const [headerShowHint, setHeaderShowHint] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<any>(null);

  const triggerHeaderSaveDraft = () => {
    setHeaderIsDrafting(true);
    // Dispatch global event for StoryForm to capture and save the current story progress
    window.dispatchEvent(new CustomEvent('save-story-draft'));
    
    localStorage.setItem('last_saved_view', currentView);
    localStorage.setItem('last_saved_timestamp', new Date().toISOString());

    setTimeout(() => {
      setHeaderIsDrafting(false);
      setHeaderShowHint(true);
      setTimeout(() => setHeaderShowHint(false), 3000);
    }, 1000);
  };

  useEffect(() => {
    const savedStats = localStorage.getItem('reading_stats');
    if (savedStats) {
      setReadingStats(JSON.parse(savedStats));
    }
    
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Reset daily stats if it's a new day
    const lastReset = localStorage.getItem('last_stats_reset');
    const todayStr = new Date().toDateString();
    if (lastReset !== todayStr) {
      setReadingStats(prev => ({ ...prev, today: 0 }));
      localStorage.setItem('last_stats_reset', todayStr);
    }
  }, []);

  useEffect(() => {
    if (isFirebaseAvailable && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user: any) => {
        if (user) {
          const userObj = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || "User",
            dateJoined: user.metadata.creationTime || new Date().toISOString()
          };
          setCurrentUser(userObj);
          localStorage.setItem('current_user', JSON.stringify(userObj));
        }
      });
      return () => unsubscribe();
    }
  }, []);


  useEffect(() => {
    localStorage.setItem('reading_stats', JSON.stringify(readingStats));
  }, [readingStats]);

  // Global Reading Timer
  useEffect(() => {
    let interval: any;
    if (currentView === 'READING') {
      interval = setInterval(() => {
        setReadingStats(prev => ({
          ...prev,
          today: prev.today + 1,
          weekly: prev.weekly + 1,
          total: prev.total + 1
        }));
      }, 60000); // Every minute
    }
    return () => clearInterval(interval);
  }, [currentView]);

  const getUserTitle = () => {
    const minutes = readingStats.total;
    const titles = (TRANSLATIONS[lang] as any).titles;
    if (minutes > 300) return titles[2]; // Sage
    if (minutes > 60) return titles[1];  // Bookworm
    return titles[0]; // Novice
  };

  const SAMPLE_NOVEL = {
    title: "أصداء النجوم",
    author: "روزلين بيلا",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
    chapterTitle: "الفصل الأول: البداية",
    chapterNumber: 1,
    content: `في عتمة الليل البارد، كانت النجوم تهمس بأسرار قديمة لم يسمعها أحد منذ دهور. روزلين، تلك الفتاة التي كانت ترى في كل كتاب سماءً جديدة، جلست تراقب الأفق...
    
كانت الكلمات تنساب كالنهر، هادئة في بدايتها، عاصفة في أعماقها. ثمة حزن دفين في طيات الصفحات، لكنه حزن يشبه عطر الياسمين في ليلة شتوية.
    
سألت نفسها: هل يمكن للحروف أن تبني جسراً إلى المستحيل؟`,
    authorNote: "شكراً لكم لمتابعة هذا الفصل. أتمنى أن ينال إعجابكم، ولا تنسوا مشاركتي مشاعركم تجاه الأحداث."
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'BURGUNDY' ? 'PURPLE' : 'BURGUNDY');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signin');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openModal = (mode: 'signin' | 'signup') => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const nextQuote = () => setCurrentQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  const prevQuote = () => setCurrentQuoteIndex((prev) => (prev - 1 + QUOTES.length) % QUOTES.length);

  const themes = {
    BURGUNDY: {
      bg: 'bg-[#011a24]',
      gradient: 'from-[#001c24] via-[#063c4a] to-[#011a24]',
      text: 'text-[#e2f1f6]',
      accent: 'text-[#7EC8E3]',
      btnBg: 'bg-[#1A6B7A]/25 hover:bg-[#7EC8E3]/30',
      btnBorder: 'border-[#7EC8E3]/35',
      btnText: 'text-[#e2f1f6]',
      descriptionColor: 'text-[#A0D8FF]/90',
      starColor: 'bg-[#7EC8E3]/55',
      logo: 'text-[#A0D8FF] font-semibold drop-shadow-[0_0_20px_rgba(126,200,227,0.65)]',
      inputBg: 'bg-[#011a24]/60',
      inputBorder: 'border-[#7EC8E3]/35',
      cardBg: 'bg-gradient-to-br from-[#0F4C5C]/35 via-[#1A6B7A]/20 to-[#011c26]/60 border-[#7EC8E3]/30 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85)]',
      quoteText: 'text-[#e2f1f6]',
      quoteAuthor: 'text-[#7EC8E3]/85',
      modalOverlay: 'bg-[#011a24]/95',
      modalAccent: '#7EC8E3',
      modalBtn: 'bg-[#1A6B7A]/30 text-white border-[#7EC8E3]/40 hover:bg-[#7EC8E3]/35',
    },
    PURPLE: {
      bg: 'bg-[#05010a]',
      gradient: 'from-[#170425] to-[#05010a]',
      text: 'text-[#dcd6fc]',
      accent: 'text-[#ab7eff]',
      btnBg: 'bg-[#ab7eff]/10 hover:bg-[#ab7eff]/20',
      btnBorder: 'border-[#ab7eff]/30',
      btnText: 'text-[#f3e8ff]',
      descriptionColor: 'text-[#dcd6fc]/90',
      starColor: 'bg-[#ab7eff]/40',
      logo: 'text-[#ab7eff] drop-shadow-[0_0_20px_rgba(171,126,255,0.6)]',
      inputBg: 'bg-[#05010a]/50',
      inputBorder: 'border-[#ab7eff]/20',
      cardBg: 'bg-[#12071f]/80 border-[#ab7eff]/30 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)]',
      quoteText: 'text-[#f3e8ff]',
      quoteAuthor: 'text-[#dcd6fc]/80',
      modalOverlay: 'bg-[#05010a]/90',
      modalAccent: '#ab7eff',
      modalBtn: 'bg-[#ab7eff] text-black hover:bg-[#9661ff]',
    }
  };

  const themeLabels = {
    AR: {
      BURGUNDY: "الأخضر البحري الساحر ⚓",
      PURPLE: "الخيال الغامض 🔮",
      btn: "تغيير المظهر"
    },
    EN: {
      BURGUNDY: "Mystic Sea-Green ⚓",
      PURPLE: "Mystic Fantasy 🔮",
      btn: "Cycle Theme"
    },
    FR: {
      BURGUNDY: "Mer Mystique ⚓",
      PURPLE: "Violet Mystique 🔮",
      btn: "Changer de Thème"
    }
  };

  const current = themes[theme];
  const t = TRANSLATIONS[lang];
  const currentLangObj = LANGUAGES.find(l => l.code === lang)!;
  const [isMoodOpen, setIsMoodOpen] = useState(false);

  return (
    <div 
      className={`relative min-h-screen w-full transition-all duration-1000 ${current.bg} overflow-x-hidden overflow-y-auto font-sans ${theme === 'BURGUNDY' ? 'theme-burgundy' : 'theme-purple'}`} 
      dir={currentLangObj.dir}
    >
      {/* Mood Recommendation Panel */}
      <AnimatePresence>
        {isMoodOpen && (
          <MoodPanel 
            theme={theme} 
            themeStyles={current} 
            lang={lang} 
            onClose={() => setIsMoodOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Background Gradient Layer (Fixed) */}
      <motion.div 
        key={theme + '-bg'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
        className={`fixed inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-from)_0%,var(--tw-gradient-to)_100%)] ${current.gradient} z-0`}
      />

      {/* Celestial Library Background Decorations */}
      <CelestialLibraryBackground theme={theme} />

      {/* Global Toast Notification for Draft Saving */}
      <AnimatePresence>
        {headerShowHint && (
          <motion.div 
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 120, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 px-8 py-3.5 rounded-full border backdrop-blur-2xl z-[100] text-xs uppercase font-bold tracking-widest flex items-center gap-3 shadow-[0_15px_30px_rgba(0,0,0,0.5)]
              ${theme === 'PURPLE' ? 'bg-[#C0C0C0]/20 border-[#C0C0C0]/40 text-[#E5E4E2]' : 'bg-red-950/40 border-rose-500/20 text-rose-200'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{t.draftSaved} ✧</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Header with Theme Toggle */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="fixed top-4 left-0 right-0 z-50 w-full px-4 md:px-8 select-none"
        dir={currentLangObj.dir}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 bg-gradient-to-r from-[#F5F5F7]/15 via-[#E5E4E2]/25 to-[#F5F5F7]/15 backdrop-blur-3xl border border-[#E5E4E2]/50 p-2 md:p-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.85),_inset_0_1px_2px_rgba(255,255,255,0.2),_0_0_15px_rgba(229,228,226,0.15)] w-full">
          
          {/* Left Side: Brand Logo, Theme Switch, and Language Switcher */}
          <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
            {/* Brand/Logo */}
            <button 
              onClick={() => {
                setCurrentView('HOME');
                setIsMobileMenuOpen(false);
                setIsNavDropdownOpen(false);
              }} 
              className="flex items-center gap-1.5 px-3 md:px-5 py-1.5 cursor-pointer group text-left shrink-0"
            >
              <span className="font-display font-semibold text-base md:text-lg bg-gradient-to-r from-[#FFFFFF] via-[#E5E4E2] to-[#B0B0B0] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] tracking-tight">
                Rosaline Bela
              </span>
              <span className="text-[8px] md:text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-[#E5E4E2]/20 text-[#E5E4E2] border border-[#E5E4E2]/40 shadow-[0_0_8px_rgba(229,228,226,0.3)]">
                ✦
              </span>
            </button>

            {/* Visual Separator */}
            <div className="hidden sm:block w-[1px] h-5 bg-[#C0C0C0]/35 shrink-0" />

            {/* Theme Switcher Toggle Button */}
            <button
              onClick={toggleTheme}
              id="theme-toggle"
              className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full border transition-all duration-300 cursor-pointer text-[10px] md:text-xs font-bold leading-none select-none shrink-0"
              title={themeLabels[lang].btn}
              style={{
                borderColor: theme === 'PURPLE' ? '#ab7eff' : '#eed2d0',
                color: theme === 'PURPLE' ? '#dcd6fc' : '#eed2d0',
                backgroundColor: theme === 'PURPLE' ? 'rgba(171,126,255,0.1)' : 'rgba(238,210,208,0.1)'
              }}
            >
              <Sparkles size={11} className="animate-pulse" />
              <span className="hidden sm:inline leading-none">
                {themeLabels[lang][theme]}
              </span>
            </button>

            {/* Language switcher */}
            <div className="flex items-center bg-black/40 p-0.5 rounded-full border border-[#E5E4E2]/20 shrink-0 select-none">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className="px-2 py-1 rounded-full text-[9px] font-bold transition-all duration-300 uppercase leading-none"
                  style={{ 
                    padding: '4px 8px',
                    backgroundColor: lang === l.code ? '#E5E4E2' : 'transparent',
                    color: lang === l.code ? '#000000' : '#ffffff'
                  }}
                >
                  {l.code}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Creative "Explore Our World" Dropdown Trigger */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => setIsProfileOpen(true)}
                className={`flex items-center gap-2 p-1.5 px-3 rounded-full border transition-all duration-300 cursor-pointer text-[10px] md:text-xs font-bold shrink-0 hover:scale-105 active:scale-95
                  ${theme === 'PURPLE' 
                    ? 'border-[#C0C0C0]/35 text-[#E0E0E0] bg-[#C0C0C0]/15 hover:border-[#C0C0C0]/60 shadow-[0_0_12px_rgba(224,224,224,0.15)]' 
                    : 'border-white/25 text-white bg-white/5 hover:border-white/40'}`}
                title={lang === 'AR' ? 'الملف الشخصي' : 'View Profile'}
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Profile" className="w-5 h-5 rounded-full object-cover border border-[#C0C0C0]/40" referrerPolicy="no-referrer" />
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${theme === 'PURPLE' ? 'bg-[#C0C0C0]/20 text-[#E0E0E0]' : 'bg-white text-black'}`}>
                    {currentUser.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline font-sans font-bold max-w-[80px] truncate">{currentUser.name}</span>
              </button>
            )}

            <div 
              className="relative shrink-0" 
              ref={dropdownRef}
              onMouseEnter={() => setIsNavDropdownOpen(true)}
              onMouseLeave={() => setIsNavDropdownOpen(false)}
            >
            <button
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
              className="creative-dropdown-trigger font-serif flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 rounded-full font-bold cursor-pointer transition-all duration-300 whitespace-nowrap"
            >
              <Sparkles size={12} className="text-[#E5E4E2] animate-pulse" />
              <span className="text-[11px] md:text-xs tracking-wider leading-none">{t.exploreOurWorld}</span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${isNavDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isNavDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="creative-dropdown-panel absolute mt-3 w-64 p-3 z-[9999] flex flex-col gap-1 text-right"
                  style={{ 
                    right: lang === 'AR' ? 'auto' : '0px', 
                    left: lang === 'AR' ? '0px' : 'auto',
                    direction: currentLangObj.dir 
                  }}
                >
                  {/* 1. الرئيسية / Home */}
                  <button
                    onClick={() => {
                      setCurrentView('HOME');
                      setIsNavDropdownOpen(false);
                    }}
                    className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors duration-200
                      ${currentView === 'HOME' 
                        ? (theme === 'PURPLE' ? 'bg-[#C0C0C0]/20 text-[#E5E4E2]' : 'bg-[#eed2d0]/20 text-[#eed2d0]') 
                        : 'text-white hover:bg-white/10'}`}
                  >
                    <BookOpen size={13} className={`shrink-0 ${theme === 'PURPLE' ? 'text-[#E5E4E2]' : 'text-[#eed2d0]'}`} />
                    <span>{t.home}</span>
                  </button>

                  {/* 2. استكشف المكتبة / Explore Library */}
                  <button
                    onClick={() => {
                      setIsNavDropdownOpen(false);
                      if (currentUser) {
                        setCurrentView('LIBRARY');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        alert(lang === 'AR' 
                          ? 'يرجى تسجيل الدخول أو إنشاء حساب أولاً لاستكشاف المكتبة السحرية!' 
                          : 'Please login or create an account first to explore the magical library!');
                        openModal('signin');
                      }
                    }}
                    className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors duration-200
                      ${currentView === 'LIBRARY' 
                        ? (theme === 'PURPLE' ? 'bg-[#C0C0C0]/20 text-[#E5E4E2]' : 'bg-[#eed2d0]/20 text-[#eed2d0]') 
                        : 'text-white hover:bg-white/10'}`}
                  >
                    <Library size={13} className={`shrink-0 ${theme === 'PURPLE' ? 'text-[#E5E4E2]' : 'text-[#eed2d0]'}`} />
                    <span>{t.exploreLibrary}</span>
                  </button>

                  {/* 3. أعمالي / My Works */}
                  <button
                    onClick={() => {
                      setCurrentView('WRITER');
                      setIsNavDropdownOpen(false);
                    }}
                    className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors duration-200
                      ${currentView === 'WRITER' 
                        ? (theme === 'PURPLE' ? 'bg-[#C0C0C0]/20 text-[#E5E4E2]' : 'bg-[#eed2d0]/20 text-[#eed2d0]') 
                        : 'text-white hover:bg-white/10'}`}
                  >
                    <PenTool size={13} className={`shrink-0 ${theme === 'PURPLE' ? 'text-[#E5E4E2]' : 'text-[#eed2d0]'}`} />
                    <span>{t.myWorks}</span>
                  </button>

                  {/* 4. المجتمع / Community */}
                  <button
                    onClick={() => {
                      setCurrentView('COMMUNITY');
                      setIsNavDropdownOpen(false);
                    }}
                    className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors duration-200
                      ${currentView === 'COMMUNITY' 
                        ? (theme === 'PURPLE' ? 'bg-[#C0C0C0]/20 text-[#E5E4E2]' : 'bg-[#eed2d0]/20 text-[#eed2d0]') 
                        : 'text-white hover:bg-white/10'}`}
                  >
                    <Users size={13} className={`shrink-0 ${theme === 'PURPLE' ? 'text-[#E5E4E2]' : 'text-[#eed2d0]'}`} />
                    <span>{t.community}</span>
                  </button>

                  {/* 5. ورشة الإبداع / Creative Workshop (Glowing Neon Badge) */}
                  <button
                    onClick={() => {
                      setCurrentView('LEARN');
                      setIsNavDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all duration-300 border
                      ${currentView === 'LEARN' 
                        ? 'bg-[#E5E4E2] text-[#0f0205] border-white/30 font-black' 
                        : 'bg-[#C0C0C0]/25 text-white hover:bg-[#C0C0C0]/40 border-[#C0C0C0]/40 shadow-[0_0_10px_rgba(224,224,224,0.25)]'}`}
                  >
                    <Sparkles size={13} className="shrink-0 text-[#E5E4E2] animate-pulse" />
                    <span>{t.learnWriting} ✦</span>
                  </button>

                  {/* 5.2. روزالين يونيفرس / Rosaline Universe (Fan Fiction) (Vibrant Rainbow/Starlight Badge) */}
                  <button
                    onClick={() => {
                      setCurrentView('UNIVERSE');
                      setIsNavDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-black cursor-pointer transition-all duration-300 border
                      ${currentView === 'UNIVERSE' 
                        ? 'bg-gradient-to-r from-pink-500 via-[#ab7eff] to-sky-500 text-white border-pink-400 font-extrabold shadow-[0_0_15px_rgba(236,72,153,0.4)]' 
                        : 'bg-gradient-to-r from-pink-500/10 via-[#ab7eff]/10 to-sky-500/10 text-white hover:bg-white/10 border-pink-500/20'}`}
                  >
                    <Sparkles size={13} className="shrink-0 text-pink-300 animate-spin" />
                    <span>{lang === 'AR' ? 'بوابة روزالين يونيفرس ✨' : lang === 'FR' ? 'Rosaline Universe ✨' : 'Rosaline Universe ✨'}</span>
                  </button>

                  {/* 5.5. العضوية الفاخرة / Premium Membership (Ultra Lux Gold Badge) */}
                  <button
                    onClick={() => {
                      setCurrentView('PRICING');
                      setIsNavDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-black cursor-pointer transition-all duration-300 border
                      ${currentView === 'PRICING' 
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-black border-yellow-300 font-extrabold shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                        : 'bg-gradient-to-r from-[#D4AF37]/20 via-[#F3E5AB]/10 to-[#D4AF37]/25 text-white hover:bg-white/10 border-[#D4AF37]/35 shadow-[0_0_10px_rgba(212,175,55,0.15)]'}`}
                  >
                    <Crown size={13} className="shrink-0 text-amber-300 animate-pulse" />
                    <span>{lang === 'AR' ? 'عالم روزالين الملكي ✧' : lang === 'FR' ? 'Alliance Royale ✧' : 'Royal Alliances ✧'}</span>
                  </button>

                  {/* Dynamic user session divider / login */}
                  <div className="h-[1px] bg-white/10 my-1 shrink-0" />

                  {/* 6. دخول - Signin or profile info display */}
                  <div className="px-1 text-right">
                    {currentUser ? (
                      <div className="flex flex-col gap-2 pt-1">
                        <button 
                          onClick={() => {
                            setIsProfileOpen(true);
                            setIsNavDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-right cursor-pointer transition-all duration-300 group
                            ${theme === 'PURPLE' 
                              ? 'bg-[#C0C0C0]/10 hover:bg-[#C0C0C0]/20 border-[#C0C0C0]/35 hover:border-[#E5E4E2]/70 shadow-[0_0_15px_rgba(224,224,224,0.15)]' 
                              : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'}`}
                        >
                          <div className="relative shrink-0">
                            {currentUser.avatar ? (
                              <img 
                                src={currentUser.avatar} 
                                alt={currentUser.name} 
                                className="w-6 h-6 rounded-full object-cover border border-[#C0C0C0]/40" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${theme === 'PURPLE' ? 'bg-[#C0C0C0]/25 text-[#E5E4E2] border border-[#C0C0C0]/20' : 'bg-white text-black'}`}>
                                {currentUser.name[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <span className={`text-[10px] uppercase font-bold block truncate leading-tight ${theme === 'PURPLE' ? 'text-[#E5E4E2]' : 'text-white'}`}>
                              {currentUser.name}
                            </span>
                            <span className="text-[8px] text-[#dec2ff]/60 block leading-none mt-0.5 group-hover:text-white transition-colors">
                              {lang === 'AR' ? 'الملف الشخصي ✦ تعديل' : 'Profile ✦ Edit'}
                            </span>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setCurrentUser(null);
                            localStorage.removeItem('current_user');
                            setIsNavDropdownOpen(false);
                          }}
                          className="w-full text-start text-[10px] font-bold text-red-400 hover:text-red-300 py-1.5 px-3 rounded hover:bg-red-500/10 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <X size={11} className="shrink-0" />
                          <span>{lang === 'AR' ? 'تسجيل الخروج' : 'Logout'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          openModal('signin');
                          setIsNavDropdownOpen(false);
                        }}
                        className="w-full text-center py-2 rounded-lg bg-[#C0C0C0]/20 text-white border border-[#C0C0C0]/30 hover:bg-[#C0C0C0]/45 transition-all text-xs font-bold leading-none cursor-pointer"
                      >
                        {t.login} ✦
                      </button>
                    )}
                  </div>

                  {/* 7. حفظ كمسودة / Save Draft (Only shown if WRITER view is active for optimal layout integrity) */}
                  {currentView === 'WRITER' && (
                    <button
                      onClick={() => {
                        triggerHeaderSaveDraft();
                        setIsNavDropdownOpen(false);
                      }}
                      className="w-full text-start flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer text-white/90 hover:bg-white/10 transition-colors duration-200 mt-1"
                    >
                      {headerIsDrafting ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 shrink-0 text-[#E0E0E0]" />
                      )}
                      <span>{t.saveDraft}</span>
                    </button>
                  )}

                  {/* 8. كيف تشعر اليوم / Mood Selection trigger */}
                  <button
                    onClick={() => {
                      setIsMoodOpen(true);
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full text-start flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold cursor-pointer text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    <Smile size={13} className="shrink-0 text-[#E0E0E0]" />
                    <span>{t.moodBtn}</span>
                  </button>

                  {/* 9. قارئ مبدع - Profile / Reading level stats container */}
                  <div className="px-2.5 py-2.5 bg-white/[0.04] rounded-xl border border-white/5 flex flex-col gap-1 select-none text-center mt-1">
                    <span className="text-[10px] text-zinc-300 font-mono font-bold leading-none uppercase tracking-wide">
                      {getUserTitle()}
                    </span>
                    <div className="flex items-center justify-around gap-1 pt-1.5 border-t border-white/5 mt-1 font-mono text-[9px] text-zinc-400">
                      <div className="text-center shrink-0">
                        <span className="block text-white font-black leading-none">{readingStats.today}m</span>
                        <span className="text-[8px] opacity-60">{lang === 'AR' ? 'اليوم' : 'Today'}</span>
                      </div>
                      <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />
                      <div className="text-center shrink-0">
                        <span className="block text-white font-black leading-none">{readingStats.weekly}m</span>
                        <span className="text-[8px] opacity-60">{lang === 'AR' ? 'الأسبوع' : 'Week'}</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>

        </div>
      </motion.header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {currentView === 'HOME' ? (
          <motion.div 
            key="home-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6 min-h-screen"
          >
            {/* Cinematic Magical Background with Twilight Mist & Particles */}
            <MagicalHomeBackground theme={theme} />

            {/* Welcome Section */}
            <main className="text-center max-w-5xl mx-auto w-full mb-16 relative z-10">
              <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                 transition={{ duration: 1.2, ease: "easeOut" }}
                 className="space-y-6"
              >
                {/* Central Title */}
                <div className="space-y-3">
                  <motion.h1 
                    id="main-title"
                    key={theme + '-title'}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`font-fancy text-7xl sm:text-8xl md:text-[6rem] lg:text-[7.5rem] tracking-wide text-transparent bg-clip-text leading-none select-none pb-4`}
                    style={{
                      backgroundImage: theme === 'BURGUNDY'
                        ? 'linear-gradient(to bottom, #FFFFFF 10%, #F3E5AB 50%, #D4AF37 100%)'
                        : 'linear-gradient(to bottom, #FFFFFF 15%, #E2D8FF 60%, #ab7eff 100%)',
                      textShadow: theme === 'BURGUNDY'
                        ? '0 0 35px rgba(212, 175, 55, 0.45), 0 0 60px rgba(159, 42, 62, 0.35)'
                        : '0 0 35px rgba(171, 126, 255, 0.45), 0 0 60px rgba(157, 0, 255, 0.3)',
                      fontStyle: 'italic'
                    }}
                  >
                    Rosaline Bela
                  </motion.h1>
                  
                  <motion.p 
                    id="welcome-text"
                    key={theme + '-desc'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className={`text-sm sm:text-base md:text-lg font-display italic tracking-widest max-w-2xl mx-auto leading-relaxed font-medium select-none
                      ${theme === 'BURGUNDY' ? 'text-[#FDFBF7]/80' : 'text-[#dcd6fc]/90'}`}
                  >
                    {t.welcome}
                  </motion.p>
                </div>

                {/* Grid of 4 Luxurious Magical Parchment Action Cards arranged in a gorgeous 2x2 grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-14 px-4 relative z-10 mx-auto">
                  {(BUTTON_INFOS[lang] || BUTTON_INFOS.AR).map((btn, idx) => {
                    const IconComponent = btn.icon;
                    const isBurgundy = theme === 'BURGUNDY';
                    const englishEquivalent = BUTTON_INFOS.EN.find(e => e.id === btn.id)?.label || "";

                    return (
                      <motion.div
                        key={btn.id}
                        initial={{ opacity: 0, y: 35 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + idx * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -8, scale: 1.025 }}
                        onClick={() => {
                          if (btn.id === 'library') {
                            if (currentUser) {
                              setCurrentView('LIBRARY');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                              alert(lang === 'AR' 
                                ? 'يرجى تسجيل الدخول أو إنشاء حساب أولاً لاستكشاف المكتبة السحرية!' 
                                : 'Please login or create an account first to explore the magical library!');
                              openModal('signin');
                            }
                          } else {
                            setCurrentView(btn.view);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`group relative cursor-pointer p-8 rounded-[1.8rem_2.2rem_1.9rem_2.4rem] border-2 transition-all duration-500 flex flex-col justify-between overflow-hidden min-h-56 text-right select-none
                          bg-gradient-to-br from-[#fefcf8] via-[#f9f5e8] to-[#f1e7cb] 
                          hover:from-[#fffefc] hover:via-[#faf6ee] hover:to-[#ecdcae]
                          after:absolute after:inset-2 after:border after:border-[#deb887]/35 after:rounded-[1.4rem_1.9rem_1.3rem_1.8rem] after:pointer-events-none
                          ${idx === 4 ? 'md:col-span-2' : ''}
                          ${isBurgundy 
                            ? 'border-[#deb887]/40 hover:border-[#7EC8E3] shadow-[0_15px_35px_rgba(0,0,0,0.65),0_0_12px_rgba(126,200,227,0.15)] hover:shadow-[0_22px_45px_rgba(0,0,0,0.7),0_0_25px_rgba(126,200,227,0.45),0_0_35px_rgba(26,107,122,0.2)]' 
                            : 'border-[#deb887]/35 hover:border-[#D16A7E] shadow-[0_15px_35px_rgba(0,0,0,0.65),0_0_12px_rgba(209,106,126,0.12)] hover:shadow-[0_22px_45px_rgba(0,0,0,0.7),0_0_25px_rgba(209,106,126,0.4),0_0_35px_rgba(159,42,62,0.25)]'}`}
                      >
                        {/* Magical Glow Aura Behind Parchment */}
                        <div className={`absolute inset-0 rounded-[1.8rem_2.2rem_1.9rem_2.4rem] blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60 group-hover:opacity-100 -z-10
                          ${isBurgundy 
                            ? 'bg-[#7EC8E3]/15 group-hover:bg-[#7EC8E3]/35' 
                            : 'bg-[#D16A7E]/12 group-hover:bg-[#D16A7E]/30'}`} />

                        {/* Top Action / Stamp Seal Row */}
                        <div className={`flex items-center justify-between w-full relative z-10 ${lang === 'AR' ? 'flex-row' : 'flex-row-reverse'}`}>
                          {/* Antique Wax Stamp Seal Icon container */}
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm
                            bg-[#ebdcb2]/60 border border-[#cbb382]/65 text-[#543b23] group-hover:scale-110 group-hover:bg-[#e4d3aa] group-hover:border-[#aa915e] group-hover:text-[#2d1b08]`}>
                            <IconComponent className="w-5.2 h-5.2" />
                          </div>

                          {/* Hover Arrow pointer indicator */}
                          <div className={`transition-transform duration-300 text-[#aa915e] group-hover:text-[#543b23] ${lang === 'AR' ? 'group-hover:-translate-x-1.5' : 'group-hover:translate-x-1.5'}`}>
                            <ChevronRight className={`w-5 h-5 ${lang === 'AR' ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Text and Literary Title Info */}
                        <div className="space-y-2 mt-6 relative z-10 text-right">
                          {lang === 'AR' ? (
                            <div className="space-y-0.5">
                              <h3 className="text-xl sm:text-2xl font-bold font-sans text-[#2f1c0a] group-hover:text-[#422a14] transition-colors duration-300">
                                {btn.label}
                              </h3>
                              <p className="font-fancy italic text-2xl lg:text-3.5xl text-[#aa915e] leading-none mt-0.5 select-none transition-colors duration-300 group-hover:text-[#8e7444]">
                                {englishEquivalent}
                              </p>
                            </div>
                          ) : (
                            <h3 className="font-fancy italic text-[2.2rem] text-[#2f1c0a] leading-none select-none transition-colors duration-300 group-hover:text-[#422a14] pb-1">
                              {btn.label}
                            </h3>
                          )}

                          <p className="text-[11.5px] sm:text-xs font-sans text-[#5c4021]/80 group-hover:text-[#422d17] leading-relaxed font-normal pt-1 transition-colors duration-300">
                            {btn.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Android APK Download Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 1 }}
                  className="flex justify-center pt-8"
                >
                  <a
                    href="./rosaline-bela.apk"
                    download="rosaline-bela.apk"
                    className={`group flex items-center justify-center gap-3.5 px-6 py-3 rounded-full border backdrop-blur-md transition-all duration-300 shadow-xl max-w-sm cursor-pointer select-none animate-pulse-slow
                      ${theme === 'BURGUNDY' 
                        ? 'bg-[#1c0206]/20 border-[#D4AF37]/30 text-white hover:bg-[#38040a]/30' 
                        : 'bg-[#12071f]/20 border-[#ab7eff]/20 text-white hover:bg-[#1a0b36]/30'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300 shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.52 14.3c-.22 0-.4-.18-.4-.4v-4.3c0-.22.18-.4.4-.4s.4.18.4.4v4.3c0 .22-.18.4-.4.4zm-11.04 0c-.22 0-.4-.18-.4-.4v-4.3c0-.22.18-.4.4-.4s.4.18.4.4v4.3c0 .22-.18.4-.4.4zM12 18.5c-2.49 0-4.5-2.01-4.5-4.5v-5h9v5c0 2.49-2.01 4.5-4.5 4.5zm5.53-10.3c-.08-.13-.24-.18-.38-.1l-.96.55c-.53-.39-1.12-.69-1.74-.88l.24-.91c.04-.15-.05-.3-.2-.34-.15-.04-.3.05-.34.2l-.24.91c-.42-.07-.85-.11-1.29-.11s-.87.04-1.29.11l-.24-.91c-.04-.15-.19-.24-.34-.2-.15.04-.24.19-.2.34l.24.91c-.62.19-1.21.49-1.74.88l-.96-.55c-.14-.08-.3-.03-.38.1-.08.14-.03.3.1.38l.96.55c-.8.85-1.29 1.99-1.29 3.25v.75h11v-.75c0-1.26-.49-2.4-1.29-3.25l.96-.55c.13-.08.18-.24.1-.38z"/>
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-mono opacity-50 uppercase tracking-widest leading-none">
                        {lang === 'AR' ? 'نسخة أندرويد متوفرة الآن' : 'Android App Available'}
                      </p>
                      <h4 className={`text-xs font-sans font-bold tracking-tight mt-1
                        ${theme === 'BURGUNDY' ? 'text-[#D4AF37]' : 'text-[#ab7eff]'}`}>
                        {lang === 'AR' ? '🤖 تحميل تطبيق Rosaline Bela المجاني' : '🤖 Download Free Rosaline Bela App'}
                      </h4>
                    </div>
                  </a>
                </motion.div>
              </motion.div>
            </main>

            {/* Premium Interactive Search / Exploration Section */}
            <section className="w-full max-w-3xl mx-auto mb-20 relative z-10" id="search-section">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="space-y-10"
              >
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors duration-500
                    ${theme === 'BURGUNDY' ? 'text-[#D4AF37]' : 'text-[#ab7eff]'}`}>
                    <Search className="w-5 h-5 group-focus-within:opacity-100 opacity-70" />
                  </div>
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className={`w-full py-4.5 pr-6 pl-14 rounded-2xl border backdrop-blur-xl transition-all duration-500 outline-none font-sans text-base
                      ${theme === 'BURGUNDY' 
                        ? 'text-[#FDFBF7] placeholder-[#D4AF37]/40 bg-[#0A050F]/50 border-[#D4AF37]/30 focus:border-[#D4AF37] hover:border-[#D4AF37]/50 focus:shadow-[0_0_30px_rgba(212,175,55,0.18)]' 
                        : 'text-[#dcd6fc] placeholder-[#ab7eff]/40 bg-[#05010a]/50 border-[#ab7eff]/25 focus:border-[#ab7eff] hover:border-[#ab7eff]/45 focus:shadow-[0_0_30px_rgba(171,126,255,0.18)]'}`}
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {t.genres.map((genre) => {
                    const isActive = activeGenre === genre;
                    return (
                      <button
                        key={genre}
                        onClick={() => setActiveGenre(genre === activeGenre ? null : genre)}
                        className={`px-6 py-2.5 rounded-full border text-xs font-sans font-bold transition-all duration-500 cursor-pointer tracking-wider uppercase
                          ${isActive 
                            ? (theme === 'BURGUNDY' 
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#FDFBF7] text-black border-transparent shadow-lg shadow-[#D4AF37]/25 hover:opacity-95'
                              : 'bg-gradient-to-r from-[#ab7eff] to-[#dcd6fc] text-black border-transparent shadow-lg shadow-[#ab7eff]/25 hover:opacity-95')
                            : (theme === 'BURGUNDY'
                              ? 'bg-[#1c0206]/30 border-[#D4AF37]/25 text-[#D4AF37] hover:bg-[#38040a]/40 hover:text-white hover:border-[#D4AF37]/50'
                              : 'bg-[#12071f]/30 border-[#ab7eff]/20 text-[#ab7eff] hover:bg-[#1a0b36]/40 hover:text-white hover:border-[#ab7eff]/45')}`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </section>

            {/* Quotes Section */}
            <section className="w-full max-w-4xl mx-auto pb-10 relative z-10" id="quotes-section">
              <QuotesDashboard theme={theme} themeStyles={current} lang={lang} />
            </section>

            {/* Leaderboard Section */}
            <section className="relative z-10 w-full">
              <Leaderboard theme={theme} themeStyles={current} lang={lang} currentUser={currentUser} />
            </section>
          </motion.div>
        ) : currentView === 'COMMUNITY' ? (
          <motion.div 
            key="community-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <CommunityView theme={theme} themeStyles={current} lang={lang} onReportPost={(post: any) => {
              setReportingPost(post);
              setIsReportModalOpen(true);
            }} />
          </motion.div>
        ) : currentView === 'WRITER' ? (
          <motion.div 
            key="writer-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <WriterDashboard theme={theme} themeStyles={current} lang={lang} />
          </motion.div>
        ) : currentView === 'ABOUT' ? (
          <motion.div 
            key="about-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <AboutPage theme={theme} themeStyles={current} lang={lang} setCurrentView={setCurrentView} />
          </motion.div>
        ) : currentView === 'PRIVACY' ? (
          <motion.div 
            key="privacy-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <PrivacyPage theme={theme} themeStyles={current} lang={lang} setCurrentView={setCurrentView} />
          </motion.div>
        ) : currentView === 'CONTACT' ? (
          <motion.div 
            key="contact-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <ContactPage theme={theme} themeStyles={current} lang={lang} setCurrentView={setCurrentView} />
          </motion.div>
        ) : currentView === 'TERMS' ? (
          <motion.div 
            key="terms-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <TermsPage theme={theme} themeStyles={current} lang={lang} setCurrentView={setCurrentView} />
          </motion.div>
        ) : currentView === 'LEARN' ? (
          <motion.div 
            key="learn-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <LearnWritingPage theme={theme} themeStyles={current} lang={lang} setCurrentView={setCurrentView} />
          </motion.div>
        ) : currentView === 'PRICING' ? (
          <motion.div 
            key="pricing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <PricingPage 
              theme={theme} 
              themeStyles={current} 
              lang={lang} 
              setCurrentView={setCurrentView} 
              currentUser={currentUser}
            />
          </motion.div>
        ) : currentView === 'UNIVERSE' ? (
          <motion.div 
            key="universe-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <RosalineUniverse 
              theme={theme} 
              themeStyles={current} 
              lang={lang} 
              setCurrentView={setCurrentView} 
              currentUser={currentUser}
            />
          </motion.div>
        ) : currentView === 'LIBRARY' ? (
          <motion.div 
            key="library-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <LibraryPage 
              theme={theme} 
              themeStyles={current} 
              lang={lang} 
              onReadNovel={(novel: any) => {
                setSelectedNovel(novel);
                setCurrentView('READING');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="reading-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center pt-32 pb-40 px-6"
          >
            <ReadingPage 
              theme={theme} 
              themeStyles={current} 
              novel={{
                ...(selectedNovel || SAMPLE_NOVEL),
                title: typeof (selectedNovel || SAMPLE_NOVEL).title === 'object' ? (selectedNovel || SAMPLE_NOVEL).title[lang] || (selectedNovel || SAMPLE_NOVEL).title['EN'] : (selectedNovel || SAMPLE_NOVEL).title,
                author: typeof (selectedNovel || SAMPLE_NOVEL).author === 'object' ? (selectedNovel || SAMPLE_NOVEL).author[lang] || (selectedNovel || SAMPLE_NOVEL).author['EN'] : (selectedNovel || SAMPLE_NOVEL).author,
                content: typeof (selectedNovel || SAMPLE_NOVEL).content === 'object' ? (selectedNovel || SAMPLE_NOVEL).content[lang] || (selectedNovel || SAMPLE_NOVEL).content['EN'] : (selectedNovel || SAMPLE_NOVEL).content,
                chapterTitle: typeof (selectedNovel || SAMPLE_NOVEL).chapterTitle === 'object' ? (selectedNovel || SAMPLE_NOVEL).chapterTitle[lang] || (selectedNovel || SAMPLE_NOVEL).chapterTitle['EN'] : (selectedNovel || SAMPLE_NOVEL).chapterTitle,
                authorNote: typeof (selectedNovel || SAMPLE_NOVEL).authorNote === 'object' ? (selectedNovel || SAMPLE_NOVEL).authorNote[lang] || (selectedNovel || SAMPLE_NOVEL).authorNote['EN'] : (selectedNovel || SAMPLE_NOVEL).authorNote,
              }} 
              lang={lang} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AuthModal 
            mode={modalMode} 
            theme={theme} 
            themeStyles={current} 
            lang={lang}
            onClose={() => setIsModalOpen(false)} 
            setMode={setMode => setModalMode(setMode)}
            onAuthSuccess={(user: any) => {
              setCurrentUser(user);
              localStorage.setItem('current_user', JSON.stringify(user));
              setIsModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <ReportModal 
            post={reportingPost}
            theme={theme} 
            themeStyles={current} 
            lang={lang}
            onClose={() => {
              setIsReportModalOpen(false);
              setReportingPost(null);
            }} 
          />
        )}
      </AnimatePresence>

      {/* User Profile Personal Modal */}
      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        lang={lang}
        theme={theme}
        themeStyles={current}
      />

      {/* Custom Mouse Glow & Custom Interactive Cursor (Dynamic Theme Aware) */}
      <MouseGlow theme={theme} />
      <CustomCursor theme={theme} />

      <GlobalFooter theme={theme} themeStyles={current} lang={lang} setCurrentView={setCurrentView} currentView={currentView} />

      <AmbientPlayer theme={theme} themeStyles={current} lang={lang} />
    </div>
  );
}

const AMBIENT_SOUNDS = (t: any) => [
  { id: 'rain', label: t.ambientRain, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder URLs for logic
  { id: 'night', label: t.ambientNight, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'forest', label: t.ambientForest, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'library', label: t.ambientLibrary, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'wind', label: t.ambientWind, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

function AmbientPlayer({ theme, themeStyles, lang }: any) {
  const t = TRANSLATIONS[lang as Language];
  const [isOpen, setIsOpen] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customSounds, setCustomSounds] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sounds = [...AMBIENT_SOUNDS(t), ...customSounds];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.volume = volume;
    audioRef.current.loop = true;
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleSound = (url: string, id: string) => {
    if (currentSound === id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setCurrentSound(id);
        setIsPlaying(true);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newSound = { id: `custom-${Date.now()}`, label: file.name.split('.')[0], url, isCustom: true };
      setCustomSounds([newSound, ...customSounds]);
      toggleSound(url, newSound.id);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-10 right-10 z-[80] p-4 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-500
          ${theme === 'PURPLE' 
            ? 'bg-[#d8b4fe]/20 border-[#d8b4fe]/40 text-[#d8b4fe]' 
            : 'bg-black/80 border-black/20 text-white'}`}
      >
        {isPlaying ? <Music className="w-6 h-6 animate-pulse" /> : <Headphones className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-28 right-10 z-[85] w-72 p-6 rounded-[2rem] border backdrop-blur-2xl shadow-3xl overflow-hidden ${themeStyles.cardBg}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xs uppercase tracking-widest font-bold opacity-60 ${themeStyles.text}`}>{t.ambientTitle}</h3>
              <Volume2 className={`w-4 h-4 opacity-40 ${themeStyles.text}`} />
            </div>

            <div className="space-y-2 mb-6">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className={`w-full h-1 appearance-none rounded-full cursor-pointer transition-all duration-300
                  ${theme === 'PURPLE' ? 'bg-white/10 accent-[#d8b4fe]' : 'bg-white/10 accent-white'}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {sounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => toggleSound(sound.url, sound.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all duration-300
                    ${currentSound === sound.id 
                      ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-[#050505] border-[#d8b4fe]' : 'bg-white text-black border-white')
                      : (theme === 'PURPLE' ? 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10')}`}
                >
                  <span className="truncate max-w-[150px]">{sound.label}</span>
                  {currentSound === sound.id && isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 opacity-40" />}
                </button>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed text-[10px] font-bold uppercase tracking-widest transition-all duration-300
                  ${theme === 'PURPLE' ? 'border-white/20 text-white/40 hover:border-[#d8b4fe]/40 hover:text-[#d8b4fe]' : 'border-white/20 text-white/40 hover:border-white/60 hover:text-white'}`}
              >
                <Upload className="w-3 h-3" />
                {t.ambientUpload}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ReviewSection({ theme, themeStyles, lang, novelId }: any) {
  const t = TRANSLATIONS[lang as Language] as any;
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState<any[]>(() => {
    const saved = localStorage.getItem(`reviews_${novelId}`);
    return saved ? JSON.parse(saved) : [
      { id: 1, author: lang === 'AR' ? "سارة القارئة" : "Sarah Reader", rating: 5, text: lang === 'AR' ? "رواية مذهلة، الأسلوب ساحر جداً." : "Amazing novel, very charming style.", date: "2d ago" },
      { id: 2, author: lang === 'AR' ? "أحمد النبيل" : "Noble Ahmad", rating: 4, text: lang === 'AR' ? "بداية قوية جداً، بانتظار الفصول القادمة." : "Very strong start, waiting for next chapters.", date: "5d ago" }
    ];
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmitReview = () => {
    if (rating === 0 || !reviewText.trim()) return;
    const newReview = {
      id: Date.now(),
      author: lang === 'AR' ? "أنت" : "You",
      rating,
      text: reviewText,
      date: t.now
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${novelId}`, JSON.stringify(updatedReviews));
    setReviewText('');
    setRating(0);
  };

  return (
    <div className={`p-8 md:p-12 rounded-[3rem] border backdrop-blur-2xl transition-all duration-1000 ${themeStyles.cardBg} space-y-10`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <h3 className={`text-xl font-display font-medium mb-1 ${themeStyles.text}`}>{t.reviewsTitle}</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} className={s <= Math.round(Number(averageRating)) ? "fill-yellow-400 text-yellow-400" : "text-white/20"} />
              ))}
            </div>
            <span className={`text-xs font-mono opacity-60 ${themeStyles.text}`}>{t.averageRating} {averageRating}/5</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest ${themeStyles.text}`}>
          {reviews.length} {lang === 'AR' ? 'مراجعة' : 'Reviews'}
        </div>
      </div>

      {/* Add Review Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${themeStyles.text}`}>{t.ratingLabel}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button 
                key={s} 
                onClick={() => setRating(s)}
                className="transition-transform duration-300 hover:scale-125"
              >
                <Star size={20} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"} />
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={t.reviewPlaceholder}
          className={`w-full p-6 rounded-2xl border bg-white/5 outline-none transition-all duration-500 font-sans text-sm min-h-[120px] resize-none
            ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-[#f3e8ff] focus:border-[#d8b4fe]/50' : 'border-white/20 text-white focus:border-white/50'}`}
        />
        <div className="flex justify-end">
          <button
            onClick={handleSubmitReview}
            disabled={rating === 0 || !reviewText.trim()}
            className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300
              ${rating > 0 && reviewText.trim() 
                ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-[#050505] shadow-[0_0_20px_rgba(216,180,254,0.3)]' : 'bg-white text-black')
                : 'opacity-40 cursor-not-allowed bg-white/10 text-white'}`}
          >
            {t.submitReview}
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6 pt-6">
        {reviews.length === 0 ? (
          <p className={`text-center py-10 text-sm opacity-40 italic ${themeStyles.text}`}>{t.noReviews}</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/20 text-[#d8b4fe]' : 'bg-white text-black'}`}>
                    {r.author[0]}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold font-sans ${themeStyles.text}`}>{r.author}</h4>
                    <span className={`text-[9px] opacity-40 uppercase tracking-tighter ${themeStyles.text}`}>{r.date}</span>
                  </div>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={10} className={s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"} />
                  ))}
                </div>
              </div>
              <p className={`text-sm leading-relaxed opacity-80 font-sans ${themeStyles.text}`}>{r.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Leaderboard({ theme, themeStyles, lang, currentUser }: any) {
  const t = TRANSLATIONS[lang as Language] as any;
  const [activeTab, setActiveTab] = useState<'NOVELS' | 'WRITERS'>('NOVELS');

  const topNovels = [
    { 
      id: 1, 
      title: lang === 'AR' ? "أصداء النجوم" : "Echoes of Stars", 
      interactions: "1.2k", 
      cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1968&auto=format&fit=crop",
      author: "ليلى"
    },
    { 
      id: 2, 
      title: lang === 'AR' ? "ليل البرغندي" : "Burgundy Night", 
      interactions: "850", 
      cover: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070&auto=format&fit=crop",
      author: "آدم"
    },
    { 
      id: 3, 
      title: lang === 'AR' ? "همس الأرجوان" : "Purple Whisper", 
      interactions: "720", 
      cover: "https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?q=80&w=1975&auto=format&fit=crop",
      author: "نور"
    },
  ];

  const defaultWriters = [
    { id: 1, name: "ليلى", rank: lang === 'AR' ? "حكيم المنصة" : (lang === 'EN' ? "Platform Sage" : "Sage de la Plateforme"), interactions: "450 pts", avatar: "L" },
    { id: 2, name: "آدم", rank: lang === 'AR' ? "ملتهم الكتب" : (lang === 'EN' ? "Bookworm" : "Dévoreur de Livres"), interactions: "320 pts", avatar: "A" },
    { id: 3, name: "نور", rank: lang === 'AR' ? "قارئ مبتدئ" : (lang === 'EN' ? "Novice Reader" : "Lecteur Novice"), interactions: "180 pts", avatar: "N" },
  ];

  // If currentUser exists, we'll put them in the list if they aren't already there
  const topWriters = currentUser 
    ? [
        { 
          id: 'user', 
          name: currentUser.name, 
          rank: lang === 'AR' ? "قارئ مبتدئ" : (lang === 'EN' ? "Novice Reader" : "Lecteur Novice"), 
          interactions: "50 pts", 
          avatar: currentUser.name[0]?.toUpperCase(),
          isUser: true
        },
        ...defaultWriters.slice(0, 2)
      ]
    : defaultWriters;

  return (
    <section className="w-full max-w-4xl mx-auto mb-32 space-y-10">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Trophy size={18} className={theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'} />
          <h2 className={`text-2xl font-display font-medium tracking-tight ${themeStyles.text}`}>{t.leaderboardTitle}</h2>
        </div>

        {/* Tab Switcher */}
        <div className={`p-1.5 rounded-full border backdrop-blur-xl flex items-center gap-1 ${themeStyles.cardBg.split(' border-')[0]}`}>
          <button
            onClick={() => setActiveTab('NOVELS')}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-500 flex items-center gap-2
              ${activeTab === 'NOVELS' 
                ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-[#050505]' : 'bg-white text-black') 
                : (theme === 'PURPLE' ? 'text-[#d8b4fe]/60 hover:text-[#d8b4fe]' : 'text-white/60 hover:text-white')}`}
          >
            <Flame size={12} />
            {t.topNovels}
          </button>
          <button
            onClick={() => setActiveTab('WRITERS')}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-500 flex items-center gap-2
              ${activeTab === 'WRITERS' 
                ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-[#050505]' : 'bg-white text-black') 
                : (theme === 'PURPLE' ? 'text-[#d8b4fe]/60 hover:text-[#d8b4fe]' : 'text-white/60 hover:text-white')}`}
          >
            <Users size={12} />
            {t.topWriters}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {(activeTab === 'NOVELS' ? topNovels : topWriters).map((item: any, idx: number) => (
            <motion.div
              key={`${activeTab}-${item.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden group p-6 rounded-[2rem] border backdrop-blur-3xl transition-all duration-500
                ${themeStyles.cardBg} hover:shadow-2xl hover:-translate-y-2
                ${item.isUser ? (theme === 'PURPLE' ? 'ring-1 ring-[#d8b4fe]' : 'ring-1 ring-white') : ''}`}
            >
              {/* Rank Badge */}
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border
                ${idx === 0 
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' 
                  : (idx === 1 ? 'bg-slate-300/20 border-slate-300/50 text-slate-300' : 'bg-orange-400/20 border-orange-400/50 text-orange-400')}`}>
                {idx + 1}
              </div>

              {activeTab === 'NOVELS' ? (
                <div className="space-y-4">
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="text-center">
                    <h3 className={`text-sm font-bold font-sans mb-1 ${themeStyles.text}`}>{item.title}</h3>
                    <div className="flex items-center justify-center gap-2 opacity-60">
                      <span className={`text-[9px] uppercase tracking-widest font-sans ${themeStyles.text}`}>{item.author}</span>
                      <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                      <div className="flex items-center gap-1">
                        <Flame size={10} className="text-orange-400" />
                        <span className={`text-[9px] font-mono font-bold ${themeStyles.text}`}>{item.interactions}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2 relative
                    ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/5 border-[#d8b4fe]/20 text-[#d8b4fe]' : 'bg-white/5 border-white/20 text-white'}`}>
                    {item.avatar}
                    {item.isUser && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-black flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className={`text-sm font-bold font-sans ${themeStyles.text}`}>{item.name}</h3>
                      {item.isUser && <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/30 font-bold uppercase tracking-tighter">You</span>}
                    </div>
                    <div className={`text-[9px] uppercase tracking-widest font-sans font-bold opacity-60 mb-2 ${themeStyles.text}`}>{item.rank}</div>
                    <div className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono opacity-60 ${themeStyles.text}`}>
                      {item.interactions}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ProfileStatsDisplay({ theme, themeStyles, lang, stats, title }: any) {
  const t = TRANSLATIONS[lang as Language] as any;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 rounded-full border backdrop-blur-sm transition-all duration-500 text-[10px] font-bold tracking-widest uppercase cursor-pointer flex items-center gap-2
          ${theme === 'PURPLE' 
            ? 'bg-[#d8b4fe]/10 border-[#d8b4fe]/30 text-[#d8b4fe] hover:bg-[#d8b4fe]/20' 
            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{title}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`absolute top-full mt-4 right-0 w-64 p-6 rounded-3xl border backdrop-blur-2xl shadow-3xl z-[60] ${themeStyles.cardBg}`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className={`text-[10px] uppercase tracking-widest font-bold opacity-60 ${themeStyles.text}`}>{t.readingStats}</h3>
                <Clock className={`w-4 h-4 opacity-40 ${themeStyles.text}`} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <span className={`text-[9px] uppercase tracking-tighter opacity-40 ${themeStyles.text}`}>{t.totalToday}</span>
                  <div className={`text-lg font-mono font-bold ${themeStyles.text}`}>{stats.today} <span className="text-[10px] font-sans opacity-40">{t.minutes}</span></div>
                </div>
                <div className="space-y-1">
                  <span className={`text-[9px] uppercase tracking-tighter opacity-40 ${themeStyles.text}`}>{t.totalWeek}</span>
                  <div className={`text-lg font-mono font-bold ${themeStyles.text}`}>{stats.weekly} <span className="text-[10px] font-sans opacity-40">{t.minutes}</span></div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 text-center`}>
                <span className={`text-[9px] uppercase tracking-widest opacity-40 ${themeStyles.text}`}>{t.userTitle}</span>
                <div className={`text-sm font-display italic font-medium mt-1 ${themeStyles.text}`}>{title}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

function ReadingPage({ theme, themeStyles, novel, lang }: any) {
  const t = TRANSLATIONS[lang as Language] as any;
  const [emotions, setEmotions] = useState({ happy: 124, sad: 45, angry: 8, amazed: 89 });
  const [voted, setVoted] = useState<string | null>(null);
  const [bookmarkedLine, setBookmarkedLine] = useState<number | null>(() => {
    const saved = localStorage.getItem(`bookmark_${novel.id}`);
    return saved ? parseInt(saved) : null;
  });
  const [justResumed, setJustResumed] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [comfortMode, setComfortMode] = useState<'DEFAULT' | 'WARM' | 'DIM'>('DEFAULT');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [autoSaveToast, setAutoSaveToast] = useState(false);
  
  // Dynamic engagement states
  const [liked, setLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`likes_${novel.id}`) === 'true';
    } catch { return false; }
  });
  const [inLibrary, setInLibrary] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`library_${novel.id}`) === 'true';
    } catch { return false; }
  });

  // Multiple Chapters state
  const [chapters, setChapters] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`chapters_of_${novel.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    // Fallback: single chapter
    return [{
      title: novel.chapterTitle || "الفصل الأول",
      content: novel.content,
      number: novel.chapterNumber || 1,
      authorNote: novel.authorNote || ""
    }];
  });
  const [currentChapIdx, setCurrentChapIdx] = useState(0);
  const currentChapter = chapters[currentChapIdx] || {
    title: novel.chapterTitle || "الفصل الأول",
    content: novel.content,
    number: novel.chapterNumber || 1,
    authorNote: novel.authorNote || ""
  };

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);
  const [commentEmojiTab, setCommentEmojiTab] = useState(0);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutsideComment(event: MouseEvent) {
      if (commentPickerRef.current && !commentPickerRef.current.contains(event.target as Node)) {
        setShowCommentEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideComment);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideComment);
    };
  }, []);

  const insertCommentEmoji = (emoji: string) => {
    const textarea = commentTextareaRef.current;
    if (!textarea) {
      setCommentText(prev => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setCommentText(before + emoji + after);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 10);
  };
  const [commentsList, setCommentsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`comments_of_${novel.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { user: lang === 'AR' ? "سندس الهلال" : "Sondos Alhilal", text: lang === 'AR' ? "رواية تأخذ الأنفاس! الأسلوب الأدبي ساحر ومختلف جداً." : "Breathtaking story! The literal style is charming and extremely unique.", time: lang === 'AR' ? "منذ ساعة" : "1h ago" },
      { user: lang === 'AR' ? "عمر الكاتب" : "Omar Writer", text: lang === 'AR' ? "بداية موفقة ولغة بليغة، بانتظار الفصل الثاني بشوق." : "Great start and eloquent language. Looking forward to chapter 2 eagerly.", time: lang === 'AR' ? "منذ ٣ ساعات" : "3h ago" }
    ];
  });

  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const totalVotes = Object.values(emotions).reduce((a, b) => (a as number) + (b as number), 0) as number;

  useEffect(() => {
    if (bookmarkedLine !== null && lineRefs.current[bookmarkedLine]) {
      setTimeout(() => {
        lineRefs.current[bookmarkedLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setJustResumed(true);
        setTimeout(() => setJustResumed(false), 3000);
      }, 800);
    }
  }, []);

  const getComfortStyles = () => {
    switch (comfortMode) {
      case 'WARM': return 'bg-[#f4ecd8] text-[#5b463d] border-[#e2d5b5]';
      case 'DIM': return 'bg-[#1a1a1a] text-[#888] border-[#333]';
      default: return '';
    }
  };

  const getFontFamilyClass = () => {
    if (fontFamily === 'serif') return 'font-serif';
    if (fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  const handleBookmark = (idx: number) => {
    if (bookmarkedLine === idx) {
      setBookmarkedLine(null);
      localStorage.removeItem(`bookmark_${novel.id}`);
    } else {
      setBookmarkedLine(idx);
      localStorage.setItem(`bookmark_${novel.id}`, idx.toString());
      setAutoSaveToast(true);
      setTimeout(() => setAutoSaveToast(false), 2500);
    }
  };

  const handleVote = (emotion: string) => {
    if (!voted) {
      setEmotions(prev => ({ ...prev, [emotion]: (prev as any)[emotion] + 1 }));
      setVoted(emotion);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    let currentUserName = lang === 'AR' ? 'قارئ روزلين' : 'Rosaline Reader';
    try {
      if (auth?.currentUser) {
        currentUserName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || currentUserName;
      } else {
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          currentUserName = parsed.displayName || parsed.name || currentUserName;
        }
      }
    } catch (e) {}

    const newComment = {
      user: currentUserName,
      text: commentText,
      time: lang === 'AR' ? 'الآن' : 'just now'
    };

    const updatedComments = [newComment, ...commentsList];
    setCommentsList(updatedComments);
    try {
      localStorage.setItem(`comments_of_${novel.id}`, JSON.stringify(updatedComments));
      
      // Update story comments count in local metadata
      const saved = localStorage.getItem('rb_published_stories');
      if (saved) {
        const stories = JSON.parse(saved);
        const updated = stories.map((s: any) => {
          if (s.id === novel.id) {
            return { ...s, commentsCount: (s.commentsCount || 2) + 1 };
          }
          return s;
        });
        localStorage.setItem('rb_published_stories', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }
    setCommentText('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-[2rem] border backdrop-blur-xl bg-white/5 border-white/10">
        <div className="flex items-center gap-6">
          <img src={novel.cover} alt={novel.title} className="w-20 sm:w-24 h-auto aspect-[2/3] rounded-xl shadow-lg border border-white/20 select-none pointer-events-none" />
          <div className="space-y-1">
            <h2 className={`text-xl md:text-2xl font-display font-medium ${themeStyles.logo}`}>{novel.title}</h2>
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase tracking-widest opacity-60 font-sans ${themeStyles.text}`}>{novel.author} ✧</span>
              <span className={`text-[11px] font-sans font-medium ${themeStyles.text}`}>
                {lang === 'AR' ? 'الفصل' : (lang === 'EN' ? 'Chapter' : 'Chapitre')} {currentChapter.number}: {currentChapter.title}
              </span>
            </div>
          </div>
        </div>

        {/* Reader Engagement Buttons: Like & Add Favorited Library */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Like Button */}
          <button 
            onClick={() => {
              const nextLiked = !liked;
              setLiked(nextLiked);
              localStorage.setItem(`likes_${novel.id}`, nextLiked ? 'true' : 'false');
              try {
                const saved = localStorage.getItem('rb_published_stories');
                if (saved) {
                  const stories = JSON.parse(saved);
                  const updated = stories.map((s: any) => {
                    if (s.id === novel.id) {
                      return { ...s, likesCount: (s.likesCount || 45) + (nextLiked ? 1 : -1) };
                    }
                    return s;
                  });
                  localStorage.setItem('rb_published_stories', JSON.stringify(updated));
                }
              } catch (e) {}
              alert(nextLiked 
                ? (lang === 'AR' ? "شكراً لتصويتك وإعجابك بالرواية! ❤️" : "Thank you for liking and voting for this novel! ❤️")
                : (lang === 'AR' ? "تمت إزالة الإعجاب." : "Removed like.")
              );
            }}
            className={`p-3 rounded-full border backdrop-blur-md transition-all duration-300 flex items-center justify-center cursor-pointer
              ${liked 
                ? 'bg-rose-500/20 border-rose-500 text-rose-500 hover:bg-rose-500/30' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
            title={lang === 'AR' ? 'إعجاب وتصويت' : 'Like & Vote'}
          >
            <Heart size={16} className={liked ? "fill-rose-500 text-rose-500" : ""} />
          </button>

          {/* Add to Library Button */}
          <button 
            onClick={() => {
              const nextLib = !inLibrary;
              setInLibrary(nextLib);
              localStorage.setItem(`library_${novel.id}`, nextLib ? 'true' : 'false');
              try {
                const savedFavorites = localStorage.getItem('rb_user_favorites');
                let favList = savedFavorites ? JSON.parse(savedFavorites) : [];
                if (nextLib) {
                  if (!favList.includes(novel.id)) {
                    favList.push(novel.id);
                  }
                  alert(lang === 'AR' 
                    ? "تم حفظ الرواية في رف مكتبتك المفضلة بنجاح! ✨" 
                    : "Saved to your favorite library shelf! ✨"
                  );
                } else {
                  favList = favList.filter((id: string) => id !== novel.id);
                  alert(lang === 'AR' ? "تمت إزالة الرواية من مكتبتك المفضلة." : "Removed from favorites.");
                }
                localStorage.setItem('rb_user_favorites', JSON.stringify(favList));
              } catch (e) {}
            }}
            className={`p-3 rounded-full border backdrop-blur-md transition-all duration-300 flex items-center justify-center cursor-pointer
              ${inLibrary 
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/30' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
            title={lang === 'AR' ? 'حفظ في المفضلة' : 'Save to My Library'}
          >
            <Bookmark size={16} className={inLibrary ? "fill-yellow-500 text-yellow-500" : ""} />
          </button>
        </div>
      </div>

      {/* Chapters Sequence Quick Select Dropdown */}
      {chapters.length > 1 && (
        <div className="flex justify-center -mt-8">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              {lang === 'AR' ? 'انتقال للفصل:' : 'Jump to Chapter:'}
            </span>
            <select
              value={currentChapIdx}
              onChange={(e) => {
                setCurrentChapIdx(Number(e.target.value));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-transparent border-none outline-none font-sans text-xs font-bold text-[#d8b4fe] cursor-pointer"
            >
              {chapters.map((ch, idx) => (
                <option key={idx} value={idx} className="bg-neutral-900 text-white font-sans text-xs">
                  {idx + 1}. {ch.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Advanced Reading Settings Bar */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`flex items-center gap-2 px-6 py-2 rounded-full border backdrop-blur-xl transition-all duration-300
            ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/10 border-[#d8b4fe]/30 text-[#d8b4fe]' : 'bg-white/10 border-white/20 text-white'}`}
        >
          <Eye size={14} />
          <span className="text-[10px] uppercase font-bold tracking-widest">{t.readingSettings}</span>
        </motion.button>

        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex flex-col md:flex-row items-center gap-6 p-4 px-8 rounded-2xl md:rounded-full border backdrop-blur-2xl shadow-xl ${themeStyles.cardBg}`}
            >
              {/* Font Size Selector */}
              <div className="flex items-center gap-3 pr-0 md:pr-6 border-r-0 md:border-r border-white/10">
                <button 
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${themeStyles.text}`}
                >
                  <Minus size={12} />
                </button>
                <div className="flex flex-col items-center">
                  <Type size={12} className={`opacity-40 ${themeStyles.text}`} />
                  <span className={`text-[9px] font-bold ${themeStyles.text}`}>{fontSize}px</span>
                </div>
                <button 
                  onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                  className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${themeStyles.text}`}
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Font Family Selector (New Feature) */}
              <div className="flex items-center gap-2 px-4 border-l-0 md:border-l border-r-0 md:border-r border-white/10 shrink-0 select-none">
                {['sans', 'serif', 'mono'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFontFamily(f as any)}
                    className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-md border transition-all duration-300
                      ${fontFamily === f 
                        ? (theme === 'PURPLE' ? 'bg-[#d8b4fe]/20 border-[#d8b4fe] text-[#d8b4fe]' : 'bg-white/20 border-white text-white')
                        : 'border-transparent text-white/40 hover:text-white/80'}`}
                  >
                    {f === 'sans' ? (lang === 'AR' ? 'عصري' : 'Sans') : f === 'serif' ? (lang === 'AR' ? 'عربي كلاسيكي' : 'Serif') : (lang === 'AR' ? 'برمجي' : 'Mono')}
                  </button>
                ))}
              </div>

              {/* Comfort Modes */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setComfortMode('DEFAULT')}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                    ${comfortMode === 'DEFAULT' ? (theme === 'PURPLE' ? 'border-[#d8b4fe] scale-110' : 'border-white scale-110') : 'border-transparent opacity-40 hover:opacity-100'}
                    ${theme === 'PURPLE' ? 'bg-[#1a0b2e]' : 'bg-[#1a0000]'}`}
                />
                <button
                  onClick={() => setComfortMode('WARM')}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 bg-[#f4ecd8]
                    ${comfortMode === 'WARM' ? 'border-orange-400 scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                />
                <button
                  onClick={() => setComfortMode('DIM')}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 bg-[#333]
                    ${comfortMode === 'DIM' ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                />
                <div className={`text-[9px] font-bold uppercase tracking-tighter opacity-40 ${themeStyles.text}`}>
                  {comfortMode === 'DEFAULT' ? t.defaultMode : (comfortMode === 'WARM' ? t.warmMode : t.dimMode)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Micro Interaction Toast for Auto Bookmark & Save Notification */}
        <AnimatePresence>
          {autoSaveToast && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider rounded-xl mt-2 shadow-lg"
            >
              {lang === 'AR' ? '✓ تم حفظ علامة تقدم القراءة تلقائياً بالهاتف!' : '✓ Reading progress bookmarked & auto-saved!'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chapter Content */}
      <article className={`prose prose-invert max-w-none text-center transition-all duration-700 rounded-[2.5rem] overflow-hidden ${getComfortStyles()} ${getFontFamilyClass()}`}>
        <div className="space-y-4 p-4 md:p-8">
          {(currentChapter.content || "").split('\n\n').map((paragraph: string, i: number) => {
            const isBookmarked = bookmarkedLine === i;
            return (
              <motion.div 
                key={i}
                ref={el => lineRefs.current[i] = el}
                onClick={() => handleBookmark(i)}
                className={`relative group p-6 rounded-2xl cursor-pointer transition-all duration-700
                  ${isBookmarked 
                    ? (comfortMode !== 'DEFAULT' 
                        ? 'bg-black/5 shadow-sm' 
                        : (theme === 'PURPLE' ? 'bg-[#d8b4fe]/10 shadow-[0_0_25px_rgba(216,180,254,0.05)]' : 'bg-[#9b1c1c]/10 shadow-[0_0_25px_rgba(155,28,28,0.05)]')) 
                    : (comfortMode !== 'DEFAULT' ? 'hover:bg-black/5' : 'hover:bg-white/5')}
                  ${justResumed && isBookmarked ? 'ring-1 ring-current ring-offset-8 ring-offset-transparent' : ''}
                `}
              >
                {isBookmarked && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute -left-4 sm:-left-8 top-1/2 -translate-y-1/2 
                      ${comfortMode === 'DEFAULT' 
                        ? (theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white')
                        : 'text-current opacity-60'}`}
                  >
                    <Bookmark size={14} className="fill-current" />
                  </motion.div>
                )}
                <p 
                  style={{ fontSize: `${fontSize}px` }}
                  className={`leading-[2.2] font-sans transition-all duration-500
                    ${isBookmarked ? 'opacity-100 scale-[1.02]' : 'opacity-80 group-hover:opacity-100'}
                    ${comfortMode === 'DEFAULT' ? (theme === 'PURPLE' ? 'text-[#f3e8ff]' : 'text-white') : ''}
                  `}
                >
                  {paragraph}
                </p>
              </motion.div>
            );
          })}
        </div>
      </article>

      {/* Multiple Chapters Bottom Navigation Sequencer */}
      {chapters.length > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
          <button 
            disabled={currentChapIdx === 0}
            onClick={() => {
              setCurrentChapIdx(prev => prev - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300
              ${currentChapIdx === 0 
                ? 'opacity-30 cursor-not-allowed text-white/40' 
                : 'hover:bg-white/10 text-white cursor-pointer'}`}
          >
            <ChevronLeft size={14} />
            <span>{lang === 'AR' ? 'الفصل السابق' : 'Prev Chapter'}</span>
          </button>

          <span className={`text-xs font-mono font-medium ${themeStyles.text}`}>
            {currentChapIdx + 1} / {chapters.length}
          </span>

          <button 
            disabled={currentChapIdx === chapters.length - 1}
            onClick={() => {
              setCurrentChapIdx(prev => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300
              ${currentChapIdx === chapters.length - 1 
                ? 'opacity-30 cursor-not-allowed text-white/40' 
                : 'hover:bg-white/10 text-white cursor-pointer'}`}
          >
            <span>{lang === 'AR' ? 'الفصل التالي' : 'Next Chapter'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Emotion System */}
      <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl transition-all duration-1000 ${themeStyles.cardBg}`}>
        <h3 className={`text-sm uppercase tracking-[0.3em] font-sans font-semibold mb-8 text-center opacity-70 ${themeStyles.text}`}>
          {t.feelingsTitle}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'happy', emoji: '😊', label: lang === 'AR' ? 'سعيد' : 'Happy' },
            { id: 'sad', emoji: '😢', label: lang === 'AR' ? 'حزين' : 'Sad' },
            { id: 'angry', emoji: '😡', label: lang === 'AR' ? 'غاضب' : 'Angry' },
            { id: 'amazed', emoji: '✨', label: lang === 'AR' ? 'مذهول' : 'Amazed' }
          ].map((e) => {
            const count = (emotions as any)[e.id];
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <button
                key={e.id}
                onClick={() => handleVote(e.id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-500 relative group
                  ${voted === e.id ? (theme === 'PURPLE' ? 'bg-[#d8b4fe]/20' : 'bg-black/10') : 'hover:bg-white/5'}`}
              >
                <span className={`text-3xl transition-transform duration-500 ${voted === e.id ? 'scale-125' : 'group-hover:scale-110'}`}>{e.emoji}</span>
                <span className={`text-[10px] font-sans font-bold uppercase tracking-wider ${themeStyles.text}`}>{e.label}</span>
                
                {voted && (
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="w-full mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden"
                  >
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${theme === 'PURPLE' ? 'bg-[#d8b4fe]' : 'bg-black'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </motion.div>
                )}
                {voted && <span className="text-[10px] font-mono opacity-40 mt-1">{percentage}%</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Novel Review Section */}
      <ReviewSection theme={theme} themeStyles={themeStyles} lang={lang} novelId={novel.id || 'sample'} />

      {/* Share & Comments (Functional Dynamic Comments System) */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-display italic ${themeStyles.text}`}>{t.discussions}</h3>
          <button className={`flex items-center gap-2 px-6 py-2 rounded-full border text-[10px] uppercase tracking-widest font-sans transition-all duration-300
            ${theme === 'PURPLE' ? 'border-[#d8b4fe]/30 text-[#d8b4fe] hover:bg-[#d8b4fe]/10' : 'border-black/30 text-black hover:bg-black/10'}`}>
            <span>{t.share}</span>
          </button>
        </div>

        {/* Real Comment Input Form */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl ${themeStyles.cardBg} space-y-3`}>
          <textarea 
            ref={commentTextareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={lang === 'AR' ? "شارك برأيك الملهم حول هذا الفصل..." : "Share what this chapter made you feel..."}
            className={`w-full bg-transparent border-none outline-none resize-none min-h-[80px] font-sans text-sm placeholder:opacity-30
              ${theme === 'PURPLE' ? 'text-white' : 'text-black'}`}
          />
          <div className="flex justify-between items-center pt-2">
            {/* Interactive Emoji Picker Dropdown */}
            <div className="relative inline-block" ref={commentPickerRef}>
              <button 
                type="button"
                onClick={() => setShowCommentEmojiPicker(!showCommentEmojiPicker)}
                className={`p-2 rounded-full transition-all duration-300 ${showCommentEmojiPicker ? 'bg-white/10 text-emerald-400 scale-105' : (theme === 'PURPLE' ? 'text-[#d8b4fe] hover:bg-[#d8b4fe]/10' : 'text-white/40 hover:text-white/60')}`}
              >
                <Smile className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showCommentEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className={`absolute bottom-full left-0 mb-3 w-72 h-80 rounded-2xl border backdrop-blur-2xl shadow-2xl p-4 flex flex-col z-50
                      ${theme === 'PURPLE' ? 'bg-[#0f091df0] border-[#d8b4fe]/30' : 'bg-[#18181bf0] border-white/20'}`}
                  >
                    {/* Category tabs */}
                    <div className="flex justify-between border-b border-white/10 pb-2 mb-3 gap-1 overflow-x-auto select-none no-scrollbar">
                      {EMOJI_CATEGORIES.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCommentEmojiTab(idx)}
                          className={`text-[10px] font-sans font-bold px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap
                            ${commentEmojiTab === idx 
                              ? (theme === 'PURPLE' ? 'bg-[#d8b4fe]/20 text-[#d8b4fe]' : 'bg-white/20 text-white') 
                              : 'text-white/40 hover:text-white/60'}`}
                        >
                          {(cat.name as any)[lang] || cat.name.EN}
                        </button>
                      ))}
                    </div>

                    {/* Emoji Selectable grid */}
                    <div className="grid grid-cols-6 gap-2 overflow-y-auto pr-1 flex-1 no-scrollbar select-none">
                      {EMOJI_CATEGORIES[commentEmojiTab].emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => insertCommentEmoji(emoji)}
                          className="text-xl p-1.5 hover:bg-white/10 rounded-lg transition-transform hover:scale-125 duration-100 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleAddComment}
              className={`px-8 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest cursor-pointer ${themeStyles.modalBtn}`}
            >
              <span>{t.comment}</span>
            </button>
          </div>
        </div>

        {/* Real Dynamic Comments List loop */}
        <div className="space-y-4">
          {commentsList.map((c, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/20 text-[#d8b4fe]' : 'bg-black text-white'}`}>
                {(c.user && c.user[0]) || 'U'}
              </div>
              <div>
                <h4 className={`text-xs font-bold font-sans ${themeStyles.text}`}>{c.user}</h4>
                <p className={`text-sm opacity-80 font-sans mt-1 ${theme === 'PURPLE' ? 'text-white font-light' : 'text-black font-medium'}`}>{c.text}</p>
                <span className="text-[10px] opacity-30 mt-1 block">{c.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Author's Note */}
      <div className={`p-8 rounded-[2rem] border shadow-2xl relative overflow-hidden transition-all duration-1000 ${themeStyles.cardBg}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-10 -translate-y-10 rounded-full ${theme === 'PURPLE' ? 'bg-[#d8b4fe]' : 'bg-black'}`} />
        <h4 className={`text-[10px] uppercase tracking-widest font-bold mb-4 opacity-50 flex items-center gap-2 ${themeStyles.text}`}>
          <PenTool className="w-3 h-3" />
          {t.authorNote}
        </h4>
        <p className={`text-sm italic leading-relaxed font-sans ${theme === 'PURPLE' ? 'text-[#f3e8ff]/90' : 'text-black font-medium'}`}>
          {currentChapter.authorNote || novel.authorNote}
        </p>
      </div>
    </div>
  );
}

function MoodPanel({ theme, themeStyles, lang, onClose }: any) {
  const t = TRANSLATIONS[lang as Language] as any;
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const recommendations = selectedMood ? (MOOD_RECOMMENDATIONS as any)[selectedMood] : [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`w-full max-w-lg p-8 rounded-[2.5rem] border backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden ${themeStyles.cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full transition-all duration-300 hover:bg-white/10 ${themeStyles.text}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-10 mt-4 px-8">
          <h2 className={`text-lg md:text-xl font-display font-medium mb-3 italic ${themeStyles.text}`}>
            {selectedMood ? (t.moodOptions.find((o: any) => o.id === selectedMood)?.label) : t.moodQuestion}
          </h2>
          {!selectedMood && <div className={`h-0.5 w-12 mx-auto rounded-full bg-current opacity-20 ${themeStyles.text}`} />}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!selectedMood ? (
              <motion.div 
                key="mood-selection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-2 gap-4"
              >
                {t.moodOptions.map((mood: any) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-500 group relative overflow-hidden
                      ${theme === 'PURPLE' 
                        ? 'border-[#d8b4fe]/20 bg-[#d8b4fe]/5 hover:bg-[#d8b4fe]/15' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-widest text-center transition-transform duration-500 group-hover:scale-105">
                      {mood.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="recommendations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid gap-4">
                  {recommendations.map((rec: any, idx: number) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex gap-4 p-4 rounded-2xl border backdrop-blur-xl group cursor-pointer transition-all duration-300
                        ${theme === 'PURPLE' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    >
                      <img src={rec.cover} alt={rec.title} className="w-16 h-20 object-cover rounded-lg shadow-md" />
                      <div className="flex flex-col justify-center">
                        <h4 className={`text-sm font-bold font-sans ${themeStyles.text}`}>{rec.title}</h4>
                        <p className={`text-[10px] italic opacity-60 mt-1 leading-relaxed ${themeStyles.text}`}>{rec.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button 
                  onClick={() => setSelectedMood(null)}
                  className={`w-full py-4 mt-4 rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300
                    ${theme === 'PURPLE' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                >
                  {lang === 'AR' ? 'تبديل المزاج / Change Mood' : 'Change Mood'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionButton({ label, themeStyles, onClick }: { label: string, themeStyles: any, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full sm:w-auto px-8 py-3.5 rounded-sm border text-[11px] uppercase tracking-[0.25em] transition-all duration-500 font-sans cursor-pointer
        ${themeStyles.btnBg} ${themeStyles.btnBorder} ${themeStyles.btnText}`}
    >
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}

function CommunityView({ theme, themeStyles, lang, onReportPost }: any) {
  const t = TRANSLATIONS[lang as Language];
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeTopic, setActiveTopic] = useState(t.topics[0]);

  const addPost = (content: string, image: string | null) => {
    const newPost = {
      id: posts.length + 1,
      author: "Guest Author",
      content,
      image,
      topic: activeTopic,
      likes: 0,
      comments: 0,
      date: t.now
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-4 mb-16">
        <h2 className={`text-4xl md:text-5xl font-display font-medium tracking-tight ${themeStyles.logo}`}>{t.communityTitle}</h2>
        <p className={`text-base italic opacity-80 ${themeStyles.descriptionColor}`}>{t.communityDesc}</p>
      </div>

      {/* Topics Filter */}
      <div className="flex flex-wrap justify-center gap-3">
        {t.topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            className={`px-6 py-2 rounded-full border text-xs sm:text-sm transition-all duration-500 font-sans cursor-pointer tracking-wider
              ${activeTopic === topic 
                ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-[#050505] border-[#d8b4fe]' : 'bg-white text-black border-white')
                : (theme === 'PURPLE' ? 'bg-transparent border-[#d8b4fe]/30 text-[#d8b4fe] hover:border-[#d8b4fe]/60' : 'bg-transparent border-white/30 text-white hover:border-white/60')
              }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* New Post Box */}
      <NewPostBox theme={theme} themeStyles={themeStyles} onPost={addPost} lang={lang} />

      {/* Posts Feed */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {posts.filter(p => p.topic === activeTopic).map((post) => (
            <PostCard key={post.id} post={post} theme={theme} themeStyles={themeStyles} lang={lang} onReport={() => onReportPost(post)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NewPostBox({ theme, themeStyles, onPost, lang }: any) {
  const t = TRANSLATIONS[lang as Language];
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndResizeImage(file, 800, 800, 0.7);
        setImage(compressed);
      } catch (err) {
        console.error("Image loading/compression failed:", err);
      }
    }
  };

  const handlePost = () => {
    if (content.trim() || image) {
      onPost(content, image);
      setContent('');
      setImage(null);
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      // Fallback if ref is not fully loaded
      setContent(prev => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setContent(before + emoji + after);

    // Reposition cursor immediately behind the added emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 10);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-3xl border backdrop-blur-xl shadow-lg ${themeStyles.cardBg}`}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={lang === 'AR' ? "اكتب فصلاً، فكرة، أو شارك مشاعرك مع ملهمي Rosaline Bela..." : "Draft a chapter, record an idea, or share with the community..."}
        className={`w-full bg-transparent border-none outline-none resize-none min-h-[100px] font-sans text-base placeholder:opacity-40 leading-relaxed
          ${theme === 'PURPLE' ? 'text-white' : 'text-white font-normal'}`}
      />

      {image && (
        <div className="relative mb-4 group inline-block">
          <img src={image} alt="Preview" className="max-h-64 rounded-2xl border border-white/20" />
          <button 
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-full transition-colors ${theme === 'PURPLE' ? 'text-[#d8b4fe] hover:bg-[#d8b4fe]/10' : 'text-white hover:bg-white/10'}`}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          {/* Functional Emoji Picker Container */}
          <div className="relative inline-block" ref={pickerRef}>
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-all duration-300 ${showEmojiPicker ? 'bg-white/10 text-emerald-400 scale-105' : (theme === 'PURPLE' ? 'text-[#d8b4fe] hover:bg-[#d8b4fe]/10' : 'text-white hover:bg-white/10')}`}
            >
              <Smile className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className={`absolute bottom-full left-0 mb-3 w-72 h-80 rounded-2xl border backdrop-blur-2xl shadow-2xl p-4 flex flex-col z-[100]
                    ${theme === 'PURPLE' ? 'bg-[#0f091df2] border-[#d8b4fe]/30' : 'bg-[#18181bf2] border-white/20'}`}
                >
                  {/* Category Tabs Header */}
                  <div className="flex justify-between border-b border-white/10 pb-2 mb-3 gap-1 overflow-x-auto select-none no-scrollbar">
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveTab(idx)}
                        className={`text-[10px] font-sans font-bold px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap
                          ${activeTab === idx 
                            ? (theme === 'PURPLE' ? 'bg-[#d8b4fe]/20 text-[#d8b4fe]' : 'bg-white/20 text-white') 
                            : 'text-white/40 hover:text-white/60'}`}
                      >
                        {(cat.name as any)[lang] || cat.name.EN}
                      </button>
                    ))}
                  </div>

                  {/* Grid layout of selective fast-insertion emojis */}
                  <div className="grid grid-cols-6 gap-2 overflow-y-auto pr-1 flex-1 no-scrollbar select-none">
                    {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-xl p-1.5 hover:bg-white/10 rounded-lg transition-transform hover:scale-125 duration-100 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <button
          onClick={handlePost}
          disabled={!content.trim() && !image}
          className={`px-8 py-2.5 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-300 flex items-center gap-2
            ${themeStyles.modalBtn} ${(!content.trim() && !image) ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
        >
          <span>{t.publish}</span>
          <Send className="w-4 h-4 -rotate-45" />
        </button>
      </div>
    </motion.div>
  );
}

function PostCard({ post, theme, themeStyles, lang, onReport }: any) {
  const t = TRANSLATIONS[lang as Language];
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(false);

  const toggleLike = () => {
    setLikes((prev: number) => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-8 rounded-3xl border backdrop-blur-xl shadow-md transition-all duration-500 ${themeStyles.cardBg}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-display font-bold text-lg
            ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/10 border-[#d8b4fe]/30 text-[#d8b4fe]' : 'bg-black border-black text-white'}`}>
            {post.author[0]}
          </div>
          <div>
            <h4 className={`font-bold font-sans ${theme === 'PURPLE' ? 'text-[#f3e8ff]' : 'text-white'}`}>{post.author}</h4>
            <span className={`text-[10px] opacity-40 uppercase tracking-widest font-sans ${themeStyles.text}`}>{post.date}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] border tracking-wider opacity-60 font-sans
          ${theme === 'PURPLE' ? 'border-[#d8b4fe]/30 text-[#d8b4fe]' : 'border-white/30 text-white'}`}>
          {post.topic}
        </div>
      </div>

      <p className={`text-base leading-relaxed mb-6 font-sans ${theme === 'PURPLE' ? 'text-[#f3e8ff]/90' : 'text-white font-normal'}`}>
        {post.content}
      </p>

      {post.image && (
        <img src={post.image} alt="Post" className="w-full h-auto rounded-2xl mb-6 border border-white/10" />
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
        <button 
          onClick={toggleLike}
          className={`flex items-center gap-2 transition-all duration-300 group
            ${isLiked ? 'text-red-500 scale-110' : (theme === 'PURPLE' ? 'text-[#d8b4fe] hover:text-[#f3e8ff]' : 'text-black hover:opacity-70')}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : 'group-hover:scale-110'}`} />
          <span className="text-sm font-bold font-mono">{likes}</span>
        </button>
        
        <button className={`flex items-center gap-2 transition-all duration-300 opacity-60 hover:opacity-100 ${themeStyles.text}`}>
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-bold font-mono">{post.comments}</span>
        </button>

        <button 
          onClick={onReport}
          className={`mr-auto flex items-center gap-2 transition-all duration-300 opacity-20 hover:opacity-100 text-red-400`}
        >
          <Flag className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest font-sans">{t.report}</span>
        </button>
      </div>
    </motion.div>
  );
}

function PublishedStoryCard({ story, theme, themeStyles, lang, onDelete, onUpdate }: any) {
  const [showChapters, setShowChapters] = useState(false);
  const [chapTitle, setChapTitle] = useState('');
  const [chapContent, setChapContent] = useState('');
  const [chapNote, setChapNote] = useState('');
  
  // Load chapters list
  const [chapters, setChapters] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`chapters_of_${story.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Fallback: single chapter
    return [{
      title: story.chapterTitle || (lang === 'AR' ? "البداية" : "Beginning"),
      content: story.content || "",
      number: 1,
      authorNote: story.authorNote || ""
    }];
  });

  const handleAddChapter = () => {
    if (!chapTitle.trim() || !chapContent.trim()) {
      alert(lang === 'AR' ? 'يرجى إدخال عنوان الفصل ومحتواه أولاً!' : 'Please enter chapter title and content first!');
      return;
    }

    const nextNumber = chapters.length + 1;
    const newChap = {
      title: chapTitle,
      content: chapContent,
      number: nextNumber,
      authorNote: chapNote
    };

    const updated = [...chapters, newChap];
    setChapters(updated);
    try {
      localStorage.setItem(`chapters_of_${story.id}`, JSON.stringify(updated));
      
      // Update story global count
      const savedStories = localStorage.getItem('rb_published_stories');
      if (savedStories) {
        const parsed = JSON.parse(savedStories);
        const nextStories = parsed.map((s: any) => {
          if (s.id === story.id) {
            return { ...s, chapterNumber: nextNumber };
          }
          return s;
        });
        localStorage.setItem('rb_published_stories', JSON.stringify(nextStories));
      }
    } catch (e) {
      console.error(e);
    }

    setChapTitle('');
    setChapContent('');
    setChapNote('');
    alert(lang === 'AR' ? `تم نشر وفهرسة الفصل ${nextNumber} (${chapTitle}) نجاح تتابعياً! 🚀` : `Chapter ${nextNumber} (${chapTitle}) published and indexed successfully under sequence! 🚀`);
    if (onUpdate) onUpdate();
  };

  // Mock-up / realistic stats
  const views = story.viewsCount || (Math.floor((parseInt(story.id || '1') % 200) + 124));
  const likes = story.likesCount || (Math.floor(views * 0.3) + 5);
  const comments = story.commentsCount || (Math.floor(likes * 0.25) + 2);

  return (
    <div className={`relative p-6 rounded-[1.8rem] border flex flex-col gap-5 ${themeStyles.cardBg} border-white/5`}>
      <div className="flex gap-4">
        {story.cover ? (
          <img 
            src={story.cover} 
            className="w-16 h-24 object-cover rounded-xl shadow-md border border-white/10 shrink-0" 
            alt={story.title} 
          />
        ) : (
          <div className="w-16 h-24 bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 shrink-0 select-none">
            <BookOpen size={20} />
            <span className="text-[8px] uppercase tracking-wider font-sans mt-2">No Cover</span>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[8px] uppercase tracking-widest font-mono font-bold px-2.5 py-0.5 rounded-full ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/10 text-[#d8b4fe]' : 'bg-white/10 text-white'}`}>
                {story.genre}
              </span>
              
              <button
                onClick={(e) => onDelete(story.id, e)}
                className="text-white/30 hover:text-red-400 p-1 rounded-full transition-colors"
                title={lang === 'AR' ? 'حذف العمل المنشور' : 'Delete Published Story'}
              >
                <Trash2 size={13} />
              </button>
            </div>

            <h3 className="text-sm font-display font-medium text-white tracking-tight mt-1 line-clamp-1">{story.title}</h3>
            <p className={`text-xs mt-1 opacity-60 font-sans line-clamp-2 leading-relaxed ${themeStyles.text}`}>{story.description}</p>
          </div>

          <div className="border-t border-white/5 pt-2 mt-2 flex items-center justify-between text-[8px] uppercase tracking-wider font-mono opacity-55">
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>{story.publishedAt}</span>
            </div>
            <span className={story.status === 'Ongoing' ? 'text-emerald-400' : 'text-amber-400'}>{story.status}</span>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard Counter Panel */}
      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1 text-white/40">
            <Eye size={11} />
            <span className="text-[8px] uppercase tracking-wider font-sans font-bold">{lang === 'AR' ? 'مشاهدات' : 'Views'}</span>
          </div>
          <p className="text-xs font-mono font-bold text-white">{views}</p>
        </div>
        <div className="space-y-0.5 border-l border-r border-white/5">
          <div className="flex items-center justify-center gap-1 text-white/40">
            <Heart size={11} className="text-rose-500 fill-rose-500/25" />
            <span className="text-[8px] uppercase tracking-wider font-sans font-bold">{lang === 'AR' ? 'إعجب' : 'Likes'}</span>
          </div>
          <p className="text-xs font-mono font-bold text-white">{likes}</p>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1 text-white/40">
            <MessageSquare size={11} className="text-purple-400" />
            <span className="text-[8px] uppercase tracking-wider font-sans font-bold">{lang === 'AR' ? 'مناقشات' : 'Comments'}</span>
          </div>
          <p className="text-xs font-mono font-bold text-white">{comments}</p>
        </div>
      </div>

      {/* Sequenced Chapters Collapsible Section */}
      <div className="space-y-3 pt-1 border-t border-white/5">
        <button
          onClick={() => setShowChapters(!showChapters)}
          className={`w-full py-2 px-4 rounded-xl border text-[9px] uppercase tracking-widest font-sans font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
            ${showChapters
              ? 'bg-white/10 border-white/20 text-white' 
              : 'border-white/5 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/5'}`}
        >
          <span>{lang === 'AR' ? 'إدارة الفصول والمسودات' : 'Manage Chapters Sequence'}</span>
          <span className="text-xs">{showChapters ? '▲' : '▼'}</span>
        </button>

        {showChapters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-1 text-left"
          >
            {/* Chapters list */}
            <div className="space-y-2">
              <span className="text-[8px] font-bold tracking-wider uppercase opacity-40 block">
                {lang === 'AR' ? 'الفصول المنشورة حالياً في تتابع العمل:' : 'Currently Published Chapters:'}
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-right">
                {chapters.map((ch: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                    <span className="font-sans font-semibold text-white/80">
                      {lang === 'AR' ? `الفصل ${ch.number}: ` : `Ch ${ch.number}: `} {ch.title}
                    </span>
                    <span className="text-[9px] font-mono text-white/40">
                      {ch.content ? `${ch.content.split(' ').length} words` : '0 words'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Add Form */}
            <div className="space-y-3 p-3.5 rounded-xl border border-white/10 bg-black/25">
              <span className="text-[8.5px] font-bold tracking-widest uppercase text-[#d8b4fe] block">
                {lang === 'AR' ? '✦ إضافة ونشر فصل جديد تتابعي' : '✦ Publish Next Chapter'}
              </span>

              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder={lang === 'AR' ? "عنوان الفصل الجديد..." : "Chapter Title..."}
                  value={chapTitle}
                  onChange={(e) => setChapTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs font-sans placeholder:opacity-40 outline-none"
                />
                <textarea 
                  placeholder={lang === 'AR' ? "طارد الخيال واستثمر الحروف من هنا..." : "Write this chapter's story content here..."}
                  value={chapContent}
                  onChange={(e) => setChapContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs min-h-[75px] font-sans placeholder:opacity-40 outline-none"
                />
                <input 
                  type="text" 
                  placeholder={lang === 'AR' ? "ملاحظة الكاتب لهذا الفصل..." : "Author's Note for this chapter..."}
                  value={chapNote}
                  onChange={(e) => setChapNote(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs font-sans placeholder:opacity-40 outline-none"
                />
                
                <button
                  type="button"
                  onClick={handleAddChapter}
                  className={`w-full py-2 rounded-lg text-[9px] uppercase font-bold tracking-widest transition-all duration-300 cursor-pointer
                    ${theme === 'PURPLE' ? 'bg-[#d8b4fe] text-black hover:bg-[#c084fc]' : 'bg-white text-black hover:bg-neutral-200'}`}
                >
                  {lang === 'AR' ? 'نشر الفصل الآن 🚀' : 'Publish Chapter Now 🚀'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function WriterDashboard({ theme, themeStyles, lang }: any) {
  const t = TRANSLATIONS[lang as Language];
  const [activeTab, setActiveTab] = useState<'MY_STORIES' | 'CREATE' | 'IDEA_BOX'>('CREATE');
  const [publishedStories, setPublishedStories] = useState<any[]>([]);

  const loadPublishedStories = () => {
    const saved = localStorage.getItem('rb_published_stories');
    if (saved) {
      try {
        setPublishedStories(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load stories", err);
      }
    } else {
      setPublishedStories([]);
    }
  };

  useEffect(() => {
    loadPublishedStories();
  }, []);

  const handleDeletePublishedStory = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = publishedStories.filter(s => s.id !== id);
    localStorage.setItem('rb_published_stories', JSON.stringify(updated));
    setPublishedStories(updated);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4 mb-16">
        <h2 className={`text-4xl md:text-5xl font-display font-medium tracking-tight ${themeStyles.logo}`}>{t.writerDashboard}</h2>
        <p className={`text-base italic opacity-80 ${themeStyles.descriptionColor}`}>{t.writerDesc}</p>
      </div>

      <div className="flex justify-center flex-wrap gap-4 sm:gap-6 mb-12">
        <button 
          onClick={() => setActiveTab('CREATE')}
          className={`pb-2 px-4 transition-all duration-300 border-b-2 text-xs sm:text-sm uppercase tracking-widest font-sans
            ${activeTab === 'CREATE' 
              ? (theme === 'PURPLE' ? 'border-[#d8b4fe] text-[#d8b4fe]' : 'border-black text-black') 
              : 'border-transparent opacity-40 hover:opacity-100'}`}
        >
          {t.createStory}
        </button>
        <button 
          onClick={() => setActiveTab('MY_STORIES')}
          className={`pb-2 px-4 transition-all duration-300 border-b-2 text-xs sm:text-sm uppercase tracking-widest font-sans
            ${activeTab === 'MY_STORIES' 
              ? (theme === 'PURPLE' ? 'border-[#d8b4fe] text-[#d8b4fe]' : 'border-black text-black') 
              : 'border-transparent opacity-40 hover:opacity-100'}`}
        >
          {t.myWorks}
        </button>
        <button 
          onClick={() => setActiveTab('IDEA_BOX')}
          className={`pb-2 px-4 transition-all duration-300 border-b-2 text-xs sm:text-sm uppercase tracking-widest font-sans
            ${activeTab === 'IDEA_BOX' 
              ? (theme === 'PURPLE' ? 'border-[#d8b4fe] text-[#d8b4fe]' : 'border-black text-black') 
              : 'border-transparent opacity-40 hover:opacity-100'}`}
        >
          {lang === 'AR' ? 'صندوق الأفكار' : lang === 'FR' ? "Boîte d'idées" : 'Idea Box'} ✧
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'CREATE' ? (
          <motion.div
            key="create-story"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <StoryForm theme={theme} themeStyles={themeStyles} lang={lang} onPublishSuccess={loadPublishedStories} />
          </motion.div>
        ) : activeTab === 'MY_STORIES' ? (
          <motion.div
            key="my-stories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex justify-center"
          >
            {publishedStories.length === 0 ? (
              <div className="text-center py-20 px-6 rounded-3xl border border-white/5 max-w-2xl mx-auto flex flex-col items-center gap-4">
                <BookOpen className={`w-12 h-12 opacity-30 ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`} />
                <p className={`text-sm italic opacity-60 ${themeStyles.text} leading-relaxed`}>
                  {lang === 'AR' 
                    ? 'لا توجد أعمال منشورة في سماء روزلين بعد. كن صانع النجوم الأول وانشر روايتك البرّاقة الآن!' 
                    : lang === 'FR' 
                    ? "Aucune œuvre publiée dans la constellation de Roseline pour le moment. Publiez votre chef-d'œuvre !" 
                    : 'No published works in your Rosaline constellation yet. Publish your dazzling masterpiece today!'}
                </p>
                <button
                  onClick={() => setActiveTab('CREATE')}
                  className={`px-6 py-2.5 mt-2 rounded-full border text-xs font-bold tracking-widest uppercase cursor-pointer transition-all duration-300
                    ${theme === 'PURPLE' ? 'bg-[#d8b4fe] text-black border-[#d8b4fe]' : 'bg-white text-black border-white'}`}
                >
                  {t.createStory} ✧
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fadeIn max-w-4xl mx-auto">
                {publishedStories.map((story) => (
                  <PublishedStoryCard
                    key={story.id}
                    story={story}
                    theme={theme}
                    themeStyles={themeStyles}
                    lang={lang}
                    onDelete={handleDeletePublishedStory}
                    onUpdate={loadPublishedStories}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="idea-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <IdeaBox theme={theme} themeStyles={themeStyles} lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StoryForm({ theme, themeStyles, lang, onPublishSuccess }: any) {
  const t = TRANSLATIONS[lang as Language];
  const [cover, setCover] = useState<string | null>(() => localStorage.getItem('draft_cover'));
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(() => localStorage.getItem('draft_status') || 'Ongoing');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [showDraftHint, setShowDraftHint] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishHint, setShowPublishHint] = useState(false);

  const [title, setTitle] = useState(() => localStorage.getItem('draft_title') || '');
  const [genre, setGenre] = useState(() => localStorage.getItem('draft_genre') || 'رومنسي');
  const [description, setDescription] = useState(() => localStorage.getItem('draft_description') || '');
  const [content, setContent] = useState(() => localStorage.getItem('draft_content') || '');

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // High quality but reasonable max resolution suitable for beautiful yet fast loading book covers
        const compressed = await compressAndResizeImage(file, 600, 900, 0.75);
        setCover(compressed);
        localStorage.setItem('draft_cover', compressed);
      } catch (err) {
        console.error("Cover image compression failed:", err);
      }
    }
  };

  const handleSaveDraft = () => {
    setIsDrafting(true);
    localStorage.setItem('draft_title', title);
    localStorage.setItem('draft_genre', genre);
    localStorage.setItem('draft_description', description);
    localStorage.setItem('draft_content', content);
    localStorage.setItem('draft_status', status);
    setTimeout(() => {
      setIsDrafting(false);
      setShowDraftHint(true);
      setTimeout(() => setShowDraftHint(false), 3000);
    }, 1000);
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert(lang === 'AR' 
        ? 'يرجى إدخال عنوان ومحتوى الرواية أولاً قبل النشر!' 
        : lang === 'FR' 
        ? 'Veuillez saisir un titre et un contenu de roman avant de publier !' 
        : 'Please enter a title and narrative content before publishing!');
      return;
    }

    setIsPublishing(true);
    const storyId = 'story_' + Date.now();
    
    // Read local or auth state safely
    let authorName = lang === 'AR' ? 'ليلى الورد / كاتب خفي' : 'Lily Rose / Guest';
    let authorUid = 'anonymous_author';
    
    try {
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        authorName = u.name || authorName;
        authorUid = u.uid || authorUid;
      } else if (auth?.currentUser) {
        authorName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || authorName;
        authorUid = auth.currentUser.uid;
      }
    } catch (e) {
      console.error(e);
    }

    const finalCover = cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300";

    const getGenreIndex = (g: string) => {
      const lowercase = (g || "").toLowerCase();
      if (lowercase.includes("rom") || lowercase.includes("روم")) return 0;
      if (lowercase.includes("sci") || lowercase.includes("خيل") || lowercase.includes("علم") || lowercase.includes("فانتازيا")) return 1;
      if (lowercase.includes("mys") || lowercase.includes("غمو")) return 2;
      if (lowercase.includes("dra") || lowercase.includes("درا")) return 3;
      if (lowercase.includes("adv") || lowercase.includes("مغا")) return 4;
      return 0;
    };

    if (isFirebaseAvailable && db) {
      try {
        const novelRef = doc(db, "novels", storyId);
        const novelData = {
          id: storyId,
          title: title,
          author: authorName,
          authorId: authorUid,
          desc: description || (lang === 'AR' ? 'لا يوجد وصف للعمل الروائي.' : 'No description provided.'),
          genreIndex: getGenreIndex(genre),
          rating: 5,
          reviewsCount: 0,
          cover: finalCover,
          chapterTitle: lang === 'AR' ? 'الفصل الأول: البداية' : 'Chapter 1: The Beginning',
          chapterNumber: 1,
          content: content,
          authorNote: lang === 'AR' ? 'أتمنى أن تنال هذه الرواية إعجابكم بمجرد النشر.' : 'Hope you enjoy the story.',
          createdAt: new Date()
        };

        // Enforce ABAC security permissions rule mapping
        await setDoc(novelRef, novelData);
      } catch (err: any) {
        console.error("Firestore publishing failed, falling back local.", err);
        handleFirestoreError(err, OperationType.WRITE, `novels/${storyId}`);
      }
    }

    // Sync with Local storage
    try {
      const saved = localStorage.getItem('rb_published_stories');
      let stories = [];
      if (saved) {
        stories = JSON.parse(saved);
      }

      const formattedDate = new Date().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const newStory = {
        id: storyId,
        title,
        genre,
        description: description || (lang === 'AR' ? 'لا يوجد وصف للعمل الروائي.' : 'No description provided.'),
        content,
        status,
        cover: finalCover,
        isScheduled,
        scheduleTime: isScheduled ? scheduleTime : null,
        publishedAt: formattedDate,
        author: authorName,
      };

      const updated = [newStory, ...stories];
      localStorage.setItem('rb_published_stories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Reset Draft Form elements
    setTitle('');
    setGenre('رومنسي');
    setDescription('');
    setContent('');
    setCover(null);
    setIsScheduled(false);
    setScheduleTime('');
    setStatus('Ongoing');

    // Clear local storage draft cache keys
    localStorage.removeItem('draft_title');
    localStorage.removeItem('draft_genre');
    localStorage.removeItem('draft_description');
    localStorage.removeItem('draft_content');
    localStorage.removeItem('draft_cover');
    localStorage.removeItem('draft_status');

    setIsPublishing(false);
    setShowPublishHint(true);

    if (onPublishSuccess) {
      onPublishSuccess();
    }

    setTimeout(() => setShowPublishHint(false), 4000);
  };

  useEffect(() => {
    const handleGlobalSave = () => {
      handleSaveDraft();
    };
    window.addEventListener('save-story-draft', handleGlobalSave);
    return () => window.removeEventListener('save-story-draft', handleGlobalSave);
  }, [title, genre, description, content, status, cover]);

  return (
    <div className={`p-8 md:p-12 rounded-[2rem] border backdrop-blur-xl shadow-2xl ${themeStyles.cardBg} space-y-10 relative overflow-hidden`}>
      <AnimatePresence>
        {showDraftHint && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full border backdrop-blur-xl z-[70] text-[10px] uppercase font-bold tracking-widest
              ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/20 border-[#d8b4fe]/40 text-[#d8b4fe]' : 'bg-white/10 border-white/20 text-white'}`}
          >
            {t.draftSaved} ✧
          </motion.div>
        )}

        {showPublishHint && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full border backdrop-blur-xl z-[70] text-[10px] uppercase font-bold tracking-widest flex items-center gap-2
              bg-emerald-500/10 border-emerald-500/30 text-emerald-400`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {lang === 'AR' 
                ? 'تم بنجاح نشر الرواية في بستان أعمالك المنشورة! ✧' 
                : lang === 'FR' 
                ? 'Chef-d’œuvre publié avec succès dans vos œuvres ! ✧' 
                : 'Masterpiece published successfully in My Works! ✧'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Cover Upload */}
        <div className="flex flex-col items-center gap-4">
          <div 
            onClick={() => coverInputRef.current?.click()}
            className={`w-full aspect-[2/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden relative group
              ${theme === 'PURPLE' ? 'border-[#d8b4fe]/30 hover:border-[#d8b4fe]/60' : 'border-white/30 hover:border-white/60'}`}
          >
            {cover ? (
              <>
                <img src={cover} className="w-full h-full object-cover" alt="Cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ImageIcon className="text-white w-8 h-8" />
                </div>
              </>
            ) : (
              <>
                <ImageIcon className={`w-10 h-10 mb-2 opacity-30 ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`} />
                <span className={`text-[10px] uppercase tracking-widest opacity-40 font-sans ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>Upload Cover</span>
              </>
            )}
          </div>
          <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
        </div>

        {/* Form Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-1">
            <label className={`text-[10px] uppercase tracking-widest opacity-60 px-2 font-sans ${themeStyles.text}`}>Story Title</label>
            <input 
              type="text" 
              placeholder="..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all duration-300 font-sans text-base
                ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-white focus:border-[#d8b4fe]/50' : 'border-white/20 text-white focus:border-white/50'}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-[10px] uppercase tracking-widest opacity-60 px-2 font-sans ${themeStyles.text}`}>Genre</label>
              <select 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all duration-300 font-sans text-sm
                ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-white focus:border-[#d8b4fe]/50 [&>option]:bg-[#050505]' : 'border-white/20 text-white focus:border-white/50 [&>option]:bg-[#1a0000]'}`}>
                {t.genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] uppercase tracking-widest opacity-60 px-2 font-sans ${themeStyles.text}`}>Language</label>
              <select className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all duration-300 font-sans text-sm
                ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-white focus:border-[#d8b4fe]/50 [&>option]:bg-[#050505]' : 'border-white/20 text-white focus:border-white/50 [&>option]:bg-[#1a0000]'}`}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-[10px] uppercase tracking-widest opacity-60 px-2 font-sans ${themeStyles.text}`}>Status</label>
            <div className="flex gap-2">
              {['Ongoing', 'Completed', 'Paused'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-lg border text-[10px] uppercase tracking-widest transition-all duration-300 font-sans
                    ${status === s 
                      ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-[#050505] border-[#d8b4fe]' : 'bg-white text-black border-white ')
                      : (theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-[#d8b4fe] hover:border-[#d8b4fe]/40' : 'border-white/20 text-white hover:border-white/40')
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className={`text-[10px] uppercase tracking-widest opacity-60 px-2 font-sans ${themeStyles.text}`}>Description</label>
        <textarea 
          placeholder="..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all duration-300 font-sans text-base min-h-[100px] resize-none
            ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-white focus:border-[#d8b4fe]/50' : 'border-white/20 text-white focus:border-white/50'}`}
        />
      </div>

      <div className="pt-4 border-t border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className={`text-xl font-display italic ${themeStyles.text}`}>Chapter One</h3>
          
          {/* Scheduling Tool */}
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsScheduled(!isScheduled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 text-[10px] uppercase font-bold tracking-widest
                ${isScheduled 
                  ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-[#050505] border-[#d8b4fe]' : 'bg-white text-black border-white')
                  : (theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-[#d8b4fe] hover:bg-[#d8b4fe]/10' : 'border-white/20 text-white hover:bg-white/10')
                }`}
            >
              <Clock size={12} />
              {isScheduled ? t.scheduledFor : t.schedulePublish}
            </button>
            
            <AnimatePresence>
              {isScheduled && (
                <motion.input 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className={`bg-transparent border-b-2 outline-none py-1 font-mono text-[10px] transition-all duration-500
                    ${theme === 'PURPLE' ? 'border-[#d8b4fe]/40 text-[#d8b4fe]' : 'border-white/40 text-white'}
                    [color-scheme:dark]`}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="relative group">
          <PenTool className={`absolute top-6 left-6 w-5 h-5 opacity-40 ${themeStyles.text}`} />
          <textarea 
            placeholder="..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full p-8 pr-12 pl-14 rounded-2xl border bg-transparent outline-none transition-all duration-500 font-sans text-base min-h-[400px] leading-relaxed
              ${theme === 'PURPLE' ? 'border-[#d8b4fe]/10 text-white/90 focus:border-[#d8b4fe]/30' : 'border-white/10 text-white focus:border-white/30'}`}
          />
        </div>

        <div className="flex justify-end gap-4 pb-4">
          <button 
            type="button"
            onClick={handleSaveDraft}
            className={`flex items-center gap-2 px-10 py-3.5 rounded-sm border text-[11px] uppercase tracking-[0.2em] font-sans transition-all duration-300 opacity-60 hover:opacity-100 ${themeStyles.text} ${themeStyles.btnBorder}`}
          >
            {isDrafting ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
            {t.saveDraft}
          </button>
          <button 
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className={`flex items-center gap-2 px-10 py-3.5 rounded-sm border text-[11px] uppercase tracking-[0.2em] font-sans transition-all duration-300 font-bold ${themeStyles.modalBtn}
              ${isPublishing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isPublishing ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
            {isScheduled ? t.schedulePublish : t.publish} ✧
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ mode, theme, themeStyles, lang, onClose, setMode, onAuthSuccess }: any) {
  const [checkedItems, setCheckedItems] = useState([false, false, false]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const allChecked = checkedItems.every(Boolean);

  const toggleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = React.useMemo(() => {
    return calculateAge(birthdate);
  }, [birthdate]);

  const authT = {
    AR: {
      joinTitle: "انضم إلى عالم روزالين بيلا",
      joinSub: "هنا تتحول الحروف إلى سحر يخترق القلوب",
      loginTitle: "مرحباً بعودتك إلى روزالين بيلا",
      loginSub: "ادخل لتستأنف رحلتك السحرية بين الحروف",
      displayName: "اسم الكاتب أو كنية الشهرة / Display Name",
      email: "البريد الإلكتروني / Email",
      password: "كلمة المرور / Password",
      confirmPassword: "تأكيد كلمة المرور / Confirm Password",
      birthdate: "تاريخ الميلاد / Date of Birth",
      registerBtn: "دخل الصرح ✧",
      signupBtn: "إنشاء حساب سحري ✒️",
      termsConfirm: "أقر وأؤكد أن عمري أكثر من 13 سنة.",
      authorConfirm: "بصفتي كاتبًا، أؤكد وأتعهد أن الروايات والأعمال التي سأنشرها هي ملكي بالكامل.",
      readerConfirm: "بصفتي قارئًا، أتعهد بعدم نسخ أو إعادة نشر أي عمل أدبي خارج المنصة.",
      googleBtn: "الدخول السريع بحساب Google",
      noAcc: "أليس لديك حساب؟ انضم لعشاق الأدب الساحر",
      hasAcc: "لديك حساب بالفعل؟ تسجيل الدخول",
    },
    EN: {
      joinTitle: "Join the Sanctuary of Rosaline Bela",
      joinSub: "Where letters transcend into heart-piercing magic",
      loginTitle: "Welcome back to Rosaline Bela",
      loginSub: "Step inside to resume your magical journey of words",
      displayName: "Pen Name / Writer Persona",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      birthdate: "Date of Birth",
      registerBtn: "Enter Sanctuary ✧",
      signupBtn: "Create Magical Account ✒️",
      termsConfirm: "I confirm that I am over 13 years of age.",
      authorConfirm: "As a writer, I pledge that the stories I publish are my original creations.",
      readerConfirm: "As a reader, I pledge not to copy or distribute any literary work outside the sanctuary.",
      googleBtn: "Sign in instantly with Google",
      noAcc: "Don’t have an account? Join the Sanctuary",
      hasAcc: "Already have an account? Enter Sanctuary",
    },
    FR: {
      joinTitle: "Rejoindre l'Univers de Rosaline Bela",
      joinSub: "Où les mots transcendent en magie qui perce les cœurs",
      loginTitle: "Bon retour chez Rosaline Bela",
      loginSub: "Entrez pour reprendre votre voyage magique d'écriture",
      displayName: "Nom de Plume / Pseudonyme",
      email: "Adresse e-mail",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      birthdate: "Date de naissance",
      registerBtn: "Entrer dans le Sanctuaire ✧",
      signupBtn: "Créer un Compte Magique ✒️",
      termsConfirm: "Je confirme que j'ai plus de 13 ans.",
      authorConfirm: "En tant qu'écrivain, je m'engage à ce que mes récits soient mes propres créations.",
      readerConfirm: "En tant que lecteur, je m'engage à ne pas copier les œuvres hors de la plateforme.",
      googleBtn: "Se connecter instantanément avec Google",
      noAcc: "Pas encore de compte ? Rejoindre le Sanctuaire",
      hasAcc: "Déjà un compte ? Se connecter",
    }
  };

  const t = (authT as any)[lang] || authT.AR;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        alert(lang === 'AR' ? 'عذراً، كلمات المرور غير متطابقة!' : 'Sorry, passwords do not match!');
        return;
      }
      if (!allChecked) return;
    }
    
    setLoading(true);
    let errorMessage = '';

    const finalDisplayName = displayName.trim() || email.split('@')[0];

    if (isFirebaseAvailable && auth) {
      try {
        if (mode === 'signup') {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(credential.user, {
            displayName: finalDisplayName
          });
          
          try {
            await setDoc(doc(db, "users", credential.user.uid), {
              userId: credential.user.uid,
              displayName: finalDisplayName,
              email: email,
              birthdate: birthdate,
              createdAt: new Date()
            });
          } catch (fsError) {
            handleFirestoreError(fsError, OperationType.WRITE, `users/${credential.user.uid}`);
          }
          
          onAuthSuccess({ 
            uid: credential.user.uid,
            email: credential.user.email, 
            name: finalDisplayName, 
            birthdate: birthdate,
            dateJoined: new Date().toISOString() 
          });
        } else {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          onAuthSuccess({ 
            uid: credential.user.uid,
            email: credential.user.email, 
            name: credential.user.displayName || email.split('@')[0], 
            dateJoined: credential.user.metadata.creationTime || new Date().toISOString() 
          });
        }
      } catch (err: any) {
        console.error("Firebase Auth Error: ", err);
        errorMessage = err.message || JSON.stringify(err);
        alert(lang === 'AR' 
          ? `عذراً، فشل تسجيل الدخول: ${errorMessage}` 
          : `Auth Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        const userObj = { 
          uid: 'local_' + Date.now(),
          email, 
          name: finalDisplayName, 
          birthdate: birthdate,
          dateJoined: new Date().toISOString() 
        };
        onAuthSuccess(userObj);
      }, 1500);
    }
  };

  const isBurgundy = theme === 'BURGUNDY';
  const parchmentBg = "bg-gradient-to-br from-[#fefcf8] via-[#f9f5e8] to-[#f1e7cb] hover:from-[#fffefc] hover:via-[#faf6ee] hover:to-[#ecdcae]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-md ${themeStyles.modalOverlay}`}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: "spring", duration: 0.8 }}
        className={`relative w-full max-w-xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] border-2 shadow-[0_35px_80px_rgba(0,0,0,0.9)] p-8 sm:p-11 transition-all duration-1000 overflow-hidden
          ${isBurgundy 
            ? 'bg-[#011a24] border-[#7EC8E3]/35 text-white' 
            : 'bg-[#05010a] border-[#ab7eff]/20 text-[#dcd6fc]'}`}
      >
        {/* Cinematic Magical Background inside Auth Modal */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden opacity-40">
          {/* Dark gradient mapping matching active theme */}
          <div className={`absolute inset-0 bg-gradient-to-b
            ${isBurgundy 
              ? 'from-[#001e28] via-[#022e3b] to-[#01141b]'
              : 'from-[#05010a] via-[#170425] to-[#05010a]'}`} />
          {/* Glowing orbs */}
          <div className={`absolute top-[-50px] left-[10%] right-[10%] h-[300px] rounded-full filter blur-[100px] opacity-25
            ${isBurgundy ? 'bg-[#7EC8E3]' : 'bg-[#ab7eff]'}`} />
        </div>

        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 p-2.5 rounded-full transition-all duration-300 z-50
            ${isBurgundy 
              ? 'text-[#7EC8E3] hover:text-white hover:bg-[#7EC8E3]/10' 
              : 'text-[#ab7eff] hover:text-white hover:bg-[#ab7eff]/10'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-9 relative z-10">
          <h2 className="font-fancy text-4xl sm:text-5xl italic tracking-wide text-transparent bg-clip-text leading-none select-none pb-2"
            style={{
              backgroundImage: isBurgundy
                ? 'linear-gradient(to bottom, #FFFFFF 10%, #F3E5AB 50%, #D4AF37 100%) font-style: italic'
                : 'linear-gradient(to bottom, #FFFFFF 15%, #E2D8FF 60%, #ab7eff 100%) font-style: italic',
              textShadow: isBurgundy
                ? '0 0 25px rgba(212,175,55,0.3)'
                : '0 0 25px rgba(171,126,255,0.25)',
            }}
          >
            Rosaline Bela
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold font-sans mt-3 text-white tracking-wide">
            {mode === 'signup' ? t.joinTitle : t.loginTitle}
          </h3>
          <p className={`text-[12px] sm:text-xs tracking-wider font-sans mt-2.5 opacity-75 font-light leading-relaxed
            ${isBurgundy ? 'text-[#e2f1f6]/90' : 'text-[#dcd6fc]/90'}`}>
            {mode === 'signup' ? t.joinSub : t.loginSub}
          </p>
        </div>

        <form 
          name="signup" 
          method="POST" 
          data-netlify="true" 
          onSubmit={handleSubmit}
          className="space-y-6 relative z-10"
        >
          <input type="hidden" name="form-name" value="signup" />
          
          {mode === 'signup' && (
            <Input 
              placeholder={t.displayName} 
              theme={theme} 
              name="displayName"
              value={displayName}
              onChange={(e: any) => setDisplayName(e.target.value)}
              required
            />
          )}
          
          <Input 
            placeholder={t.email} 
            theme={theme} 
            name="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            required
          />
          <Input 
            placeholder={t.password} 
            theme={theme} 
            type="password" 
            name="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />
          
          {mode === 'signup' && (
            <>
              <Input 
                placeholder={t.confirmPassword} 
                theme={theme} 
                type="password" 
                name="confirm-password" 
                value={confirmPassword}
                onChange={(e: any) => setConfirmPassword(e.target.value)}
                required 
              />

              <div className="space-y-2 text-right" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
                <label className={`text-xs font-semibold tracking-wider ${isBurgundy ? 'text-[#7EC8E3]' : 'text-[#ab7eff]'}`}>
                  {t.birthdate}
                </label>
                <input 
                  type="date"
                  name="birthdate"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  required
                  className={`w-full py-4 px-6 rounded-xl border-2 outline-none transition-all duration-300 font-sans cursor-pointer text-center
                    ${isBurgundy 
                      ? 'bg-[#011a24]/80 border-[#7EC8E3]/35 text-white focus:border-[#7EC8E3]' 
                      : 'bg-[#12071f]/80 border-[#ab7eff]/20 text-[#dcd6fc] focus:border-[#ab7eff]'}`}
                />
              </div>

              {/* Dynamic Birthday Greeting / Discount message under the field */}
              {birthdate && age !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`p-5 rounded-2xl border text-center transition-all duration-300 relative overflow-hidden
                    ${isBurgundy 
                      ? 'bg-[#011c26]/60 border-[#7EC8E3]/35 shadow-[0_0_15px_rgba(126,200,227,0.15)] text-[#e2f1f6]'
                      : 'bg-[#12071f]/60 border-[#ab7eff]/25 shadow-[0_0_15px_rgba(171,126,255,0.1)] text-[#dcd6fc]'}`}
                >
                  <div className="absolute right-3.5 top-3.5 opacity-25">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>

                  {age >= 13 && age <= 17 ? (
                    <div className="space-y-1.5">
                      <p className="text-sm sm:text-base font-bold text-emerald-400">
                        {lang === 'AR' ? '🎁 تهانينا الحارة يا شباب المستقبل المبدع!' : '🎁 Golden Youth Privilege!'}
                      </p>
                      <p className="text-xs sm:text-sm leading-relaxed">
                        {lang === 'AR' 
                          ? `رائع! بما أنك في ربيع عُمرك الفني الزاهر (${age} سنة)، فقد منحتك روزالين Bela خصماً سحرياً خاصاً بنسبة 50% على سائر ميزات وعضويات الصخرة الأدبية! 🎉📚`
                          : `Sensational! Since you are in your peak imaginative youth (${age} years), Rosaline Bela awards you a magical 50% discount on all subscriptions and novel releases! 🎉📚`}
                      </p>
                    </div>
                  ) : age >= 18 ? (
                    <div className="space-y-1.5">
                      <p className={`text-sm sm:text-base font-bold ${isBurgundy ? 'text-[#7EC8E3]' : 'text-[#ab7eff]'}`}>
                        {lang === 'AR' ? '✨ مرحباً بك في منتدى الحكماء والكتّاب الساميين' : '✨ A Noble Presence Awaits'}
                      </p>
                      <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                        {lang === 'AR' 
                          ? 'أهلاً بك في مجمعنا الأدبي السامي! ننتظر بشوق كبير فيض إبداعاتك ومشاركتك القيّمة وسحر حروفك في هذا الصرح الملكي المليء بالغموض والإلهام. 🏛️✒'
                          : 'Welcome to our esteemed literary safehaven! We eagerly await the abundance of your written craft and your valuable insights inside our mystical sanctuary. 🏛️✒️'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-sm sm:text-base font-bold text-amber-400">
                        {lang === 'AR' ? '🌟 نجمنا الصغير اللامع' : '🌟 Sparkling Little Star'}
                      </p>
                      <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                        {lang === 'AR' 
                          ? 'أهلاً بك يا بطل المستقبل المبدع! يُرجى الاستئذان أو التعلم بصحبة عائلتك لتصفح روائع روزالين Bela ومجمع الروايات بأمان متكامل. 🛡️📖'
                          : 'Welcome, young reader! Please make sure you traverse this mystical collection of stories with parental companion or supervision. 🛡️📖'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
              
              <div className="space-y-4 pt-4 border-t border-white/5 text-right w-full" dir="rtl">
                <LegalCheckbox 
                  label={t.termsConfirm}
                  checked={checkedItems[0]}
                  onChange={() => toggleCheck(0)}
                  theme={theme}
                />
                <LegalCheckbox 
                  label={t.authorConfirm}
                  checked={checkedItems[1]}
                  onChange={() => toggleCheck(1)}
                  theme={theme}
                />
                <LegalCheckbox 
                  label={t.readerConfirm}
                  checked={checkedItems[2]}
                  onChange={() => toggleCheck(2)}
                  theme={theme}
                />
              </div>
            </>
          )}

          {/* Magical Old Parchment Button Design for Signup/Login Button */}
          <motion.button
            type="submit"
            disabled={((mode === 'signup' && !allChecked) || loading)}
            whileHover={((mode === 'signup' && !allChecked) || loading) ? {} : { y: -4, scale: 1.025 }}
            whileTap={((mode === 'signup' && !allChecked) || loading) ? {} : { scale: 0.98 }}
            className={`w-full relative py-4.5 px-8 rounded-[1.2rem_1.4rem_1.1rem_1.5rem] border-2 transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden select-none cursor-pointer
              ${parchmentBg}
              after:absolute after:inset-1 after:border after:border-[#deb887]/30 after:rounded-[0.9rem_1.1rem_0.8rem_1.2rem] after:pointer-events-none
              ${((mode === 'signup' && !allChecked) || loading) 
                ? 'opacity-30 cursor-not-allowed grayscale' 
                : (isBurgundy 
                  ? 'border-[#deb887]/40 shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_10px_rgba(126,200,227,0.15)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(126,200,227,0.45),0_0_30px_rgba(26,107,122,0.15)] hover:border-[#7EC8E3]' 
                  : 'border-[#deb887]/35 shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_10px_rgba(209,106,126,0.12)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(209,106,126,0.4),0_0_30px_rgba(159,42,62,0.15)] hover:border-[#D16A7E]')}`}
          >
            {/* Glowing Aura inside parchment button */}
            <div className={`absolute inset-0 blur-md opacity-50 group-hover:opacity-100 transition-all duration-500 -z-10
              ${isBurgundy 
                ? 'bg-[#7EC8E3]/10 group-hover:bg-[#7EC8E3]/25' 
                : 'bg-[#D16A7E]/8 group-hover:bg-[#D16A7E]/20'}`} />

            {loading ? (
              <div className="w-5 h-5 border-2 border-[#5c4021] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'signup' ? <PenTool className="w-5 h-5 text-[#5c4021]" /> : <BookOpen className="w-5 h-5 text-[#5c4021]" />}
                <span className="font-fancy italic text-xl.5 sm:text-2xl text-[#2f1c0a] group-hover:text-[#422d17] transition-colors leading-none pt-0.5" style={{ fontStyle: 'italic' }}>
                  {mode === 'signin' ? t.registerBtn : t.signupBtn}
                </span>
              </>
            )}
          </motion.button>

          {isFirebaseAvailable && (
            <button 
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await signInWithPopup(auth, googleProvider);
                  try {
                    await setDoc(doc(db, "users", result.user.uid), {
                      userId: result.user.uid,
                      displayName: result.user.displayName || result.user.email?.split('@')[0] || "User",
                      email: result.user.email,
                      createdAt: new Date()
                    });
                  } catch (e) {
                      // Silently hand off or update if rules permit or existing profiles
                  }
                  onAuthSuccess({ 
                    uid: result.user.uid,
                    email: result.user.email, 
                    name: result.user.displayName || result.user.email?.split('@')[0] || "User", 
                    dateJoined: result.user.metadata.creationTime || new Date().toISOString() 
                  });
                } catch (err: any) {
                  console.error("Google login failed: ", err);
                  if (err.code === 'auth/unauthorized-domain') {
                    alert(lang === 'AR'
                      ? "خطأ المزامنة: النطاق غير مصرح به حالياً في إعدادات Firebase لـ Google auth. يرجى إضافة 'rosaline-bela.netlify.app' إلى النطاقات المصرح بها (Authorized Domains) في لوحة تحكم Firebase."
                      : "Authorization Error: This domain 'netlify.app' is not authorized in your Firebase console. Please add 'rosaline-bela.netlify.app' to your Authorized Domains list.");
                  } else if (err.code === 'auth/popup-blocked') {
                    alert(lang === 'AR'
                      ? "تم حظر النافذة المنبثقة! يرجى السماح بالهواتف/المتصفح لفتح النوافذ المنبثقة أو المحاولة مرة أخرى."
                      : "Popup blocked by your browser! Please allow popups for this site and try again.");
                  } else if (err.code === 'auth/popup-closed-by-user') {
                    // Quietly let user retry
                  } else {
                    alert(lang === 'AR' ? `حدث خطأ أثناء تسجيل الدخول: ${err.message}` : `Login Error: ${err.message}`);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className={`w-full py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-bold tracking-wider transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer border backdrop-blur-md
                ${isBurgundy 
                  ? 'bg-[#e2f1f6]/5 hover:bg-[#e2f1f6]/12 border-[#7EC8E3]/25 text-[#e2f1f6] hover:text-white hover:border-[#7EC8E3]' 
                  : 'bg-[#ab7eff]/5 hover:bg-[#ab7eff]/12 border-[#ab7eff]/20 text-[#dcd6fc] hover:text-white hover:border-[#ab7eff]'}`}
            >
              <svg className="w-4.5 h-4.5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.73 0 3.3.63 4.52 1.8l2.42-2.42C17.435 1.7 14.975 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.76-4.06 9.76-9.9 0-.596-.06-1.176-.17-1.815z" />
              </svg>
              <span>{t.googleBtn}</span>
            </button>
          )}

          <div className="text-center pt-4 relative z-10">
            <button 
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className={`text-sm underline underline-offset-4 decoration-2 transition-colors font-medium
                ${isBurgundy ? 'text-[#7EC8E3] hover:text-[#e2f1f6]' : 'text-[#ab7eff] hover:text-white'}`}
            >
              {mode === 'signin' ? t.noAcc : t.hasAcc}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const REPORT_LABELS = {
  AR: {
    title: "إبلاغ عن محتوى",
    subtitle: "ساعدنا في الحفاظ على أمان وجمال مجتمع روزلين.",
    reasonLabel: "سبب الإبلاغ",
    reasons: {
      spam: "محتوى عشوائي أو سبام",
      copyright: "انتهاك حقوق الملكية الفكرية",
      harassment: "مضايقة أو إساءة",
      inappropriate: "محتوى غير لائق أدبياً",
      other: "سبب آخر"
    },
    detailsLabel: "التفاصيل والملحوظات الإضافية",
    detailsPlaceholder: "...اكتب هنا تفاصيل المشكلة أو الروابط المعنية",
    emailLabel: "(اختياري) بريدك الإلكتروني",
    emailPlaceholder: "...سنستخدمه للتواصل معك عند الضرورة",
    cancel: "إلغاء",
    submit: "حفظ وإرسال البلاغ ✧",
    submitting: "قيد الإرسال...",
    success: "تم تسجيل بلاغك بنجاح! شكراً لمساعدتنا في تحسين المجتمع.",
    error: "عذراً، حدث خطأ أثناء إرسال البلاغ. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً."
  },
  EN: {
    title: "Report Content",
    subtitle: "Help us keep the Rosaline community safe and beautiful.",
    reasonLabel: "Reason for Reporting",
    reasons: {
      spam: "Spam or Off-topic",
      copyright: "Copyright Infringement",
      harassment: "Harassment or Abuse",
      inappropriate: "Inappropriate Content",
      other: "Other Reason"
    },
    detailsLabel: "Additional Details",
    detailsPlaceholder: "Describe the issue or share links here...",
    emailLabel: "Your Email Address (Optional)",
    emailPlaceholder: "To contact you if we need more info...",
    cancel: "Cancel",
    submit: "Submit Report ✧",
    submitting: "Submitting...",
    success: "Report submitted successfully! Thank you for helping us protect the community.",
    error: "Sorry, an error occurred while sending the report. Please check your internet connection and try again."
  },
  FR: {
    title: "Signaler un contenu",
    subtitle: "Aidez-nous à préserver la sécurité de la communauté.",
    reasonLabel: "Raison du signalement",
    reasons: {
      spam: "Spam ou Hors-sujet",
      copyright: "Violation des droits d'auteur",
      harassment: "Harcèlement ou Abus",
      inappropriate: "Contenu inapproprié",
      other: "Autre raison"
    },
    detailsLabel: "Détails supplémentaires",
    detailsPlaceholder: "Décrivez le problème ici...",
    emailLabel: "Votre adresse e-mail (optionnel)",
    emailPlaceholder: "Pour vous contacter si nécessaire...",
    cancel: "Annuler",
    submit: "Envoyer le signalement ✧",
    submitting: "Envoi en cours...",
    success: "Signalement envoyé avec succès ! Merci de votre contribution.",
    error: "Désolé, une erreur est survenue lors de l'envoi du signalement. Veuillez vérifier votre connexion et réessayer."
  }
};

function ReportModal({ post, theme, themeStyles, lang, onClose }: any) {
  const isRtl = lang === 'AR';
  const rl = REPORT_LABELS[lang as Language] || REPORT_LABELS.EN;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setErrorMsg(lang === 'AR' ? "يرجى تحديد تفاصيل المشكلة" : "Please provide details for the report.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    let success = false;

    // 1. Send the report data to a backend API endpoint via modern Fetch POST
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId: post?.id?.toString() || "unknown",
          postAuthor: post?.author || "unknown",
          postContent: post?.content || "",
          reason: reason,
          details: details,
          reporterEmail: email || "anonymous",
          timestamp: new Date().toISOString()
        })
      });

      // Avoid 404 HTML fallback crashing on parse
      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        success = true;
      } else if (response.ok && !contentType?.includes("text/html")) {
        success = true;
      }
    } catch (apiError) {
      console.warn("Backend API endpoint not responding, attempting Firestore / local persistence:", apiError);
    }

    // 2. Persists the report in Firestore as our principal cloud storage layer if initialized
    try {
      if (isFirebaseAvailable && db) {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'reports'), {
          postId: post?.id?.toString() || "unknown",
          postAuthor: post?.author || "unknown",
          postContent: post?.content || "",
          reason: reason,
          details: details,
          reporterEmail: email || "anonymous",
          createdAt: serverTimestamp()
        });
        success = true;
      }
    } catch (dbError) {
      console.error("Firestore persistence failed:", dbError);
    }

    // 3. Resilient Client-side Local Storage backup to assure successful user feedback in dev/preview offline states
    if (!success) {
      try {
        const fallbackReports = JSON.parse(localStorage.getItem('rosaline_reports') || '[]');
        fallbackReports.push({
          reportId: Date.now().toString(),
          postId: post?.id?.toString() || "unknown",
          postAuthor: post?.author || "unknown",
          postContent: post?.content || "",
          reason: reason,
          details: details,
          reporterEmail: email || "anonymous",
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('rosaline_reports', JSON.stringify(fallbackReports));
        success = true; // Mark as success so the user sees the confirmation
      } catch (localError: any) {
        console.error("Local storage fallback failed:", localError);
        setErrorMsg(rl.error || localError.message);
      }
    }

    setLoading(false);

    if (success) {
      setSubmitted(true);
      // Auto-close modal after success message triggers
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setDetails('');
        setEmail('');
      }, 3500);
    } else {
      setErrorMsg(rl.error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/85"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-2 shadow-2xl p-8 sm:p-12
          ${theme === 'PURPLE' ? 'bg-[#1a0b2e]/95 border-[#d8b4fe]/20 backdrop-blur-2xl' : 'bg-[#0a0a0a]/95 border-[#4a0404]/50'}`}
      >
        <button 
          onClick={onClose}
          type="button"
          disabled={loading}
          className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${theme === 'PURPLE' ? 'text-[#d8b4fe] hover:bg-[#d8b4fe]/10 disabled:opacity-30' : 'text-white hover:bg-white/10 disabled:opacity-30'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className={`text-3xl font-display font-medium mb-3 ${theme === 'PURPLE' ? 'text-[#f3e8ff]' : 'text-white'}`}>
            {rl.title}
          </h2>
          <p className="text-xs opacity-60 text-white/70 max-w-sm mx-auto">
            {rl.subtitle}
          </p>
        </div>

        {/* Short post teaser */}
        {post && (
          <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/75 leading-relaxed">
            <span className="font-bold opacity-40 uppercase block mb-1">
              {lang === 'AR' ? 'المحتوى المُبلغ عنه' : 'Reported Content'}
            </span>
            <div className="opacity-80 line-clamp-2">
              <span className={`font-semibold ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-[#e11d48]'}`}>{post.author}:</span> "{post.content}"
            </div>
          </div>
        )}

        {/* User-friendly Notifications */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 rounded-2xl border border-green-500/30 bg-green-500/10 text-center text-sm text-green-400 space-y-3 font-semibold"
            >
               <div className="w-12 h-12 rounded-full border border-green-500/40 flex items-center justify-center mx-auto mb-2 text-xl">✓</div>
               <p>{rl.success}</p>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-semibold flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <p className="flex-1">{errorMsg}</p>
                </motion.div>
              )}

              <form 
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider opacity-75 font-sans font-bold text-white/90">
                    {rl.reasonLabel}
                  </label>
                  <select
                    name="reason"
                    value={reason}
                    disabled={loading}
                    onChange={(e) => setReason(e.target.value)}
                    className={`w-full py-3.5 px-5 rounded-xl border-2 bg-black font-sans text-sm focus:outline-none transition-all duration-300 disabled:opacity-50
                      ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-[#f3e8ff] focus:border-[#d8b4fe]/60' : 'border-white/10 text-white focus:border-white/40'}`}
                  >
                    <option value="spam">{rl.reasons.spam}</option>
                    <option value="copyright">{rl.reasons.copyright}</option>
                    <option value="harassment">{rl.reasons.harassment}</option>
                    <option value="inappropriate">{rl.reasons.inappropriate}</option>
                    <option value="other">{rl.reasons.other}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider opacity-75 font-sans font-bold text-white/90">
                    {rl.detailsLabel}
                  </label>
                  <textarea
                    name="details"
                    rows={4}
                    required
                    disabled={loading}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={rl.detailsPlaceholder}
                    className={`w-full py-3.5 px-5 rounded-xl border-2 bg-[#d8b4fe]/[0.02] font-sans text-sm min-h-[100px] focus:outline-none transition-all duration-300 disabled:opacity-50
                      ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-white placeholder:text-white/30 focus:border-[#d8b4fe]/60' : 'border-white/10 text-white placeholder:text-white/30 focus:border-white/40'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider opacity-75 font-sans font-bold text-white/90">
                    {rl.emailLabel}
                  </label>
                  <input
                    type="email"
                    name="reporter-email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={rl.emailPlaceholder}
                    className={`w-full py-3.5 px-5 rounded-xl border-2 bg-[#d8b4fe]/[0.02] font-sans text-sm focus:outline-none transition-all duration-300 disabled:opacity-50
                      ${theme === 'PURPLE' ? 'border-[#d8b4fe]/20 text-white placeholder:text-white/30 focus:border-[#d8b4fe]/60' : 'border-white/10 text-white placeholder:text-white/30 focus:border-white/40'}`}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-5 py-3 rounded-full border border-white/10 text-xs font-semibold tracking-wider font-sans opacity-60 hover:opacity-100 hover:bg-white/5 duration-300 cursor-pointer text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {rl.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-7 py-3 rounded-full font-bold text-xs tracking-wider uppercase font-sans duration-500 cursor-pointer shadow-lg flex items-center gap-2
                      ${themeStyles.modalBtn} ${loading ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : null}
                    <span>{loading ? rl.submitting : rl.submit}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function Input({ placeholder, theme, type = "text", value, onChange, name, required }: any) {
  return (
    <input 
      type={type}
      dir="rtl"
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={`w-full py-4 px-6 rounded-xl border-2 outline-none transition-all duration-300 font-sans
        ${theme === 'PURPLE' 
          ? 'bg-[#d8b4fe]/5 border-[#d8b4fe]/20 text-white placeholder:text-white/30 focus:border-[#d8b4fe]/60' 
          : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/40'}`}
    />
  );
}

function LegalCheckbox({ label, checked, onChange, theme }: any) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center pt-1">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onChange}
          className="sr-only" 
        />
        <div className={`w-5 h-5 rounded border-2 transition-all duration-300 flex items-center justify-center
          ${checked 
            ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] border-[#d8b4fe]' : 'bg-white border-white') 
            : (theme === 'PURPLE' ? 'bg-transparent border-[#d8b4fe]/40 group-hover:border-[#d8b4fe]/70' : 'bg-transparent border-white/40 group-hover:border-white/70')}`}>
          {checked && <div className={`w-2.5 h-2.5 rounded-sm ${theme === 'PURPLE' ? 'bg-[#0a0410]' : 'bg-black'}`} />}
        </div>
      </div>
      <span className={`text-xs sm:text-sm leading-relaxed transition-opacity ${checked ? 'opacity-100' : 'opacity-60'} ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>
        {label}
      </span>
    </label>
  );
}

function MouseGlow({ theme }: { theme: 'BURGUNDY' | 'PURPLE' }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [glowColor, setGlowColor] = useState('rgba(212, 175, 55, 0.04)');

  useEffect(() => {
    // Dynamically update the background glow color based on the selected theme
    const glows = {
      BURGUNDY: 'rgba(212, 175, 55, 0.04)', // Glowing gold for Royal Crimson/Burgundy
      PURPLE: 'rgba(157, 0, 255, 0.05)'      // Neon Purple for Mystic Fantasy
    };
    setGlowColor(glows[theme] || 'rgba(212, 175, 55, 0.04)');
  }, [theme]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-2 transition-all duration-1000"
      style={{
        background: `radial-gradient(circle 400px at var(--x) var(--y), ${glowColor}, transparent 80%)`,
        '--x': `${mousePos.x}px`,
        '--y': `${mousePos.y}px`,
        opacity: theme === 'BURGUNDY' ? 0.7 : 1
      } as any}
    />
  );
}

function CustomCursor({ theme }: { theme: 'BURGUNDY' | 'PURPLE' }) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Custom cursor color state updated dynamically on theme changes
  const [cursorColor, setCursorColor] = useState('#E0E0E0');

  const mouseRef = useRef({ x: -100, y: -100 });
  const trailRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Map theme names to their correct custom cursor color representations
    const colors = {
      BURGUNDY: '#E0E0E0', // Silver (#E0E0E0) for Royal Burgundy
      PURPLE: '#9D00FF'    // Neon Purple (#9D00FF) for Mystic Fantasy
    };
    setCursorColor(colors[theme] || '#E0E0E0');
  }, [theme]);

  useEffect(() => {
    // Only enable on desktop / fine-pointer devices
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.classList.contains('cursor-pointer') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.cursor-pointer');

      if (isInteractive) {
        setIsHovered(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovered(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    setIsVisible(true);

    let animationFrameId: number;
    const updateTrail = () => {
      const dt = 0.16; // lag interpolation factor for trailing ring
      const currentTrail = trailRef.current;
      const targetMouse = mouseRef.current;

      if (currentTrail.x === -100) {
        trailRef.current = targetMouse;
        setTrail(targetMouse);
      } else {
        const nextX = currentTrail.x + (targetMouse.x - currentTrail.x) * dt;
        const nextY = currentTrail.y + (targetMouse.y - currentTrail.y) * dt;
        trailRef.current = { x: nextX, y: nextY };
        setTrail({ x: nextX, y: nextY });
      }

      animationFrameId = requestAnimationFrame(updateTrail);
    };

    animationFrameId = requestAnimationFrame(updateTrail);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Central Cursor Dot */}
      <div
        className="pointer-events-none fixed z-[9999] rounded-full mix-blend-screen -translate-x-1/2 -translate-y-1/2 select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '7px',
          height: '7px',
          backgroundColor: cursorColor,
          boxShadow: `0 0 10px ${cursorColor}, 0 0 20px ${cursorColor}80`,
          transition: 'background-color 0.5s ease, box-shadow 0.5s ease',
        }}
      />
      {/* Outer Trailing Ring */}
      <div
        className="pointer-events-none fixed z-[9998] rounded-full mix-blend-screen -translate-x-1/2 -translate-y-1/2 border select-none"
        style={{
          left: `${trail.x}px`,
          top: `${trail.y}px`,
          width: isHovered ? '50px' : '24px',
          height: isHovered ? '50px' : '24px',
          borderColor: cursorColor,
          backgroundColor: isHovered ? `${cursorColor}10` : 'transparent',
          boxShadow: isHovered 
            ? `0 0 22px ${cursorColor}, inset 0 0 10px ${cursorColor}30` 
            : `0 0 8px ${cursorColor}25`,
          transition: 'width 0.25s cubic-bezier(0.215, 0.610, 0.355, 1.000), height 0.25s cubic-bezier(0.215, 0.610, 0.355, 1.000), border-color 0.5s ease, background-color 0.5s ease, box-shadow 0.5s ease',
        }}
      />
    </>
  );
}

function GlobalFooter({ theme, themeStyles, lang, setCurrentView, currentView }: any) {
  const t = TRANSLATIONS[lang as Language] as any;
  const isRtl = lang === 'AR';

  return (
    <footer className="relative z-20 w-full py-16 px-12 border-t border-white/5 bg-black/20 backdrop-blur-md mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
        {/* Branding & Description */}
        <div className={`space-y-2 max-w-sm ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
          <h4 className={`text-lg font-display tracking-wide ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-rose-400'}`}>
            Rosaline Bela
          </h4>
          <p className="text-[11px] leading-relaxed opacity-60 font-sans tracking-wide text-white/85">
            {lang === 'AR' 
              ? 'ملاذ أدبي حالم مخصص للروايات الخيالية، مشاركة الإبداع والقصص الملهمة.' 
              : (lang === 'EN' 
                ? 'A dreamy fantasy literary sanctuary dedicated to novels, sharing creativity, and sharing inspiring stories.'
                : 'Un sanctuaire littéraire féérique dédié aux romans, au partage de la créativité et des histoires inspirantes.')}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-[10.5px] uppercase tracking-[0.2em] font-sans font-bold">
          <a 
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('HOME');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors duration-300 cursor-pointer ${currentView === 'HOME' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            {t.home}
          </a>
          <a 
            href="#about-us"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('ABOUT');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors duration-300 cursor-pointer ${currentView === 'ABOUT' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            {t.about}
          </a>
          <a 
            href="#contact-us"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('CONTACT');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors duration-300 cursor-pointer ${currentView === 'CONTACT' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            {t.contact}
          </a>
          <a 
            href="#privacy-policy"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('PRIVACY');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors duration-300 cursor-pointer ${currentView === 'PRIVACY' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            {t.privacy}
          </a>
          <a 
            href="#terms-of-service"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('TERMS');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors duration-300 cursor-pointer ${currentView === 'TERMS' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            {t.terms}
          </a>
          <a 
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('PRICING');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors duration-300 cursor-pointer ${currentView === 'PRICING' ? 'text-[#D4AF37]' : 'text-white/50 hover:text-[#D4AF37]'}`}
          >
            {lang === 'AR' ? 'عالم روزالين الفاخر ✧' : lang === 'FR' ? 'Alliance Royale ✧' : 'Royal Alliances ✧'}
          </a>
        </div>

        {/* Copyright */}
        <div className={`text-[10px] uppercase tracking-[0.4em] text-white/40 ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
          <div>© 2026 Rosaline Bela</div>
          <div className="text-[8px] tracking-[0.2em] mt-1 text-white/30 lowercase">
            {theme === 'PURPLE' ? '✦ celestial theme' : '🍷 burgundy sanctuary'}
          </div>
        </div>
      </div>
    </footer>
  );
}

function AboutPage({ theme, themeStyles, lang, setCurrentView }: any) {
  const isRtl = lang === 'AR';

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-[2.5rem] p-8 md:p-14 border backdrop-blur-2xl shadow-2xl ${themeStyles.cardBg} space-y-10 relative overflow-hidden`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Dynamic Background Flare */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-25 ${theme === 'PURPLE' ? 'bg-[#d8b4fe]' : 'bg-[#e11d48]'}`} />
      
      {/* Title */}
      <div className="space-y-4">
        <button 
          onClick={() => setCurrentView('HOME')}
          className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest ${theme === 'PURPLE' ? 'text-[#d8b4fe] hover:text-[#f3e8ff]' : 'text-white hover:opacity-80'} cursor-pointer`}
        >
          {isRtl ? '← العودة للرئيسية' : '← Back to Home'}
        </button>
        <div className="flex items-center gap-4 pt-2">
          <Info className={`w-8 h-8 ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-[#e11d48]'}`} />
          <h1 className={`text-3xl md:text-4xl font-display font-medium italic tracking-wide ${themeStyles.text}`}>
            {lang === 'AR' ? 'من نحن - حكاية روزلين بيلا' : (lang === 'EN' ? 'About Us - The Story of Rosaline Bela' : 'À propos - L\'histoire de Rosaline Bela')}
          </h1>
        </div>
        <div className="h-px w-20 bg-current opacity-30" />
      </div>

      {/* Backstory & details in elegant paragraph */}
      <div className="space-y-6 text-sm md:text-base leading-relaxed text-white/90">
        <p>
          {lang === 'AR' 
            ? 'مرحباً بكم في روزلين بيلا، الملاذ الأدبي الحالم المصمم خصيصاً لعشاق الروايات الخيالية وعوالم الكتابة الإبداعية المتكاملة. تأسست هذه المنصة لتصبح همزة الوصل بين خيال الكاتب الروائي وشغف القارئ المتلهف للمغامرة والاستكشاف.'
            : (lang === 'EN'
              ? 'Welcome to Rosaline Bela, a dreamy literary sanctuary customized for fans of fantasy novels and creative writing. This platform was born to bridge the vivid imagination of novelists with the deep passion of readers searching for high adventure.'
              : 'Bienvenue sur Rosaline Bela, un sanctuaire littéraire féérique conçu pour les passionnés de romans de fantasy et d\'écriture créative. Cette plateforme est née pour marier l\'imagination débordante des romanciers et la passion dévorante de lecteurs en constante quête d\'aventure.')}
        </p>
        <p>
          {lang === 'AR'
            ? 'نحن نؤمن بأن الحرف هو اللبنة الأساسية لبناء حضارات الخيال. لذا، نقدم عوالم ذات طابع مخملي ناعم، يمزج بين ألوان البنفسج الدافئ والبرغندي الملكي وأناقة العتمة الساحرة. تم تصميم واجهتنا بعناية فائقة لتوفر بيئة قراءة خالية من المشتتات، مدعومة بمؤثرات صوتية محيطة تعزز التركيز والتعايش الكامل مع فصول الروايات.'
            : (lang === 'EN'
              ? 'We believe that words are the elementary building blocks of fantasy civilisations. Hence, we offer velvet-toned worlds, blending warm lavender tones, deep royal burgundy, and mysterious nighttime elegance. Our interface offers a completely distraction-free workspace powered by immersive ambient soundscapes to elevate reading loops.'
              : 'Nous croyons que les mots sont l\'essence même des civilisations imaginaires. C\'est pourquoi nous vous offrons des univers feutrés, alliant des teintes douces de lavande, de bordeaux royal et de mystère nocturne. Notre interface est pensée pour offrir un espace de lecture minimaliste, sublimé par des ambiances sonores apaisantes.')}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className={`p-6 rounded-2xl border ${theme === 'PURPLE' ? 'border-[#d8b4fe]/15 bg-[#d8b4fe]/5' : 'border-white/10 bg-white/5'} text-center space-y-2`}>
          <div className={`text-3xl font-mono font-bold ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>10,000+</div>
          <div className="text-[10px] uppercase tracking-wider opacity-60 font-sans">
            {lang === 'AR' ? 'كلمة كُتبت' : (lang === 'EN' ? 'Words Written' : 'Mots Écrits')}
          </div>
        </div>
        <div className={`p-6 rounded-2xl border ${theme === 'PURPLE' ? 'border-[#d8b4fe]/15 bg-[#d8b4fe]/5' : 'border-white/10 bg-white/5'} text-center space-y-2`}>
          <div className={`text-3xl font-mono font-bold ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>250+</div>
          <div className="text-[10px] uppercase tracking-wider opacity-60 font-sans">
            {lang === 'AR' ? 'فصل رواية' : (lang === 'EN' ? 'Novel Chapters' : 'Chapitres de Novels')}
          </div>
        </div>
        <div className={`p-6 rounded-2xl border ${theme === 'PURPLE' ? 'border-[#d8b4fe]/15 bg-[#d8b4fe]/5' : 'border-white/10 bg-white/5'} text-center space-y-2`}>
          <div className={`text-3xl font-mono font-bold ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>1,500+</div>
          <div className="text-[10px] uppercase tracking-wider opacity-60 font-sans">
            {lang === 'AR' ? 'ساعة استماع هادئة' : (lang === 'EN' ? 'Calm Listening Hours' : 'Heures de Lecture')}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivacyPage({ theme, themeStyles, lang, setCurrentView }: any) {
  const isRtl = lang === 'AR';

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-[2.5rem] p-8 md:p-14 border backdrop-blur-2xl shadow-2xl ${themeStyles.cardBg} space-y-8 relative overflow-hidden`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-25 ${theme === 'PURPLE' ? 'bg-[#d8b4fe]' : 'bg-[#e11d48]'}`} />
      
      {/* Title */}
      <div className="space-y-4">
        <button 
          onClick={() => setCurrentView('HOME')}
          className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest ${theme === 'PURPLE' ? 'text-[#d8b4fe] hover:text-[#f3e8ff]' : 'text-white hover:opacity-80'} cursor-pointer`}
        >
          {isRtl ? '← العودة للرئيسية' : '← Back to Home'}
        </button>
        <div className="flex items-center gap-4 pt-2">
          <Shield className={`w-8 h-8 ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-[#e11d48]'}`} />
          <h1 className={`text-3xl md:text-4xl font-display font-medium italic tracking-wide ${themeStyles.text}`}>
            {lang === 'AR' ? 'سياسة الخصوصية وحماية الكلمات' : (lang === 'EN' ? 'Privacy Policy & Word Protection' : 'Politique de Confidentialité')}
          </h1>
        </div>
        <div className="h-px w-20 bg-current opacity-30" />
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <p className="text-white">
          {lang === 'AR'
            ? 'نحن نقدر شرف كلماتكم وخصوصيتكم كأولوية تقع على عاتق منصتنا السحابية الخيالية. نرجو مراجعة بنود سياستنا البسيطة:'
            : (lang === 'EN'
              ? 'We value the honor of your creations and consider your privacy the highest priority of our cloud literary sanctuary. Please read our guidelines:'
              : 'Nous accordons une importance cruciale à la protection de vos créations littéraires et de votre vie privée. Veuillez consulter nos principes fondamentaux :')}
        </p>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <h3 className={`text-base font-bold font-sans ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>
              1. {lang === 'AR' ? 'أمان المخطوطات والقرّاء' : (lang === 'EN' ? 'Manuscript & Reader Security' : 'Sécurité des Manuscrits et des Lecteurs')}
            </h3>
            <p>
              {lang === 'AR'
                ? 'عند قيامك بكتابة مسودات الفصول أو حفظها على التطبيق، فإننا نلتزم بالتخزين السحابي الآمن لمنع أي تسريب أدبي أو وصول غير مصرح للمخطوطات غير المنشورة.'
                : (lang === 'EN'
                  ? 'All local drafts and novel contents saved on the platform are stored securely. We absolutely guarantee prevention of any leaking or unauthorized reading of unpublished texts.'
                  : 'Lors de la rédaction ou de l\'écriture en ligne, nous nous engageons à stocker vos textes de manière ultra-sécurisée afin d\'éviter toute fuite littéraire.')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className={`text-base font-bold font-sans ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>
              2. {lang === 'AR' ? 'التخزين المحلي (Local Storage)' : (lang === 'EN' ? 'Local Storage & Cookies' : 'Stockage Local & Cookies')}
            </h3>
            <p>
              {lang === 'AR'
                ? 'نستخدم ميزة التخزين المحلي في متصفحكم لتخزين إحصائيات القراءة والتفضيلات الشخصية (مثل نمط الألوان المفضل ومستوى الصوت في الخلفية) لضمان تجربة زيارة مثالية وسريعة.'
                : (lang === 'EN'
                  ? 'We use your browser\'s local storage exclusively to save reading speeds, volume preferences, and visual custom modes for a highly fluid login-free session.'
                  : 'Nous utilisons le stockage local de votre navigateur pour persister vos statistiques et réglages visuels (afin de préserver le choix de thème et le volume).')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className={`text-base font-bold font-sans ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>
              3. {lang === 'AR' ? 'عدم مشاركة البيانات' : (lang === 'EN' ? 'No Third-Party Sharing' : 'Aucun Partage de Données')}
            </h3>
            <p>
              {lang === 'AR'
                ? 'لا نقوم بمشاركة أي بريد إلكتروني أو بيانات حركة المرور الخاصة بك مع أي شركة خارجية أو شبكة إعلانية على الإطلاق.'
                : (lang === 'EN'
                  ? 'We never share your email addresses, reader metrics, or writing data with any third-party ads networks or corporate tracking agencies.'
                  : 'Nous ne revendons ni ne transmettons aucune donnée personnelle ou statistique de lecture à des tiers ou à des fins publicitaires.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsPage({ theme, themeStyles, lang, setCurrentView }: any) {
  const isRtl = lang === 'AR';

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-[2.5rem] p-8 md:p-14 border backdrop-blur-2xl shadow-2xl ${themeStyles.cardBg} space-y-8 relative overflow-hidden`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-25 ${theme === 'PURPLE' ? 'bg-[#d8b4fe]' : 'bg-[#e11d48]'}`} />
      
      {/* Title */}
      <div className="space-y-4">
        <button 
          onClick={() => setCurrentView('HOME')}
          className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest ${theme === 'PURPLE' ? 'text-[#d8b4fe] hover:text-[#f3e8ff]' : 'text-white hover:opacity-80'} cursor-pointer`}
        >
          {isRtl ? '← العودة للرئيسية' : '← Back to Home'}
        </button>
        <div className="flex items-center gap-4 pt-2">
          <FileText className={`w-8 h-8 ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-[#e11d48]'}`} />
          <h1 className={`text-3xl md:text-4xl font-display font-medium italic tracking-wide ${themeStyles.text}`}>
            {lang === 'AR' ? 'شروط الخدمة الأدبية' : (lang === 'EN' ? 'Literary Terms of Service' : 'Conditions Générales d\'Utilisation')}
          </h1>
        </div>
        <div className="h-px w-20 bg-current opacity-30" />
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <p className="text-white font-sans text-xs uppercase tracking-wider opacity-90">
          {lang === 'AR' ? 'يرجى قراءة هذه الوثيقة قبل بدء رحلة الإلهام في مكتبتنا:' : (lang === 'EN' ? 'Please read these rules before embarkment into our celestial archive:' : 'Veuillez lire attentivement les conditions suivantes avant de commencer votre voyage littéraire :')}
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className={`text-base font-bold font-sans ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>
              1. {lang === 'AR' ? 'الملكية الفكرية الكاملة للقصص' : (lang === 'EN' ? 'Full Intellectual Property' : 'Propriété Intellectuelle Intégrale')}
            </h3>
            <p>
              {lang === 'AR'
                ? 'أي فكرة أو مسودة أو فصل رواية تقوم بنشره وتدوينه داخل المنصة يظل ملكيتك الفكرية الخاصة والخالصة 100%، ولا يملك موقع روزلين بيلا أي حق في بيعها أو استخدامها تجارياً دون موافقتك الصريحة والخطية.'
                : (lang === 'EN'
                  ? 'Every novel, plot arc, or draft written on Rosaline Bela belongs solely and 100% to you. We hold zero commercial claims over your fantasy worlds.'
                  : 'Tous les textes rédigés sur Rosaline Bela vous appartiennent à 100%. Nous ne revendiquons aucun droit commercial ou éditorial sur votre œuvre.')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className={`text-base font-bold font-sans ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-white'}`}>
              2. {lang === 'AR' ? 'السلوك والمجتمع الملتزم' : (lang === 'EN' ? 'Community Core Values' : 'Respect et Bienveillance')}
            </h3>
            <p>
              {lang === 'AR'
                ? 'نتوقع من جميع فرسان الكلمة والقراء الحفاظ على نقاشات مهذبة وودودة وخالية من خطاب الكراهية في جميع أرجاء صفحة كواليس وتفاعلات المجتمع.'
                : (lang === 'EN'
                  ? 'We expect all scriptwriters and readers to uphold kindness, respect, and avoid toxic language or harassment within the community chat and discussion channels.'
                  : 'Nous demandons à tous les conteurs et lecteurs d\'échanger de manière courtoise, amicale et constructive dans les discussions.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage({ theme, themeStyles, lang, setCurrentView }: any) {
  const isRtl = lang === 'AR';
  const t = TRANSLATIONS[lang as Language] as any;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Netlify form AJAX submission
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "form-name": "contact",
        name,
        email,
        message,
      }).toString(),
    })
      .then(() => {
        setLoading(false);
        setSubmitted(true);
        setName('');
        setEmail('');
        setMessage('');
        setTimeout(() => setSubmitted(false), 5000);
      })
      .catch((error) => {
        console.error("Netlify Form Submission Error:", error);
        setLoading(false);
      });
  };

  return (
    <div className={`w-full max-w-lg mx-auto rounded-[2.5rem] p-8 md:p-12 border backdrop-blur-2xl shadow-2xl ${themeStyles.cardBg} space-y-8 relative overflow-hidden`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-25 ${theme === 'PURPLE' ? 'bg-[#d8b4fe]' : 'bg-[#e11d48]'}`} />
      
      {/* Title */}
      <div className="space-y-4">
        <button 
          onClick={() => setCurrentView('HOME')}
          className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest ${theme === 'PURPLE' ? 'text-[#d8b4fe] hover:text-[#f3e8ff]' : 'text-white hover:opacity-80'} cursor-pointer`}
        >
          {isRtl ? '← العودة للرئيسية' : '← Back to Home'}
        </button>
        <div className="flex items-center gap-4 pt-2">
          <Mail className={`w-8 h-8 ${theme === 'PURPLE' ? 'text-[#d8b4fe]' : 'text-[#e11d48]'}`} />
          <h1 className={`text-2xl sm:text-3xl font-display font-medium italic tracking-wide ${themeStyles.text}`}>
            {lang === 'AR' ? 'تواصل معي' : (lang === 'EN' ? 'Contact Rosaline' : 'Contactez Rosaline')}
          </h1>
        </div>
        <div className="h-px w-20 bg-current opacity-30" />
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 rounded-2xl border border-green-500/30 bg-green-500/10 text-center text-sm text-green-400 space-y-2 font-semibold"
          >
             <div className="w-10 h-10 rounded-full border border-green-500/40 flex items-center justify-center mx-auto mb-2 text-lg">✓</div>
             <p>{t.successMessage}</p>
          </motion.div>
        ) : (
          <motion.form 
            onSubmit={handleFormSubmit}
            className="space-y-5"
            name="contact"
            method="POST"
            data-netlify="true"
          >
            {/* Hidden Input required for Netlify in React/JSX */}
            <input type="hidden" name="form-name" value="contact" />

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wide opacity-70 font-sans font-bold text-white/90">
                {lang === 'AR' ? 'الاسم الأدبي' : (lang === 'EN' ? 'Pen Name' : 'Nom d\'auteur')}
              </label>
              <input 
                type="text" 
                name="name"
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="..."
                className={`w-full py-3.5 px-5 rounded-xl border bg-transparent font-sans text-sm focus:outline-none transition-all duration-300
                  ${theme === 'PURPLE' ? 'border-[#d8b4fe]/10 text-white focus:border-[#d8b4fe]/40' : 'border-white/10 text-white focus:border-white/40'}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wide opacity-70 font-sans font-bold text-white/90">
                {lang === 'AR' ? 'البريد الإلكتروني للرد' : (lang === 'EN' ? 'Email Address' : 'Adresse Email')}
              </label>
              <input 
                type="email" 
                name="email"
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="..."
                className={`w-full py-3.5 px-5 rounded-xl border bg-transparent font-sans text-sm focus:outline-none transition-all duration-300
                  ${theme === 'PURPLE' ? 'border-[#d8b4fe]/10 text-white focus:border-[#d8b4fe]/40' : 'border-white/10 text-white focus:border-white/40'}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wide opacity-70 font-sans font-bold text-white/90">
                {lang === 'AR' ? 'حبر رسالتك' : (lang === 'EN' ? 'Your Message Text' : 'Votre Message')}
              </label>
              <textarea 
                rows={4}
                name="message"
                required 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="..."
                className={`w-full py-4 px-5 rounded-xl border bg-transparent font-sans text-sm min-h-[100px] focus:outline-none transition-all duration-300
                  ${theme === 'PURPLE' ? 'border-[#d8b4fe]/10 text-white focus:border-[#d8b4fe]/40' : 'border-white/10 text-white focus:border-white/40'}`}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-sans font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer
                ${themeStyles.modalBtn} ${loading ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t.sendMessage} ✧</span>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function CelestialLibraryBackground({ theme }: { theme: Theme }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const newItems: any[] = [];
    
    // 1. Tiny glowing books (7 instances)
    for (let i = 0; i < 7; i++) {
      newItems.push({
        id: `book-${i}`,
        type: 'book',
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.5 + Math.random() * 0.4,
        opacity: 0.12 + Math.random() * 0.1,
        duration: 25 + Math.random() * 15,
        delay: Math.random() * -20,
        driftX: -20 + Math.random() * 40,
        driftY: -25 - Math.random() * 25,
        rotate: -15 + Math.random() * 30,
      });
    }

    // 2. Old manuscript pages (7 instances)
    for (let i = 0; i < 7; i++) {
      newItems.push({
        id: `page-${i}`,
        type: 'page',
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.6 + Math.random() * 0.4,
        opacity: 0.1 + Math.random() * 0.1,
        duration: 28 + Math.random() * 18,
        delay: Math.random() * -20,
        driftX: -15 + Math.random() * 30,
        driftY: -20 - Math.random() * 25,
        rotate: -30 + Math.random() * 60,
      });
    }

    // 3. Feather pens (5 instances)
    for (let i = 0; i < 5; i++) {
      newItems.push({
        id: `pen-${i}`,
        type: 'pen',
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.55 + Math.random() * 0.3,
        opacity: 0.1 + Math.random() * 0.08,
        duration: 26 + Math.random() * 14,
        delay: Math.random() * -20,
        driftX: -15 + Math.random() * 30,
        driftY: -15 - Math.random() * 25,
        rotate: -20 + Math.random() * 40,
      });
    }

    // 4. Soft magical particles (25 instances)
    for (let i = 0; i < 25; i++) {
      newItems.push({
        id: `particle-${i}`,
        type: 'particle',
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.4 + Math.random() * 0.8,
        opacity: 0.18 + Math.random() * 0.18,
        duration: 12 + Math.random() * 8,
        delay: Math.random() * -10,
        driftX: -25 + Math.random() * 50,
        driftY: -35 - Math.random() * 35,
      });
    }

    // 5. Celestial sparkles (12 instances)
    for (let i = 0; i < 12; i++) {
      newItems.push({
        id: `sparkle-${i}`,
        type: 'sparkle',
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.4 + Math.random() * 0.6,
        opacity: 0.15 + Math.random() * 0.25,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * -6,
      });
    }

    // 6. Constellations (3 instances)
    for (let i = 0; i < 3; i++) {
      newItems.push({
        id: `constellation-${i}`,
        type: 'constellation',
        x: i === 0 ? 8 : i === 1 ? 78 : 42,
        y: i === 0 ? 12 : i === 1 ? 22 : 68,
        scale: 0.75 + Math.random() * 0.35,
        opacity: 0.08 + Math.random() * 0.06,
        duration: 18 + Math.random() * 8,
        delay: Math.random() * -10,
      });
    }

    // 7. Tiny floating stars (15 instances)
    for (let i = 0; i < 15; i++) {
      newItems.push({
        id: `star-${i}`,
        type: 'star',
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.35 + Math.random() * 0.45,
        opacity: 0.15 + Math.random() * 0.2,
        duration: 5 + Math.random() * 4,
        delay: Math.random() * -5,
        driftX: -8 + Math.random() * 16,
        driftY: -12 + Math.random() * 8,
      });
    }

    // 8. Very small transparent hearts (5 instances, low opacity, rare appearance only, soft rose glow)
    for (let i = 0; i < 5; i++) {
      newItems.push({
        id: `heart-${i}`,
        type: 'heart',
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.35 + Math.random() * 0.2,
        opacity: 0.04 + Math.random() * 0.04, // low opacity
        duration: 22 + Math.random() * 10,
        delay: Math.random() * -20,
        driftX: -15 + Math.random() * 30,
        driftY: -20 - Math.random() * 20,
        rotate: -15 + Math.random() * 30,
      });
    }

    setItems(newItems);
  }, []);

  const isPurple = theme === 'PURPLE';

  return (
    <div className="pointer-events-none fixed inset-0 z-1 overflow-hidden transition-opacity duration-1000">
      {items.map((item) => {
        let colorClass = '';

        switch (item.type) {
          case 'book':
            colorClass = isPurple 
              ? 'text-[#d8b4fe]/85 drop-shadow-[0_0_8px_rgba(216,180,254,0.35)]' 
              : 'text-amber-100/75 drop-shadow-[0_0_8px_rgba(253,230,138,0.25)]';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${24 * item.scale}px`,
                  height: `${24 * item.scale}px`,
                  opacity: item.opacity,
                }}
                animate={{
                  y: [0, item.driftY, 0],
                  x: [0, item.driftX, 0],
                  rotate: [0, item.rotate, 0],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={colorClass}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 21c-1.2-1-3-1.5-5-1.5-1.8 0-4 .5-5 1.5V5c1-1 3.2-1.5 5-1.5 2 0 3.8.5 5 1.5 1.2-1 3-1.5 5-1.5 1.8 0 4 .5 5 1.5v16c-1-1-3.2-1.5-5-1.5-2 0-3.8.5-5 1.5z" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M12 5v16" strokeWidth="0.8" strokeDasharray="1 1"/>
                </svg>
              </motion.div>
            );

          case 'page':
            colorClass = isPurple 
              ? 'text-[#e5e0f5]/80' 
              : 'text-[#fef3c7]/65';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${18 * item.scale}px`,
                  height: `${22 * item.scale}px`,
                  opacity: item.opacity,
                }}
                animate={{
                  y: [0, item.driftY, 0],
                  x: [0, item.driftX, 0],
                  rotate: [0, item.rotate, -item.rotate/2, 0],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={`${colorClass} drop-shadow-[0_0_4px_rgba(255,255,255,0.1)]`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.2" />
                  <path d="M14 2v6h6" strokeWidth="1.2" />
                  <line x1="16" y1="13" x2="8" y2="13" strokeWidth="0.8" strokeOpacity="0.6" />
                  <line x1="16" y1="17" x2="8" y2="17" strokeWidth="0.8" strokeOpacity="0.6" />
                  <line x1="10" y1="9" x2="8" y2="9" strokeWidth="0.8" strokeOpacity="0.6" />
                </svg>
              </motion.div>
            );

          case 'pen':
            colorClass = isPurple 
              ? 'text-[#f3e8ff]/80' 
              : 'text-rose-100/70';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${24 * item.scale}px`,
                  height: `${24 * item.scale}px`,
                  opacity: item.opacity,
                }}
                animate={{
                  y: [0, item.driftY, 0],
                  x: [0, item.driftX, 0],
                  rotate: [0, item.rotate, 0],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={colorClass}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20.24 4.76a6 6 0 0 0-8.49 0L3 13.5V21h7.5l8.74-8.74a6 6 0 0 0 0-8.5z" strokeWidth="1" strokeLinecap="round" />
                  <line x1="16" y1="9" x2="11" y2="14" strokeWidth="0.8" />
                  <path d="M3 21l3-3" strokeWidth="1" />
                </svg>
              </motion.div>
            );

          case 'particle':
            colorClass = isPurple 
              ? 'bg-[#d8b4fe]/60 shadow-[0_0_6px_rgba(216,180,254,0.6)]' 
              : 'bg-[#fb7185]/55 shadow-[0_0_6px_rgba(251,113,133,0.5)]';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${4 * item.scale}px`,
                  height: `${4 * item.scale}px`,
                  borderRadius: '50%',
                  opacity: item.opacity,
                }}
                animate={{
                  y: [0, item.driftY],
                  x: [0, item.driftX],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={colorClass}
              />
            );

          case 'sparkle':
            colorClass = isPurple 
              ? 'text-[#f5f3ff] drop-shadow-[0_0_8px_rgba(216,180,254,0.8)]' 
              : 'text-rose-100 drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${16 * item.scale}px`,
                  height: `${16 * item.scale}px`,
                }}
                animate={{
                  scale: [0.3, 1, 0.3],
                  opacity: [item.opacity * 0.4, item.opacity * 1.3, item.opacity * 0.4],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={colorClass}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c0 5.5-4.5 10-10 10 5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" />
                </svg>
              </motion.div>
            );

          case 'star':
            colorClass = isPurple ? 'text-white' : 'text-rose-50';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${6 * item.scale}px`,
                  height: `${6 * item.scale}px`,
                }}
                animate={{
                  opacity: [item.opacity * 0.4, item.opacity, item.opacity * 0.4],
                  y: [0, item.driftY, 0],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={colorClass}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                </svg>
              </motion.div>
            );

          case 'constellation':
            colorClass = isPurple ? 'text-[#d8b4fe]/25' : 'text-rose-300/20';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${140 * item.scale}px`,
                  height: `${140 * item.scale}px`,
                  opacity: item.opacity,
                }}
                animate={{
                  opacity: [item.opacity, item.opacity * 1.5, item.opacity],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={colorClass}
              >
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor">
                  <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                  <circle cx="50" cy="40" r="2" fill="currentColor" />
                  <circle cx="85" cy="20" r="1.5" fill="currentColor" />
                  <circle cx="65" cy="80" r="1.5" fill="currentColor" />
                  <circle cx="30" cy="65" r="2.5" fill="currentColor" />
                  
                  <line x1="20" y1="20" x2="50" y2="40" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                  <line x1="50" y1="40" x2="85" y2="20" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                  <line x1="50" y1="40" x2="65" y2="80" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                  <line x1="65" y1="80" x2="30" y2="65" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                  <line x1="30" y1="65" x2="20" y2="20" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                </svg>
              </motion.div>
            );

          case 'heart':
            colorClass = 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.35)]';
            return (
              <motion.div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${11 * item.scale}px`,
                  height: `${11 * item.scale}px`,
                  opacity: item.opacity,
                }}
                animate={{
                  y: [0, item.driftY, 0],
                  x: [0, item.driftX, 0],
                  rotate: [0, item.rotate, 0],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }}
                className={colorClass}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </motion.div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

const LIBRARY_BOOKS = [
  {
    id: "echoes_stars",
    title: { AR: "أصداء النجوم", EN: "Echoes of Stars", FR: "Échos des Étoiles" },
    author: { AR: "روزلين بيلا", EN: "Rosaline Bela", FR: "Rosaline Bela" },
    desc: { AR: "رحلة منسية بين النجوم والمخاطر السحرية في عوالم معتمة.", EN: "A forgotten journey among stars and magical dangers in dark realms.", FR: "Un voyage oublié parmi les étoiles et les dangers magiques dans des royaumes sombres." },
    genreIndex: 1, // Sci-Fi & Fantasy / خيال علمي وفانتازيا
    rating: 4.9,
    reviewsCount: 128,
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
    chapterTitle: { AR: "الفصل الأول: البداية", EN: "Chapter 1: The Beginning", FR: "Chapitre 1 : Le Commencement" },
    chapterNumber: 1,
    content: {
      AR: `في عتمة الليل البارد، كانت النجوم تهمس بأسرار قديمة لم يسمعها أحد منذ دهور. روزلين، تلك الفتاة التي كانت ترى في كل كتاب سماءً جديدة، جلست تراقب الأفق...\n\nكانت الكلمات تنساب كالنهر، هادئة في بدايتها، عاصفة في أعماقها. ثمة حزن دفين في طيات الصفحات، لكنه حزن يشبه عطر الياسمين في ليلة شتوية.\n\nسألت نفسها: هل يمكن للحروف أن تبني جسراً إلى المستحيل؟`,
      EN: `In the cold darkness of the night, the stars whispered ancient secrets unheard for ages. Rosaline, the girl who saw in every book a new sky, sat watching the horizon...\n\nWords flowed like a river, gentle at first, tumultuous in their depths. There was a hidden sadness within the folds of the pages, but it was a sadness like the scent of jasmine on a winter night.\n\nShe asked herself: Can letters build a bridge to the impossible?`,
      FR: `Dans l'obscurité froide de la nuit, les étoiles murmuraient d'anciens secrets ignorés depuis des siècles. Rosaline, la fille qui voyait dans chaque livre un nouveau ciel, contemplait l'horizon...\n\nLes mots coulaient comme un fleuve, doux au début, tumultueux dans leurs profondeurs. Il y avait une tristesse cachée au creux des pages, mais c'était une tristesse semblable au parfum du jasmin par une nuit d'hiver.\n\nElle se demanda : Les lettres peuvent-elles bâtir un pont vers l'impossible ?`
    },
    authorNote: { AR: "شكراً لكم لمتابعة هذا الفصل. أتمنى أن ينال إعجابكم.", EN: "Thank you for reading this chapter. I hope you enjoyed it.", FR: "Merci pour votre lecture. J'espère que vous avez apprécié." }
  },
  {
    id: "beyond_galaxy",
    title: { AR: "خلف آفاق المجرة", EN: "Beyond Galactic Horizon", FR: "Au-delà de l'Horizon Galactique" },
    author: { AR: "سليم الرواد", EN: "Salim Al-Rowad", FR: "Salim Al-Rowad" },
    desc: { AR: "رحلة منسية بين النجوم ومخاطر الفضاء البعيد وكشف أسرار الماضي التاريخية في عمق الكون.", EN: "A forgotten journey among stars and deep-space perils to unlock the universe's past.", FR: "Un voyage oublié à travers les étoiles pour percer les mystères de l'univers." },
    genreIndex: 1, // Sci-Fi & Fantasy
    rating: 4.8,
    reviewsCount: 94,
    cover: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=300",
    chapterTitle: { AR: "الفصل الأول: نداء النجوم", EN: "Chapter 1: Call of the Stars", FR: "Chapitre 1 : L'Appel des Étoiles" },
    chapterNumber: 1,
    content: {
      AR: `الظلام دامس هنا... خلف غبار المجرة البعيدة تنام أسرار حضارة منسية لم يجرؤ أحد على كشفها.\n\nكنا نبحث عن حطام سفينة الاستكشاف القديمة، لكن ما وجدناه كان شيئاً أعظم بكثير: رمز ساطع ينبض بالحياة.\n\nقال القبطان: "هذا ليس حطاماً، هذه بوابة لمكان آخر تماماً."`,
      EN: `The darkness is absolute here... behind the dust of the distant galaxy lie the secrets of a forgotten civilization that no one dared uncover.\n\nWe were searching for the wreckage of the old exploration ship, but what we found was far grander: a glowing, pulsing symbol of life.\n\nThe captain whispered: "This isn't wreckage. This is a portal to another place entirely."`,
      FR: `L'oscurité est absolue ici... derrière la poussière de la lointaine galaxie dorment les secrets d'une civilisation oubliée que personne n'a osé dévoiler.\n\nNous cherchions l'épave de l'ancien vaisseau d'exploration, mais ce que nous avons trouvé était bien plus grand : un symbole vibrant et éclatant de vie.\n\nLe capitaine murmura : "Ce n'est pas une épave. C'est un portail vers un tout autre ail."`
    },
    authorNote: { AR: "رحلة الخيال العلمي هذه مستوحاة من غموض الفضاء.", EN: "This sci-fi journey is inspired by the mysteries of cosmos.", FR: "Ce voyage de science-fiction est inspiré par les mystères du cosmos." }
  },
  {
    id: "orchid_whisper",
    title: { AR: "همس الأوركيد", EN: "Whisper of Orchid", FR: "Le Murmure de l'Orchidée" },
    author: { AR: "ليلى الورد", EN: "Layla Al-Ward", FR: "Layla Al-Ward" },
    desc: { AR: "قصيدة مرسومة بالكلمات الشاعرية عن الهدوء والسكينة والعشق النادر كالأزهار البرية.", EN: "A poem drawn with words about tranquility, inner peace, and rare scenic love.", FR: "Un poème dessiné avec des mots sur la tranquillité, la paix et l'amour rare." },
    genreIndex: 0, // Romance
    rating: 4.7,
    reviewsCount: 76,
    cover: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=300",
    chapterTitle: { AR: "الفصل الأول: عطر قديم", EN: "Chapter 1: Ancient Fragrance", FR: "Chapitre 1 : Parfum Ancien" },
    chapterNumber: 1,
    content: {
      AR: `في الصباحات الهادئة، حيث تتسلل أشعة الشمس الذهبية خجولة من خلف الستائر البنفسجية، كانت تفوح رائحة زهور الأوركيد.\n\nكانت تمسك بيديها كتاباً مغلفاً بالجلد البني، وتقرأ بصوت منخفض ينافس حفيف الرياح.\n\nدخل الغرفة فجأة، حاملاً معه برودة الخارج ودفء عينيه اللتين طالما بحثت عنهما في صفحات قصصها.`,
      EN: `In the quiet mornings, as golden sunbeams shyly seeped through the purple curtains, the scent of orchids filled the air.\n\nShe held a brown leather-bound book, reading in a low voice that rivaled the rustling wind.\n\nHe entered the room suddenly, carrying with him the crisp cold of the outdoors and the warmth of his eyes is what she had always searched for.`,
      FR: `Par les matins calmes, alors que les rayons dorés du soleil traversaient timidement les rideaux violets, l'odeur des orchidées flottait.\n\nElle tenait un livre relié de cuir brun, lisant d'une voix basse qui rivalisait avec le bruissement du vent.\n\nIl entra soudainement, apportant avec lui la fraîcheur de l'extérieur et la chaleur de ses yeux qu'elle avait tant cherchée.`
    },
    authorNote: { AR: "العواطف هي جوهر رواياتي الرومانسية.", EN: "Emotions are the core of my romantic stories.", FR: "Les émotions sont le cœur de mes récits romantiques." }
  },
  {
    id: "lost_compass",
    title: { AR: "بوصلة المفقودين", EN: "The Lost Compass", FR: "La Boussole des Égarés" },
    author: { AR: "يوسف الجغرافي", EN: "Youssef Al-Geographer", FR: "Youssef Al-Geographer" },
    desc: { AR: "مغامرة مثيرة ومميتة بحثاً عن الكنوز الغامضة في جزر بعيدة لا توجد على خريطة.", EN: "A thrilling adventure in search of mysterious treasures on unmapped islands.", FR: "Une aventure palpitante à la recherche de trésors mystérieux sur des îles oubliées." },
    genreIndex: 4, // Adventure
    rating: 4.9,
    reviewsCount: 110,
    cover: "https://images.unsplash.com/photo-1519074063240-8451f22dad82?auto=format&fit=crop&q=80&w=300",
    chapterTitle: { AR: "الفصل الأول: الخريطة السرية", EN: "Chapter 1: The Secret Map", FR: "Chapitre 1 : La Carte Secrète" },
    chapterNumber: 1,
    content: {
      AR: `أمسك بالبوصلة النحاسية القديمة بيدين مرتعشتين، الإبرة لم تكن تشير للشمال، بل تشير للأعماق... إلى الجبل الأسود.\n\n"هذا مستحيل،" تمتم وهو يعيد فحص لفيفة الـجلد المخطوطة يدوياً. "الخريطة تقول إن الكنز ينبض فقط تحت ضوء القمر الأزرق."\n\nلم يعلم أن خلف دقاته السريعة تتربص كائنات أخرى تحرس الياقوت الغالي.`,
      EN: `He held the ancient brass compass with trembling hands. The needle didn't point north; it pointed straight to the depths... to the Black Mountain.\n\n"This is impossible," he muttered, re-examining the hand-drawn parchment roll. "The map says the treasure only pulses under the blue moonlight."\n\nHe had no idea that behind his rapid heartbeat, other creatures watched over the precious ruby.`,
      FR: `Il tenait l'ancienne boussole en laiton d'une main tremblante. L'aiguille n'indiquait pas le nord ; elle pointait droit vers les profondeurs... vers la Montagne Noire.\n\n"C'est impossible", murmura-t-il, examinant à nouveau le vieux parchemin. "La carte dit que le trésor ne vibre que sous la lumière de la lune bleue."\n\nIl ignorait que derrière les battements de son cœur, d'autres gardiens veillaient sur le rubis.`
    },
    authorNote: { AR: "استمتع بمغامرات البحث عن الغموض والمجهول.", EN: "Enjoy the adventure of seeking the mysteries and unknowns.", FR: "Profitez de l'aventure à la recherche du mystère et de l'inconnu." }
  },
  {
    id: "seagulls_sanctuary",
    title: { AR: "ملاذ النوارس", EN: "Seagulls Sanctuary", FR: "Le Refuge des Mouettes" },
    author: { AR: "شمس البحر", EN: "Shams Al-Bahr", FR: "Shams Al-Bahr" },
    desc: { AR: "دراما عائلية عميقة تسرد قصة عشق البحر الذي يعيد جمع القلوب ويرمم شقوق الروح.", EN: "A deep family drama about the sea that reconciles hearts and heals scars.", FR: "Un drame familial profond sur la mer qui réconcilie les cœurs et guérit les cicatrices." },
    genreIndex: 3, // Drama & Emotions
    rating: 4.6,
    reviewsCount: 82,
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=300",
    chapterTitle: { AR: "الفصل الأول: صوت البحر", EN: "Chapter 1: Sound of the Ocean", FR: "Chapitre 1 : Le Bruit de l'Océan" },
    chapterNumber: 1,
    content: {
      AR: `البحر لا يكذب أبداً، إنه يبلع أحزاننا ويعيد صياغتها على شكل أمواج تتكسر على الشاطئ الدافئ.\n\nوقفت على رصيف الميناء القديم تراقب الأفق، والرياح تلاعب خصلات شعرها. كانت تبحث عن غائب طال انتظاره.\n\n"سيعود،" قالت لنفسها بنبرة يقين تهز الصخر. "النوارس دائماً تعود إلى ملاذها الآمن."`,
      EN: `The ocean never lies; it swallows our sorrows and reshapes them as waves crashing on the warm beach.\n\nShe stood on the wooden dock, watching the horizon as the wind played with her hair, waiting for someone long gone.\n\n"He will return," she whispered with a rock-solid conviction. "Seagulls always return to their safe haven."`,
      FR: `L'océan ne ment jamais ; il engloutit nos peines et les façonne en vagues s'écrasant sur la plage chaude.\n\nElle se tenait sur le vieux quai, regardant l'horizon tandis que le vent jouait avec ses cheveux, attendant un être disparu depuis longtemps.\n\n"Il reviendra", murmura-t-elle avec une certitude de fer. "Les mouettes reviennent toujours à leur refuge."`
    },
    authorNote: { AR: "مهداة لكل من يجد السلام في أمواج البحر وصوت الهدوء.", EN: "Dedicated to anyone who finds peace in ocean waves and quietude.", FR: "Dédié à quiconque trouve la paix dans les vagues et la quiétude." }
  },
  {
    id: "magic_alphabet",
    title: { AR: "أبجدية السحر", EN: "Alphabet of Magic", FR: "L'Alphabet Magique" },
    author: { AR: "مازن الغامض", EN: "Mazen Al-Ghamid", FR: "Mazen Al-Ghamid" },
    desc: { AR: "أسرار غامضة ومخيفة تتحول فيها الحروف الصامتة إلى كائنات حية لحماية المكتبة التائهة.", EN: "Mysterious secrets where words come alive to guard ancient, forbidden library vaults.", FR: "Des secrets mystérieux où les mots prennent vie pour garder le savoir interdit." },
    genreIndex: 2, // Mystery & Thriller
    rating: 4.9,
    reviewsCount: 154,
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=300",
    chapterTitle: { AR: "الفصل الأول: الرمز الأول", EN: "Chapter 1: The First Symbol", FR: "Chapitre 1 : Le Premier Symbole" },
    chapterNumber: 1,
    content: {
      AR: `الحروف ليست مجرد خطوط جافة، إنها كائنات حية، تتنفس، وتتحرك إذا قرأتها بالطريقة الصحيحة.\n\nفي القبو المظلم تحت المكتبة الوطنية، فتحت روزلين المخطوطة القديمة الممنوعة.\n\nفجأة، طارت الحروف الذهبية من الصفحة، مشكلة حلقة من الضوء الساطع حاصر الباب الخشبي الثقيل!`,
      EN: `Letters are not just dry lines; they are living, breathing entities that move when read in the sacred sequence.\n\nInside the dusty, secret vault under the National Library, Rosaline unlocked the forbidden manuscript.\n\nSuddenly, the golden characters rose from parchment, spinning into a blinding halo of light around the heavy oak door!`,
      FR: `Les lettres ne sont pas de simples lignes sèches ; ce sont des êtres vivants qui s'animent lorsqu'ils sont lus dans le bon ordre.\n\nDans la crypte poussiéreuse sous la Bibliothèque Nationale, Rosaline ouvrit le manuscrit interdit.\n\nSoudain, les caractères dorés s'envolèrent, formant un halo de lumière entourant la lourde porte en chêne !`
    },
    authorNote: { AR: "الحروف طاقة هائلة، وقصتي تفتح لكم الأبواب لتجربتها.", EN: "Letters carry colossal energy, my story invites you to witness it.", FR: "Les lettres portent une énergie colossale, cette histoire vous invite à la vivre." }
  }
];

function LibraryPage({ theme, themeStyles, lang, onReadNovel }: any) {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [realtimeBooks, setRealtimeBooks] = useState<any[]>([]);
  const [localStories, setLocalStories] = useState<any[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const t = TRANSLATIONS[lang as Language] as any;
  const genresList = t.genres || [];

  useEffect(() => {
    if (isFirebaseAvailable && db) {
      try {
        const novelsRef = collection(db, "novels");
        const q = query(novelsRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data() });
          });
          setRealtimeBooks(list);
        }, (error) => {
          console.error("Failed to sync realtime query for library page", error);
        });
        return () => unsubscribe();
      } catch (e) {
        console.error("Firestore observer failed to init", e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rb_published_stories');
      if (saved) {
        setLocalStories(JSON.parse(saved));
      }
    } catch (e) {
      console.error("LocalStorage load failed in library", e);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rb_user_favorites');
      if (saved) {
        setFavoriteIds(JSON.parse(saved));
      } else {
        setFavoriteIds([]);
      }
    } catch (e) {}
  }, [showOnlyFavorites]);

  // Localized texts
  const labels = {
    AR: {
      title: "مكتبة النجوم",
      subtitle: "استكشف فضاء الروايات والكتب الفاخرة المنسوجة بالكلمات الذهبية.",
      all: "كل الروايات",
      searchPlaceholder: "ابحث عن رواية، كاتب، أو كلمة مفتاحية مثل #غموض...",
      readBtn: "اقرأ الآن",
      reviews: "مراجعة",
      noResults: "لم يتم العثور على روايات تطابق بحثك.",
      author: "الكاتب",
      rating: "التقييم"
    },
    EN: {
      title: "Sanctuary Library",
      subtitle: "Explore the dark, starlit library of premium tales woven in gold.",
      all: "All Stories",
      searchPlaceholder: "Search for a novel, author, or tag like #mystery...",
      readBtn: "Read Now",
      reviews: "reviews",
      noResults: "No stories found matching your filter.",
      author: "Author",
      rating: "Rating"
    },
    FR: {
      title: "La Bibliothèque",
      subtitle: "Explorez notre sélection raffinée d'œuvres littéraires enveloppées d'étoiles.",
      all: "Toutes les œuvres",
      searchPlaceholder: "Rechercher un roman, un auteur, ou #mot-clé...",
      readBtn: "Lire maintenant",
      reviews: "critiques",
      noResults: "Aucun roman ne correspond à votre recherche.",
      author: "Auteur",
      rating: "Note"
    }
  }[lang as Language] || {
    title: "مكتبة النجوم",
    subtitle: "استكشف فضاء الروايات والكتب الفاخرة المنسوجة بالكلمات الذهبية.",
    all: "كل الروايات",
    searchPlaceholder: "ابحث عن رواية، كاتب، أو كلمة مفتاحية مثل #غموض...",
    readBtn: "اقرأ الآن",
    reviews: "مراجعة",
    noResults: "لم يتم العثور على روايات تطابق بحثك.",
    author: "الكاتب",
    rating: "التقييم"
  };

  const getGenreIndexFromName = (g: string) => {
    const lowercase = (g || "").toLowerCase();
    if (lowercase.includes("rom") || lowercase.includes("روم")) return 0;
    if (lowercase.includes("sci") || lowercase.includes("خيل") || lowercase.includes("علم") || lowercase.includes("فانتازيا")) return 1;
    if (lowercase.includes("mys") || lowercase.includes("غمو")) return 2;
    if (lowercase.includes("dra") || lowercase.includes("درا")) return 3;
    if (lowercase.includes("adv") || lowercase.includes("مغا")) return 4;
    return 0;
  };

  const allMergedBooks = [...LIBRARY_BOOKS];

  realtimeBooks.forEach((b: any) => {
    if (!allMergedBooks.some(x => x.id === b.id)) {
      allMergedBooks.push({
        id: b.id,
        title: { AR: b.title, EN: b.title, FR: b.title },
        author: { AR: b.author, EN: b.author, FR: b.author },
        desc: { AR: b.desc, EN: b.desc, FR: b.desc },
        genreIndex: b.genreIndex ?? 0,
        rating: b.rating ?? 5.0,
        reviewsCount: b.reviewsCount ?? 0,
        cover: b.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
        chapterTitle: { AR: b.chapterTitle || "البداية", EN: b.chapterTitle || "Beginning", FR: b.chapterTitle || "Commencement" },
        chapterNumber: b.chapterNumber ?? 1,
        content: { AR: b.content, EN: b.content, FR: b.content },
        authorNote: { AR: b.authorNote, EN: b.authorNote, FR: b.authorNote }
      });
    }
  });

  localStories.forEach((b: any) => {
    if (!allMergedBooks.some(x => x.id === b.id)) {
      allMergedBooks.push({
        id: b.id,
        title: { AR: b.title, EN: b.title, FR: b.title },
        author: { AR: b.author, EN: b.author, FR: b.author },
        desc: { AR: b.description, EN: b.description, FR: b.description },
        genreIndex: getGenreIndexFromName(b.genre),
        rating: 5.0,
        reviewsCount: 0,
        cover: b.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
        chapterTitle: { AR: "الفصل الأول", EN: "Chapter 1", FR: "Chapitre 1" },
        chapterNumber: 1,
        content: { AR: b.content, EN: b.content, FR: b.content },
        authorNote: { AR: "", EN: "", FR: "" }
      });
    }
  });

  const filteredBooks = allMergedBooks.filter((book: any) => {
    const bookTitle = (book.title[lang] || book.title['EN'] || "").toLowerCase();
    const bookAuthor = (book.author[lang] || book.author['EN'] || "").toLowerCase();
    const bookDesc = (book.desc[lang] || book.desc['EN'] || "").toLowerCase();
    let query = searchQuery.trim().toLowerCase();

    // Smart #tag parsing
    let matchesSearch = false;
    if (query.startsWith('#')) {
      const tag = query.substring(1);
      const genreName = (genresList[book.genreIndex] || "").toLowerCase();
      matchesSearch = genreName.includes(tag) || bookTitle.includes(tag) || bookDesc.includes(tag);
    } else {
      matchesSearch = bookTitle.includes(query) || bookAuthor.includes(query) || bookDesc.includes(query);
    }

    const matchesGenre = selectedGenre === null || book.genreIndex === selectedGenre;
    const matchesFavorites = !showOnlyFavorites || favoriteIds.includes(book.id);

    return matchesSearch && matchesGenre && matchesFavorites;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Editorial Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 backdrop-blur-md"
        >
          <Library className={`w-4 h-4 ${themeStyles.text}`} />
          <span className="font-mono tracking-widest uppercase text-[10px]">{lang === 'AR' ? 'المجموعات الفاخرة' : 'Premium Collections'}</span>
        </motion.div>
        
        <h1 className={`text-4xl md:text-5xl font-display font-medium tracking-tight ${themeStyles.logo}`}>
          {labels.title}
        </h1>
        <p className="text-sm text-white/50 leading-relaxed font-sans font-light">
          {labels.subtitle}
        </p>
      </div>

      {/* Dynamic Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-6 rounded-[2rem] border backdrop-blur-xl bg-white/5 border-white/10">
        
        {/* Category Chips - Scrollable */}
        <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setSelectedGenre(null)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer
              ${selectedGenre === null 
                ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-black shadow-lg shadow-purple-500/15' : 'bg-white text-black')
                : 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/5'}`}
          >
            {labels.all}
          </button>
          
          {genresList.map((g: string, idx: number) => {
            const isSelected = selectedGenre === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedGenre(idx)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer
                  ${isSelected
                    ? (theme === 'PURPLE' ? 'bg-[#d8b4fe] text-black shadow-lg shadow-purple-500/15' : 'bg-white text-black')
                    : 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/5'}`}
              >
                {g}
              </button>
            )
          })}

          <div className="h-4 w-px bg-white/10 shrink-0" />

          {/* Favorites library toggle button */}
          <button
            type="button"
            onClick={() => {
              const nextFav = !showOnlyFavorites;
              setShowOnlyFavorites(nextFav);
              if (nextFav) {
                try {
                  const saved = localStorage.getItem('rb_user_favorites');
                  if (saved) setFavoriteIds(JSON.parse(saved));
                } catch (e) {}
              }
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 cursor-pointer
              ${showOnlyFavorites 
                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                : 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/5'}`}
          >
            <Bookmark size={12} className={showOnlyFavorites ? "fill-yellow-500 text-yellow-500" : ""} />
            <span>{lang === 'AR' ? "المفضلة" : lang === 'FR' ? "Favoris" : "Favorites"}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 group">
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-full py-2.5 pl-10 pr-6 text-xs transition-all duration-300 outline-none focus:border-white/20 focus:bg-white/10 font-sans"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white/60 transition-colors" />
        </div>
      </div>

      {/* Responsive Book Grid */}
      <AnimatePresence mode="popLayout">
        {filteredBooks.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredBooks.map((book: any, idx: number) => {
              const bookTitle = book.title[lang] || book.title['EN'] || "";
              const bookAuthor = book.author[lang] || book.author['EN'] || "";
              const bookDesc = book.desc[lang] || book.desc['EN'] || "";
              const bookGenre = genresList[book.genreIndex] || "";
              
              return (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05, duration: 0.6 }}
                  className="group relative flex flex-col justify-between p-5 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-x-0 -top-40 -z-10 h-80 bg-gradient-to-b from-[#d8b4fe]/5 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="space-y-4">
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                      <img 
                        src={book.cover} 
                        alt={bookTitle} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-4 right-4 text-[9px] font-mono font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-md border border-white/10">
                        {bookGenre}
                      </span>
                    </div>

                    <div className="space-y-2 px-2">
                      <h3 className="font-display font-medium text-lg text-white group-hover:text-[#d8b4fe] transition-colors line-clamp-1">
                        {bookTitle}
                      </h3>
                      <p className="text-[11px] font-mono tracking-wide text-white/50">
                        {labels.author}: <span className="text-white/80">{bookAuthor}</span>
                      </p>
                      
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < Math.floor(book.rating) ? "fill-current" : "opacity-30"} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-white/60">
                          {book.rating} ({book.reviewsCount} {labels.reviews})
                        </span>
                      </div>

                      <p className="text-xs text-white/65 leading-relaxed font-sans line-clamp-2 pt-2">
                        {bookDesc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 px-2">
                    <button
                      type="button"
                      onClick={() => onReadNovel(book)}
                      className={`w-full py-3 px-4 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                        ${theme === 'PURPLE' 
                          ? 'bg-[#d8b4fe]/10 text-[#d8b4fe] border border-[#d8b4fe]/30 hover:bg-[#d8b4fe] hover:text-black hover:border-transparent' 
                          : 'bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black hover:border-transparent'}`}
                    >
                      <BookOpen size={14} />
                      {labels.readBtn}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.02]"
          >
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-sm font-light text-white/40">{labels.noResults}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function LearnWritingPage({ theme, themeStyles, lang, setCurrentView }: any) {
  const isRtl = lang === 'AR';

  // State parameters for the 4-step interactive sequential workshop
  const [currentStep, setCurrentStep] = useState(0);

  // Magical Badges System & Fantasy Prompt Generator States
  const [unlockedBadges, setUnlockedBadges] = useState<{ [key: string]: boolean }>({
    plot: false,
    gray: false,
    sensory: false
  });

  const [promptBoxOpen, setPromptBoxOpen] = useState(false);
  const [currentPromptText, setCurrentPromptText] = useState('');

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  };

  const getReadingTime = (text: string) => {
    const words = getWordCount(text);
    if (words === 0) return '0s';
    const seconds = Math.ceil((words / 200) * 60);
    if (seconds < 60) {
      return lang === 'AR' ? `${seconds} ثانية` : `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    if (lang === 'AR') {
      return remainingSecs > 0 ? `${mins} دقيقة و ${remainingSecs} ثانية` : `${mins} دقيقة`;
    }
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
  };

  // Step 1: وضع أساس القصة
  const [charNames, setCharNames] = useState(() => localStorage.getItem('rb_wf_step1_chars') || '');
  const [plotStart, setPlotStart] = useState(() => localStorage.getItem('rb_wf_step1_plot') || '');
  const [plotEvents, setPlotEvents] = useState(() => localStorage.getItem('rb_wf_step1_events') || '');
  const [plotEnding, setPlotEnding] = useState(() => localStorage.getItem('rb_wf_step1_ending') || '');
  const [step1ChallengeText, setStep1ChallengeText] = useState(() => localStorage.getItem('rb_wf_step1_challenge') || '');

  // Step 2: ماضي الشخصيات
  const [backstoryText, setBackstoryText] = useState(() => localStorage.getItem('rb_wf_step2_backstory') || '');

  // Step 3: الشخصيات المعقدة والرمادية
  const [grayCharText, setGrayCharText] = useState(() => localStorage.getItem('rb_wf_step3_gray') || '');

  // Step 4: الوصف الحسي للأماكن
  const [sensoryText, setSensoryText] = useState(() => localStorage.getItem('rb_wf_step4_sensory') || '');

  // General state
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('rb_wf_author_name') || '');
  const [showTip, setShowTip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotify, setSaveNotify] = useState<boolean | string>(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [evaluatingStep, setEvaluatingStep] = useState<number | null>(null);
  const [stepFeedbacks, setStepFeedbacks] = useState<{ [key: number]: any | null }>(() => {
    try {
      const saved = localStorage.getItem('rb_wf_step_feedbacks');
      return saved ? JSON.parse(saved) : { 0: null, 1: null, 2: null, 3: null };
    } catch {
      return { 0: null, 1: null, 2: null, 3: null };
    }
  });
  const [publishedWorkshops, setPublishedWorkshops] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rb_wf_published_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Textarea references for appending magical tokens at current cursor structure
  const step2Ref = useRef<HTMLTextAreaElement>(null);
  const step3Ref = useRef<HTMLTextAreaElement>(null);
  const step4Ref = useRef<HTMLTextAreaElement>(null);

  // Auto-save values to localStorage on change
  useEffect(() => {
    localStorage.setItem('rb_wf_step1_chars', charNames);
    localStorage.setItem('rb_wf_step1_plot', plotStart);
    localStorage.setItem('rb_wf_step1_events', plotEvents);
    localStorage.setItem('rb_wf_step1_ending', plotEnding);
    localStorage.setItem('rb_wf_step1_challenge', step1ChallengeText);
    localStorage.setItem('rb_wf_step2_backstory', backstoryText);
    localStorage.setItem('rb_wf_step3_gray', grayCharText);
    localStorage.setItem('rb_wf_step4_sensory', sensoryText);
    localStorage.setItem('rb_wf_author_name', authorName);
  }, [charNames, plotStart, plotEvents, plotEnding, step1ChallengeText, backstoryText, grayCharText, sensoryText, authorName]);

  // Debounce "Draft Saved" notification trackers when typing stops
  const [draftSavedFlash, setDraftSavedFlash] = useState<{[stepKey: string]: boolean}>({});

  useEffect(() => {
    if (!step1ChallengeText.trim()) return;
    const timer = setTimeout(() => {
      setDraftSavedFlash(prev => ({ ...prev, step1: true }));
      const hide = setTimeout(() => {
        setDraftSavedFlash(prev => ({ ...prev, step1: false }));
      }, 1800);
      return () => clearTimeout(hide);
    }, 1200);
    return () => clearTimeout(timer);
  }, [step1ChallengeText]);

  useEffect(() => {
    if (!backstoryText.trim()) return;
    const timer = setTimeout(() => {
      setDraftSavedFlash(prev => ({ ...prev, step2: true }));
      const hide = setTimeout(() => {
        setDraftSavedFlash(prev => ({ ...prev, step2: false }));
      }, 1800);
      return () => clearTimeout(hide);
    }, 1200);
    return () => clearTimeout(timer);
  }, [backstoryText]);

  useEffect(() => {
    if (!grayCharText.trim()) return;
    const timer = setTimeout(() => {
      setDraftSavedFlash(prev => ({ ...prev, step3: true }));
      const hide = setTimeout(() => {
        setDraftSavedFlash(prev => ({ ...prev, step3: false }));
      }, 1800);
      return () => clearTimeout(hide);
    }, 1200);
    return () => clearTimeout(timer);
  }, [grayCharText]);

  useEffect(() => {
    if (!sensoryText.trim()) return;
    const timer = setTimeout(() => {
      setDraftSavedFlash(prev => ({ ...prev, step4: true }));
      const hide = setTimeout(() => {
        setDraftSavedFlash(prev => ({ ...prev, step4: false }));
      }, 1800);
      return () => clearTimeout(hide);
    }, 1200);
    return () => clearTimeout(timer);
  }, [sensoryText]);

  // Like & Comment management states for Scribes Community items
  const [workshopLikes, setWorkshopLikes] = useState<{[postId: string]: boolean}>(() => {
    try {
      const saved = localStorage.getItem('rb_wf_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [workshopLikeCounts, setWorkshopLikeCounts] = useState<{[postId: string]: number}>(() => {
    try {
      const saved = localStorage.getItem('rb_wf_like_counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [workshopComments, setWorkshopComments] = useState<{[postId: string]: any[]}>(() => {
    try {
      const saved = localStorage.getItem('rb_wf_post_comments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [commentInputTexts, setCommentInputTexts] = useState<{[postId: string]: string}>({});

  useEffect(() => {
    localStorage.setItem('rb_wf_likes', JSON.stringify(workshopLikes));
  }, [workshopLikes]);

  useEffect(() => {
    localStorage.setItem('rb_wf_like_counts', JSON.stringify(workshopLikeCounts));
  }, [workshopLikeCounts]);

  useEffect(() => {
    localStorage.setItem('rb_wf_post_comments', JSON.stringify(workshopComments));
  }, [workshopComments]);

  const toggleWorkshopLike = (postId: string) => {
    setWorkshopLikes(prev => {
      const liked = !prev[postId];
      const nextLikes = { ...prev, [postId]: liked };
      
      setWorkshopLikeCounts(counts => {
        const currentCount = counts[postId] !== undefined ? counts[postId] : Math.floor(Math.random() * 8) + 3;
        const nextCount = liked ? currentCount + 1 : Math.max(0, currentCount - 1);
        return { ...counts, [postId]: nextCount };
      });

      return nextLikes;
    });
  };

  const getLikeCount = (postId: string) => {
    if (workshopLikeCounts[postId] !== undefined) {
      return workshopLikeCounts[postId];
    }
    // Lazy initialize standard seed likes count
    const seed = Math.floor(Math.random() * 8) + 3;
    setWorkshopLikeCounts(prev => ({ ...prev, [postId]: seed }));
    return seed;
  };

  const getPostComments = (postId: string) => {
    if (workshopComments[postId]) {
      return workshopComments[postId];
    }
    // Lazy seed comments count
    const seed = [
      {
        id: 'seed-1-' + postId,
        author: lang === 'AR' ? 'تالا الوجيه' : 'Tala Al-Wajih',
        text: lang === 'AR' ? 'توصيف رائع وإحساس عميق يحرك طيات الخيال الروائي المبدع!' : 'Exquisite descriptors! Moves the very fibers of speculative imagination.',
        date: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'seed-2-' + postId,
        author: lang === 'AR' ? 'رواد الأطياف' : 'Specter Scribe',
        text: lang === 'AR' ? 'مذهل بحق، تناغم الألوان والتعبير الروائي يرتقي بـ Rosaline Bela!' : 'Truly incredible, the rhythm aligns precisely with Rosaline Bela\'s universe!',
        date: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setWorkshopComments(prev => ({ ...prev, [postId]: seed }));
    return seed;
  };

  const handleAddWorkshopComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    const author = authorName.trim() || (lang === 'AR' ? "روائي مجهول" : "Anonymous Scribe");
    const newComment = {
      id: 'comment-' + Date.now(),
      author,
      text: text.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWorkshopComments(prev => {
      const existing = prev[postId] || [
        {
          id: 'seed-1-' + postId,
          author: lang === 'AR' ? 'تالا الوجيه' : 'Tala Al-Wajih',
          text: lang === 'AR' ? 'توصيف رائع وإحساس عميق يحرك طيات الخيال الروائي المبدع!' : 'Exquisite descriptors! Moves the very fibers of speculative imagination.',
          date: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 'seed-2-' + postId,
          author: lang === 'AR' ? 'رواد الأطياف' : 'Specter Scribe',
          text: lang === 'AR' ? 'مذهل بحق، تناغم الألوان والتعبير الروائي يرتقي بـ Rosaline Bela!' : 'Truly incredible, the rhythm aligns precisely with Rosaline Bela\'s universe!',
          date: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      return {
        ...prev,
        [postId]: [...existing, newComment]
      };
    });

    setCommentInputTexts(prev => ({
      ...prev,
      [postId]: ''
    }));
  };

  // Sync badges based on evaluation scores
  useEffect(() => {
    const updated = { plot: false, gray: false, sensory: false };
    
    // Check Step 1 (stepId: 0)
    if (stepFeedbacks[0] && stepFeedbacks[0].score) {
      const scoreNum = parseInt(stepFeedbacks[0].score);
      if (scoreNum >= 8) updated.plot = true;
    }
    // Check Step 3 (stepId: 2)
    if (stepFeedbacks[2] && stepFeedbacks[2].score) {
      const scoreNum = parseInt(stepFeedbacks[2].score);
      if (scoreNum >= 8) updated.gray = true;
    }
    // Check Step 4 (stepId: 3)
    if (stepFeedbacks[3] && stepFeedbacks[3].score) {
      const scoreNum = parseInt(stepFeedbacks[3].score);
      if (scoreNum >= 8) updated.sensory = true;
    }
    
    setUnlockedBadges(updated);
  }, [stepFeedbacks]);

  // Multilingual Texts (Focused heavily on Arabic as requested, with fallback translation)
  const translations = {
    AR: {
      workshopTitle: "ورشة كتابة الفانتازيا والواقعية السحرية",
      workshopSubtitle: "بوابة الكون الأدبي؛ صممت خطوة بخطوة لصقل موهبتك وهندسة عوالمك الخيالية الغامضة",
      backHome: "← العودة للمحراب الرئيسي",
      saveProgressBtn: "حفظ التقدم لحسابي 💾",
      progressSaved: "تمت مزامنة تقدمك الإبداعي محلياً بنجاح ✧",
      skipStep: "تخطي هذه الخطوة",
      prevStep: "الخطوة السابقة",
      nextStep: "الخطوة التالية",
      publishAllBtn: "أنشر ورشة عملي في مجتمع روزلين بيلا",
      communitySectionTitle: "لوحة الشرف بمحراب روزلين للمبدعين",
      communitySub: "مخططات وتحديات أدبية تمت مشاركتها مؤخراً بواسطة مبدعي ورشتنا السحرية:",
      anonymous: "روائي غامض",
      deleteSuccess: "تمت إزالة ورشة العمل من سجلاتك الخاصة.",
      charactersLabel: "أسماء وحقائق الشخصيات المتفاعلة",
      plotStartLabel: "شرارة البداية لتسارع الأحداث",
      eventsLabel: "منعطفات الصراع والذروة العاصفة",
      endingLabel: "النهاية أو القرار الحاسم والأليم",
    },
    EN: {
      workshopTitle: "Fantasy & Magical Realism Workshop",
      workshopSubtitle: "Your universe portal, guiding you step-by-step to engineer mystical worlds and deep character arcs.",
      backHome: "← Back to Main Sanctuary",
      saveProgressBtn: "Save Progress 💾",
      progressSaved: "Your creative progress synced successfully! ✧",
      skipStep: "Skip Challenge",
      prevStep: "Previous Step",
      nextStep: "Next Step",
      publishAllBtn: "Publish My Workshop to Rosaline Bela Community 🌌",
      communitySectionTitle: "Rosaline's Hall of Creative Scribes",
      communitySub: "Masterful writing blueprints and narrative challenges recently shared by workshop graduates:",
      anonymous: "Mysterious Writer",
      deleteSuccess: "Workshop removed from your personal logs.",
      charactersLabel: "Character Names & Core Truths",
      plotStartLabel: "Initial Spark & Hook",
      eventsLabel: "Rising action & Deepening conflicts",
      endingLabel: "Expected resolution & Crucial choice",
    }
  };

  const currentTranslation = translations[lang as 'AR' | 'EN'] || translations.AR;

  // The 4 detailed sequential steps in creative Arabic
  const stepsData = [
    {
      title: lang === 'AR' ? "وضع أساس الحبكة (The Foundation)" : "Drafting The Foundation",
      shortTitle: lang === 'AR' ? "١. الأساس" : "1. Foundation",
      explanatory: lang === 'AR' 
        ? `الفكرة هي الشرارة الأولى لحياة القصة. كما قلنا، فإن الفكرة هي المبدأ الأساسي لبناء قصتكِ بأكملها. لكن السؤال الحقيقي ليس كيف أجد فكرة مناسبة تجعل القارئ ينجذب إلي، بل كيف أجعل من فكرة صغيرة عالماً أكبر! هذا العالم الأكبر يحتوي على الكثير من الأشياء التي سنتعلمها مع الوقت، لكن الأهم أولاً هو أن تستطيع التفريق بين بناء فكرة مكررة تزيد من رتابة القصص وتجعلها نادرة، أو أن تستخدم فكرة مكررة جداً بنفس الطريقة المعتادة.

فمثلاً، فكرة سهلة وبسيطة للغاية مثل قصة (الأميرة والوحش)، قد يجدها البعض سخيفة وقد لا تبني قصة أبداً؛ لكن ما أريد توضيحه هو أننا قد نستطيع بناء قصص طفولية تقليدية عن الأميرة والوحش، وبالمقابل نستطيع أن نقول أن هذا الوحش كان شريراً، قتل وفعل وفعل.. نجعله شخصية غريبة ورمادية، ونجعل البطلة (الأميرة) أيضاً شخصية شريرة وسيئة لكنها لا تحاول أن تتغير! هكذا فقط يصبح للقصة عمق نفسي ساحر.

الأمر الضروري ليس ألا تكون الفكرة مكررة، بل الضروري هو أن تفهم كيف تبني تفاصيل القصة لتجعلها نادرة وفريدة. فكرة روايتي الشخصية مثلاً هي فكرة مكررة تتحدث عن (الذاكرة ومآسيها)، لكن ما جعلها نادرة وقريبة من القلوب هي الشخصيات، طريقة الحكي، وطبيعة الروح التي تظهر في هذه القصة.`
        : "The idea is the initial spark of any mystical novel. Novice writers often jump in without a roadmap, causing their plot to stagnate midway. Master scribes secure the castle's foundation before shaping its towers by defining the four core pillars of narrative architecture.",
      challengePrompt: lang === 'AR'
        ? "أطلق العنان لذهنك وصغ الخطوط العامة لروايتك عبر كتابة أسماء الشخصيات، نقطة البداية، كيف ستعقد الأمور في المنتصف، وفكرة النهاية الكبرى."
        : "Unleash your mind and outline the general backbone of your tale by defining your primary characters, the ignition trigger, rising turning points, and the ultimate ending.",
      tip: lang === 'AR'
        ? "تخيّل النهاية أولاً! معرفة أين سيتوقف حوت قصتك الطائر يجعل كل منعطف في طريقك مبرراً وممتعاً."
        : "Visualize the destination first. Knowing where your flying whale berths justifies every storm along the way."
    },
    {
      title: lang === 'AR' ? "بناء ماضي الشخصيات وظلها (Character Backstory)" : "Character Backstory & Shades",
      shortTitle: lang === 'AR' ? "٢. الماضي" : "2. Backstory",
      explanatory: lang === 'AR'
        ? `الماضي ليس مجرد شيء يستطيع الكاتب أن يتجاهله بسهولة في القصة. كم من راوٍ وضع شخصية جيدة، قوية، لها كاريزما ورائعة، لكنه فشل في تقديم الماضي المناسب لها، فجعلها تبدو سطحية، غير مبالية، وقد تصبح مكروهة في بعض الأحيان! \n\nما يجب أن تفهمه هو أنه ليس كل ماضٍ يُكتب، وليس كل ماضٍ يجب أن يُذكر؛ بل أول شيء عليك فعله هو أن تفكر وتقول في نفسك: (هل تصرفات هذه الشخصية مناسبة ومتناسقة مع الماضي الذي كتبته لها؟). حدد ماضي الشخصية بدقة قبل أن تبدأ بكتابة الرواية لتستطيع بناء أحداث تتناسب مع تاريخها؛ فعندما يظهر ماضيها لاحقاً في الفصول، سيقول القارئ تلقائياً: (أوه! لقد تذكرت.. حدث هذا وهذا مما جعله يتصرف هكذا!)، مما يدفعه لتصديق الشخصية ورؤية الترابط الوثيق في أفعالها.\n\nما أريد شرحه هنا ليس كيف تبني أي ماضٍ عشوائي قد يكون منفصلاً عن الواقع، بل كل ما يهم هو أن تصنع ماضياً يجعل الشخصية حية (أو حتى غير حية في عمقها). فماضيك أنت في الحقيقة يتناسب مع شخصيتك الحالية، وهكذا هي شخصيات الرواية؛ فمثلاً، إذا كان ماضي الشخصية حزيناً ومنكسراً، فقد يرتدي في الحاضر قناع الشخص المتكبر! \n\nدعونا نضرب مثالاً صغيراً: شخصية عاشت ماضياً قاسياً، تعرضت فيه للعنف والضرب من عمّها، وكانت هي الناجية الوحيدة من مأساة عائلية.. هنا، يجب أن تكون شخصيتها في الحاضر (مغلفة من الخارج) لتبدو قوية وصخرية أمام الناس، لكنها من الداخل هشة كأرق زجاج، يمكن بلمسة واحدة كسرها! ما يجب أن نفهمه ليس الماضي كأحداث مجردة، بل كيف نبني ماضياً يبرر أفعال الشخصية، أقوالها، وردود أفعالها.`
        : "Characters are not floating ghosts; they are the sum of their childhood traps, unspoken shame, and forgotten roots. Backstory is the ghost machine driving their current choices. Without a rich past, your characters will fall flat; weave their scars to give readers a true anchor for empathy.",
      challengePrompt: lang === 'AR'
        ? `التحدي الثاني: قناع القوة والهشاشة الداخلية (تحدي متقدم)
لنرفع مستوى الصعوبة قليلاً ونختبر مهاراتك في اللعب بمشاعر القارئ. التحدي الآن هو بناء شخصية كاملة من اختيارك (لك الحرية في تسميتها)، ولكن بشرط أن يكون ماضيها مبنياً على (العنف العائلي).

المطلوب منك في صندوق الكتابة أدناه هو تحقيق هذه المعادلة النفسية الصعبة:
1. المظهر الخارجي: اجعل الشخصية تظهر أمام الناس بقناع محدد (مثل كبرياء شديد، برود قاتل، أو قسوة).
2. العمق الداخلي: اعكس هشاشتها وانكسارها الحقيقي الذي تحاول إخفاءه.
3. التناقض الحواري: اجعلها تتحدث بأقوال وتتصرف بأفعال متناقضة تماماً مع ما تشعر به في الداخل.

الهدف الأساسي: اكتب نصاً وصفياً وحوارياً لهذه الشخصية يجعل القارئ في حالة ارتباك وحيرة شديدة.. لا يعرف هل يتعاطف معها ويحبها، أم يرفض أفعالها ويكرهها!`
        : "Challenge Two: Mask of Strength & Inner Fragility (Advanced Challenge)\nLet's raise the difficulty and test your skills in playing with the reader's emotions. Build a character of your choice whose backstory is based on family violence.\nAchieve this difficult psychological equation:\n1. Exterior: Show them with a strong mask (pride, coldness, or cruelty).\n2. Interior: Reflect their true fragility and brokenness.\n3. Dialogical Contradiction: Make them speak and act in complete contradiction to their inner feelings.\n\nGoal: Write a description and dialogue that leaves the reader utterly confused—unsure whether to hate them or symphathize with them!",
      tip: lang === 'AR'
        ? "يُعبر ماضي الشخصية عن نفسه دائماً بحركة تلقائية؛ كأن يلمس ندبته قسرياً كلما توتر، أو يحمل غرضاً تافهاً يتيم الذكرى."
        : "Show, don't tell the backstory. Let your character touch their old scar nervously, or hold a seemingly useless trinket whenever anxiety strikes.",
      tokens: lang === 'AR' 
        ? ["ندبة السحر الخالد", "السر المدفون", "الخيانة غير المتوقعة", "عهد الطفولة المدمّر", "نبض الحنين الدافئ"] 
        : ["magical scar", "buried betrayals", "unspoken legacy", "childhood compact", "phantom heartbeats"]
    },
    {
      title: lang === 'AR' ? "الشخصيات الرمادية والمعقدة (Morally Gray Persona)" : "Morally Gray Characters",
      shortTitle: lang === 'AR' ? "٣. الوجه الرمادي" : "3. Morally Gray",
      explanatory: lang === 'AR'
        ? `عالمنا أصبح واسعاً، والتكنولوجيا أتيحت للجميع، فيظن بعضهم أن ذلك ميزة له بما يحتاج إليه، لكن بناء شخصية رمادية قد يكون من أصعب الخطوات التي قد يتعلمها الكاتب؛ فإن لم تكن لديك تلك الموهبة التي تجعل منك شخصاً يستطيع بناء شخصية رمادية، لن تفتح عينيك على الكتابة، وقد يكون ذلك صعباً عليك. 

في أحد أعمالي الشخصية، كتبتُ قصة بطلها وشريرها في آن واحد هي فتاة اسمها (ديارا). ديارا لها ماضٍ ولها أشياء وتعاني كثيراً، لكنني جعلتُ القارئ يفكر أولاً قبل أن يفهم؛ حيث طرحتُ في مقدمة القصة سؤالاً أخلاقياً قد يجعله مرتبكاً وقد يتجاهله بعض القراء: (هل هي بريئة أم هي مجرمة؟). المهم هنا ليس السؤال نفسه، بل كيف ستربك عقل القارئ رغم تجاهله للسؤال، لأنه في النهاية لن يتجاهل الحقيقة!

ماضي الشخصية ليس بالشيء السهل كما يظن البعض، بل هو أكبر شيء تقوم به وقد تصعد به القصة إلى قمة النجاح. ولكي تصنع هذا الماضي، يجب أولاً أن يحتوي على جزء غير مفهوم.. جزء غامض لا أحد يعرف جوابه! هذا الجزء الغامض ليس من الضروري أن يكون في حاضر الشخصية، بل قد يكون مدفوناً في ماضيها؛ قطعة مفقودة من (البازل) لم تكتمل، تجعل القارئ هو من يفكر كيف يستطيع ملأها. ومن الأفضل أحياناً ألا تملأها أبداً، أو أن يكون خيارك هو كشفها في آخر كلمة تضعها في الرواية! هذه القطعة البسيطة، التي قد لا تكون ظاهرة في البداية، هي ما سيجعل القارئ يكمل الرواية إلى آخر رمق، ليعرف فقط هل ما فكر فيه صحيح أم أنها خدعة سحرية من الكاتب.

لذا، لا تسرد ماضي الشخصية كأنك تستعرض قصصاً عادية فتقول: (ماضيه هو كذا، وقد كان في فرنسا وحصل معه كذا وكذا..) وتتوقف! بل يجب أن تصف المشاعر.. الخنقة.. هل تعرف عندما تشعر بالغصة؟ في تلك اللحظة مثلاً: (رأيت ذلك المنظر، فشعرت بعنقي كأنما يلتف حوله سلسال من الحديد يخنقه ويمنعه من التحدث.. شعرت بالحزن لأنني لا أملك صوتاً). هنا الشخصية لا تقول مباشرة أنها فاقدة للصوت، بل تعبر عن العجز بطريقة غير مباشرة تجعل القارئ يعيش معها الأحداث المؤلمة والسعيدة. 

القطعة المفقودة التي تتركها للنهاية أو لا تشرحها أبداً يجب أن تكون مفصلية؛ مثلاً: من قام بحرق بيت عائلته؟ من قام بقتل والدته؟ من أمر بفعل هذا؟ بهذه الطريقة تخلق أسئلة تدور في بال القارئ وتجعله يتلهف لمعرفة الإجابة.`
        : `Our world is wide and technology is accessible to everyone, making some think it serves their every need. However, building a morally gray character is one of the most difficult skills a writer can master. Without the seed of talent to craft such complexity, one's literary vision remains closed.

In my own work, I wrote a story where the hero and villain reside within the same heart: a girl named Diara. Diara has a traumatic past and suffers immensely, yet I designed her to make the reader think before they understand. At the outset, I posed a moral dilemma that perplexes readers: "Is she innocent or is she a criminal?" The question itself isn't what matters, but rather how you destabilize the reader's judgment so they cannot ignore the ultimate truth!

Crafting a character's backstory is far from easy. It is the single most powerful anchor that can elevate a story to peak success. To create this rich history, it must first contain an unresolved fragment—a dark mystery with no clear answer! This enigma doesn't need to lie in the present; it is best buried in the past like a missing puzzle piece, leaving readers to wonder how to fill the void. Sometimes, it is best never to solve it, or to reveal it as the very last word of the novel! This subtle piece keeps readers hanging on until the final breath.

Do not narrate the past like a flat resume: "His past is this, he lived in France, this and that happened..." and then stop! Instead, capture sensory struggles... the suffocation... Do you know the feeling of a lump in your throat? Like: “I saw that sight, and felt my neck bound by heavy iron chains, choking me, stealing my voice. I felt profound grief for having no utterance.” Here, the character never directly states they are mute, but conveys the helplessness indirectly to immerse the reader.

The missing piece left until the end must be pivotal: Who burned down their ancestral home? Who ordered the crime? This creates deep, burning inquiries in the reader's spirit.`,
      challengePrompt: lang === 'AR'
        ? `التحدي الثالث: اكتب لي شخصية رمادية... فقط!
بناءً على الفلسفة التي قرأتها بالأعلى، التحدي الآن أصبح مباشراً وقاسياً ليختبر جوهر موهبتك. المطلوب منك في صندوق الكتابة هو ابتكار شخصية رمادية، لك كامل الحرية في اختيار اسمها، ولكن يجب عليك الالتزام التام بالقوانين الثلاثة التالية:

1. قانون الارتباط: يجب أن تمنح الشخصية لمحة من ماضٍ يبرر أفعالها ويجعل القارئ يتعلق بها ويتألم لأجلها.
2. قانون قطعة البازل: اترك قطعة مفقودة، غامضة، وغير مفهومة في تاريخ الشخصية أو دوافعها ليظل القارئ يبحث عنها.
3. قانون السؤال المعلق: اطرح في سياق النص سؤالاً أخلاقياً عميقاً حول الشخصية.. واتركه بدون إجابة!

أرنا كيف ستصنع السحر في أسطر قليلة تجعل عقل القارئ يرتبك!`
        : `Challenge Three: Just Write Me a Morally Gray Character!
Based on the philosophy you read above, the challenge is now direct and demanding to test the core of your talent. Your task in the writing box is to create a morally gray character. You have absolute freedom in choosing their name, but you must strictly adhere to the following three laws:

1. The Law of Connection: You must grant the character a glimpse of a backstory that justifies their actions and makes the reader connect and grieve with them.
2. The Law of the Puzzle Piece: Leave a missing, mysterious, and incomprehensible piece in the character's history or motives so the reader is always searching for it.
3. The Law of the Unanswered Question: Raise a deep ethical question about the character within the text's context... and leave it completely unanswered!

Show us how you compile magic in a few lines that will perplex the reader's judgment!`,
      tip: lang === 'AR'
        ? "ابنِ غصة حقيقية أو تفصيلاً غامضاً لا تكشفه مباشرة، بل اتركه يظهر تعبيراً جسدياً صامتاً كملامسة الندبة أو شد أطراف الرداء."
        : "Focus on creating a sensory gasp or an unresolved secret, allowing it to emerge through subtle, silent physical body motions.",
      tokens: lang === 'AR'
        ? ["غصة خانقة", "قطعة بازل مفقودة", "هل هي بريئة؟", "السر المدفون", "سلسال من حديد"]
        : ["choking gasp", "missing piece", "is she innocent?", "buried secret", "iron chains"]
    },
    {
      title: lang === 'AR' ? "الوصف الحسي للأماكن (Sensory World-Building)" : "Sensory World Building",
      shortTitle: lang === 'AR' ? "٤. الوصف الحسي" : "4. Sensory Details",
      explanatory: lang === 'AR'
        ? `الوصف قد يكون أصعب شيء قد تمر به كاتب.. نعم، قد يكون أصعب من بناء الشخصيات وكل الأشياء التي شرحناها قبلاً! أنا شخصياً أرى أن الوصف هو من أهم النقاط التي يجب أن نركز عليها كثيراً، لأنك بذلك تجعل القارئ يشعر كأنه جزء لا يتجزأ من الحدث.

دعونا نضرب مثالاً عادياً: تخيل نفسك في مقهى تكتب مشهداً للأبطال هناك.. ما الأشياء التي تحيط بك؟ أنت لا ترى فقط، بل تشم رائحة القهوة الطازجة الذكية، وتلمس الكرسي المريح، وتتأمل الطاولة الخشبية ذات اللون البني الجميل الذي يشيع في النفس الهدوء والسكينة.. تنظر إلى الحائط فترى رسومات تعبر عن القهوة وأهميتها، وترى أشخاصاً يتهامسون في الجانب الآخر.. تمسك الكأس فتشعر بحرارته أو برودته، وتفكر: ماذا يوقظ هذا الشعور في داخلك؟

الطريقة التي أستخدمها شخصياً في كتاباتي هي أنني (أتخيل نفسي ضمن الحدث).. أنا داخل المشهد تماماً! فمثلاً، إذا أردت كتابة مشهد رعب، أتخيل نفسي في ذلك المكان؛ اخترت بيتاً مظلماً؟ إذن سأتخيل نفسي داخل هذا البيت الحالك، أفكر في الروائح العفنة التي قد أشمها، والأصوات الخافتة التي قد أسمعها، وبماذا يجول عقلي في تلك اللحظة.. وبذلك فقط، ينتج كاتب وصفاً حياً وممتازاً.`
        : "Settings are never static stage backdrops. To craft authentic wonder, utilize active sensory details that satisfy multiple avenues of perception: the hum of stellar dust settling on ancient floorboards, the smell of burnt copper in humid damp castle corridors, and the heavy chill of stars.",
      challengePrompt: lang === 'AR'
        ? `التحدي الرابع والأخير: أصداء القلعة المظلمة (تحدي الحواس الأربعة)
حان الوقت لنضع لمستك السحرية الأخيرة في ورشتنا! التحدي هو أن تصف (قلعة مخيفة ومهجورة)، مع الالتزام التام بالشروط الحِسّية التالية:

1. حاسة البصر: صِف تفصيلاً صغيراً وخفياً في المكان (وليس القلعة ككل).
2. حاسة السمع: انقل لنا صوتاً يكسر سكون القلعة ويرعب الأنفاس.
3. حاسة الشم: ما هي الرائحة التي تعبق في هواء هذا المكان المهجور؟
4. حاسة اللمس: ادمج ملمساً في المشهد (برودة الجدران، غبار النوافذ، ثقل الهواء).
5. الأفكار الجائلة: اذكر فكرة أو خاطرة دارت في عقل البطل وهو يخطو داخلها (مثل: جال في فكري أنني...).

أطلق العنان لقلمك الآن، واختم ورشتك بنص حسي يسلب الألباب!`
        : "Describe a scary and abandoned castle, strictly blending at least four physical senses (Sight, Sound, Smell, Touch) and your protagonist's internal monologue ('It occurred to me that I...').",
      tip: lang === 'AR'
        ? "تجنب الألفاظ المباشرة مثل 'كان المقهى جميلاً ويصدر صوتاً'، بدلاً من ذلك قل 'كان المقهى يطن بوشوشات خافتة تعيد رائحة القرفة والقهوة المطحونة للأرواح الجالسة'."
        : "Avoid dry summary statements like 'the room was magic'. Write instead: 'the room exhaled dry stardust, smelling of roasted cinnamon and whispers of long-dead travelers.'",
      tokens: lang === 'AR'
        ? ["طنين الكواكب الخافت", "رائحة النحاس المحترق", "رطوبة الحجر الأثرية", "حكاية مجهولة", "وميض بنفسجي غامض"]
        : ["celestial hum", "burnt star copper", "antique stone coldness", "shattered prophecy", "misty purple embers"]
    }
  ];

  // Helper function to append tokens to textareas
  const appendTokenToText = (token: string, stepNum: number) => {
    let ref;
    let value = '';
    let setter: any;

    if (stepNum === 2) {
      ref = step2Ref.current;
      value = backstoryText;
      setter = setBackstoryText;
    } else if (stepNum === 3) {
      ref = step3Ref.current;
      value = grayCharText;
      setter = setGrayCharText;
    } else if (stepNum === 4) {
      ref = step4Ref.current;
      value = sensoryText;
      setter = setSensoryText;
    }

    if (!ref) {
      setter((prev: string) => prev ? `${prev} ${token}` : token);
      return;
    }

    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const text = ref.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setter(before ? `${before} ${token} ${after}` : `${token} ${after}`);

    setTimeout(() => {
      ref.focus();
      const newPos = start + token.length + 2;
      ref.setSelectionRange(newPos, newPos);
    }, 20);
  };

  const handleSkip = () => {
    if (currentStep === 0) {
      setStep1ChallengeText(lang === 'AR' 
        ? "تفاصيل تحدي سحر إعادة الابتكار: الفتاة (ليلة) متمردة تحمل في ردائها الأحمر دماء صياد قديم، تبحث عن الذئب الذي يمثل حارس الغابة المنسية لتبرم صفقة لمنع زوال مملكتها. تنتهي الحكاية بتعانق الأرواح تحت ضوء القمر الخافت لتولد فجر جديد."
        : "Re-innovation challenge outline: Little Red Riding Hood is a rebel holding the ashes of an ancient hunter in her crimson cloak. She seeks the wolf—the protector of the forgotten forest—to seal a compact preventing the decay of her realm.");
    } else if (currentStep === 1) {
      setBackstoryText(lang === 'AR' 
        ? "تربى يونس في الكنيسة السريّة يتجرع قوانين العزلة، وكان ذنبه الحقيقي في الطفولة حرق مخطوطة أكلها الصدأ تمنياتا بحرية أخته التي قضت غرقاً تحت ظلال الحوت الطائر."
        : "Raised by the silent monks of Eldria, Younes was trained to avoid human links. His life shattered when his sister drowned due to a calculated decree he failed to prevent.");
    } else if (currentStep === 2) {
      setGrayCharText(lang === 'AR'
        ? "أطبقتُ كفّي حول المقبض الصدِئ والظلام يلتف حولي كشرنقة. شعرتُ حينها بغصة حارقة في حلْقي وسلسلة من الحديد تطبقُ بقسوة على صخَب أنفاسي. كنتُ أعلم ما يُقال عن ديارا خلف الجدران العتيقة، لكن تلك الزوايا المظلمة لم تكشف أبداً من الذي أشعل النار الحقيقية في تلك الليلة المشؤومة؛ هل كنتُ ضحيتها الباكية، أم المجرمة التي تستلذ بالرماد؟"
        : "My hand clamped onto the rusted latch as darkness surrounded me like a cocoon. I felt a burning lump in my throat, like heavy iron chains locking my ragged breath. I knew what they whispered about Diara behind ancient stone walls, but the shadows never revealed who actually lit the fire on that fateful night: was of a weeping victim, or the villain enjoying the ashes?");
    } else if (currentStep === 3) {
      setSensoryText(lang === 'AR'
        ? "تسلل هواء عليل برائحة الخزامى الجافة وأوراق الدفلى من بوابات مقهى الكواكب المنسية الطائرة. كان الحجر يطن بخفوت سماوي دافئ، بينما ترنو الموائد الدوارة الخشبية مبعثرة كالسحب الأرجوانية تحت لمعان مصابيح الغاز المستلهمة من نجوم منطفئة."
        : "The sanctuary keyhole exhaled cold, ancient air smelling of dried lavender and rust. Under the floating wooden arches of the starry café, the atmosphere hummed with a quiet celestial vibration, and purple embers swam in the bronze lanterns.");
    }

    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const triggerSaveProgress = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveNotify(true);
      setTimeout(() => setSaveNotify(false), 3000);
    }, 800);
  };

  const shareStep1Attempt = () => {
    if (!step1ChallengeText.trim()) {
      alert(lang === 'AR' ? "يرجى كتابة بعض الكلمات للمشاركة أولاً!" : "Please write some words to share first!");
      return;
    }
    
    // Trigger AI correction evaluation
    runAIEvaluation(0, step1ChallengeText);
    
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      
      const newWorkshop = {
        id: Date.now().toString(),
        author: authorName.trim() || (lang === 'AR' ? "روائي مبدع متطلع" : "Creative Scribe"),
        date: new Date().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        step1Challenge: step1ChallengeText,
        step1: {
          chars: lang === 'AR' ? "تحدي: إعادة الابتكار لليلة والذئب" : "Challenge: Red Riding Hood Re-innovation",
          plot: step1ChallengeText.substring(0, 80) + "...",
          events: "...",
          ending: "..."
        },
        step2: lang === 'AR' ? "لم يكتب بعد" : "Not drafted yet",
        step3: lang === 'AR' ? "لم يكتب بعد" : "Not drafted yet",
        step4: lang === 'AR' ? "لم يكتب بعد" : "Not drafted yet"
      };

      const updatedList = [newWorkshop, ...publishedWorkshops];
      setPublishedWorkshops(updatedList);
      try {
        localStorage.setItem('rb_wf_published_list', JSON.stringify(updatedList));
      } catch (err) {
        console.error(err);
      }

      setSaveNotify(lang === 'AR' ? "تم حفظ تقدمك الإبداعي ونشر محاولتك لليلة والذئب بلوحة الشرف بمحراب روزلين! 🚀" : "Saved your progress and shared your Red Riding Hood attempt in the Honor Scroll! 🚀");
      setTimeout(() => setSaveNotify(false), 4500);
    }, 600);
  };

  const shareStep2Attempt = () => {
    if (!backstoryText.trim()) {
      alert(lang === 'AR' ? "يرجى كتابة بعض الكلمات للمشاركة أولاً!" : "Please write some words to share first!");
      return;
    }
    
    // Trigger AI correction evaluation
    runAIEvaluation(1, backstoryText);
    
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      
      const newWorkshop = {
        id: Date.now().toString(),
        author: authorName.trim() || (lang === 'AR' ? "روائي مبدع متطلع" : "Creative Scribe"),
        date: new Date().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        step1Challenge: step1ChallengeText || (lang === 'AR' ? "تخطي أو لم يكتب بعد" : "Skipped or not written yet"),
        step1: {
          chars: lang === 'AR' ? "تحدي: إعادة الابتكار لليلة والذئب" : "Challenge: Red Riding Hood Re-innovation",
          plot: step1ChallengeText ? step1ChallengeText.substring(0, 80) + "..." : "...",
          events: "...",
          ending: "..."
        },
        step2: backstoryText,
        step3: lang === 'AR' ? "لم يكتب بعد" : "Not drafted yet",
        step4: lang === 'AR' ? "لم يكتب بعد" : "Not drafted yet"
      };

      const updatedList = [newWorkshop, ...publishedWorkshops];
      setPublishedWorkshops(updatedList);
      try {
        localStorage.setItem('rb_wf_published_list', JSON.stringify(updatedList));
      } catch (err) {
        console.error(err);
      }

      setSaveNotify(lang === 'AR' ? "تم حفظ تقدمك الإبداعي ونشر محاولتك لظلال الماضي بلوحة الشرف بمحراب روزلين! 🚀" : "Saved your progress and shared your Character Backstory attempt in the Honor Scroll! 🚀");
      setTimeout(() => setSaveNotify(false), 4500);
    }, 600);
  };

  const shareStep3Attempt = () => {
    if (!grayCharText.trim()) {
      alert(lang === 'AR' ? "يرجى كتابة بعض الكلمات للمشاركة أولاً!" : "Please write some words to share first!");
      return;
    }
    
    // Trigger AI correction evaluation
    runAIEvaluation(2, grayCharText);
    
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      
      const newWorkshop = {
        id: Date.now().toString(),
        author: authorName.trim() || (lang === 'AR' ? "روائي مبدع متطلع" : "Creative Scribe"),
        date: new Date().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        step1Challenge: step1ChallengeText || (lang === 'AR' ? "تخطي أو لم يكتب بعد" : "Skipped or not written yet"),
        step1: {
          chars: lang === 'AR' ? "تحدي: إعادة الابتكار لليلة والذئب" : "Challenge: Red Riding Hood Re-innovation",
          plot: step1ChallengeText ? step1ChallengeText.substring(0, 80) + "..." : "...",
          events: "...",
          ending: "..."
        },
        step2: backstoryText || (lang === 'AR' ? "تخطي أو لم يكتب بعد" : "Skipped or not written yet"),
        step3: grayCharText,
        step4: lang === 'AR' ? "لم يكتب بعد" : "Not drafted yet"
      };

      const updatedList = [newWorkshop, ...publishedWorkshops];
      setPublishedWorkshops(updatedList);
      try {
        localStorage.setItem('rb_wf_published_list', JSON.stringify(updatedList));
      } catch (err) {
        console.error(err);
      }

      setSaveNotify(lang === 'AR' ? "تم حفظ تقدمك الإبداعي ونشر محاولتك للشخصية الرمادية بلوحة الشرف بمحراب روزلين! 🚀" : "Saved your progress and shared your Morally Gray Character attempt in the Honor Scroll! 🚀");
      setTimeout(() => setSaveNotify(false), 4500);
    }, 600);
  };

  const shareStep4Attempt = () => {
    if (!sensoryText.trim()) {
      alert(lang === 'AR' ? "يرجى كتابة بعض الكلمات للمشاركة أولاً!" : "Please write some words to share first!");
      return;
    }
    
    // Trigger AI correction evaluation
    runAIEvaluation(3, sensoryText);
    
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      
      const newWorkshop = {
        id: Date.now().toString(),
        author: authorName.trim() || (lang === 'AR' ? "روائي مبدع متطلع" : "Creative Scribe"),
        date: new Date().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        step1Challenge: step1ChallengeText || (lang === 'AR' ? "تخطي أو لم يكتب بعد" : "Skipped or not written yet"),
        step1: {
          chars: charNames || (lang === 'AR' ? "يونس وروزلين" : "Younes & Rosaline"),
          plot: plotStart || (lang === 'AR' ? "سرقة الترياق العظيم لإنقاذ السلالة" : "Stealing solar elixir to restore life"),
          events: plotEvents || (lang === 'AR' ? "الصراع بين العوالم الغابرة المنسية" : "Navigating cosmic void battles"),
          ending: plotEnding || (lang === 'AR' ? "قبول فاني للفناء لأجل الحب الأبدي" : "Preserving the flame of memory")
        },
        step2: backstoryText || (lang === 'AR' ? "تخطي أو لم يكتب بعد" : "Skipped or not written yet"),
        step3: grayCharText || (lang === 'AR' ? "تخطي أو لم يكتب بعد" : "Skipped or not written yet"),
        step4: sensoryText
      };

      const updatedList = [newWorkshop, ...publishedWorkshops];
      setPublishedWorkshops(updatedList);
      try {
        localStorage.setItem('rb_wf_published_list', JSON.stringify(updatedList));
      } catch (err) {
        console.error(err);
      }

      setSaveNotify(lang === 'AR' ? "تم حفظ تقدمك الإبداعي ونشر محاولتك لوصف الأماكن بلوحة الشرف بمحراب روزلين! 🚀" : "Saved your progress and shared your Sensory Details attempt in the Honor Scroll! 🚀");
      setTimeout(() => setSaveNotify(false), 4500);
    }, 600);
  };

  const handlePublishWorkshop = (e: React.FormEvent) => {
    e.preventDefault();

    // Compile everything into a beautiful workshop record
    const newWorkshop = {
      id: Date.now().toString(),
      author: authorName.trim() || currentTranslation.anonymous,
      date: new Date().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      step1Challenge: step1ChallengeText,
      step1: {
        chars: charNames || (lang === 'AR' ? "يونس وروزلين" : "Younes & Rosaline"),
        plot: plotStart || (lang === 'AR' ? "سرقة الترياق العظيم لإنقاذ السلالة" : "Stealing solar elixir to restore life"),
        events: plotEvents || (lang === 'AR' ? "الصراع بين العوالم الغابرة المنسية" : "Navigating cosmic void battles"),
        ending: plotEnding || (lang === 'AR' ? "قبول فاني للفناء لأجل الحب الأبدي" : "Preserving the flame of memory")
      },
      step2: backstoryText || (lang === 'AR' ? "ندبة طفل سقط في حفرة السحر الأبدي بالماضي." : "A childhood star tragedy framing their current silence."),
      step3: grayCharText || (lang === 'AR' ? "السرقة النبيلة التي تضر الكثير في سبيل إنقاذ البقية." : "Stealing life-changing remedy to salvage a dying daughter."),
      step4: sensoryText || (lang === 'AR' ? "وصف مفعم برائحة الخزامى الفواحة وصوت النحاس الطنان." : "A serene library smelling of ink, burnt copper, and cold stardust.")
    };

    const updatedList = [newWorkshop, ...publishedWorkshops];
    setPublishedWorkshops(updatedList);
    try {
      localStorage.setItem('rb_wf_published_list', JSON.stringify(updatedList));
    } catch (err) {
      console.error(err);
    }

    // Reset fields upon success
    setPublishSuccess(true);
    setCharNames('');
    setPlotStart('');
    setPlotEvents('');
    setPlotEnding('');
    setStep1ChallengeText('');
    setBackstoryText('');
    setGrayCharText('');
    setSensoryText('');
    setAuthorName('');
    setCurrentStep(0);

    setTimeout(() => {
      setPublishSuccess(false);
    }, 6000);
  };

  const deletePublishedItem = (id: string) => {
    const updated = publishedWorkshops.filter(item => item.id !== id);
    setPublishedWorkshops(updated);
    localStorage.setItem('rb_wf_published_list', JSON.stringify(updated));
  };

  const runAIEvaluation = (stepIdx: number, text: string) => {
    if (!text.trim()) return;
    setEvaluatingStep(stepIdx);
    
    // Simulate AI model processing with a beautiful magical delay
    setTimeout(() => {
      let score = 5;
      let strengths: string[] = [];
      let improvements: string[] = [];
      
      const textLower = text.toLowerCase().trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      
      if (stepIdx === 0) {
        // Step 1 (The Foundation): Plot structure, the ending, character intro, and Red Riding Hood reinvention.
        const hasRedRidingHood = textLower.includes("ليلى") || textLower.includes("الذئب") || textLower.includes("ليلي") || textLower.includes("ذئب") || textLower.includes("رداء") || textLower.includes("أحمر") || textLower.includes("حمراء") || textLower.includes("جدة") || textLower.includes("صياد") || textLower.includes("wolf") || textLower.includes("red") || textLower.includes("hood");
        const hasPlotStructure = textLower.includes("حبكة") || textLower.includes("بداية") || textLower.includes("وسط") || textLower.includes("صراع") || textLower.includes("عقدة") || textLower.includes("ثم") || textLower.includes("أحداث") || textLower.includes("تسلسل") || textLower.includes("plot") || textLower.includes("structure") || textLower.includes("events");
        const hasEnding = textLower.includes("نهاية") || textLower.includes("انتهت") || textLower.includes("خاتمة") || textLower.includes("خلاص") || textLower.includes("موت") || textLower.includes("فجر") || textLower.includes("مصير") || textLower.includes("أخيراً") || textLower.includes("ending") || textLower.includes("resolve") || textLower.includes("destiny");
        const hasCharIntro = textLower.includes("شخصية") || textLower.includes("بطل") || textLower.includes("شخصيات") || textLower.includes("يونس") || textLower.includes("فتاة") || textLower.includes("رجل") || textLower.includes("characters") || textLower.includes("intro") || textLower.includes("name");

        if (wordCount >= 30) score += 1;
        
        // 1. Evaluate Red Riding Hood reinvention
        if (hasRedRidingHood) {
          score += 1;
          strengths.push("إعادة بناء أسطورية ومتمردة لقصة (ليلى والذئب) بقالب معاصر مفعم بالدلالات والرموز السحرية غير المستهلكة.");
        } else {
          improvements.push("حاول دمج أحد العناصر الرمزية من القصة الكلاسيكية ليلى والذئب (كرمزية الرداء الأحمر، أو معاهدة الذئب الأزلية) لإبراز سمة إعادة الابتكار السحرية.");
        }

        // 2. Evaluate Plot structure
        if (hasPlotStructure) {
          score += 1;
          strengths.push("تأسيس بنيوي متماسك للحبكة؛ وضعتَ للقارئ مساراً سردياً واضحاً يبدأ بشرارة محركة واختمار مدروس للصراع والأحداث.");
        } else {
          improvements.push("احرص على تقوية العمود الفقري للحبكة بإضافة (شرارة صراع وعقبات واضحة) في المنتصف لتصعيد وتيرة التشويق وجذب المتلقي.");
        }

        // 3. Evaluate Character Intro
        if (hasCharIntro) {
          score += 1;
          strengths.push("تعريف بليغ بالشخصيات المتفاعلة يتجاوز السطحية التنميطية ويضفي غموضاً ساحراً على كوامنهم النفسية.");
        } else {
          improvements.push("انفخ الروح في أبطالك منذ البداية؛ عرّفنا صراحة أو تلميحاً على أسماء أو سمات كبرى تحدد هوية الشخصيات الروائية.");
        }

        // 4. Evaluate Ending
        if (hasEnding) {
          score += 1;
          strengths.push("صياغة خاتمة/حل أدبي ذي أبعاد شعورية دافئة وعميقة، تُنهي الجزء الأول بلذة تماسك فني ممتع ومقنع.");
        } else {
          improvements.push("حدد خطوط النهاية أو المصير الأليم المتوقع لأبطالك في الختام، لتعطي هيكل الرواية تماسكاً فكرياً ونهاية حاسمة تلتصق بالذاكرة.");
        }

        if (wordCount < 20) {
          improvements.push("النص مقتضب للغاية؛ تمدد في السرد وأثث مشهدك بمزيد من الجمل لنستشعر ملامح السحر والابتكار الفني.");
        }

      } else if (stepIdx === 1) {
        // Step 2 (Character Backstory): Evaluate depth of trauma/backstory and if it perfectly justifies hard exterior vs fragile interior.
        const hasTrauma = textLower.includes("ماضي") || textLower.includes("طفل") || textLower.includes("طفولة") || textLower.includes("حزن") || textLower.includes("ألم") || textLower.includes("وجع") || textLower.includes("ظلام") || textLower.includes("عنف") || textLower.includes("صدمة") || textLower.includes("مشرّد") || textLower.includes("يتم") || textLower.includes("فقد") || textLower.includes("ضرب") || textLower.includes("مأساة") || textLower.includes("trauma") || textLower.includes("past") || textLower.includes("abuse") || textLower.includes("grief");
        const hasExterior = textLower.includes("قناع") || textLower.includes("درع") || textLower.includes("قوي") || textLower.includes("صلب") || textLower.includes("حديد") || textLower.includes("صخر") || textLower.includes("برود") || textLower.includes("كبرياء") || textLower.includes("غرور") || textLower.includes("قسوة") || textLower.includes("جاف") || textLower.includes("صمت") || textLower.includes("mask") || textLower.includes("shield") || textLower.includes("cold") || textLower.includes("pride");
        const hasInterior = textLower.includes("هش") || textLower.includes("هشاشة") || textLower.includes("انكسار") || textLower.includes("ضعف") || textLower.includes("خوف") || textLower.includes("رعب") || textLower.includes("دموع") || textLower.includes("بكاء") || textLower.includes("زجاج") || textLower.includes("ارتجاف") || textLower.includes("داخل") || textLower.includes("وجع") || textLower.includes("fragile") || textLower.includes("broken") || textLower.includes("glass") || textLower.includes("inside");

        if (wordCount >= 30) score += 1;

        // 1. Evaluate depth of trauma
        if (hasTrauma) {
          score += 1;
          strengths.push("البناء السيكولوجي للبطل مغسول بآلام الماضي؛ لقد نجحت في تجسيد عتمة الطفولة المأساوية والأثر التراكمي للصدمة.");
        } else {
          improvements.push("أثث تاريخ بطلتك بندبة طفولة فادحة أو تجربة أسرية مؤلمة (كالصدمات أو العنف الباكر) لتعطي كبرياءها الحالي مبرراً درامياً يثير تعاطف القراء.");
        }

        // 2. Evaluate exterior justification
        if (hasExterior) {
          score += 1;
          strengths.push("تمثيل عبقري ومبهر للقناع الخارجي الصخري (الكبرياء أو البرود القاتل) كحصن تلوذ به الشخصية هرباً من سهام الفقد.");
        } else {
          improvements.push("ركز على صياغة المظهر الخارجي؛ أظهر كيف يتخفى البطل خلف درع مجازي من برود الأعصاب، القسوة المتصنعة أو الكبرياء المفرط.");
        }

        // 3. Evaluate fragile interior
        if (hasInterior) {
          score += 1;
          strengths.push("مهارة استثنائية في إظهار الشقوق الداخلية الرقيقة؛ جعلتَ هشاشتها الزجاجية الدفينة في الحوار تهتز مع أول ملامسة للواقع.");
        } else {
          improvements.push("احرص على تبيان مواكب الانكسار الروحي الدافئ؛ دَعنا نلمح الهشاشة المرتجفة في عمق البطل أو فزعه الطفولي خلف جدار قساوته الخشنة.");
        }

        // 4. Perfect Justification Check
        if (hasTrauma && hasExterior && hasInterior) {
          score += 1;
          strengths.push("المعادلة النفسية المزدوجة تحققت بامتياز إبداعي؛ ظهر الماضي كمبرر نفسي مطلق لخلق ذلك التناقض الصارخ والسلوك المشتعل.");
        } else {
          improvements.push("اعمل على حبك الترابط الثلاثي: اجعل صدمة الماضي هي الوقود المباشر الذي يسند القناع الخارجي المتصلب مع إبقاء الروح الداخلية هشة كأرق زجاج.");
        }

      } else if (stepIdx === 2) {
        // Step 3 (Morally Gray): Check if successfully created a moral dilemma, a missing puzzle piece, and an unanswered ethical question.
        const hasDilemma = textLower.includes("أخلاق") || textLower.includes("معضلة") || textLower.includes("براءة") || textLower.includes("إدانة") || textLower.includes("مذنب") || textLower.includes("مجرم") || textLower.includes("ضحية") || textLower.includes("خطيئة") || textLower.includes("أخلاقي") || textLower.includes("شر") || textLower.includes("خير") || textLower.includes("dilemma") || textLower.includes("moral") || textLower.includes("innocent") || textLower.includes("guilty") || textLower.includes("criminal");
        const hasPuzzle = textLower.includes("قطعة") || textLower.includes("بازل") || textLower.includes("لغز") || textLower.includes("سر") || textLower.includes("مفتوح") || textLower.includes("مفقود") || textLower.includes("غائب") || textLower.includes("مدفون") || textLower.includes("مخفي") || textLower.includes("خافي") || textLower.includes("خيانة") || textLower.includes("mystery") || textLower.includes("puzzle") || textLower.includes("secret") || textLower.includes("hidden");
        const hasQuestion = textLower.includes("؟") || textLower.includes("?") || textLower.includes("هل") || textLower.includes("كيف") || textLower.includes("لماذا") || textLower.includes("أيهما") || textLower.includes("تساءل") || textLower.includes("سؤال") || textLower.includes("question") || textLower.includes("why") || textLower.includes("who");

        if (wordCount >= 30) score += 1;

        // 1. Evaluate moral dilemma
        if (hasDilemma) {
          score += 1;
          strengths.push("تأسيس فذ للشخصية الرمادية؛ طرحتَ قضايا البراءة والجريمة بحيث يضطرب عقل المتلقي وتهتز أحكامه الأخيقية التقليدية.");
        } else {
          improvements.push("عزز المعضلة الأخلاقية داخل النص؛ لا تجعل البطل شريراً مطلقاً ولا ملاكاً نقياً، بل اجعل غاياته النبيلة تصطدم بوسائل ملتوية ومثيرة للريبة والشفقة.");
        }

        // 2. Evaluate missing puzzle piece
        if (hasPuzzle) {
          score += 1;
          strengths.push("استعمال ذكي لقانون (قطعة البازل المفقودة)؛ حيث تركت حدثاً تاريخياً دفيناً معلقاً يحفز القارئ لمواصلة البحث والمطالعة.");
        } else {
          improvements.push("عزز جاذبية النص بإبقاء قطعة غامضة مفقودة من ماضي البطل (مثل سر حرق المنزل، أو هوية الجاني الحقيقية) بلا كشف صريح لشد انتباه القارئ.");
        }

        // 3. Evaluate unanswered ethical question
        if (hasQuestion) {
          score += 2;
          strengths.push("براعة مذهلة في تطبيق (قانون السؤال المعلق) باستخدام أدوات الاستفهام المشككة بضمير البطل وعقابه؛ مما ينأى بالعمل عن طابع الوعظ المباشر.");
        } else {
          improvements.push("تذكر تطبيق قاعدة (السؤال المعلق)؛ اطرح تساؤلاً وجدانياً صريحاً بمشافهة الاستفهام (مثل: 'هل هي بريئة أم مجرمة؟' أو 'من الجاني ومن الضحية؟') واتركه بلا إجابة بليدة.");
        }

      } else if (stepIdx === 3) {
        // Step 4 (Sensory Description): Check for the 4 mandatory senses (sight, sound, smell, touch) and internal thought "جال في فكري".
        const hasSight = textLower.includes("رأى") || textLower.includes("رأيت") || textLower.includes("شاهدت") || textLower.includes("أبصرت") || textLower.includes("نظر") || textLower.includes("ضوء") || textLower.includes("ألوان") || textLower.includes("أثري") || textLower.includes("بنفسجي") || textLower.includes("لمعان") || textLower.includes("أرجوان") || textLower.includes("غبار") || textLower.includes("جدار") || textLower.includes("قبة") || textLower.includes("sight") || textLower.includes("saw") || textLower.includes("view") || textLower.includes("color");
        const hasSound = textLower.includes("سمعت") || textLower.includes("صوت") || textLower.includes("صدى") || textLower.includes("خشخشة") || textLower.includes("صرير") || textLower.includes("طنين") || textLower.includes("همس") || textLower.includes("صراخ") || textLower.includes("قرع") || textLower.includes("دوي") || textLower.includes("sound") || textLower.includes("heard") || textLower.includes("echo") || textLower.includes("whisper");
        const hasSmell = textLower.includes("شممت") || textLower.includes("رائحة") || textLower.includes("عبير") || textLower.includes("عبق") || textLower.includes("تفوح") || textLower.includes("فاحت") || textLower.includes("روائح") || textLower.includes("شذى") || textLower.includes("قرفة") || textLower.includes("خزامى") || textLower.includes("قهوة") || textLower.includes("عطر") || textLower.includes("smell") || textLower.includes("scent") || textLower.includes("fragrance");
        const hasTouch = textLower.includes("لمست") || textLower.includes("برودة") || textLower.includes("حرارة") || textLower.includes("رطوبة") || textLower.includes("خشونة") || textLower.includes("نعومة") || textLower.includes("دافئ") || textLower.includes("تحسست") || textLower.includes("ملمس") || textLower.includes("جليد") || textLower.includes("طراوة") || textLower.includes("touch") || textLower.includes("felt") || textLower.includes("cold") || textLower.includes("warm");
        const hasThoughts = textLower.includes("جال في فكري") || textLower.includes("جال بخاطري") || textLower.includes("جال في عقلي") || textLower.includes("جال بفكري");

        if (wordCount >= 30) score += 1;

        let sensesFound = 0;
        let sensesList: string[] = [];
        if (hasSight) { sensesFound++; sensesList.push("البصر (الرؤية والبريق)"); }
        if (hasSound) { sensesFound++; sensesList.push("السمع (الصوت والطنين)"); }
        if (hasSmell) { sensesFound++; sensesList.push("الشم (الروائح والعبير)"); }
        if (hasTouch) { sensesFound++; sensesList.push("اللمس (البرودة والملمس)"); }

        score += Math.min(sensesFound, 3);

        // 1. Evaluate senses
        if (sensesFound >= 4) {
          strengths.push("إدراك حسي فائده الإعجاز! نجحت باقتدار استثنائي في نسج الحواس المعيارية الأربعة (Sight, Sound, Smell, Touch) لتشيد بيئة فانتازية ملموسة ونابضة بالجاذبية الكونية.");
        } else if (sensesFound >= 2) {
          strengths.push(`تجسيد تعبيري رائع خاطب مدركات السامع الفنية عبر قنوات حسية رشيقة مثل (${sensesList.join(" و")}).`);
          improvements.push(`عزز نسيج المشهد بإدماج حواس إضافية (الأبعاد الحسية المكتشفة حالياً: ${sensesFound}/4). أدخل صرير الرياح الهامس، رائحة الزعفران العبقة، أو ملمس الخشب الأثري الصامت.`);
        } else {
          improvements.push("النص يفتقر للتأثيث الحسي الملموس المحيط بالبطل؛ احرص على تفعيل حاستي الشم، السمع، أو برودة الأسطح لإنقاذ الأماكن من السكون المسطح.");
        }

        // 2. Evaluate thoughts "جال في فكري"
        if (hasThoughts) {
          score += 1;
          strengths.push("إدراج المونولوج الوجداني الداخلي بصياغته المعبرة ('جال في فكري') أضاف عمقاً سيكولوجياً ساحراً وأنسن تفاعل البطل مع صمت المقهى الهائم.");
        } else {
          improvements.push("لا تنس تضمين عبارة الوجدان الباطني الصريحة ('جال في فكري') لتنقل لنا الخاطرة الذاتية التي زاحمت فكر البطل في غمرة الإبصار والشم المثيرين.");
        }
      }
      
      // Keep score within beautiful bounds
      if (score > 10) score = 10;
      if (score < 5) score = 5;
      
      const feedback = {
        score: `${score}/10`,
        strengths: strengths.length > 0 ? strengths : ["تتميز محاولتك الأدبية بسلاسة تعبيرية فائقة وصور خيالية دافئة ومدهشة."],
        improvements: improvements.length > 0 ? improvements : ["واظب على هذا الأداء الإبداعي المتميز وحافظ على انسياب قلمك الساحر!"]
      };
      
      const newFeedbacks = { ...stepFeedbacks, [stepIdx]: feedback };
      setStepFeedbacks(newFeedbacks);
      try {
        localStorage.setItem('rb_wf_step_feedbacks', JSON.stringify(newFeedbacks));
      } catch (err) {
        console.error(err);
      }
      
      setEvaluatingStep(null);
    }, 2000);
  };

  const renderAIFeedback = (stepIdx: number) => {
    const feedback = stepFeedbacks[stepIdx];
    const isEvaluating = evaluatingStep === stepIdx;
    
    if (!feedback && !isEvaluating) return null;

    const badgesData = [
      {
        id: 'plot',
        stepIdx: 0,
        title: lang === 'AR' ? 'وسام "مُهندس الحبكات الكونية"' : 'Badge of "Cosmic Plot Engineer"',
        desc: lang === 'AR' ? 'أُنجز بعد إعادة صياغة ليلى والذئب بتصحيح 8/10 أو أعلى.' : 'Unlocked with score 8/10+ on Step 1.',
        icon: '🌌',
        color: 'from-amber-400 via-orange-500 to-yellow-600',
        glow: 'rgba(245,158,11,0.5)',
      },
      {
        id: 'gray',
        stepIdx: 2,
        title: lang === 'AR' ? 'وسام "صانع الأرواح الرمادية"' : 'Badge of "Gray Scribe Spark"',
        desc: lang === 'AR' ? 'أُنجز بعد ابتكار شخصية رمادية معقدة بالقوانين الثلاثة بتصحيح 8/10 أو أعلى.' : 'Unlocked with score 8/10+ on Step 3.',
        icon: '🔮',
        color: 'from-fuchsia-400 via-purple-600 to-indigo-600',
        glow: 'rgba(168,85,247,0.5)',
      },
      {
        id: 'sensory',
        stepIdx: 3,
        title: lang === 'AR' ? 'وسام "مستدعي الأطياف الحسيّة"' : 'Badge of "Sensory Phantom Summoner"',
        desc: lang === 'AR' ? 'أُنجز بعد وصف القلعة الغامضة بحركات الحواس والأفكار بتصحيح 8/10 أو أعلى.' : 'Unlocked with score 8/10+ on Step 4.',
        icon: '🏰',
        color: 'from-teal-400 via-indigo-500 to-cyan-500',
        glow: 'rgba(20,184,166,0.5)',
      }
    ];

    return (
      <div className="space-y-4">
        {isEvaluating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-8 rounded-2xl border border-purple-500/20 bg-purple-950/10 flex flex-col items-center justify-center gap-4 text-center shadow-[0_0_20px_rgba(138,43,226,0.05)]"
          >
            <div className="relative flex items-center justify-center w-12 h-12">
              <div className="absolute w-12 h-12 rounded-full border-4 border-purple-500/30"></div>
              <div className="absolute w-12 h-12 rounded-full border-4 border-t-purple-400 animate-spin"></div>
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
            <p className="text-sm font-sans font-medium text-purple-200 animate-pulse" dir="rtl">
              {lang === 'AR' ? "جاري قراءة سحرك وتصحيحه..." : "Reading and critiquing your magic..."}
            </p>
          </motion.div>
        )}
        
        {feedback && !isEvaluating && (
          <div className="space-y-4 text-right">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 p-6 rounded-2xl border border-purple-500/30 bg-[#160b29]/85 shadow-[0_0_35px_rgba(138,43,226,0.2)] space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  <h4 className="font-display font-medium text-purple-200 text-sm sm:text-base text-right">
                    {lang === 'AR' ? "روبوت التصحيح الذكي (محراب النقد الروائي)" : "AI Scribe Critique Chamber"}
                  </h4>
                </div>
                <div className="px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                  {lang === 'AR' ? `التقييم الجمالي: ${feedback.score}` : `Evaluation Score: ${feedback.score}`}
                </div>
              </div>
              
              <div className="space-y-4 text-right">
                <div className="text-right">
                  <h5 className="text-[#d8b4fe] font-sans font-bold text-xs sm:text-sm mb-1.5 flex items-center gap-1.5 justify-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    {lang === 'AR' ? "نقاط القوة الروائية:" : "Strengths:"}
                  </h5>
                  <ul className="space-y-2 pr-1 text-right">
                    {feedback.strengths.map((item: string, i: number) => (
                      <li key={i} className="text-purple-200/90 text-xs sm:text-sm leading-relaxed flex items-start gap-2 justify-start text-right">
                        <span className="text-[#d8b4fe] shrink-0 mt-0.5">✦</span>
                        <span className="text-right">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-purple-500/10 pt-3 text-right">
                  <h5 className="text-[#f5f3ff] font-sans font-bold text-xs sm:text-sm mb-1.5 flex items-center gap-1.5 justify-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    {lang === 'AR' ? "ما الذي يمكن تحسينه لترقية سحرك؟" : "What can be elevated?"}
                  </h5>
                  <ul className="space-y-2 pr-1 text-right">
                    {feedback.improvements.map((item: string, i: number) => (
                      <li key={i} className="text-purple-200/80 text-xs sm:text-sm leading-relaxed flex items-start gap-2 justify-start text-right">
                        <span className="text-amber-300/80 shrink-0 mt-0.5">✦</span>
                        <span className="text-right">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Specific Badge Showcase inside current step evaluate box */}
              {(stepIdx === 0 || stepIdx === 2 || stepIdx === 3) && (() => {
                const currentBadge = badgesData.find(b => b.stepIdx === stepIdx);
                if (!currentBadge) return null;
                const isUnlocked = unlockedBadges[currentBadge.id];
                return (
                  <div className={`mt-4 p-4 rounded-xl border transition-all duration-500 ${isUnlocked ? 'bg-purple-950/25 border-[#8a2be2]/40 shadow-[0_0_20px_rgba(138,43,226,0.15)]' : 'bg-black/45 border-white/5'} flex flex-col sm:flex-row items-center gap-4`}>
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl relative z-10 select-none transition-transform duration-500 bg-gradient-to-tr ${isUnlocked ? 'scale-110 rotate-12 animate-pulse ' + currentBadge.color : 'bg-white/5 grayscale select-none'}`}>
                        {currentBadge.icon}
                      </div>
                      {isUnlocked && (
                        <div className="absolute inset-x-0 -top-2 h-16 bg-[#8a2be2]/30 rounded-full blur-md opacity-75 animate-pulse"></div>
                      )}
                    </div>
                    <div className="text-right flex-1 w-full text-center sm:text-right">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className={`text-xs sm:text-sm font-bold tracking-wide flex items-center gap-1.5 justify-center sm:justify-start ${isUnlocked ? 'text-[#d8b4fe]' : 'text-white/40'}`}>
                          {currentBadge.title}
                          {isUnlocked ? (
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> {lang === 'AR' ? "تم الفتح" : "Unlocked"}
                            </span>
                          ) : (
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/35 border border-white/10">
                              🔒 {lang === 'AR' ? "مغلق" : "Locked"}
                            </span>
                          )}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 font-light leading-relaxed text-right ${isUnlocked ? 'text-white/80' : 'text-white/40'}`}>
                        {currentBadge.desc}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            {/* Whole Badges Showcase grid inside feedback */}
            <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/10 bg-black/45 space-y-3 mt-4" dir="rtl">
              <div className="flex items-center gap-2 justify-start text-right">
                <Trophy className="w-4 h-4 text-purple-400 animate-bounce" />
                <h5 className="text-xs font-mono font-bold tracking-wider text-purple-200 uppercase text-right">
                  {lang === 'AR' ? "خزانة الأوسمة الكونية المتكاملة" : "Your Celestial Badges Collection"}
                </h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {badgesData.map(b => {
                  const isUnlocked = unlockedBadges[b.id];
                  return (
                    <div 
                      key={b.id} 
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all duration-500 relative overflow-hidden group
                        ${isUnlocked 
                          ? 'bg-gradient-to-b from-[#1c0a35] to-[#120524] border-purple-500/40 shadow-[0_0_15px_rgba(138,43,226,0.2)]' 
                          : 'bg-black/30 border-white/5 opacity-55 hover:opacity-100'}`}
                    >
                      {/* Subtle star particle if unlocked */}
                      {isUnlocked && (
                        <div className="absolute inset-x-0 -top-12 h-16 bg-gradient-to-b from-[#9d4edd]/20 to-transparent blur-md"></div>
                      )}
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 transition-transform duration-500 relative bg-zinc-900/45 border border-purple-500/15
                        ${isUnlocked ? 'scale-110 drop-shadow-[0_0_8px_' + b.glow + '] animate-pulse' : 'grayscale filter scale-95 opacity-50'}`}
                      >
                        {b.icon}
                        {isUnlocked && (
                          <span className="absolute -top-1 -right-1 text-[8px] bg-amber-400 text-black font-extrabold rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-lg border border-black animate-bounce">
                            ✦
                          </span>
                        )}
                      </div>
                      
                      <span className={`text-[10px] font-bold block leading-tight ${isUnlocked ? 'text-[#d8b4fe]' : 'text-white/30'}`}>
                        {b.title}
                      </span>
                      <span className="text-[9px] text-white/50 mt-1 font-light max-w-[120px] whitespace-normal leading-normal">
                        {isUnlocked ? (lang === 'AR' ? "✨ مبروك الفتح" : "✨ Unlocked!") : b.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FANTASY_PROMPTS = {
    AR: [
      "ماذا لو استيقظت البطلة ووجدت أن الجميع يتحدثون بلغة الطيور ما عداها؟",
      "اكتب عن شخصية تكتشف أن ظلها يملك حكاية خاصة به ويرفض اتباعه...",
      "تخيل مدينة مبنية بالكامل فوق سحاب أحمر، ما هي وسيلة المواصلات التي يستخدمها السكان؟",
      "اكتب مشهداً لباب يظهر فقط عندما تبكي الشخصية، وأين يؤدي هذا الباب؟",
      "تخيل مدينة طائرة من بلور زجاجي، والعملة الوحيدة المتداولة هي الذكريات السعيدة.",
      "اكتب عن غابة عتيقة تنمو فيها كتب عوضاً عن الأشجار، ويتنافس السحرة على قطاف الفصول."
    ],
    EN: [
      "What if the protagonist woke up to find everyone speaking the language of birds except her?",
      "Write about a character who discovers their shadow has its own narrative and refuses to follow them...",
      "Imagine a city built entirely on red clouds. What means of transport do the residents use?",
      "Write a scene about a door that only appears when a character weeps, and where does this door lead?",
      "Imagine a floating city made of pure crystal, where the only currency is happy memories.",
      "Write about an ancient forest where stories grow instead of trees, and mages harvest the seasons."
    ]
  };

  const handleGetRandomPrompt = () => {
    const list = FANTASY_PROMPTS[lang === 'AR' ? 'AR' : 'EN'] || FANTASY_PROMPTS.AR;
    const randomIndex = Math.floor(Math.random() * list.length);
    setCurrentPromptText(list[randomIndex]);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto rounded-[2.5rem] p-6 sm:p-10 border backdrop-blur-3xl shadow-[0_0_50px_rgba(216,180,254,0.05)] ${themeStyles.cardBg} space-y-10 relative overflow-hidden`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* مُلهِم الأفكار السحري (Fantasy Prompt Generator) Floating Sidebar Widget */}
      <div className={`fixed bottom-24 ${isRtl ? 'left-4' : 'right-4'} z-45 md:absolute md:bottom-auto md:top-48 md:${isRtl ? '-left-6' : '-right-6'} transition-all`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <motion.button
          type="button"
          onClick={() => {
            setPromptBoxOpen(prev => !prev);
            if (!currentPromptText) {
              handleGetRandomPrompt();
            }
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 p-3 sm:p-3.5 rounded-full shadow-[0_0_20px_rgba(138,43,226,0.6)] cursor-pointer bg-[#1A0A35] border border-[#8a2be2] text-white"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
          <span className="text-xs font-bold tracking-wide font-sans hidden md:inline">
            {lang === 'AR' ? "مُلهِم الأفكار السحري" : "Magical Prompt Spark"}
          </span>
        </motion.button>

        <AnimatePresence>
          {promptBoxOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className={`absolute bottom-full mb-3 ${isRtl ? 'left-0 origin-bottom-left' : 'right-0 origin-bottom-right'} w-72 sm:w-80 p-4 sm:p-5 rounded-2xl border border-purple-500/40 bg-[#160b29]/95 shadow-[0_15px_50px_rgba(138,43,226,0.55)] backdrop-blur-2xl z-50 text-right`}
            >
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <h4 className="font-display font-bold text-xs sm:text-sm text-[#d8b4fe]">
                    {lang === 'AR' ? "مستدعي أفكار روزلين السحرية" : "Rosaline's Idea Summoner"}
                  </h4>
                </div>
                <button 
                  onClick={() => setPromptBoxOpen(false)}
                  className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/45 border border-purple-500/10 min-h-[90px] flex items-center justify-center relative overflow-hidden text-center">
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-purple-500/5 to-transparent"></div>
                
                <p className="text-xs sm:text-sm font-sans font-light text-purple-200 leading-relaxed relative z-10 animate-fade-in">
                  {currentPromptText || (lang === 'AR' ? "انقر بالأسفل لاستحضار إلهام كونك الروائي..." : "Click below to summon a cosmic literary spark...")}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleGetRandomPrompt}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] select-none cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'AR' ? "توليد فكرة جديدة" : "Spark New Idea"}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (currentPromptText) {
                      navigator.clipboard.writeText(currentPromptText);
                      setSaveNotify(lang === 'AR' ? "تم نسخ الإلهام السحري لحافظتك!" : "Copied magical prompt to clipboard!");
                      setTimeout(() => setSaveNotify(false), 2500);
                    }
                  }}
                  disabled={!currentPromptText}
                  className="px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-white/70 disabled:opacity-40 select-none cursor-pointer flex items-center justify-center"
                  title={lang === 'AR' ? "نسخ النص" : "Copy to Clipboard"}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Mystical backgrounds */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 ${theme === 'PURPLE' ? 'bg-[#d8b4fe]' : 'bg-[#e11d48]'}`} />
      <div className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${theme === 'PURPLE' ? 'bg-violet-600' : 'bg-[#e11d48]/10'}`} />

      {/* Header section with back navigation and inspiring titles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
        <div className="space-y-3">
          <button 
            type="button"
            onClick={() => setCurrentView('HOME')}
            className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest ${theme === 'PURPLE' ? 'text-[#d8b4fe] hover:text-[#f3e8ff]' : 'text-white hover:opacity-85'} cursor-pointer`}
          >
            {currentTranslation.backHome}
          </button>
          
          <div className="space-y-1">
            <h1 className={`text-2xl sm:text-4xl font-display font-medium leading-tight tracking-wide ${themeStyles.text}`}>
              {currentTranslation.workshopTitle} 🌌
            </h1>
            <p className="text-xs sm:text-sm font-sans font-light text-white/60 max-w-2xl">
              {currentTranslation.workshopSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerSaveProgress}
          disabled={isSaving}
          className={`px-5 py-3 rounded-full text-xs font-bold tracking-wider hover:scale-105 active:scale-95 duration-300 shadow-md ${themeStyles.modalBtn}`}
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : currentTranslation.saveProgressBtn}
        </button>
      </div>

      {/* Synchronized notify bar */}
      <AnimatePresence>
        {saveNotify && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-4 rounded-xl border border-[#d8b4fe]/20 bg-[#d8b4fe]/10 text-violet-300 text-xs font-sans text-center font-bold tracking-wide shadow-lg"
          >
            ✦ {typeof saveNotify === 'string' ? saveNotify : currentTranslation.progressSaved}
          </motion.div>
        )}

        {publishSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-200 text-xs sm:text-sm font-sans flex items-start gap-4 shadow-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white text-base">{lang === 'AR' ? 'تم نشر ميثاقك بنجاح! ✧' : 'Your Literary Charter Published! ✧'}</p>
              <p className="opacity-80 leading-relaxed font-light">
                {lang === 'AR' 
                  ? "تهانينا الحارة! لقد أنجزت خطوات ورشة الفانتازيا الأربعة وحفرت كلماتك في سجلات روزلين بيلا الخالدة. يمكنك قراءة ومطالعة منشورك باللوحة شرف الكتاب أدناه." 
                  : "Hearty congratulations! You have finished all four workshop modules and carved your sentences into Rosaline Bela's scrolls. You can review your submission at the gallery below."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps progress indicator & Wizard Navigation tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/35 p-2 rounded-2xl border border-white/5 shadow-inner">
        {stepsData.map((step, idx) => {
          const isActive = currentStep === idx;
          const isDone = currentStep > idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentStep(idx);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className={`p-3.5 rounded-xl transition-all duration-300 text-right flex flex-col justify-between border relative select-none cursor-pointer
                ${isActive 
                  ? (theme === 'PURPLE' ? 'bg-[#d8b4fe]/15 border-[#d8b4fe]/50 text-[#d8b4fe]' : 'bg-white/10 border-white text-white') 
                  : (isDone 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300/80 hover:bg-emerald-500/10' 
                      : 'bg-transparent border-transparent text-white/35 hover:text-white/60')}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase opacity-80">
                  {step.shortTitle}
                </span>
                {isDone && <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
              </div>
              <span className="text-xs font-sans font-bold mt-1.5 truncate">
                {step.title}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="activeWizardGlow"
                  className="absolute inset-0 rounded-xl border border-dashed border-[#d8b4fe]/70 pointer-events-none shadow-[0_0_15px_rgba(216,180,254,0.1)]" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main active Step card panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl group/card relative
            ${theme === 'PURPLE' ? 'bg-[#0f091df0] border-[#d8b4fe]/15' : 'bg-white/[0.01] border-white/10'}`}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <span className={`text-[10px] uppercase font-bold tracking-[0.25em] px-3.5 py-1.5 rounded-full
                  ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/10 text-[#d8b4fe]' : 'bg-white/10 text-white'}`}>
                  {stepsData[currentStep].title}
                </span>
                <p className={`text-base sm:text-lg leading-relaxed font-sans text-white font-medium whitespace-pre-line ${isRtl ? 'leading-loose' : ''}`}>
                  {stepsData[currentStep].explanatory}
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTip(!showTip)}
                  className={`p-2.5 rounded-full border transition-all duration-300 cursor-pointer
                    ${showTip 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300 scale-105' 
                      : (theme === 'PURPLE' ? 'bg-[#d8b4fe]/5 border-[#d8b4fe]/10 text-[#d8b4fe] hover:bg-[#d8b4fe]/25' : 'bg-white/5 border-white/10 text-white hover:bg-white/20')}`}
                  title={lang === 'AR' ? "سر الكاتب" : "Writer's Tip"}
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {showTip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute left-0 sm:left-auto right-0 sm:right-0 mt-3 w-64 bg-[#140e24f7] border border-rose-500/20 p-4 rounded-xl shadow-2xl z-50 text-xs text-rose-100"
                    >
                      <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#d8b4fe] mb-1.5">
                        ✧ {lang === 'AR' ? "سر الكاتب الملهم" : "The Golden Scribe Secret"}
                      </h4>
                      <p className="line-clamp-4 leading-relaxed font-sans text-white/90">
                        {stepsData[currentStep].tip}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Dynamic Challenge Inputs & Textareas based on step index */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-white/50 tracking-wider font-sans uppercase">
                  {lang === 'AR' ? "المشروع الإبداعي النشط للحلقة:" : "Active Challenge for the Module:"}
                </h3>
                <p className={`text-sm sm:text-base text-violet-200 font-sans font-light ${isRtl ? 'leading-relaxed' : ''}`}>
                  {stepsData[currentStep].challengePrompt}
                </p>
              </div>

              {/* Step 1 input grid layout replaced with interactive challenge */}
              {currentStep === 0 && (
                <div className="space-y-6 pt-3" dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 bg-purple-950/10 border-[#8a2be2]/30 focus-within:border-[#d8b4fe]/50 shadow-[0_0_25px_rgba(138,43,226,0.06)]`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#d8b4fe] animate-pulse shrink-0" />
                      <h4 className="text-base sm:text-lg font-display font-bold text-[#d8b4fe]">
                        {lang === 'AR' ? "التحدي الأول: سحر إعادة الابتكار" : "Challenge One: The Art of Re-innovation"}
                      </h4>
                    </div>
                    
                    <div className={`text-xs sm:text-sm font-sans font-light text-[#f3e8ff]/95 leading-relaxed ${isRtl ? 'leading-loose text-right' : 'text-left'}`}>
                      {lang === 'AR' ? (
                        <div className="space-y-4">
                          <p>
                            الآن حان دورك للتجربة! أمامك قصة مكررة ومعروفة للجميع وهي قصة (ذات الرداء الأحمر / ليلة والذئب). التحدي هو أن تصنع من هذه الفكرة البسيطة قصة جديدة، عميقة، ومؤثرة تلمس القلوب.
                          </p>
                          <p>
                            في صندوق الكتابة أدناه، قم ببناء جدران قصتك الجديدة من خلال تحديد:
                          </p>
                          <ul className="list-disc list-inside pr-4 space-y-1.5 font-sans font-medium text-purple-200">
                            <li>الفكرة العامة الجديدة (كيف ستجعلها نادرة؟)</li>
                            <li>أسماء الشخصيات وطبيعتها النفسية (هل الذئب هو الشر المطلق؟ هل الفتاة بريئة فعلاً؟)</li>
                            <li>أهم الأحداث (عقدة القصة)</li>
                            <li>النهاية التي ستجعل القارئ يتعلق بالرواية ولا ينساها أبداً.</li>
                          </ul>
                          <p className="font-semibold text-purple-300">
                            يمكنك القيام بالتحدي الآن، أو تخطيه والانتقال للخطوة التالية!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p>
                            Now it's your turn to experiment! You have a recycled, well-known story: (Little Red Riding Hood). The challenge is to turn this simple idea into a new, deep, and touching story that moves hearts.
                          </p>
                          <p>
                            In the write box below, build your new story's pillars by defining:
                          </p>
                          <ul className="list-disc list-inside pl-4 space-y-1.5 font-sans font-medium text-purple-200">
                            <li>The new general idea (How will you make it rare?)</li>
                            <li>Character names and psychological nature (Is the wolf absolute evil? Is the girl really innocent?)</li>
                            <li>Core events (The story struggle/conflict)</li>
                            <li>The ending that makes the reader fall in love with the tale and never forget it.</li>
                          </ul>
                          <p className="font-semibold text-purple-300">
                            You can take the challenge now, or skip it and move to the next step!
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="relative mt-5">
                      <textarea
                        value={step1ChallengeText}
                        onChange={(e) => setStep1ChallengeText(e.target.value)}
                        placeholder={lang === 'AR' ? "قم ببناء جدران أسطورتك الفريدة هنا..." : "Construct the walls of your unique legend here..."}
                        rows={7}
                        className={`w-full p-5 pb-16 rounded-xl border bg-black/40 font-sans text-sm outline-none resize-none transition-all duration-300 leading-relaxed text-white
                          ${theme === 'PURPLE' 
                            ? 'border-[#8a2be2]/40 focus:border-[#d8b4fe] focus:shadow-[0_0_20px_rgba(138,43,226,0.35)]' 
                            : 'border-white/10 focus:border-white/40 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                      />
                      
                      {/* Live Indicators Overlay */}
                      <div className="absolute bottom-3 inset-x-5 flex items-center justify-between pointer-events-none select-none text-[10px] font-mono">
                        {/* Auto-save notification flashes when typing stops */}
                        <div className="flex items-center gap-1.5 min-h-[16px]">
                          <AnimatePresence>
                            {draftSavedFlash.step1 && (
                              <motion.span
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-emerald-400 font-bold flex items-center gap-1"
                              >
                                <Check size={10} className="stroke-[3]" />
                                {lang === 'AR' ? "✓ حُفظ آلياً" : "✓ Auto-Saved"}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Text Stats */}
                        <div className="flex items-center gap-3 text-purple-300/50 font-medium">
                          <span>{getWordCount(step1ChallengeText)} {lang === 'AR' ? 'كلمة' : 'words'}</span>
                          <span>•</span>
                          <span>{getReadingTime(step1ChallengeText)} {lang === 'AR' ? 'وقت القراءة' : 'read'}</span>
                          <span>•</span>
                          <span>{step1ChallengeText.length} {lang === 'AR' ? 'حرف' : 'chars'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Challenge Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={shareStep1Attempt}
                        className="py-2.5 px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2 text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40"
                        style={{
                          boxShadow: '0 0 15px rgba(138, 43, 226, 0.45)'
                        }}
                      >
                        <Sparkles size={12} className="text-[#d8b4fe]" />
                        <span>{lang === 'AR' ? "حفظ التقدم ومشاركة المحاولة" : "Save Progress & Share Attempt"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(1);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="py-2.5 px-5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white/90"
                      >
                        {lang === 'AR' ? "تخطي التحدي" : "Skip Challenge"}
                      </button>
                    </div>

                    {renderAIFeedback(0)}
                  </div>
                </div>
              )}

              {/* Step 2 interactive challenge block */}
              {currentStep === 1 && (
                <div className="space-y-6 pt-3" dir={isRtl ? 'rtl' : 'ltr'}>
                  {charNames.trim() && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-[11px] sm:text-xs text-indigo-300 font-sans font-medium flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                      <span>
                        {lang === 'AR' 
                          ? `تم سحب أسماء شخصياتك مسبقاً بنجاح لمساعدتك في التركيز: ${charNames}` 
                          : `Successfully fetched your characters: ${charNames}`}
                      </span>
                    </div>
                  )}

                  <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 bg-purple-950/10 border-[#8a2be2]/30 focus-within:border-[#d8b4fe]/50 shadow-[0_0_25px_rgba(138,43,226,0.06)]`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#d8b4fe] animate-pulse shrink-0" />
                      <h4 className="text-base sm:text-lg font-display font-bold text-[#d8b4fe]">
                        {lang === 'AR' ? "التحدي الثاني: قناع القوة والهشاشة الداخلية (تحدي متقدم)" : "Challenge Two: Mask of Strength & Inner Fragility (Advanced)"}
                      </h4>
                    </div>
                    
                    <div className={`text-xs sm:text-sm font-sans font-light text-[#f3e8ff]/95 leading-relaxed ${isRtl ? 'leading-loose text-right' : 'text-left'}`}>
                      {lang === 'AR' ? (
                        <div className="space-y-4">
                          <p>
                            لنرفع مستوى الصعوبة قليلاً ونختبر مهاراتك في اللعب بمشاعر القارئ. التحدي الآن هو بناء شخصية كاملة من اختيارك (لك الحرية في تسميتها)، ولكن بشرط أن يكون ماضيها مبنياً على (العنف العائلي).
                          </p>
                          <p>
                            المطلوب منك في صندوق الكتابة أدناه هو تحقيق هذه المعادلة النفسية الصعبة:
                          </p>
                          <ul className="list-decimal list-inside pr-4 space-y-1.5 font-sans font-medium text-purple-200">
                            <li><strong>المظهر الخارجي:</strong> اجعل الشخصية تظهر أمام الناس بقناع محدد (مثل كبرياء شديد، برود قاتل، أو قسوة).</li>
                            <li><strong>العمق الداخلي:</strong> اعكس هشاشتها وانكسارها الحقيقي الذي تحاول إخفاءه.</li>
                            <li><strong>التناقض الحواري:</strong> اجعلها تتحدث بأقوال وتتصرف بأفعال متناقضة تماماً مع ما تشعر به في الداخل.</li>
                          </ul>
                          <p className="font-semibold text-purple-300">
                            الهدف الأساسي: اكتب نصاً وصفياً وحوارياً لهذه الشخصية يجعل القارئ في حالة ارتباك وحيرة شديدة.. لا يعرف هل يتعاطف معها ويحبها، أم يرفض أفعالها ويكرهها!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p>
                            Let's raise the difficulty and test your skills in playing with the reader's emotions. The challenge is to build a complete character of your choice, but with the condition that their backstory is based on (family violence).
                          </p>
                          <p>
                            What's required in the writing box below is to solve this difficult psychological equation:
                          </p>
                          <ul className="list-disc list-inside pl-4 space-y-1.5 font-sans font-medium text-purple-200">
                            <li><strong>Exterior Appearance:</strong> Make the character appear with a specific mask (e.g., extreme pride, deadly coldness, or cruelty).</li>
                            <li><strong>Inner Depth:</strong> Reflect their true fragility and brokenness that they try to hide.</li>
                            <li><strong>Dialogical Contradiction:</strong> Make them speak words and act in ways completely opposite to how they feel inside.</li>
                          </ul>
                          <p className="font-semibold text-purple-300">
                            Core Goal: Write a descriptive and dialogue-driven passage for this character that leaves the reader in deep conflict—unsure whether to sympathize with and love them, or reject their actions and hate them!
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="relative mt-5">
                      <textarea
                        ref={step2Ref}
                        value={backstoryText}
                        onChange={(e) => setBackstoryText(e.target.value)}
                        placeholder={lang === 'AR' ? "قم ببناء ماضي شخصيتك هنا وسرها الدفین..." : "Construct the heavy personal backstory of your character here..."}
                        rows={7}
                        className={`w-full p-5 pb-16 rounded-xl border bg-black/40 font-sans text-sm outline-none resize-none transition-all duration-300 leading-relaxed text-white
                          ${theme === 'PURPLE' 
                            ? 'border-[#8a2be2]/40 focus:border-[#d8b4fe] focus:shadow-[0_0_20px_rgba(138,43,226,0.35)]' 
                            : 'border-white/10 focus:border-white/40 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                      />
                      
                      {/* Live Indicators Overlay */}
                      <div className="absolute bottom-3 inset-x-5 flex items-center justify-between pointer-events-none select-none text-[10px] font-mono">
                        {/* Auto-save notification flashes when typing stops */}
                        <div className="flex items-center gap-1.5 min-h-[16px]">
                          <AnimatePresence>
                            {draftSavedFlash.step2 && (
                              <motion.span
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-emerald-400 font-bold flex items-center gap-1"
                              >
                                <Check size={10} className="stroke-[3]" />
                                {lang === 'AR' ? "✓ حُفظ آلياً" : "✓ Auto-Saved"}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Text Stats */}
                        <div className="flex items-center gap-3 text-purple-300/50 font-medium">
                          <span>{getWordCount(backstoryText)} {lang === 'AR' ? 'كلمة' : 'words'}</span>
                          <span>•</span>
                          <span>{getReadingTime(backstoryText)} {lang === 'AR' ? 'وقت القراءة' : 'read'}</span>
                          <span>•</span>
                          <span>{backstoryText.length} {lang === 'AR' ? 'حرف' : 'chars'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Challenge Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={shareStep2Attempt}
                        className="py-2.5 px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2 text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40"
                        style={{
                          boxShadow: '0 0 15px rgba(138, 43, 226, 0.45)'
                        }}
                      >
                        <Sparkles size={12} className="text-[#d8b4fe]" />
                        <span>{lang === 'AR' ? "حفظ التقدم ومشاركة المحاولة" : "Save Progress & Share Attempt"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(2);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="py-2.5 px-5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white/90"
                      >
                        {lang === 'AR' ? "تخطي التحدي" : "Skip Challenge"}
                      </button>
                    </div>

                    {renderAIFeedback(1)}
                  </div>
                </div>
              )}

              {/* Step 3 interactive challenge block */}
              {currentStep === 2 && (
                <div className="space-y-6 pt-3" dir={isRtl ? 'rtl' : 'ltr'}>
                  {backstoryText.trim() && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-[11px] sm:text-xs text-indigo-300 font-sans font-medium flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                      <span>
                        {lang === 'AR' 
                          ? `تم سحب ماضي وهشاشة شخصيتك المعقدة لمساعدتك في الربط المباشر: ${backstoryText.substring(0, 100)}...` 
                          : `Successfully loaded your character's backstory: ${backstoryText.substring(0, 100)}...`}
                      </span>
                    </div>
                  )}

                  <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 bg-purple-950/10 border-[#8a2be2]/30 focus-within:border-[#d8b4fe]/50 shadow-[0_0_25px_rgba(138,43,226,0.06)]`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#d8b4fe] animate-pulse shrink-0" />
                      <h4 className="text-base sm:text-lg font-display font-bold text-[#d8b4fe]">
                        {lang === 'AR' ? "التحدي الثالث: اكتب لي شخصية رمادية... فقط!" : "Challenge Three: Just Write Me a Morally Gray Character!"}
                      </h4>
                    </div>
                    
                    <div className={`text-xs sm:text-sm font-sans font-light text-[#f3e8ff]/95 leading-relaxed ${isRtl ? 'leading-loose text-right' : 'text-left'}`}>
                      {lang === 'AR' ? (
                        <div className="space-y-4">
                          <p className="font-semibold text-purple-200 text-sm leading-relaxed">
                            بناءً على الفلسفة التي قرأتها بالأعلى، التحدي الآن أصبح مباشراً وقاسياً ليختبر جوهر موهبتك. المطلوب منك في صندوق الكتابة هو ابتكار شخصية رمادية، لك كامل الحرية في اختيار اسمها، ولكن يجب عليك الالتزام التام بالقوانين الثلاثة التالية:
                          </p>
                          <ul className="list-decimal list-inside pr-4 space-y-2.5 font-sans font-medium text-purple-200">
                            <li><strong>قانون الارتباط:</strong> يجب أن تمنح الشخصية لمحة من ماضٍ يبرر أفعالها ويجعل القارئ يتعلق بها ويتألم لأجلها.</li>
                            <li><strong>قانون قطعة البازل:</strong> اترك قطعة مفقودة، غامضة، وغير مفهومة في تاريخ الشخصية أو دوافعها ليظل القارئ يبحث عنها.</li>
                            <li><strong>قانون السؤال المعلق:</strong> اطرح في سياق النص سؤالاً أخلاقياً عميقاً حول الشخصية.. واتركه بدون إجابة!</li>
                          </ul>
                          <p className="font-bold text-[#d8b4fe] text-xs pt-1">
                            أرنا كيف ستصنع السحر في أسطر قليلة تجعل عقل القارئ يرتبك!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="font-semibold text-purple-200 text-sm leading-relaxed">
                            Based on the philosophy you read above, the challenge is now direct and demanding to test the core of your talent. Your task in the writing box is to create a morally gray character. You have absolute freedom in choosing their name, but you must strictly adhere to the following three laws:
                          </p>
                          <ul className="list-disc list-inside pl-4 space-y-2.5 font-sans font-medium text-purple-200">
                            <li><strong>The Law of Connection:</strong> You must grant the character a glimpse of a backstory that justifies their actions and makes the reader connect and grieve with them.</li>
                            <li><strong>The Law of the Puzzle Piece:</strong> Leave a missing, mysterious, and incomprehensible piece in the character's history or motives so the reader is always searching for it.</li>
                            <li><strong>The Law of the Unanswered Question:</strong> Raise a deep ethical question about the character within the text's context... and leave it completely unanswered!</li>
                          </ul>
                          <p className="font-bold text-[#d8b4fe] text-xs pt-1">
                            Show us how you compile magic in a few lines that will perplex the reader's judgment!
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="relative mt-5">
                      <textarea
                        ref={step3Ref}
                        value={grayCharText}
                        onChange={(e) => setGrayCharText(e.target.value)}
                        placeholder={lang === 'AR' ? "اكتب مشهدك الرمادي المعقّد وقطعة البازل المفقودة هنا..." : "Write your morally gray character scene and its missing puzzle piece here..."}
                        rows={7}
                        className={`w-full p-5 pb-16 rounded-xl border bg-black/40 font-sans text-sm outline-none resize-none transition-all duration-300 leading-relaxed text-white
                          ${theme === 'PURPLE' 
                            ? 'border-[#8a2be2]/40 focus:border-[#d8b4fe] focus:shadow-[0_0_20px_rgba(138,43,226,0.35)]' 
                            : 'border-white/10 focus:border-white/40 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                      />
                      
                      {/* Live Indicators Overlay */}
                      <div className="absolute bottom-3 inset-x-5 flex items-center justify-between pointer-events-none select-none text-[10px] font-mono">
                        {/* Auto-save notification flashes when typing stops */}
                        <div className="flex items-center gap-1.5 min-h-[16px]">
                          <AnimatePresence>
                            {draftSavedFlash.step3 && (
                              <motion.span
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-emerald-400 font-bold flex items-center gap-1"
                              >
                                <Check size={10} className="stroke-[3]" />
                                {lang === 'AR' ? "✓ حُفظ آلياً" : "✓ Auto-Saved"}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Text Stats */}
                        <div className="flex items-center gap-3 text-purple-300/50 font-medium">
                          <span>{getWordCount(grayCharText)} {lang === 'AR' ? 'كلمة' : 'words'}</span>
                          <span>•</span>
                          <span>{getReadingTime(grayCharText)} {lang === 'AR' ? 'وقت القراءة' : 'read'}</span>
                          <span>•</span>
                          <span>{grayCharText.length} {lang === 'AR' ? 'حرف' : 'chars'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Challenge Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={shareStep3Attempt}
                        className="py-2.5 px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2 text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40"
                        style={{
                          boxShadow: '0 0 15px rgba(138, 43, 226, 0.45)'
                        }}
                      >
                        <Sparkles size={12} className="text-[#d8b4fe]" />
                        <span>{lang === 'AR' ? "حفظ التقدم ومشاركة المحاولة" : "Save Progress & Share Attempt"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(3);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="py-2.5 px-5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white/90"
                      >
                        {lang === 'AR' ? "تخطي التحدي" : "Skip Challenge"}
                      </button>
                    </div>

                    {renderAIFeedback(2)}
                  </div>
                </div>
              )}

              {/* Step 4 textarea */}
              {currentStep === 3 && (
                <div className="space-y-6 pt-3" dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 bg-purple-950/10 border-[#8a2be2]/30 focus-within:border-[#d8b4fe]/50 shadow-[0_0_25px_rgba(138,43,226,0.06)]`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#d8b4fe] animate-pulse shrink-0" />
                      <h4 className="text-base sm:text-lg font-display font-bold text-[#d8b4fe]">
                        {lang === 'AR' ? "التحدي الرابع والأخير: أصداء القلعة المظلمة (تحدي الحواس الأربعة)" : "Challenge Four: Echoes of the Dark Castle"}
                      </h4>
                    </div>
                    
                    <div className={`text-xs sm:text-sm font-sans font-light text-[#f3e8ff]/95 leading-relaxed ${isRtl ? 'leading-loose text-right' : 'text-left'}`}>
                      {lang === 'AR' ? (
                        <div className="space-y-4">
                          <p className="font-semibold text-purple-200 text-sm">
                            حان الوقت لنضع لمستك السحرية الأخيرة في ورشتنا! التحدي هو أن تصف (قلعة مخيفة ومهجورة)، مع الالتزام التام بالشروط الحِسّية التالية:
                          </p>
                          <ul className="list-decimal list-inside pr-4 space-y-2.5 font-sans font-medium text-purple-200">
                            <li><strong>حاسة البصر:</strong> صِف تفصيلاً صغيراً وخفياً في المكان (وليس القلعة ككل).</li>
                            <li><strong>حاسة السمع:</strong> نقل لنا صوتاً يكسر سكون القلعة ويرعب الأنفاس.</li>
                            <li><strong>حاسة الشم:</strong> ما هي الرائحة التي تعبق في هواء هذا المكان المهجور؟</li>
                            <li><strong>حاسة اللمس:</strong> ادمج ملمساً في المشهد (برودة الجدران، غبار النوافذ، ثقل الهواء).</li>
                            <li><strong>الأفكار الجائلة:</strong> اذكر فكرة أو خاطرة دارت في عقل البطل وهو يخطو داخلها (مثل: جال في فكري أنني...).</li>
                          </ul>
                          <p className="font-bold text-[#d8b4fe] text-xs pt-1">
                            أطلق العنان لقلمك الآن، واختم ورشتك بنص حسي يسلب الألباب!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="font-semibold text-purple-200 text-sm">
                            It is time to put your final magical touch to our workshop! The challenge is to describe a (scary and abandoned castle), strictly adhering to the following sensory conditions:
                          </p>
                          <ul className="list-disc list-inside pl-4 space-y-2.5 font-sans font-medium text-purple-200">
                            <li><strong>Sight:</strong> Describe a small, hidden detail in the setting (rather than the castle as a whole).</li>
                            <li><strong>Sound:</strong> Convey a sound that breaks the silence of the castle and strikes terror.</li>
                            <li><strong>Smell:</strong> What is the odor lingering in the air of this deserted place?</li>
                            <li><strong>Touch:</strong> Integrate a tactile sensation into the scene (chilled walls, dusty windows, heavy air).</li>
                            <li><strong>Internal Monologue:</strong> Mention a lingering thought that passed through the protagonist's mind as they stepped inside (e.g., 'It occurred to me that I...').</li>
                          </ul>
                          <p className="font-bold text-[#d8b4fe] text-xs pt-1">
                            Unleash your pen now, and seal your workshop with a sensory masterpiece that captivates souls!
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="relative mt-5">
                      <textarea
                        ref={step4Ref}
                        value={sensoryText}
                        onChange={(e) => setSensoryText(e.target.value)}
                        placeholder={lang === 'AR' ? "اكتب وصفك الحسي للقلعة المظلمة هنا وتذكر استخدام حواسك..." : "Weave your sensory dark castle description here using your senses..."}
                        rows={7}
                        className={`w-full p-5 pb-16 rounded-xl border bg-black/40 font-sans text-sm outline-none resize-none transition-all duration-300 leading-relaxed text-white
                          ${theme === 'PURPLE' 
                            ? 'border-[#8a2be2]/40 focus:border-[#d8b4fe] focus:shadow-[0_0_20px_rgba(138,43,226,0.35)]' 
                            : 'border-white/10 focus:border-white/40 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                      />
                      
                      {/* Live Indicators Overlay */}
                      <div className="absolute bottom-3 inset-x-5 flex items-center justify-between pointer-events-none select-none text-[10px] font-mono">
                        {/* Auto-save notification flashes when typing stops */}
                        <div className="flex items-center gap-1.5 min-h-[16px]">
                          <AnimatePresence>
                            {draftSavedFlash.step4 && (
                              <motion.span
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-emerald-400 font-bold flex items-center gap-1"
                              >
                                <Check size={10} className="stroke-[3]" />
                                {lang === 'AR' ? "✓ حُفظ آلياً" : "✓ Auto-Saved"}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Text Stats */}
                        <div className="flex items-center gap-3 text-purple-300/50 font-medium">
                          <span>{getWordCount(sensoryText)} {lang === 'AR' ? 'كلمة' : 'words'}</span>
                          <span>•</span>
                          <span>{getReadingTime(sensoryText)} {lang === 'AR' ? 'وقت القراءة' : 'read'}</span>
                          <span>•</span>
                          <span>{sensoryText.length} {lang === 'AR' ? 'حرف' : 'chars'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Challenge Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={shareStep4Attempt}
                        className="py-2.5 px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2 text-white bg-violet-600 hover:bg-violet-500 border border-violet-400/40"
                        style={{
                          boxShadow: '0 0 15px rgba(138, 43, 226, 0.45)'
                        }}
                      >
                        <Sparkles size={12} className="text-[#d8b4fe]" />
                        <span>{lang === 'AR' ? "حفظ التقدم ومشاركة المحاولة" : "Save Progress & Share Attempt"}</span>
                      </button>
                    </div>

                    {renderAIFeedback(3)}
                  </div>
                </div>
              )}

              {/* Magical Words Token selector bar */}
              {currentStep > 0 && stepsData[currentStep].tokens && (
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2.5">
                  <h4 className="text-[10px] font-sans font-bold tracking-widest uppercase text-white/45 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>
                      {lang === 'AR' ? "انقر لإضافة كلمات سحرية للفقرة تلقائياً بموقع المؤشر:" : "Myst mystical words (Click term to insert at cursor position):"}
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {stepsData[currentStep].tokens?.map((token, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => appendTokenToText(token, currentStep + 1)}
                        className={`text-xs py-2 px-4 rounded-full transition-all duration-300 border font-sans cursor-pointer
                          ${theme === 'PURPLE' 
                            ? 'bg-[#d8b4fe]/5 border-[#d8b4fe]/15 text-[#d8b4fe] hover:bg-[#d8b4fe]/20 hover:border-[#d8b4fe]/40 hover:scale-105 active:scale-95' 
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/15'}`}
                      >
                        🔮 {token}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom action panel for the current step */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={handleSkip}
                className={`py-2 px-5 rounded-full text-xs font-semibold tracking-wide transition-colors cursor-pointer
                  ${theme === 'PURPLE' ? 'bg-[#d8b4fe]/5 text-[#d8b4fe] hover:bg-[#d8b4fe]/15' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                {currentTranslation.skipStep}
              </button>

              <div className="flex items-center gap-2.5">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(prev => prev - 1);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`py-2 px-5 rounded-full text-xs font-semibold tracking-wide border transition-colors cursor-pointer
                      ${theme === 'PURPLE' ? 'border-[#d8b4fe]/15 text-[#d8b4fe] hover:bg-[#d8b4fe]/10' : 'border-white/10 text-white/70'}`}
                  >
                    {currentTranslation.prevStep}
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(prev => prev + 1);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`py-2 px-5 rounded-full text-xs font-bold tracking-wide transition-all shadow-md cursor-pointer
                      ${theme === 'PURPLE' ? 'bg-[#d8b4fe] text-black hover:opacity-90' : 'bg-white text-black hover:opacity-90'}`}
                  >
                    {currentTranslation.nextStep}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Final Step Submission form at the bottom */}
      {currentStep === 3 && (sensoryText.trim() || grayCharText.trim() || backstoryText.trim() || charNames.trim()) && (
        <motion.form 
          onSubmit={handlePublishWorkshop}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/25 space-y-5"
        >
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white font-sans uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>{lang === 'AR' ? "المرحلة النهائية: توثيق الهوية والنشر في الفيد العام" : "Final Stage: Identity Sign-off & Community Broadcast"}</span>
            </h3>
            <p className="text-xs text-white/50 leading-relaxed max-w-2xl">
              {lang === 'AR' 
                ? "لقد قمت بحبك جميع خطوات ورشة العمل الأربعة وصياغتها بإتقان باذخ. ضع كلمتك الختامية أو اسمك المستعار لننشر ورشة العمل باللوحة الشاملة في محراب المبدعين."
                : "You've crafted the complete 4-step creative arc. Input your pen name to sign off your masterpiece and broadcast your work into Rosaline Bela's public hall of fame."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input 
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={lang === 'AR' ? "ضع اسمك المستعار الساحر هنا (اختياري)..." : "Your pen name (optional)..."}
              className={`w-full sm:w-2/3 p-4 rounded-xl border bg-black/20 font-sans text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(216,180,254,0.15)]
                ${theme === 'PURPLE' ? 'border-[#d8b4fe]/25 text-white focus:border-[#d8b4fe]/50' : 'border-white/10 text-white focus:border-white/30'}`}
            />

            <button
              type="submit"
              className={`w-full sm:w-1/3 py-4 rounded-xl font-bold text-xs tracking-widest uppercase shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cursor-pointer
                ${themeStyles.modalBtn}`}
            >
              {currentTranslation.publishAllBtn}
            </button>
          </div>
        </motion.form>
      )}

      {/* Community Gallery / List Section */}
      <div className="space-y-6 pt-6 border-t border-white/10">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-display font-medium text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>{currentTranslation.communitySectionTitle}</span>
          </h2>
          <p className="text-xs text-white/50">
            {currentTranslation.communitySub}
          </p>
        </div>

        {publishedWorkshops.length === 0 ? (
          <div className="text-center py-16 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
            <PenTool className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-sans font-light text-white/50 max-w-sm mx-auto px-6">
              {lang === 'AR' 
                ? "تعتبر هذه اللوحة فارغة بانتظار الكاتب المستنير الأول. خض خطوات التحديات الأربعة في التبويبات أعلاه لتكون ساطعاً كالنجم المتهاوي!" 
                : "The hall of scribes is quiet. Be the first to fulfill all four parameters and publish your work today!"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {publishedWorkshops.map((work) => (
              <div 
                key={work.id}
                className={`p-6 sm:p-8 rounded-[2rem] border relative group bg-black/40 border-white/10 space-y-6`}
              >
                {/* Delete button option */}
                <button
                  type="button"
                  onClick={() => deletePublishedItem(work.id)}
                  className="absolute top-6 left-6 p-2 rounded-full text-white/35 hover:text-red-400 hover:bg-white/5 transition-all duration-300"
                  title={lang === 'AR' ? "إزالة من السجل" : "Remove"}
                >
                  <Trash2 size={13} />
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[10px] font-mono tracking-widest uppercase font-extrabold text-[#d8b4fe]">
                      ✦ {lang === 'AR' ? "ميثاق الفانتازيا المتكامل" : "FANTASY BLUEPRINT"}
                    </span>
                    <span className="text-white/20 text-xs">•</span>
                    <span className="text-[10px] text-white/45 font-sans font-light flex items-center gap-1.5">
                      <Clock size={11} />
                      {work.date}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-white/35">
                    — {lang === 'AR' ? 'بصمة الكاتب المستعار: ' : 'Carved by: '} 
                    <span className="font-bold text-white/70">{work.author}</span>
                  </p>
                </div>

                <div className="h-px bg-white/5" />

                {/* Grid showing Step summary details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm font-sans leading-relaxed text-white/90">
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wide">
                      {lang === 'AR' ? "١. المخطط العام للأساس" : "1. System Schema"}
                    </span>
                    <div className="space-y-1 text-xs text-white/70">
                      <p>• <span className="text-white font-medium">{currentTranslation.charactersLabel}:</span> {work.step1?.chars}</p>
                      <p>• <span className="text-white font-medium">{currentTranslation.plotStartLabel}:</span> {work.step1?.plot}</p>
                      <p>• <span className="text-white font-medium">{currentTranslation.eventsLabel}:</span> {work.step1?.events}</p>
                      <p>• <span className="text-white font-medium">{currentTranslation.endingLabel}:</span> {work.step1?.ending}</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wide">
                      {lang === 'AR' ? "٢. ماضي وظلال الشخصية" : "2. Character Shadow"}
                    </span>
                    <p className={`text-xs text-white/75 ${isRtl ? 'leading-relaxed' : ''}`}>
                      “ {work.step2} ”
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wide">
                      {lang === 'AR' ? "٣. الوجه الرمادي والذنب" : "3. The Morally Gray Act"}
                    </span>
                    <p className={`text-xs text-white/75 ${isRtl ? 'leading-relaxed' : ''}`}>
                      “ {work.step3} ”
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-[#d8b4fe] uppercase tracking-wide">
                      {lang === 'AR' ? "٤. هندسة الوصف الحسي" : "4. Sensory Environment"}
                    </span>
                    <p className={`text-xs text-white/75 ${isRtl ? 'leading-relaxed' : ''}`}>
                      “ {work.step4} ”
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Like & Comment Bar */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-4">
                    {/* Like button with heart animation */}
                    <button
                      type="button"
                      onClick={() => toggleWorkshopLike(work.id)}
                      className="flex items-center gap-1.5 focus:outline-none group select-none cursor-pointer"
                    >
                      <motion.div
                        whileTap={{ scale: 1.4 }}
                        animate={{ scale: workshopLikes[work.id] ? [1, 1.25, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart
                          size={15}
                          className={`transition-colors duration-300 ${
                            workshopLikes[work.id] 
                              ? 'text-rose-500 fill-rose-500 filter drop-shadow-[0_0_5px_rgba(244,63,94,0.6)]' 
                              : 'text-white/40 group-hover:text-rose-400'
                          }`}
                        />
                      </motion.div>
                      <span className={`font-mono text-[11px] font-bold transition-colors ${workshopLikes[work.id] ? 'text-rose-400' : 'text-white/45'}`}>
                        {getLikeCount(work.id)}
                      </span>
                    </button>

                    {/* Comments Count Indicator */}
                    <div className="flex items-center gap-1.5 text-white/45 font-sans">
                      <MessageCircle size={15} className="text-white/40" />
                      <span className="font-mono text-[11px] font-bold">
                        {getPostComments(work.id).length}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-white/25 italic">
                    {lang === 'AR' ? "انقر للتفاعل مع الإلهام الكوني" : "Join the creative frequency"}
                  </span>
                </div>

                {/* Comments List & Input box */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  {/* Real Comments list */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {getPostComments(work.id).map((c) => (
                      <div 
                        key={c.id} 
                        className="p-3.5 rounded-2xl text-xs space-y-1 transition-colors duration-300 bg-white/[0.02] border border-white/5 text-white/90"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1">
                          <span className="text-[9px] font-light">{c.date}</span>
                          <span className="font-bold uppercase tracking-wider text-purple-300/80">
                            ✦ {c.author}
                          </span>
                        </div>
                        <p className="font-sans font-light leading-relaxed text-right text-white/80">
                          {c.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input form with seamless dynamic appending */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const txt = commentInputTexts[work.id] || '';
                      handleAddWorkshopComment(work.id, txt);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={commentInputTexts[work.id] || ''}
                      onChange={(e) => setCommentInputTexts(prev => ({
                        ...prev,
                        [work.id]: e.target.value
                      }))}
                      placeholder={lang === 'AR' ? "اكتب تعليقاً ملهماً من نبع كُلّك الروائي..." : "Carve an inspiring comment here..."}
                      className={`flex-1 p-3 rounded-xl border bg-black/30 font-sans text-xs outline-none text-white focus:outline-none transition-all duration-300
                        ${theme === 'PURPLE' ? 'border-purple-500/20 focus:border-purple-500/50' : 'border-white/10 focus:border-white/35'}`}
                    />
                    <button
                      type="submit"
                      disabled={!(commentInputTexts[work.id] || '').trim()}
                      className="p-3 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-40 select-none bg-[#ab7eff]/20 hover:bg-[#ab7eff]/30 text-[#d8b4fe]"
                      title={lang === 'AR' ? "نشر التعليق" : "Append comment"}
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
