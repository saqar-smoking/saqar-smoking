/*
 * AL SAQAR design reminder — The Connoisseur's Edit:
 * warm-ivory editorial luxury, carbon structure, rare Saqar Gold details,
 * asymmetrical procession, and clear adult-retail utility.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  Gem,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

type Language = "en" | "ar" | "fa";

const WHATSAPP_URL = "https://wa.me/971526179396";
const MAPS_URL = "https://maps.app.goo.gl/HyMvX8iZtQe4oRpq9?g_st=ic";
const INSTAGRAM_URL = "https://www.instagram.com/alsaqar_smoking/";
const PHONE_URL = "tel:+971526179396";

const copy = {
  en: {
    language: "EN",
    hours: "Every day, 8:30 AM – 1:30 AM",
    openDaily: "Open Daily",
    home: "Home",
    categories: "Categories",
    about: "About",
    contact: "Contact",
    whatsapp: "WhatsApp",
    heroEyebrow: "Dubai · Adult essentials · Open daily",
    heroTitle: "Your Premium Smoking Experience in Dubai.",
    heroText: "Hookahs, tobacco, smoking accessories, electronic devices and more.",
    explore: "Explore Collection",
    visit: "Visit Our Store",
    scrollCue: "Scroll to discover",
    quickTitle: "Here when the city is still awake.",
    callUs: "Call Us",
    location: "Location",
    quickOpen: "Open daily",
    quickCall: "052 617 9396",
    quickWhatsapp: "Fast response",
    quickLocation: "Dubai, UAE",
    collectionLabel: "The collection",
    collectionTitle: "Find your next essential.",
    collectionText: "A considered edit of the categories that complete the ritual.",
    discover: "Discover",
    serviceLabel: "The Al Saqar standard",
    serviceTitle: "The details make the ritual.",
    serviceText: "A focused in-store experience, with helpful guidance when you need it.",
    premium: "Premium Quality",
    brands: "Best Brands",
    expert: "Expert Service",
    fast: "Fast Response",
    premiumText: "Chosen for the rhythm of your everyday ritual.",
    brandsText: "A focused range, selected with restraint.",
    expertText: "Direct guidance, without the hard sell.",
    fastText: "A clear answer when you message our team.",
    visitLabel: "Visit Al Saqar",
    visitTitle: "A Dubai destination for the considered choice.",
    visitText: "Come by for an unhurried look at the collection, or contact us before your visit.",
    directions: "Get Directions",
    mapLabel: "Find us on Google Maps",
    footerTagline: "Premium adult smoking essentials in Dubai.",
    navigation: "Navigation",
    reachUs: "Reach us",
    languages: "Languages",
    ageEyebrow: "Adults only · Dubai, UAE",
    ageTitle: "A considered experience, for adults.",
    ageText: "You must be 18 years of age or older to enter this website.",
    accept: "I am 18+",
    exit: "Exit",
    ageNote: "By entering, you confirm that you meet the legal age requirement.",
    rights: "© 2026 AL SAQAR SMOKING SHOP. All rights reserved.",
  },
  ar: {
    language: "AR",
    hours: "يوميًا، 8:30 صباحًا – 1:30 صباحًا",
    openDaily: "مفتوح يوميًا",
    home: "الرئيسية",
    categories: "الفئات",
    about: "عن المتجر",
    contact: "تواصل",
    whatsapp: "واتساب",
    heroEyebrow: "دبي · متجر للبالغين · مفتوح يوميًا",
    heroTitle: "تجربة تدخين راقية في دبي.",
    heroText: "شيشة، تبغ، ملحقات تدخين، أجهزة إلكترونية وأكثر.",
    explore: "استكشف المجموعة",
    visit: "زر متجرنا",
    scrollCue: "اكتشف المزيد",
    quickTitle: "نحن هنا حتى عندما تبقى المدينة مستيقظة.",
    callUs: "اتصل بنا",
    location: "الموقع",
    quickOpen: "مفتوح يوميًا",
    quickCall: "052 617 9396",
    quickWhatsapp: "رد سريع",
    quickLocation: "دبي، الإمارات",
    collectionLabel: "المجموعة",
    collectionTitle: "اعثر على أساسياتك التالية.",
    collectionText: "اختيار مدروس من الفئات التي تكمل طقوسك.",
    discover: "اكتشف",
    serviceLabel: "معيار السقار",
    serviceTitle: "التفاصيل تصنع الطقوس.",
    serviceText: "تجربة مركّزة في المتجر، مع إرشاد مفيد عند الحاجة.",
    premium: "جودة راقية",
    brands: "أفضل العلامات",
    expert: "خدمة متخصصة",
    fast: "رد سريع",
    premiumText: "اختيار مدروس لاحتياجاتك اليومية.",
    brandsText: "مجموعة مركّزة تُقدّم بعناية.",
    expertText: "خدمة مفيدة لاختيار أكثر ثقة.",
    fastText: "تواصل سريع مع فريقنا عبر واتساب.",
    visitLabel: "زر السقار",
    visitTitle: "وجهة دبي للاختيار المدروس.",
    visitText: "تفضل بزيارة المجموعة بهدوء، أو تواصل معنا قبل زيارتك.",
    directions: "الحصول على الاتجاهات",
    mapLabel: "اعثر علينا على خرائط Google",
    footerTagline: "أساسيات تدخين راقية للبالغين في دبي.",
    navigation: "التنقل",
    reachUs: "تواصل معنا",
    languages: "اللغات",
    ageEyebrow: "للبالغين فقط · دبي، الإمارات",
    ageTitle: "تجربة مدروسة، للبالغين.",
    ageText: "يجب أن يكون عمرك 18 عامًا أو أكثر لدخول هذا الموقع.",
    accept: "عمري 18+",
    exit: "خروج",
    ageNote: "بدخولك، تؤكد استيفاءك لمتطلب السن القانوني.",
    rights: "© 2026 متجر السقار للتدخين. جميع الحقوق محفوظة.",
  },
  fa: {
    language: "FA",
    hours: "هر روز، ۸:۳۰ صبح تا ۱:۳۰ بامداد",
    openDaily: "هر روز باز است",
    home: "خانه",
    categories: "دسته‌بندی‌ها",
    about: "درباره",
    contact: "تماس",
    whatsapp: "واتساپ",
    heroEyebrow: "دبی · فروشگاه بزرگسالان · هر روز باز",
    heroTitle: "تجربه ممتاز شما از محصولات دخانی در دبی.",
    heroText: "قلیان، تنباکو، لوازم جانبی، دستگاه‌های الکترونیکی و بیشتر.",
    explore: "مشاهده مجموعه",
    visit: "بازدید از فروشگاه",
    scrollCue: "برای کشف بیشتر",
    quickTitle: "وقتی شهر هنوز بیدار است، ما اینجاییم.",
    callUs: "تماس با ما",
    location: "موقعیت",
    quickOpen: "هر روز باز",
    quickCall: "052 617 9396",
    quickWhatsapp: "پاسخ سریع",
    quickLocation: "دبی، امارات",
    collectionLabel: "مجموعه",
    collectionTitle: "ضرورت بعدی خود را پیدا کنید.",
    collectionText: "انتخابی سنجیده از دسته‌هایی که آیین شما را کامل می‌کنند.",
    discover: "مشاهده",
    serviceLabel: "استاندارد السقار",
    serviceTitle: "جزئیات، آیین را می‌سازند.",
    serviceText: "تجربه‌ای متمرکز در فروشگاه، همراه با راهنمایی مفید در زمان نیاز.",
    premium: "کیفیت ممتاز",
    brands: "بهترین برندها",
    expert: "خدمات تخصصی",
    fast: "پاسخ سریع",
    premiumText: "انتخابی سنجیده برای ضروریات روزمره شما.",
    brandsText: "مجموعه‌ای متمرکز که با دقت ارائه می‌شود.",
    expertText: "راهنمایی مفید برای انتخابی مطمئن‌تر.",
    fastText: "از طریق واتساپ سریع با تیم ما ارتباط بگیرید.",
    visitLabel: "از السقار دیدن کنید",
    visitTitle: "مقصدی در دبی برای انتخابی سنجیده.",
    visitText: "با آرامش از مجموعه دیدن کنید یا پیش از مراجعه با ما تماس بگیرید.",
    directions: "دریافت مسیر",
    mapLabel: "ما را در نقشه Google پیدا کنید",
    footerTagline: "محصولات ممتاز دخانی برای بزرگسالان در دبی.",
    navigation: "ناوبری",
    reachUs: "ارتباط با ما",
    languages: "زبان‌ها",
    ageEyebrow: "فقط بزرگسالان · دبی، امارات",
    ageTitle: "تجربه‌ای سنجیده، برای بزرگسالان.",
    ageText: "برای ورود به این وب‌سایت باید ۱۸ سال یا بیشتر داشته باشید.",
    accept: "من ۱۸+ هستم",
    exit: "خروج",
    ageNote: "با ورود، تأیید می‌کنید که شرط سن قانونی را دارید.",
    rights: "© ۲۰۲۶ فروشگاه دخانیات السقار. تمامی حقوق محفوظ است.",
  },
} as const;

const categories = [
  { key: "hookahs", art: "hookah", className: "category-card--feature" },
  { key: "tobacco", art: "tobacco", className: "category-card--tone" },
  { key: "smokingDevices", art: "devices", className: "category-card--line" },
  { key: "accessories", art: "accessories", className: "category-card--image" },
  { key: "electronicDevices", art: "electronic", className: "category-card--image" },
  { key: "charcoalMore", art: "charcoal", className: "category-card--charcoal" },
] as const;

const categoryNames: Record<Language, Record<(typeof categories)[number]["key"], string>> = {
  en: { hookahs: "Hookahs", tobacco: "Tobacco", smokingDevices: "Smoking Devices", accessories: "Accessories", electronicDevices: "Electronic Devices", charcoalMore: "Charcoal & More" },
  ar: { hookahs: "الشيشة", tobacco: "التبغ", smokingDevices: "أجهزة التدخين", accessories: "الملحقات", electronicDevices: "الأجهزة الإلكترونية", charcoalMore: "الفحم والمزيد" },
  fa: { hookahs: "قلیان", tobacco: "تنباکو", smokingDevices: "دستگاه‌های دخانی", accessories: "لوازم جانبی", electronicDevices: "دستگاه‌های الکترونیکی", charcoalMore: "زغال و بیشتر" },
};

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand-mark ${inverse ? "brand-mark--inverse" : ""}`} aria-hidden="true">
      <img src={inverse ? "/assets/logo-light.svg" : "/assets/logo.svg"} alt="" />
      <span className="brand-mark__fallback">⌒</span>
    </span>
  );
}

function CategoryArt({ type }: { type: (typeof categories)[number]["art"] }) {
  return (
    <div className={`category-object category-object--${type}`} aria-hidden="true">
      <span className="category-object__arc" />
      <span className="category-object__plinth category-object__plinth--rear" />
      <span className="category-object__plinth category-object__plinth--front" />
      <span className="category-object__primary" />
      <span className="category-object__secondary" />
      <span className="category-object__detail" />
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = copy[language];
  const isRtl = language !== "en";
  const languageOptions = useMemo(() => [
    { value: "en" as const, label: "English", code: "EN" },
    { value: "ar" as const, label: "العربية", code: "AR" },
    { value: "fa" as const, label: "فارسی", code: "FA" },
  ], []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [language, isRtl]);

  const selectLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setLanguageOpen(false);
  };

  const closeMenuAndScroll = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openCategory = (category: string) => `/shop?category=${category}`;

  return (
    <div className={`site-shell ${isRtl ? "rtl" : "ltr"}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="utility-bar">
        <div className="page-frame utility-bar__inner">
          <p><Clock3 size={13} strokeWidth={1.7} /> {t.hours}</p>
          <p className="utility-bar__open"><span /> {t.openDaily}</p>
          <a href={PHONE_URL}><Phone size={13} strokeWidth={1.7} /> 052 617 9396</a>
        </div>
      </div>

      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <div className="page-frame site-header__inner">
          <button className="brand-lockup" onClick={() => closeMenuAndScroll("home")} aria-label="AL SAQAR SMOKING SHOP home">
            <BrandMark />
            <span className="brand-lockup__wordmark"><strong>AL SAQAR</strong><small>SMOKING SHOP</small></span>
          </button>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <button onClick={() => closeMenuAndScroll("home")}>{t.home}</button>
            <button onClick={() => closeMenuAndScroll("categories")}>{t.categories}</button>
            <button onClick={() => closeMenuAndScroll("about")}>{t.about}</button>
            <button onClick={() => closeMenuAndScroll("contact")}>{t.contact}</button>
          </nav>

          <div className="header-actions">
            <div className="language-switcher">
              <button className="language-trigger" onClick={() => setLanguageOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={languageOpen}>
                <span>{t.language}</span><ChevronDown size={14} strokeWidth={1.8} />
              </button>
              {languageOpen && (
                <div className="language-menu" role="listbox" aria-label="Choose language">
                  {languageOptions.map((option) => (
                    <button key={option.value} onClick={() => selectLanguage(option.value)} role="option" aria-selected={language === option.value}>
                      <span>{option.label}</span><small>{option.code}</small>{language === option.value && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a className="whatsapp-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={16} /> <span>{t.whatsapp}</span></a>
            <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu" aria-label="Mobile navigation">
            <button onClick={() => closeMenuAndScroll("home")}>{t.home}<ArrowUpRight size={18} /></button>
            <button onClick={() => closeMenuAndScroll("categories")}>{t.categories}<ArrowUpRight size={18} /></button>
            <button onClick={() => closeMenuAndScroll("about")}>{t.about}<ArrowUpRight size={18} /></button>
            <button onClick={() => closeMenuAndScroll("contact")}>{t.contact}<ArrowUpRight size={18} /></button>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={18} /> {t.whatsapp}</a>
          </div>
        )}
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero__scene" aria-hidden="true">
            <span className="hero__scene__smoke hero__scene__smoke--one" />
            <span className="hero__scene__smoke hero__scene__smoke--two" />
            <span className="hero__scene__hookah" />
            <span className="hero__scene__vape" />
          </div>
          <div className="page-frame hero__content">
            <div className="hero__copy">
              <p className="eyebrow"><span className="eyebrow__arc" /> {t.heroEyebrow}</p>
              <h1>{t.heroTitle}</h1>
              <p className="hero__summary">{t.heroText}</p>
              <div className="hero__actions">
                <a className="button button--dark" href="/shop">{t.explore}<ArrowRight size={17} /></a>
                <button className="text-action" onClick={() => closeMenuAndScroll("contact")}>{t.visit}<span className="text-action__line" /></button>
              </div>
            </div>
            <p className="hero__scroll"><span /> {t.scrollCue}</p>
          </div>
        </section>

        <section className="quick-info" aria-label="Shop details">
          <div className="page-frame quick-info__grid">
            <p className="quick-info__intro">{t.quickTitle}</p>
            <a href="#contact" onClick={(event) => { event.preventDefault(); closeMenuAndScroll("contact"); }} className="quick-info__item"><Clock3 /><span><small>{t.openDaily}</small><strong>{t.quickOpen}</strong></span><ArrowUpRight /></a>
            <a href={PHONE_URL} className="quick-info__item"><Phone /><span><small>{t.callUs}</small><strong>{t.quickCall}</strong></span><ArrowUpRight /></a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="quick-info__item"><MessageCircle /><span><small>{t.whatsapp}</small><strong>{t.quickWhatsapp}</strong></span><ArrowUpRight /></a>
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="quick-info__item"><MapPin /><span><small>{t.location}</small><strong>{t.quickLocation}</strong></span><ArrowUpRight /></a>
          </div>
        </section>

        <section className="collection" id="categories">
          <div className="page-frame">
            <div className="section-heading section-heading--collection">
              <div><p className="eyebrow"><span className="eyebrow__arc" /> 01 / {t.collectionLabel}</p><h2>{t.collectionTitle}</h2></div>
              <p>{t.collectionText}</p>
            </div>
            <div className="collection-grid">
              {categories.map((category, index) => {
                const name = categoryNames[language][category.key];
                return (
                  <a key={category.key} href={openCategory(category.key)} className={`category-card ${category.className}`}>
                    <CategoryArt type={category.art} />
                    <span className="category-card__number">0{index + 1}</span>
                    <div className="category-card__footer"><h3>{name}</h3><span className="category-card__action">{t.discover}<ArrowUpRight size={16} /></span></div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="service-section" id="about">
          <div className="page-frame service-section__layout">
            <div className="service-section__title"><p className="eyebrow"><span className="eyebrow__arc" /> 02 / {t.serviceLabel}</p><h2>{t.serviceTitle}</h2><p>{t.serviceText}</p></div>
            <div className="service-list">
              {[
                { title: t.premium, text: t.premiumText, icon: ShieldCheck },
                { title: t.brands, text: t.brandsText, icon: Gem },
                { title: t.expert, text: t.expertText, icon: Sparkles },
                { title: t.fast, text: t.fastText, icon: MessageCircle },
              ].map((service, index) => {
                const Icon = service.icon;
                return <article className="service-item" key={service.title}><span className="service-item__number">0{index + 1}</span><Icon /><div><h3>{service.title}</h3><p>{service.text}</p></div></article>;
              })}
            </div>
          </div>
        </section>

        <section className="visit-section" id="contact">
          <div className="page-frame visit-section__frame">
            <div className="visit-section__content"><p className="eyebrow eyebrow--light"><span className="eyebrow__arc" /> 03 / {t.visitLabel}</p><h2>{t.visitTitle}</h2><p>{t.visitText}</p><div className="visit-section__actions"><a href={MAPS_URL} target="_blank" rel="noreferrer" className="button button--light">{t.directions}<ArrowUpRight size={17} /></a><a href={MAPS_URL} target="_blank" rel="noreferrer" className="map-link"><MapPin size={16} /> {t.mapLabel}</a></div></div>
            <div className="visit-section__card"><BrandMark inverse /><p>AL SAQAR<br />SMOKING SHOP</p><span className="visit-section__card-rule" /><strong>Dubai, UAE</strong><small>{t.hours}</small></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-frame site-footer__grid">
          <div className="site-footer__brand"><div className="footer-lockup"><BrandMark inverse /><span><strong>AL SAQAR</strong><small>SMOKING SHOP</small></span></div><p>{t.footerTagline}</p><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@alsaqar_smoking <ArrowUpRight size={14} /></a></div>
          <div><h3>{t.navigation}</h3><button onClick={() => closeMenuAndScroll("home")}>{t.home}</button><button onClick={() => closeMenuAndScroll("categories")}>{t.categories}</button><button onClick={() => closeMenuAndScroll("about")}>{t.about}</button><button onClick={() => closeMenuAndScroll("contact")}>{t.contact}</button></div>
          <div><h3>{t.reachUs}</h3><a href={PHONE_URL}>052 617 9396</a><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">{t.whatsapp}</a><a href={MAPS_URL} target="_blank" rel="noreferrer">Dubai, UAE</a><p>{t.hours}</p></div>
          <div><h3>{t.languages}</h3>{languageOptions.map((option) => <button key={option.value} className={language === option.value ? "language-footer-active" : ""} onClick={() => selectLanguage(option.value)}>{option.label}<small>{option.code}</small></button>)}</div>
        </div>
        <div className="page-frame site-footer__bottom"><span>{t.rights}</span><span className="site-footer__bottom-mark">18+ · ADULTS ONLY</span></div>
      </footer>

      <div className="mobile-float-actions" aria-label="Quick actions"><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={17} /> {t.whatsapp}</a><a href={MAPS_URL} target="_blank" rel="noreferrer"><MapPin size={17} /> {t.directions}</a></div>
    </div>
  );
}
