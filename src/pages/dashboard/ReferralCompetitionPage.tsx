import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, AlertTriangle, Users, Calculator, Gift, ShieldAlert, BadgeCheck, FileText, Languages } from 'lucide-react';

const translations = {
  english: {
    bannerTitle: "Referral Competition",
    bannerDesc: "Leaderboard Program – Details & Guidelines. Compete to earn exclusive rewards by inviting active users.",
    reqTitle: "Participation Requirements",
    req1: "Entry is strictly for organic sub-referrals that meet minimum activity thresholds.",
    req2: "Direct invitations to this competition are only sent to proven power referrers.",
    req3: "Your standard referral link automatically qualifies you, provided all rules are followed.",
    calcTitle: "Earnings Calculation",
    calc1: 'Only "Active" and "Earning" referrals count toward the leaderboard score.',
    calc2: "Suspended or inactive (0 earning) referrals are disregarded immediately.",
    calc3: "Final earnings calculation involves proprietary weighting to prevent fraud.",
    rewardTitle: "Reward Distribution",
    reward1: "Top 5 referrers sharing a significant prize pool at each month's end.",
    reward2: "1st Place: Highest percentage and a premium badge.",
    reward3: "Payouts are combined directly to your Main Balance on the 1st of every month automatically.",
    leaderboardTitle: "Live Leaderboard",
    leaderboard1: 'The leaderboard reflects "verified" earnings only, not "gross" earnings.',
    leaderboard2: "Expect slight delays (up to 24 hours) as anti-abuse algorithms process new sign-ups.",
    adminTitle: "Admin Final Policy",
    adminText: "The TaskVexa team reserves the absolute right to evaluate referral authenticity. All administrative decisions regarding disqualifications or reward payments are final.",
    fakeTitle: "Fake Referrals Policy",
    fakeWarning: "Warning",
    fakeDesc: "Any attempt at creating multiple accounts or paying individuals for fake clicks will result in:",
    fake1: "Immediate disqualification from the competition.",
    fake2: "Permanent ban of your main TaskVexa account.",
    fake3: "Confiscation of all pending balances across related accounts.",
    langEn: "English",
    langUr: "Urdu",
    langRu: "Roman"
  },
  urdu: {
    bannerTitle: "ریفرل مقابلہ",
    bannerDesc: "لیڈر بورڈ پروگرام – تفصیلات اور ہدایات۔ ایکٹو یوزرز کو مدعو کر کے خصوصی انعامات جیتیں۔",
    reqTitle: "شرکت کی شرائط",
    req1: "اس مقابلے میں شرکت صرف ان ریفرلز کے لیے ہے جو کم از کم ایکٹیویٹی کی حد پوری کرتے ہوں۔",
    req2: "اس مقابلے کے براہ راست دعوتی نامے صرف ثابت شدہ اور بہترین ریفررز کو بھیجے جاتے ہیں۔",
    req3: "تمام قوانین کی پیروی کی شرط پر، آپ کا عام ریفرل لنک آپ کو خود بخود اہل بناتا ہے۔",
    calcTitle: "کمائی کا حساب",
    calc1: "لیڈر بورڈ سکور میں صرف 'ایکٹو' اور 'کمانے والے' ریفرلز شمار کیے جاتے ہیں۔",
    calc2: "معطل یا غیر فعال (0 کمائی والے) ریفرلز کو فوری طور پر خارج کر دیا جاتا ہے۔",
    calc3: "حتمی کمائی کے حساب میں فراڈ کو روکنے کے لیے خصوصی نظام شامل ہے۔",
    rewardTitle: "انعامات کی تقسیم",
    reward1: "ہر ماہ کے آخر میں ٹاپ 5 ریفررز میں ایک بڑا انعام تقسیم کیا جاتا ہے۔",
    reward2: "پہلا انعام: سب سے زیادہ فیصد اور ایک پریمیم بیج۔",
    reward3: "ادا کی جانے والی رقم ہر مہینے کی 1 تاریخ کو خود بخود آپ کے مین بیلنس میں شامل کر دی جاتی ہے۔",
    leaderboardTitle: "لائیو لیڈر بورڈ",
    leaderboard1: "لیڈر بورڈ صرف 'تصدیق شدہ' کمائی دکھاتا ہے، 'مجموعی' کمائی نہیں۔",
    leaderboard2: "سسٹم نئے سائن اپس کی جانچ کرتا ہے جس کی وجہ سے تھوڑی تاخیر (24 گھنٹے تک) ہو سکتی ہے۔",
    adminTitle: "ایڈمن کی حتمی پالیسی",
    adminText: "ٹاسک ویکسہ ٹیم کو ریفرل کی اصلیت جانچنے کا مکمل حق حاصل ہے۔ نااہلی یا انعام کی ادائیگی کے حوالے سے تمام انتظامی فیصلے حتمی ہوں گے۔",
    fakeTitle: "جعلی ریفرل پالیسی",
    fakeWarning: "انتباہ",
    fakeDesc: "متعدد اکاؤنٹس بنانے یا فیک کلکس کے لیے لوگوں کو پیسے دینے کی کسی بھی کوشش کے نتیجے میں:",
    fake1: "مقابلے سے فوری طور پر نااہل قرار دیا جائے گا۔",
    fake2: "آپ کا مین ٹاسک ویکسہ اکاؤنٹ مستقل طور پر بین کر دیا جائے گا۔",
    fake3: "جڑے ہوئے تمام اکاؤنٹس کے بقیہ بیلنس ضبط کر لیے جائیں گے۔",
    langEn: "English",
    langUr: "Urdu",
    langRu: "Roman"
  },
  romanUrdu: {
    bannerTitle: "Referral Competition",
    bannerDesc: "Leaderboard Program – Tafseelat aur Hidayat. Active users ko invite kar ke shandar inaam jeetein.",
    reqTitle: "Hissa Lene Ki Sharait",
    req1: "Entry sirf un organic referrals ke liye hai jo minimum activity limit poori karte hon.",
    req2: "Is competition ke direct invites sirf proven top referrers ko bheje jate hain.",
    req3: "Agar aap tamam rules follow karte hain to aap ka standard referral link aap ko automatically qualify kar deta hai.",
    calcTitle: "Earning Calculation",
    calc1: "Leaderboard score mein sirf 'Active' aur 'Earning' referrals count hote hain.",
    calc2: "Suspended ya inactive (0 earning wale) referrals ko foran nikal diya jata hai.",
    calc3: "Final earning calculation mein fraud rokne ke liye special checking system shamil hai.",
    rewardTitle: "Rewards Ki Taqseem",
    reward1: "Har mahine ke aakhir mein top 5 referrers mein bada inam taqseem hota hai.",
    reward2: "1st Place: Sab se zyada percentage aur premium badge.",
    reward3: "Payouts har mahine ki 1 tareekh ko auto par aap ko Main Balance mein mil jayenge.",
    leaderboardTitle: "Live Leaderboard",
    leaderboard1: "Leaderboard sirf 'verified' earnings show karta hai, 'total' nahi.",
    leaderboard2: "Anti-abuse system naye signups check karta hai is liye thora delay (24 hours tak) ho sakta hai.",
    adminTitle: "Admin Final Policy",
    adminText: "TaskVexa team ko referral ke asli hone ko check karne ka pura haq hai. Ban karne ya reward dene ke hawale se admin ke decisions final honge.",
    fakeTitle: "Fake Referrals Policy",
    fakeWarning: "Warning",
    fakeDesc: "Multiple accounts banane ya fake clicks ke liye logo ko paise dene ki kisi bhi koshish ke nateejay mein:",
    fake1: "Competition se foren nikaal diya jaye ga.",
    fake2: "Aap ka main TaskVexa account permanent ban ho jaye ga.",
    fake3: "Related accounts ka sara pending balance zapt ho jaye ga.",
    langEn: "English",
    langUr: "Urdu",
    langRu: "Roman"
  }
};

type LangType = keyof typeof translations;

export default function ReferralCompetitionPage() {
  const [language, setLanguage] = useState<LangType>('english');

  useEffect(() => {
    const savedLang = localStorage.getItem('taskvexa_pref_lang') as LangType;
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang: LangType) => {
    setLanguage(lang);
    localStorage.setItem('taskvexa_pref_lang', lang);
  };

  const t = translations[language];
  const isUrdu = language === 'urdu';

  return (
    <div className={`w-full pb-12 ${isUrdu ? 'text-right' : 'text-left'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* Language Switcher */}
      <div className="flex justify-end mb-4" dir="ltr">
        <div className="inline-flex bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-100 dark:border-slate-800">
          <button
            onClick={() => changeLanguage('english')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              language === 'english' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🇺🇸 EN
          </button>
          <button
            onClick={() => changeLanguage('urdu')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              language === 'urdu' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🇵🇰 اردو
          </button>
          <button
            onClick={() => changeLanguage('romanUrdu')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              language === 'romanUrdu' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🔤 Roman
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-amber-500 rounded-[32px] p-8 sm:p-10 text-white mb-8 relative overflow-hidden shadow-xl shadow-amber-500/20">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-600/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shrink-0 border-4 border-white/30 backdrop-blur-sm">
            <Trophy className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          <div className={`text-center sm:text-start`}>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{t.bannerTitle}</h1>
            <p className="text-amber-100 font-medium text-sm sm:text-base leading-relaxed max-w-xl text-center sm:text-start" dir={isUrdu ? 'rtl' : 'ltr'}>
              {t.bannerDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participation Requirements */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col"
        >
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-6 self-start">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t.reqTitle}</h2>
          <ul className="space-y-3 mt-auto">
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">1</span>
              <div>{t.req1}</div>
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">2</span>
              <div>{t.req2}</div>
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">3</span>
              <div>{t.req3}</div>
            </li>
          </ul>
        </motion.div>

        {/* Earnings Calculation */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col"
        >
          <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/40 rounded-2xl flex items-center justify-center mb-6 self-start">
            <Calculator className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t.calcTitle}</h2>
          <ul className="space-y-3 mt-auto">
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0 mt-2" />
              <div>{t.calc1}</div>
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0 mt-2" />
              <div>{t.calc2}</div>
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0 mt-2" />
              <div>{t.calc3}</div>
            </li>
          </ul>
        </motion.div>

        {/* Reward Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col"
        >
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center mb-6 self-start">
            <Gift className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t.rewardTitle}</h2>
          <ul className="space-y-3 mt-auto">
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-2" />
              <div>{t.reward1}</div>
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-2" />
              <div>{t.reward2}</div>
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-2" />
              <div>{t.reward3}</div>
            </li>
          </ul>
        </motion.div>

        {/* Live Leaderboard & Admin Final Policy */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col"
        >
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex-1">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center mb-6 self-start">
              <BadgeCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t.leaderboardTitle}</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0 mt-2" />
                <div>{t.leaderboard1}</div>
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0 mt-2" />
                <div>{t.leaderboard2}</div>
              </li>
            </ul>
          </div>
          <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{t.adminTitle}</h3>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.adminText}
            </p>
          </div>
        </motion.div>

        {/* Fake Referrals Policy */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="md:col-span-2 bg-rose-50 dark:bg-rose-950/20 rounded-3xl p-6 md:p-10 border border-rose-100 dark:border-rose-900/50 shadow-xl shadow-rose-200/40 dark:shadow-none"
        >
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            <div className="w-16 h-16 bg-white dark:bg-rose-900/50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100/50 dark:border-rose-800/50">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <div className="w-full">
              <h2 className="text-xl font-black text-rose-800 dark:text-rose-400 mb-3 flex items-center gap-2 flex-wrap">
                {t.fakeTitle} <span className="text-[10px] bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 px-2.5 py-1 rounded-full tracking-widest uppercase">{t.fakeWarning}</span>
              </h2>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-300 mb-5 leading-relaxed opacity-90 max-w-2xl">
                {t.fakeDesc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div className="bg-white dark:bg-rose-900/30 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-800/50 text-start">
                  <AlertTriangle className="w-5 h-5 text-rose-500 mb-2" />
                  <p className="text-sm font-bold text-rose-900 dark:text-rose-300">{t.fake1}</p>
                </div>
                <div className="bg-white dark:bg-rose-900/30 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-800/50 text-start">
                  <AlertTriangle className="w-5 h-5 text-rose-500 mb-2" />
                  <p className="text-sm font-bold text-rose-900 dark:text-rose-300">{t.fake2}</p>
                </div>
                <div className="bg-white dark:bg-rose-900/30 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-800/50 text-start">
                  <AlertTriangle className="w-5 h-5 text-rose-500 mb-2" />
                  <p className="text-sm font-bold text-rose-900 dark:text-rose-300">{t.fake3}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

