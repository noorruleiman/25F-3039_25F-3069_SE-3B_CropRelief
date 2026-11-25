/* I18N.js - FR16: Bilingual English and Urdu (RTL) localization support. */
const UR_DICTIONARY = {
  'Login': 'لاگ ان',
  'Logout': 'لاگ آؤٹ',
  'Register': 'رجسٹر کریں',
  'Mobile number': 'موبائل نمبر',
  'Password': 'پاس ورڈ',
  'OTP (demo: 1234)': 'او ٹی پی (ڈیمو: 1234)',
  'Full name': 'پورا نام',
  'Khasra number': 'خسرہ نمبر',
  'Acreage': 'رقبہ (ایکڑ)',
  'Flood zone': 'سیلابی زون',
  'District': 'ضلع',
  'New farmer? Register here': 'نئے کسان؟ یہاں رجسٹر کریں',
  'Back to login': 'لاگ ان پر واپس',
  'Flood crop damage reporting': 'سیلاب سے فصل کے نقصان کی رپورٹنگ',
  'Report crop damage': 'فصل کے نقصان کی رپورٹ',
  'Add land plot': 'نئی زمین شامل کریں',
  'Register plot': 'زمین رجسٹر کریں',
  'Submit report': 'رپورٹ جمع کریں',
  'Sync drafts now': 'ڈرافٹس ابھی بھیجیں',
  'My reports': 'میری رپورٹس',
  'SMS inbox': 'ایس ایم ایس',
  'Land plot': 'زمین',
  'Flood event': 'سیلابی واقعہ',
  'Crop type': 'فصل کی قسم',
  'Damaged acres': 'متاثرہ ایکڑ',
  'Damage %': 'نقصان %',
  'Date': 'تاریخ',
  'Photos (max 3)': 'تصاویر (زیادہ سے زیادہ 3)',
  'Status': 'صورتحال',
  'Action': 'کارروائی',
  'Notes': 'نوٹس',
  'Appeal': 'اپیل',
  'Submitted': 'جمع شدہ',
  'Assigned': 'تفویض',
  'Surveyed': 'سروے شدہ',
  'Verified': 'تصدیق شدہ',
  'Approved': 'منظور',
  'Rejected': 'مسترد',
  'Under appeal': 'اپیل میں',
  'Assigned reports': 'تفویض شدہ رپورٹس',
  'Submit findings': 'نتائج جمع کریں',
  'Assign': 'تفویض کریں',
  'Verify': 'تصدیق',
  'Desk verify': 'ڈیسک تصدیق',
  'Reject': 'مسترد کریں',
  'Re-survey': 'دوبارہ سروے',
  'Approve compensation': 'معاوضہ منظور کریں',
  'Decline': 'انکار',
  'Total reports': 'کل رپورٹس',
  'In progress': 'زیر عمل',
  'Compensation': 'معاوضہ',
  'To survey': 'سروے باقی',
  'Done': 'مکمل',
  'Pending': 'زیر التواء',
  'To decide': 'فیصلہ باقی',
  'Verified claims': 'تصدیق شدہ دعوے',
  'District damage report': 'ضلعی نقصان رپورٹ',
  'Users': 'صارفین',
  'Add user': 'صارف شامل کریں',
  'Flood zones': 'سیلابی زونز',
  'Declare flood event': 'سیلابی واقعہ درج کریں',
  'Audit log': 'آڈٹ لاگ',
  'Reports': 'رپورٹس',
  'Active events': 'فعال واقعات',
  'Offline drafts waiting to sync': 'آف لائن ڈرافٹس',
  'Deactivate': 'غیر فعال',
  'Activate': 'فعال',
  'Save role': 'کردار محفوظ کریں'
};

class I18N {
  static lang() {
    return Storage.get('lang', 'en');
  }

  static toggle() {
    Storage.set('lang', this.lang() === 'en' ? 'ur' : 'en');
  }

  static t(key) {
    return (this.lang() === 'ur' && UR_DICTIONARY[key]) || key;
  }

  static apply() {
    document.documentElement.lang = this.lang();
    document.documentElement.dir = this.lang() === 'ur' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-act=lang]').forEach((el) => {
      el.textContent = this.lang() === 'en' ? 'اردو' : 'English';
    });
  }
}

const t = (key) => I18N.t(key);
