/* ============================================================
   הגדרות דף הנחיתה – שיא הנחלה, נתיבות
   כל מה שצריך לשנות לפני העלאה לאוויר נמצא כאן.
   ============================================================ */
window.LP_CONFIG = {
  /* --- פרטי קשר --- */
  phone: "08-6236812",            // מוצג בדף ומשמש ל-tel:
  whatsapp: "972501234567",       // מספר בינלאומי ללא + (החלף למספר הוואטסאפ של המכירות)
  whatsappText: "היי, אשמח לקבל פרטים על פרויקט שיא הנחלה בנתיבות",
  email: "office@crp.co.il",

  /* --- לאן נשלח הליד ---
     אפשרות 1 (מומלץ): Webhook – Make / Zapier / Google Apps Script / CRM.
       הטופס שולח POST עם JSON: { name, phone, email, rooms, source, utm_*, page, time }
     אפשרות 2: Formspree / Basin / Netlify Forms – שים את כתובת ה-endpoint.
     ריק = מצב הדגמה: הליד נרשם ב-console והדף מציג הצלחה.                          */
  leadWebhook: "",

  /* --- מעקב (השאר ריק אם אין) --- */
  facebookPixelId: "",   // למשל "123456789012345"
  gtmId: "",             // למשל "GTM-XXXXXXX"
  googleAdsConversion: "", // למשל "AW-123456789/AbCdEfGhIj"

  /* --- תמונות ---
     ברירת מחדל: טעינה ישירה מאתר היזם. להעתקה מקומית הרץ scripts/localize-assets.sh */
  assetBase: "https://crp.co.il/wp-content/uploads/2026/02/"
};
