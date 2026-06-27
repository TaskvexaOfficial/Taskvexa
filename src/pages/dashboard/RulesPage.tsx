import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

const translations = {
  english: {
    bannerTitle: "Website Rules",
    bannerDesc: "Please read and understand the following rules before using TaskVexa. Violating these rules will result in an immediate account ban or deduction of your balance.",
    rules: [
      { id: 1, title: "Multiple Accounts", description: "Creating multiple accounts using the same IP, device, or fake details is strictly prohibited. You will be permanently banned." },
      { id: 2, title: "Fake Activity", description: "Any use of bots, VPNs, proxies, or emulators to complete tasks or click links will lead to an immediate ban." },
      { id: 3, title: "Proof Submission Fraud", description: "Submitting fake screenshots, repeating the same proof, or copying others' proof in tasks will result in task rejection and a possible ban." },
      { id: 4, title: "Withdrawal Rules", description: "Ensure your account details are correct before withdrawing. Withdrawals submitted with incorrect details may be permanently lost." },
      { id: 5, title: "Referral Abuse", description: "Inviting inactive or fake users heavily impacts the system. Only genuine referrals are allowed. Your account balance may be wiped if fake referrals are detected." },
      { id: 6, title: "Reward Reversal", description: "If a task provider rejects your activity after approval due to fraud, the credited amount will be reversed from your balance." },
      { id: 7, title: "Admin Decision", description: "The administration reserves the final right to decide on any dispute. All administrative actions are non-negotiable." }
    ],
    warningTitle: "Zero Tolerance Policy",
    warningDesc: "We maintain a zero-tolerance policy against any cheating or fraudulent attempts to manipulate earnings. Suspicious accounts are permanently deactivated without warning.",
    zeroHighlight: "zero-tolerance policy"
  },
  urdu: {
    bannerTitle: "ویب سائٹ کے قواعد",
    bannerDesc: "ٹاسک ویکسہ استعمال کرنے سے پہلے درج ذیل قواعد کو ضرور پڑھیں۔ قوانین کی خلاف ورزی کی صورت میں اکاؤنٹ فوری طور پر بین یا بیلنس کاٹ لیا جائے گا۔",
    rules: [
      { id: 1, title: "ایک سے زیادہ اکاؤنٹس", description: "ایک ہی آئی پی، ڈیوائس یا جعلی تفصیلات استعمال کر کے متعدد اکاؤنٹس بنانا سختی سے منع ہے۔ آپ کا اکاؤنٹ مستقل طور پر بین کر دیا جائے گا۔" },
      { id: 2, title: "جعلی ایکٹیویٹی", description: "ٹاسک مکمل کرنے یا لنکس پر کلک کرنے کے لیے بوٹس، وی پی این، پراکسیز یا ایمولیٹرز کا کسی بھی قسم کا استعمال فوری بین کا سبب بنے گا۔" },
      { id: 3, title: "جعلی پروف جمع کروانا", description: "جعلی سکرین شاٹس جمع کروانا، ایک ہی پروف کو بار بار بھیجنا، یا دوسروں کا پروف کاپی کرنے پر ٹاسک مسترد کر دیا جائے گا اور بین بھی کیا جا سکتا ہے۔" },
      { id: 4, title: "پیسے نکلوانے کے قواعد", description: "پیسے نکلوانے سے پہلے یقینی بنائیں کہ آپ کے اکاؤنٹ کی تفصیلات درست ہیں۔ غلط معلومات کے ساتھ نکالی گئی رقم مستقل طور پر ضائع ہو سکتی ہے۔" },
      { id: 5, title: "ریفرل کا غلط استعمال", description: "غیر فعال یا جعلی یوزرز کو مدعو کرنے سے سسٹم پر برا اثر پڑتا ہے۔ صرف اصلی ریفرلز کی اجازت ہے۔ جعلی ریفرلز پکڑے جانے پر آپ کا سارا بیلنس ختم کیا جا سکتا ہے۔" },
      { id: 6, title: "انعام کی واپسی", description: "اگر کوئی ٹاسک دینے والا فراڈ کی وجہ سے منظوری کے بعد آپ کی ایکٹیویٹی مسترد کر دیتا ہے، تو دی گئی رقم آپ کے بیلنس سے کاٹ لی جائے گی۔" },
      { id: 7, title: "ایڈمن کا فیصلہ", description: "انتظامیہ کو کسی بھی تنازع پر فیصلہ کرنے کا حتمی حق حاصل ہے۔ تمام انتظامی کارروائیوں پر بحث کی گنجائش نہیں ہے۔" }
    ],
    warningTitle: "زیرو ٹالرنس پالیسی",
    warningDesc: "ہم فراڈ یا دھوکہ دہی کر کے کمائی بڑھانے کی کسی بھی کوشش پر زیرو ٹالرنس پالیسی رکھتے ہیں۔ مشتبہ اکاؤنٹس کو بغیر انتباہ کے مستقل طور پر بند کر دیا جاتا ہے۔",
    zeroHighlight: "زیرو ٹالرنس پالیسی"
  },
  romanUrdu: {
    bannerTitle: "Website Rules",
    bannerDesc: "TaskVexa use karne se pehle in rules ko zaroor parhein. Rules break karne par account foran ban aur balance deduct kiya ja sakta hai.",
    rules: [
      { id: 1, title: "Multiple Accounts", description: "Ek hi IP, device ya fake details use kar ke zyada accounts banana sakhti se mana hai. Aap ko permanent ban kar diya jaye ga." },
      { id: 2, title: "Fake Activity", description: "Tasks pure karne ya links open karne ke liye kisi bhi qism ke bots, VPNs, proxies, ya emulators ka istemal foran account ban ka sabab banega." },
      { id: 3, title: "Proof Submission Fraud", description: "Fake screenshots upload karna, wahi proof baar baar bhejna ya dusron ka proof copy karna, is sab par task reject hoga aur ban bhi ho sakte hain." },
      { id: 4, title: "Withdrawal Rules", description: "Paise nikalne se pehle check kar lein ke aap ki account details theek hain. Galat details par lagai gayi withdrawal hamesha ke liye zaya ho sakti hai." },
      { id: 5, title: "Referral Abuse", description: "Inactive ya fake users invite karne se system kharab hota hai. Sirf original referrals allowed hain. Agar fake referrals mile to balance zero kiya ja sakta hai." },
      { id: 6, title: "Reward Reversal", description: "Agar koi task provider approval ke baad fraud ki wajah se activity reject kar de to credit ki gai amount wapas kaat li jaye gi." },
      { id: 7, title: "Admin Decision", description: "Administration ke paas kisi bhi masle ka faisla karne ka final haq hoga. Admin ka decision final hoga aur us par behas nahi ki ja sakti." }
    ],
    warningTitle: "Zero Tolerance Policy",
    warningDesc: "Hum fraud ya cheating karke paise kamane ki kisi bhi koshish par Zero Tolerance Policy rakhte hain. Suspicious accounts foran aur hamesha ke liye band kar diye jayenge bgair kisi warning ke.",
    zeroHighlight: "Zero Tolerance Policy"
  }
};

type LangType = keyof typeof translations;

export default function RulesPage() {
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

      {/* Header */}
      <div className="bg-indigo-600 rounded-[32px] p-8 sm:p-10 text-white mb-8 relative overflow-hidden shadow-xl shadow-indigo-600/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shrink-0 border-4 border-white/30 backdrop-blur-sm">
            <ShieldAlert className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          <div className={`text-center sm:text-start`}>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{t.bannerTitle}</h1>
            <p className="text-indigo-100 font-medium text-sm sm:text-base leading-relaxed text-center sm:text-start" dir={isUrdu ? 'rtl' : 'ltr'}>
              {t.bannerDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4 mb-8">
        {t.rules.map((rule, index) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-400 transition-colors">
              {rule.id}
            </div>
            <div className="w-full">
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {rule.title}
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                {rule.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Zero Tolerance Warning */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: t.rules.length * 0.05 }}
        className="bg-rose-50 dark:bg-rose-950/20 rounded-3xl p-6 md:p-8 border border-rose-100 dark:border-rose-900/50 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="w-16 h-16 bg-white dark:bg-rose-900/50 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-rose-100/50 dark:border-rose-800/50">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="text-center sm:text-start w-full">
          <h2 className="text-lg font-black text-rose-800 dark:text-rose-400 mb-2 tracking-tight">
            {t.warningTitle}
          </h2>
          <p className="text-sm font-bold text-rose-900/80 dark:text-rose-300/90 leading-relaxed">
            {t.warningDesc.replace(t.zeroHighlight, t.zeroHighlight)} {/* Basic replace, but we will make it bold below manually to be safer */}
            <span className="hidden"></span>
            {t.warningDesc.split(t.zeroHighlight).map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <strong className="text-rose-600 dark:text-rose-400">{t.zeroHighlight}</strong>}
              </React.Fragment>
            ))}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
