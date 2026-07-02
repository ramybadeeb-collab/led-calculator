import { useState, useMemo, useEffect } from 'react';
// @ts-ignore
import rabatLogo from './assets/images/rabat_lights_logo_exact_1782851943248.jpg';
import { 
  Tv, 
  Cpu, 
  Zap, 
  Layers, 
  Sliders, 
  Coins, 
  Share2, 
  BookOpen, 
  RefreshCw, 
  Check, 
  Maximize2, 
  ChevronDown, 
  Info, 
  HelpCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  Flame,
  Activity,
  Award,
  Printer,
  Settings,
  Save,
  Plus,
  Trash2,
  Search,
  X,
  History,
  Eye
} from 'lucide-react';

// Predefined standard LED modules
interface LEDModule {
  id: string;
  name: string;
  pitch: number; // pixel pitch in mm
  widthMm: number; // physical width in mm
  heightMm: number; // physical height in mm
  pixelWidth: number; // resolution width in px
  pixelHeight: number; // resolution height in px
  maxPowerW: number; // max power in Watts
  isOutdoor: boolean;
}

const PREDEFINED_MODULES: LEDModule[] = [
  { id: 'p10-out', name: 'P10 خارجي (Outdoor)', pitch: 10, widthMm: 320, heightMm: 160, pixelWidth: 32, pixelHeight: 16, maxPowerW: 25, isOutdoor: true },
  { id: 'p8-out', name: 'P8 خارجي (Outdoor)', pitch: 8, widthMm: 320, heightMm: 160, pixelWidth: 40, pixelHeight: 20, maxPowerW: 28, isOutdoor: true },
  { id: 'p6-out', name: 'P6 خارجي/داخلي', pitch: 6, widthMm: 192, heightMm: 192, pixelWidth: 32, pixelHeight: 32, maxPowerW: 20, isOutdoor: true },
  { id: 'p5-inout', name: 'P5 داخلي/خارجي', pitch: 5, widthMm: 320, heightMm: 160, pixelWidth: 64, pixelHeight: 32, maxPowerW: 30, isOutdoor: false },
  { id: 'p4-in', name: 'P4 داخلي (Indoor)', pitch: 4, widthMm: 320, heightMm: 160, pixelWidth: 80, pixelHeight: 40, maxPowerW: 30, isOutdoor: false },
  { id: 'p3-in', name: 'P3 داخلي (Indoor)', pitch: 3, widthMm: 192, heightMm: 192, pixelWidth: 64, pixelHeight: 64, maxPowerW: 18, isOutdoor: false },
  { id: 'p2.5-in', name: 'P2.5 داخلي (Indoor)', pitch: 2.5, widthMm: 320, heightMm: 160, pixelWidth: 128, pixelHeight: 64, maxPowerW: 32, isOutdoor: false },
  { id: 'p2-in', name: 'P2 داخلي (Indoor)', pitch: 2, widthMm: 256, heightMm: 128, pixelWidth: 128, pixelHeight: 64, maxPowerW: 24, isOutdoor: false },
];

interface PowerSupply {
  id: string;
  name: string;
  voltage: number;
  amperes: number;
  watts: number;
}

const POWER_SUPPLIES: PowerSupply[] = [
  { id: '5v40a', name: 'محول 5V 40A (200W)', voltage: 5, amperes: 40, watts: 200 },
  { id: '5v60a', name: 'محول 5V 60A (300W)', voltage: 5, amperes: 60, watts: 300 },
  { id: '5v80a', name: 'محول 5V 80A (400W)', voltage: 5, amperes: 80, watts: 400 },
  { id: 'custom', name: 'محول مخصص...', voltage: 5, amperes: 40, watts: 200 },
];

interface ReceivingCard {
  id: string;
  name: string;
  maxW: number;
  maxH: number;
  maxPixels: number;
}

const RECEIVING_CARDS: ReceivingCard[] = [
  { id: 'std', name: 'كرت Huidu قياسي (256 × 256 بكسل) - HD-R508T', maxW: 256, maxH: 256, maxPixels: 65536 },
  { id: 'high', name: 'كرت Huidu عالي السعة (256 × 512 بكسل) - HD-R512T', maxW: 256, maxH: 512, maxPixels: 131072 },
  { id: 'custom', name: 'كرت بمواصفات مخصصة...', maxW: 256, maxH: 256, maxPixels: 65536 },
];

export default function App() {
  // Client and Project Identification
  const [clientName, setClientName] = useState<string>(() => {
    try {
      return localStorage.getItem('led_client_name') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('led_client_name', clientName);
    } catch (e) {
      console.error('Error writing client name to localStorage:', e);
    }
  }, [clientName]);

  // Client Request structure for history/registry
  interface ClientRequest {
    id: string;
    clientName: string;
    date: string;
    reqWidth: number;
    reqHeight: number;
    dimensionUnit: 'm' | 'cm';
    isDoubleSided: boolean;
    moduleName: string;
    actualWidthM: number;
    actualHeightM: number;
    totalModules: number;
    powerSuppliesCount: number;
    totalReceivingCards: number;
    totalCost: number;
    currency: string;
  }

  const [clientRequests, setClientRequests] = useState<ClientRequest[]>(() => {
    try {
      const saved = localStorage.getItem('led_client_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved client requests:', e);
    }
    return [];
  });

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [searchRequestQuery, setSearchRequestQuery] = useState<string>('');
  const [isPrintingHistory, setIsPrintingHistory] = useState<boolean>(false);
  const [isPrintingSuppliers, setIsPrintingSuppliers] = useState<boolean>(false);
  const [isPrintingQuotation, setIsPrintingQuotation] = useState<boolean>(false);
  const [showQuotationModal, setShowQuotationModal] = useState<boolean>(false);

  // Quotation specific fields
  const [quotationId, setQuotationId] = useState<string>('');
  const [quotationDate, setQuotationDate] = useState<string>('');
  const [quotationDiscount, setQuotationDiscount] = useState<number>(0);
  const [quotationDiscountType, setQuotationDiscountType] = useState<'percent' | 'flat'>('flat');
  const [quotationTaxPercent, setQuotationTaxPercent] = useState<number>(0); // 0% by default
  const [quotationTerms, setQuotationTerms] = useState<string>(
    "1. الضمان: سنة كاملة وشاملة لكافة قطع الغيار والأعطال المصنعية من تاريخ التركيب.\n" +
    "2. مدة التوريد والتركيب: خلال 7 إلى 10 أيام عمل من تاريخ دفع الدفعة المقدمة.\n" +
    "3. شروط السداد والتشغيل: 60% دفعة مقدمة عند التعاقد وتوقيع العرض، 30% عند وصول المواد والقطع للموقع وقبل البدء بالتركيب، 10% عند التشغيل والتسليم الفعلي لشاشات LED.\n" +
    "4. يلتزم العميل بتوفير مصدر طاقة كهربائية مستقر بقرب موقع الشاشة ونقاط التعليق أو الهياكل الخرسانية المناسبة للتثبيت الهيكلي الجداري."
  );
  const [quotationNotes, setQuotationNotes] = useState<string>('هذا العرض سارٍ ومثبت لمدة 15 يوماً فقط من تاريخ إصداره.');
  const [quotationItems, setQuotationItems] = useState<any[]>([]);

  const handleOpenQuotationCreator = () => {
    // Set default Quotation fields
    setQuotationId('QT-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000));
    setQuotationDate(new Date().toISOString().split('T')[0]);
    setQuotationDiscount(0);
    setQuotationDiscountType('flat');
    
    // Create default items based on current calculation
    const items = [
      {
        id: 'item_1',
        name: `مديول شاشة LED طراز (${activeModule.name})`,
        qty: calculations.totalModules,
        unit: 'حبة',
        price: computedPricing.modulePrice,
      },
      {
        id: 'item_2',
        name: `محول طاقة تيار مستمر 5V (${activePs.name.split(' (')[0]})`,
        qty: calculations.powerSuppliesCount,
        unit: 'حبة',
        price: computedPricing.psPrice,
      },
      {
        id: 'item_3',
        name: `كارت استقبال بيانات شبكة (${activeCard.name.split(' قياسي')[0].split(' عالي')[0]})`,
        qty: calculations.totalReceivingCards,
        unit: 'حبة',
        price: computedPricing.cardPrice,
      },
      {
        id: 'item_4',
        name: `معالج ومحكم إرسال متكامل طراز (${calculations.recommendedController.split(' (')[0]})`,
        qty: 1,
        unit: 'جهاز',
        price: computedPricing.controllerPrice,
      },
      {
        id: 'item_5',
        name: `تجهيز وهيكل الكابينة والحديد الحامل للشاشة (${isDoubleSided ? 'وجهين' : 'وجه واحد'})`,
        qty: +calculations.totalAreaM2.toFixed(2),
        unit: 'متر مربع',
        price: computedPricing.cabinetPrice,
      },
      {
        id: 'item_6',
        name: `أجور التركيب، التشغيل، البرمجة والتوصيل الفني الفعلي`,
        qty: +calculations.totalAreaM2.toFixed(2),
        unit: 'متر مربع',
        price: computedPricing.laborPrice,
      },
    ];
    setQuotationItems(items);
    setShowQuotationModal(true);
  };

  const handleUpdateQuotationItem = (itemId: string, field: string, value: any) => {
    setQuotationItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddCustomQuotationItem = () => {
    const newItem = {
      id: 'custom_item_' + Date.now(),
      name: 'بند مخصص جديد (مثال: كوابل تمديد طاقة أو قواطع كهربائية...)',
      qty: 1,
      unit: 'حبة',
      price: 0,
    };
    setQuotationItems(prev => [...prev, newItem]);
  };

  const handleDeleteQuotationItem = (itemId: string) => {
    setQuotationItems(prev => prev.filter(item => item.id !== itemId));
  };

  const quotationTotals = useMemo(() => {
    const subtotal = quotationItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    
    let discountVal = 0;
    if (quotationDiscountType === 'percent') {
      discountVal = subtotal * (quotationDiscount / 100);
    } else {
      discountVal = quotationDiscount;
    }
    
    const afterDiscount = Math.max(0, subtotal - discountVal);
    const taxVal = afterDiscount * (quotationTaxPercent / 100);
    const netTotal = afterDiscount + taxVal;
    
    return {
      subtotal,
      discountVal,
      taxVal,
      netTotal
    };
  }, [quotationItems, quotationDiscount, quotationDiscountType, quotationTaxPercent]);

  const handlePrintQuotation = () => {
    setIsPrintingQuotation(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrintingQuotation(false);
      }, 1000);
    }, 150);
  };

  const handlePrintSuppliers = () => {
    setIsPrintingSuppliers(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrintingSuppliers(false);
      }, 1000);
    }, 150);
  };

  const handlePrintHistory = () => {
    setIsPrintingHistory(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrintingHistory(false);
      }, 1000);
    }, 150);
  };

  const handlePrintSingleRequest = (req: ClientRequest) => {
    // Load data into active state so the technical report matches
    setClientName(req.clientName);
    setDimensionUnit(req.dimensionUnit);
    setReqWidth(req.reqWidth);
    setReqHeight(req.reqHeight);
    setIsDoubleSided(req.isDoubleSided);
    
    const matched = PREDEFINED_MODULES.find(m => m.name === req.moduleName);
    if (matched) {
      setSelectedModuleId(matched.id);
    } else {
      setSelectedModuleId('custom');
    }
    
    if (req.currency) {
      setCurrency(req.currency);
    }

    setIsPrintingHistory(false);
    
    // Alert the user and print
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const filteredRequests = useMemo(() => {
    if (!searchRequestQuery.trim()) return clientRequests;
    const query = searchRequestQuery.trim().toLowerCase();
    return clientRequests.filter(req => 
      req.clientName.toLowerCase().includes(query) ||
      req.moduleName.toLowerCase().includes(query)
    );
  }, [clientRequests, searchRequestQuery]);

  const handleSaveClientRequest = () => {
    if (!clientName.trim()) {
      alert('الرجاء إدخال اسم العميل أولاً في خانة اسم العميل لحفظ الطلب!');
      return;
    }

    const newRequest: ClientRequest = {
      id: 'req_' + Date.now(),
      clientName: clientName.trim(),
      date: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      reqWidth,
      reqHeight,
      dimensionUnit,
      isDoubleSided,
      moduleName: activeModule.name,
      actualWidthM: calculations.actualWidthM,
      actualHeightM: calculations.actualHeightM,
      totalModules: calculations.totalModules,
      powerSuppliesCount: calculations.powerSuppliesCount,
      totalReceivingCards: calculations.totalReceivingCards,
      totalCost: calculations.totalCost,
      currency,
    };

    setClientRequests(prev => {
      const updated = [newRequest, ...prev];
      try {
        localStorage.setItem('led_client_requests', JSON.stringify(updated));
      } catch (e) {
        console.error('Error writing client requests to localStorage:', e);
      }
      return updated;
    });

    alert(`تم حفظ التقرير وعرض السعر بنجاح للعميل: ${clientName.trim()}`);
  };

  const handleLoadClientRequest = (req: ClientRequest) => {
    setClientName(req.clientName);
    setDimensionUnit(req.dimensionUnit);
    setReqWidth(req.reqWidth);
    setReqHeight(req.reqHeight);
    setIsDoubleSided(req.isDoubleSided);
    
    // Find matching module by name
    const matched = PREDEFINED_MODULES.find(m => m.name === req.moduleName);
    if (matched) {
      setSelectedModuleId(matched.id);
    } else {
      setSelectedModuleId('custom');
    }
    
    if (req.currency) {
      setCurrency(req.currency);
    }
    
    alert(`تم استدعاء وتحميل بيانات طلب العميل: ${req.clientName}`);
  };

  const handleDeleteClientRequest = (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف طلب العميل: ${name} من السجل؟`)) {
      return;
    }
    setClientRequests(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('led_client_requests', JSON.stringify(updated));
      } catch (e) {
        console.error('Error writing client requests to localStorage:', e);
      }
      return updated;
    });
  };

  // Input dimensions (Meters)
  const [reqWidth, setReqWidth] = useState<number>(3.0);
  const [reqHeight, setReqHeight] = useState<number>(2.0);
  const [dimensionUnit, setDimensionUnit] = useState<'m' | 'cm'>('m');
  const [isDoubleSided, setIsDoubleSided] = useState<boolean>(false);

  // Selected Options
  const [selectedModuleId, setSelectedModuleId] = useState<string>('p10-out');
  const [fittingStrategy, setFittingStrategy] = useState<'up' | 'down' | 'nearest'>('up');
  const [selectedPsId, setSelectedPsId] = useState<string>('5v40a');
  const [selectedCardId, setSelectedCardId] = useState<string>('std');
  
  // Custom configuration states (used when "custom" is selected)
  const [customModule, setCustomModule] = useState<Omit<LEDModule, 'id'>>({
    name: 'مديول مخصص',
    pitch: 5,
    widthMm: 320,
    heightMm: 160,
    pixelWidth: 64,
    pixelHeight: 32,
    maxPowerW: 30,
    isOutdoor: false
  });

  const [customPs, setCustomPs] = useState<Omit<PowerSupply, 'id'>>({
    name: 'محول مخصص',
    voltage: 5,
    amperes: 40,
    watts: 200
  });

  const [customCard, setCustomCard] = useState<Omit<ReceivingCard, 'id'>>({
    name: 'كرت مخصص',
    maxW: 256,
    maxH: 256,
    maxPixels: 65536
  });

  // Safety values
  const [psSafetyMargin, setPsSafetyMargin] = useState<number>(80); // percentage (e.g., 80% safe load)
  const [psBlockWidth, setPsBlockWidth] = useState<number>(2);
  const [psBlockHeight, setPsBlockHeight] = useState<number>(3);
  const [brightnessPercent, setBrightnessPercent] = useState<number>(20); // default to 20%

  // Supplier Interface
  interface Supplier {
    id: string;
    name: string;
    country: string;
    city: string;
    lastUpdate: string;
    itemPrices: Record<string, number>;
    controllerPrice: number;
    cabinetPrice: number;
    laborPrice: number;
  }

  // Suppliers & Pricing Meta Info (Multiple suppliers with state preservation)
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('led_suppliers_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved suppliers:', e);
    }
    return [
      {
        id: 'rabat',
        name: 'أضواء الرباط للتوريد المباشر',
        country: 'اليمن - صنعاء',
        city: 'موقع التخزين والتركيب',
        lastUpdate: new Date().toISOString().split('T')[0],
        itemPrices: {
          'p10-out': 35,
          'p8-out': 45,
          'p6-out': 55,
          'p5-inout': 48,
          'p4-in': 60,
          'p3-in': 75,
          'p2.5-in': 90,
          'p2-in': 120,
          'custom-module': 45,
          '5v40a': 25,
          '5v60a': 35,
          '5v80a': 45,
          'custom-ps': 65,
          'std': 18,
          'high': 32,
          'custom-card': 120,
        },
        controllerPrice: 450,
        cabinetPrice: 150,
        laborPrice: 300,
      }
    ];
  });

  const [activeSupplierId, setActiveSupplierId] = useState<string>(() => {
    try {
      return localStorage.getItem('led_active_supplier_id') || 'rabat';
    } catch (e) {
      console.error('Error reading active supplier id:', e);
      return 'rabat';
    }
  });

  const [supplierName, setSupplierName] = useState<string>('أضواء الرباط للتوريد المباشر');
  const [supplierCountry, setSupplierCountry] = useState<string>('اليمن - صنعاء');
  const [supplierCity, setSupplierCity] = useState<string>('موقع التخزين والتركيب');
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Pricing inputs
  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem('led_currency') || 'ر.س';
    } catch (e) {
      return 'ر.س';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('led_currency', currency);
    } catch (e) {
      console.error('Error saving currency:', e);
    }
  }, [currency]);

  const [pricingMode, setPricingMode] = useState<'single' | 'mixed'>(() => {
    try {
      return (localStorage.getItem('led_pricing_mode') as 'single' | 'mixed') || 'single';
    } catch (e) {
      return 'single';
    }
  });

  const [moduleSupplierId, setModuleSupplierId] = useState<string>(() => {
    try { return localStorage.getItem('led_module_supplier_id') || 'rabat'; } catch (e) { return 'rabat'; }
  });
  const [psSupplierId, setPsSupplierId] = useState<string>(() => {
    try { return localStorage.getItem('led_ps_supplier_id') || 'rabat'; } catch (e) { return 'rabat'; }
  });
  const [cardSupplierId, setCardSupplierId] = useState<string>(() => {
    try { return localStorage.getItem('led_card_supplier_id') || 'rabat'; } catch (e) { return 'rabat'; }
  });
  const [controllerSupplierId, setControllerSupplierId] = useState<string>(() => {
    try { return localStorage.getItem('led_controller_supplier_id') || 'rabat'; } catch (e) { return 'rabat'; }
  });
  const [cabinetSupplierId, setCabinetSupplierId] = useState<string>(() => {
    try { return localStorage.getItem('led_cabinet_supplier_id') || 'rabat'; } catch (e) { return 'rabat'; }
  });
  const [laborSupplierId, setLaborSupplierId] = useState<string>(() => {
    try { return localStorage.getItem('led_labor_supplier_id') || 'rabat'; } catch (e) { return 'rabat'; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('led_pricing_mode', pricingMode);
      localStorage.setItem('led_module_supplier_id', moduleSupplierId);
      localStorage.setItem('led_ps_supplier_id', psSupplierId);
      localStorage.setItem('led_card_supplier_id', cardSupplierId);
      localStorage.setItem('led_controller_supplier_id', controllerSupplierId);
      localStorage.setItem('led_cabinet_supplier_id', cabinetSupplierId);
      localStorage.setItem('led_labor_supplier_id', laborSupplierId);
    } catch (e) {
      console.error('Error saving pricing selections:', e);
    }
  }, [pricingMode, moduleSupplierId, psSupplierId, cardSupplierId, controllerSupplierId, cabinetSupplierId, laborSupplierId]);

  // Customizable default unit prices for each predefined item
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({
    'p10-out': 35,
    'p8-out': 45,
    'p6-out': 55,
    'p5-inout': 48,
    'p4-in': 60,
    'p3-in': 75,
    'p2.5-in': 90,
    'p2-in': 120,
    'custom-module': 45,
    '5v40a': 25,
    '5v60a': 35,
    '5v80a': 45,
    'custom-ps': 65,
    'std': 18,
    'high': 32,
    'custom-card': 120,
  });

  const [pricing, setPricing] = useState({
    modulePrice: 35, // default P10 price
    psPrice: 25,     // default 5V 40A price
    cardPrice: 18,   // default Standard card price
    controllerPrice: 450,
    cabinetPrice: 150, // price per square meter of metal cabinet frame
    laborPrice: 300,   // installation & manufacturing per square meter
  });

  // Mixed pricing computed result
  const computedPricing = useMemo(() => {
    if (pricingMode === 'single') {
      return pricing;
    }
    
    const getSupplierPrice = (supplierId: string, itemKey: string, defaultPrice: number) => {
      const s = suppliers.find(sup => sup.id === supplierId) || suppliers[0];
      if (!s) return defaultPrice;
      return s.itemPrices[itemKey] ?? defaultPrice;
    };
    
    const getSupplierDirectPrice = (supplierId: string, field: 'controllerPrice' | 'cabinetPrice' | 'laborPrice', defaultPrice: number) => {
      const s = suppliers.find(sup => sup.id === supplierId) || suppliers[0];
      if (!s) return defaultPrice;
      return s[field] ?? defaultPrice;
    };

    const modKey = selectedModuleId === 'custom' ? 'custom-module' : selectedModuleId;
    const psKey = selectedPsId === 'custom' ? 'custom-ps' : selectedPsId;
    const cardKey = selectedCardId === 'custom' ? 'custom-card' : selectedCardId;

    return {
      modulePrice: getSupplierPrice(moduleSupplierId, modKey, pricing.modulePrice),
      psPrice: getSupplierPrice(psSupplierId, psKey, pricing.psPrice),
      cardPrice: getSupplierPrice(cardSupplierId, cardKey, pricing.cardPrice),
      controllerPrice: getSupplierDirectPrice(controllerSupplierId, 'controllerPrice', pricing.controllerPrice),
      cabinetPrice: getSupplierDirectPrice(cabinetSupplierId, 'cabinetPrice', pricing.cabinetPrice),
      laborPrice: getSupplierDirectPrice(laborSupplierId, 'laborPrice', pricing.laborPrice),
    };
  }, [
    pricingMode,
    pricing,
    suppliers,
    moduleSupplierId,
    psSupplierId,
    cardSupplierId,
    controllerSupplierId,
    cabinetSupplierId,
    laborSupplierId,
    selectedModuleId,
    selectedPsId,
    selectedCardId
  ]);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync active states with active supplier
  useEffect(() => {
    const active = suppliers.find(s => s.id === activeSupplierId) || suppliers[0];
    if (active) {
      setSupplierName(active.name);
      setSupplierCountry(active.country);
      setSupplierCity(active.city);
      setLastPriceUpdate(active.lastUpdate);
      setItemPrices(active.itemPrices);
      setPricing({
        modulePrice: active.itemPrices[selectedModuleId === 'custom' ? 'custom-module' : selectedModuleId] || 35,
        psPrice: active.itemPrices[selectedPsId === 'custom' ? 'custom-ps' : selectedPsId] || 25,
        cardPrice: active.itemPrices[selectedCardId === 'custom' ? 'custom-card' : selectedCardId] || 18,
        controllerPrice: active.controllerPrice,
        cabinetPrice: active.cabinetPrice,
        laborPrice: active.laborPrice,
      });
    }
  }, [activeSupplierId, suppliers]);

  // Handle price changes and sync them with suppliers list
  const handleModulePriceChange = (val: number) => {
    setPricing(prev => ({ ...prev, modulePrice: val }));
    const priceKey = selectedModuleId === 'custom' ? 'custom-module' : selectedModuleId;
    setItemPrices(prev => {
      const updated = { ...prev, [priceKey]: val };
      setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
      return updated;
    });
  };

  const handlePsPriceChange = (val: number) => {
    setPricing(prev => ({ ...prev, psPrice: val }));
    const priceKey = selectedPsId === 'custom' ? 'custom-ps' : selectedPsId;
    setItemPrices(prev => {
      const updated = { ...prev, [priceKey]: val };
      setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
      return updated;
    });
  };

  const handleCardPriceChange = (val: number) => {
    setPricing(prev => ({ ...prev, cardPrice: val }));
    const priceKey = selectedCardId === 'custom' ? 'custom-card' : selectedCardId;
    setItemPrices(prev => {
      const updated = { ...prev, [priceKey]: val };
      setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
      return updated;
    });
  };

  // Sync other properties directly
  const syncActiveSupplierMeta = (updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === activeSupplierId ? { ...s, ...updates } : s));
  };

  const handleControllerPriceChange = (val: number) => {
    setPricing(prev => ({ ...prev, controllerPrice: val }));
    setSuppliers(prev => prev.map(s => s.id === activeSupplierId ? { ...s, controllerPrice: val } : s));
  };

  const handleCabinetPriceChange = (val: number) => {
    setPricing(prev => ({ ...prev, cabinetPrice: val }));
    setSuppliers(prev => prev.map(s => s.id === activeSupplierId ? { ...s, cabinetPrice: val } : s));
  };

  const handleLaborPriceChange = (val: number) => {
    setPricing(prev => ({ ...prev, laborPrice: val }));
    setSuppliers(prev => prev.map(s => s.id === activeSupplierId ? { ...s, laborPrice: val } : s));
  };

  const handleAddNewSupplier = () => {
    const newId = 'supplier_' + Date.now();
    const newSupplier: Supplier = {
      id: newId,
      name: `مورد جديد ${suppliers.length + 1}`,
      country: 'اليمن',
      city: 'صنعاء',
      lastUpdate: new Date().toISOString().split('T')[0],
      itemPrices: { ...itemPrices }, // Copy current prices as a starting point
      controllerPrice: pricing.controllerPrice,
      cabinetPrice: pricing.cabinetPrice,
      laborPrice: pricing.laborPrice,
    };
    setSuppliers(prev => [...prev, newSupplier]);
    setActiveSupplierId(newId);
  };

  const handleDeleteSupplier = (idToDelete: string) => {
    if (suppliers.length <= 1) {
      alert('لا يمكن حذف المورد الأخير المتبقي!');
      return;
    }
    const index = suppliers.findIndex(s => s.id === idToDelete);
    const updated = suppliers.filter(s => s.id !== idToDelete);
    setSuppliers(updated);
    
    // If we deleted the active supplier, select another one
    if (activeSupplierId === idToDelete) {
      const nextActive = updated[Math.max(0, index - 1)];
      setActiveSupplierId(nextActive.id);
    }
  };

  const saveSuppliersData = () => {
    try {
      localStorage.setItem('led_suppliers_list', JSON.stringify(suppliers));
      localStorage.setItem('led_active_supplier_id', activeSupplierId);
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Navigation tab for visualizer overlay view
  const [visualizerMode, setVisualizerMode] = useState<'modules' | 'cards' | 'power' | 'video'>('modules');
  
  // Notification banner state
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Price manager panel toggle
  const [showPriceManager, setShowPriceManager] = useState<boolean>(false);

  // Active specifications resolution based on selection
  const activeModule = useMemo(() => {
    if (selectedModuleId === 'custom') {
      return { id: 'custom', ...customModule } as LEDModule;
    }
    return PREDEFINED_MODULES.find(m => m.id === selectedModuleId) || PREDEFINED_MODULES[0];
  }, [selectedModuleId, customModule]);

  const activePs = useMemo(() => {
    if (selectedPsId === 'custom') {
      return { id: 'custom', ...customPs } as PowerSupply;
    }
    return POWER_SUPPLIES.find(p => p.id === selectedPsId) || POWER_SUPPLIES[0];
  }, [selectedPsId, customPs]);

  const activeCard = useMemo(() => {
    if (selectedCardId === 'custom') {
      return { id: 'custom', ...customCard } as ReceivingCard;
    }
    return RECEIVING_CARDS.find(c => c.id === selectedCardId) || RECEIVING_CARDS[0];
  }, [selectedCardId, customCard]);

  // Handle custom module auto-pixel calculation
  const updateCustomModuleMm = (field: 'widthMm' | 'heightMm', val: number) => {
    setCustomModule(prev => {
      const pitch = prev.pitch || 1;
      const calculatedPixels = Math.round(val / pitch);
      return {
        ...prev,
        [field]: val,
        [field === 'widthMm' ? 'pixelWidth' : 'pixelHeight']: calculatedPixels
      };
    });
  };

  const updateCustomModulePitch = (pitch: number) => {
    setCustomModule(prev => {
      const p = pitch || 1;
      return {
        ...prev,
        pitch: p,
        pixelWidth: Math.round(prev.widthMm / p),
        pixelHeight: Math.round(prev.heightMm / p)
      };
    });
  };

  // Helper to get power supply index for a module at linear index `idx` in a grid of `cols` columns
  const getPsIndexForModule = (idx: number, cols: number, rows: number) => {
    if (cols <= 0 || rows <= 0) return 1;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    
    // We group into blocks of psBlockWidth x psBlockHeight
    const blockCol = Math.floor(col / Math.max(1, psBlockWidth));
    const blockRow = Math.floor(row / Math.max(1, psBlockHeight));
    
    const blocksPerRow = Math.ceil(cols / Math.max(1, psBlockWidth));
    const blockIndex = blockRow * blocksPerRow + blockCol;
    
    return blockIndex + 1;
  };

  // Convert inputs to meters
  const requestedWidthM = dimensionUnit === 'm' ? reqWidth : reqWidth / 100;
  const requestedHeightM = dimensionUnit === 'm' ? reqHeight : reqHeight / 100;

  // Perform Calculations
  const calculations = useMemo(() => {
    const modW_m = activeModule.widthMm / 1000;
    const modH_m = activeModule.heightMm / 1000;

    // Exact division
    const exactCols = requestedWidthM / modW_m;
    const exactRows = requestedHeightM / modH_m;

    let cols = 0;
    let rows = 0;

    if (fittingStrategy === 'up') {
      cols = Math.ceil(exactCols);
      rows = Math.ceil(exactRows);
    } else if (fittingStrategy === 'down') {
      cols = Math.max(1, Math.floor(exactCols));
      rows = Math.max(1, Math.floor(exactRows));
    } else {
      cols = Math.max(1, Math.round(exactCols));
      rows = Math.max(1, Math.round(exactRows));
    }

    // Safety bounds
    cols = isNaN(cols) || cols <= 0 ? 1 : cols;
    rows = isNaN(rows) || rows <= 0 ? 1 : rows;

    const faceModules = cols * rows;
    const totalModules = faceModules * (isDoubleSided ? 2 : 1);

    // Actual Screen Dimensions
    const actualWidthM = cols * modW_m;
    const actualHeightM = cols === 0 ? 0 : rows * modH_m;
    const actualAreaM2 = actualWidthM * actualHeightM;
    const totalAreaM2 = actualAreaM2 * (isDoubleSided ? 2 : 1);

    // Screen Pixel Resolution
    const totalPixelW = cols * activeModule.pixelWidth;
    const totalPixelH = rows * activeModule.pixelHeight;
    const totalPixels = totalPixelW * totalPixelH; // We keep single-face pixel count for controller rating

    // Electricity/Power calculation
    const totalMaxPowerW = totalModules * activeModule.maxPowerW;
    // Power Supplies calculations
    const psMaxSafeW = activePs.watts * (psSafetyMargin / 100);
    const powerSuppliesCount = Math.ceil(totalMaxPowerW / psMaxSafeW);
    const modulesPerPs = Math.floor(psMaxSafeW / activeModule.maxPowerW);

    // Amperage details at 220V AC and 5V DC
    const totalAmpsDC = totalModules * (activeModule.maxPowerW / 5);
    const totalAmpsAC220 = totalMaxPowerW / 220;
    const averagePowerKW = (totalMaxPowerW * 0.4) / 1000; // Average is ~40% of max
    const brightnessPowerKW = (totalMaxPowerW * (brightnessPercent / 100)) / 1000;
    const brightnessAmpsAC220 = (totalMaxPowerW * (brightnessPercent / 100)) / 220;

    // Receiving Cards Layout Logic
    // Step 1: Calculate how many modules can a single card drive without exceeding limit
    let colsPerCard = Math.max(1, Math.floor(activeCard.maxW / activeModule.pixelWidth));
    let rowsPerCard = Math.max(1, Math.floor(activeCard.maxH / activeModule.pixelHeight));
    
    // Tighten bounds to ensure total pixels per card does not exceed maxPixels
    while (colsPerCard * activeModule.pixelWidth * rowsPerCard * activeModule.pixelHeight > activeCard.maxPixels && (colsPerCard > 1 || rowsPerCard > 1)) {
      if (colsPerCard > rowsPerCard) {
        colsPerCard--;
      } else {
        rowsPerCard--;
      }
    }

    const cardsCols = Math.ceil(cols / colsPerCard);
    const cardsRows = Math.ceil(rows / rowsPerCard);
    const totalReceivingCards = cardsCols * cardsRows * (isDoubleSided ? 2 : 1);

    // Sending Card Recommendation
    let recommendedController = 'Huidu HD-VP210 (معالج فيديو ومحكم اقتصادي)';
    let controllerReason = 'مناسب للشاشات التي تقل دقتها عن 1.3 مليون بكسل مع مداخل HDMI/DVI.';
    let controllerCapacity = 1300000;

    if (totalPixels > 3900000) {
      recommendedController = 'Huidu HD-VP1200 / HD-VP1620 معالج فيديو متطور جداً';
      controllerReason = 'يدعم دقة فائقة تتخطى 3.9 مليون بكسل ويوفر مخارج شبكة متعددة للتحكم بالشاشات العملاقة.';
      controllerCapacity = 6500000;
    } else if (totalPixels > 2300000) {
      recommendedController = 'Huidu HD-VP620 / HD-VP830 معالج فيديو احترافي';
      controllerReason = 'يدعم دقة تصل إلى 3.9 مليون بكسل ومثالي للمشاريع الكبيرة وبث الفيديو الاحترافي.';
      controllerCapacity = 3900000;
    } else if (totalPixels > 1300000) {
      recommendedController = 'Huidu HD-VP410 معالج ومحكم متكامل';
      controllerReason = 'يدعم دقة تصل إلى 2.6 مليون بكسل مع معالجة فيديو احترافية ومخارج شبكة متعددة.';
      controllerCapacity = 2300000;
    }

    // Recommended breaker (Double pole or Single pole)
    let recommendedBreaker = '10A أحادي الطور (Single Phase)';
    const safetyBreakerCurrent = totalAmpsAC220 * 1.25; // 125% code factor
    if (safetyBreakerCurrent > 32) {
      recommendedBreaker = `${Math.ceil(safetyBreakerCurrent / 3) + 5}A ثلاثي الأطوار (3-Phase)`;
    } else if (safetyBreakerCurrent > 20) {
      recommendedBreaker = '32A أحادي الطور (Single Phase)';
    } else if (safetyBreakerCurrent > 16) {
      recommendedBreaker = '25A أحادي الطور (Single Phase)';
    } else if (safetyBreakerCurrent > 10) {
      recommendedBreaker = '16A أحادي الطور (Single Phase)';
    }

    // Cost calculations
    const costModules = totalModules * computedPricing.modulePrice;
    const costPS = powerSuppliesCount * computedPricing.psPrice;
    const costCards = totalReceivingCards * computedPricing.cardPrice;
    const costController = computedPricing.controllerPrice;
    const costCabinet = totalAreaM2 * computedPricing.cabinetPrice;
    const costLabor = totalAreaM2 * computedPricing.laborPrice;
    const totalCost = costModules + costPS + costCards + costController + costCabinet + costLabor;

    return {
      cols,
      rows,
      faceModules,
      totalModules,
      actualWidthM,
      actualHeightM,
      actualAreaM2,
      totalAreaM2,
      totalPixelW,
      totalPixelH,
      totalPixels,
      totalMaxPowerW,
      powerSuppliesCount,
      modulesPerPs,
      totalAmpsDC,
      totalAmpsAC220,
      averagePowerKW,
      colsPerCard,
      rowsPerCard,
      cardsCols,
      cardsRows,
      totalReceivingCards,
      recommendedController,
      controllerReason,
      controllerCapacity,
      recommendedBreaker,
      exactCols,
      exactRows,
      costModules,
      costPS,
      costCards,
      costController,
      costCabinet,
      costLabor,
      totalCost,
      brightnessPowerKW,
      brightnessAmpsAC220
    };
  }, [
    requestedWidthM,
    requestedHeightM,
    activeModule,
    activePs,
    activeCard,
    fittingStrategy,
    psSafetyMargin,
    computedPricing,
    currency,
    isDoubleSided,
    brightnessPercent
  ]);

  // Dynamically adapt power supply block layout default to fit inside safety modules per power supply
  useEffect(() => {
    if (!calculations || !calculations.modulesPerPs) return;
    const mPerPs = calculations.modulesPerPs;
    
    // Choose standard structured rectangular block of modules that fits within mPerPs
    let defaultW = 2;
    let defaultH = 3;
    
    if (mPerPs >= 8) {
      defaultW = 2;
      defaultH = 4;
    } else if (mPerPs >= 6) {
      defaultW = 2;
      defaultH = 3;
    } else if (mPerPs >= 4) {
      defaultW = 2;
      defaultH = 2;
    } else if (mPerPs >= 2) {
      defaultW = 2;
      defaultH = 1;
    } else {
      defaultW = 1;
      defaultH = 1;
    }
    
    // If current configuration is invalid or exceeds, auto-correct it
    if (psBlockWidth * psBlockHeight > mPerPs) {
      setPsBlockWidth(defaultW);
      setPsBlockHeight(defaultH);
    }
  }, [calculations?.modulesPerPs]);

  // Simplify custom configurations and reset options
  const handleReset = () => {
    setReqWidth(3.0);
    setReqHeight(2.0);
    setDimensionUnit('m');
    setSelectedModuleId('p10-out');
    setFittingStrategy('up');
    setSelectedPsId('5v40a');
    setSelectedCardId('std');
    setPsSafetyMargin(80);
    setIsDoubleSided(false);
    setPricing({
      modulePrice: 45,
      psPrice: 65,
      cardPrice: 120,
      controllerPrice: 450,
      cabinetPrice: 150,
      laborPrice: 300,
    });
  };

  // Generate a text report suitable for WhatsApp or copy
  const generateTextReport = () => {
    return `📋 *تقرير الحسابات الفنية لشاشة LED الإعلانية*
----------------------------------------
${clientName ? `👤 *العميل الكريم:* ${clientName}\n----------------------------------------\n` : ''}👤 *نوع الشاشة:* ${isDoubleSided ? 'شاشة وجهين (Double-Sided)' : 'شاشة وجه واحد (Single-Sided)'}
📐 *المقاسات المطلوبة (للوجه الواحد):* ${reqWidth} × ${reqHeight} ${dimensionUnit === 'm' ? 'متر' : 'سم'}
🎨 *موديل المديول:* ${activeModule.name} (بيكسل بيتش: ${activeModule.pitch} مم)
📐 *مقاس المديول:* ${activeModule.widthMm}×${activeModule.heightMm} مم (${activeModule.pixelWidth}×${activeModule.pixelHeight} بكسل)

🖥️ *أبعاد الشاشة الفعلية (النهائية للوجه الواحد):*
   🔹 العرض الفعلي: ${calculations.actualWidthM.toFixed(2)} متر
   🔹 الارتفاع الفعلي: ${calculations.actualHeightM.toFixed(2)} متر
   🔹 مساحة الوجه الواحد: ${calculations.actualAreaM2.toFixed(2)} م²
   ${isDoubleSided ? `🔹 المساحة الإجمالية للوجهين: ${calculations.totalAreaM2.toFixed(2)} م²\n` : ''}   🔹 التناسق الفعلي: ${getAspectRatio(calculations.cols, calculations.rows)}

🧩 *تفاصيل قطع الغيار والوحدات المطلوبة:*
   🔸 مديولات LED: *${calculations.totalModules} مديول* ${isDoubleSided ? '(إجمالي للوجهين)' : ''} (${calculations.cols} عرضاً × ${calculations.rows} ارتفاعاً للوجه الواحد)
   🔸 دقة الشاشة (للوجه الواحد): *${calculations.totalPixelW} × ${calculations.totalPixelH}* بكسل (إجمالي: ${calculations.totalPixels.toLocaleString()} بكسل للوجه)
   🔸 كروت الاستقبال: *${calculations.totalReceivingCards} كرت* ${isDoubleSided ? '(إجمالي للوجهين)' : ''} (${calculations.cardsCols} أعمدة × ${calculations.cardsRows} صفوف للوجه الواحد)
   🔸 محولات الطاقة (مزود طاقة): *${calculations.powerSuppliesCount} محول* (طراز ${activePs.name} @ أمان ${psSafetyMargin}%)
   🔸 كرت الإرسال الموصى به: *${calculations.recommendedController}* (${calculations.controllerReason})

⚡ *الاستهلاك والكهرباء (السرعة والقدرة):*
   🔌 أقصى استهلاك متوقع: *${(calculations.totalMaxPowerW / 1000).toFixed(2)} كيلوواط* (${calculations.totalAmpsAC220.toFixed(1)} أمبير)
   🔌 الاستهلاك المتوسط الفعلي: *${calculations.averagePowerKW.toFixed(2)} كيلوواط/ساعة*
   💡 الاستهلاك عند سطوع ${brightnessPercent}%: *${calculations.brightnessPowerKW.toFixed(2)} كيلوواط/ساعة* (بشدة تيار: ${calculations.brightnessAmpsAC220.toFixed(1)} أمبير)
   🔒 القاطع الكهربائي الموصى به: *${calculations.recommendedBreaker}*

💰 *التكلفة التقريبية للمشروع:*
   💵 إجمالي التكلفة المقدرة: *${calculations.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}*
   (تشمل المديولات، المحولات، الكروت، الكبائن والتركيب لجميع الأوجه)

${pricingMode === 'single' ? `📋 *تفاصيل التوريد ومصدر الأسعار:*
   🔹 المورد المعتمد: ${supplierName}
   🔹 بلد ومنشأ التوريد: ${supplierCountry} (${supplierCity})
   🔹 تاريخ تحديث الأسعار: ${lastPriceUpdate}` : `📋 *تفاصيل التوريد من موردين متعددين (شراء هجين مختلط):*
   🔹 مورد مديولات LED: ${suppliers.find(s => s.id === moduleSupplierId)?.name || 'غير محدد'} (بمبلغ ${calculations.costModules.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency})
   🔹 مورد محولات الطاقة: ${suppliers.find(s => s.id === psSupplierId)?.name || 'غير محدد'} (بمبلغ ${calculations.costPS.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency})
   🔹 مورد كروت الاستقبال: ${suppliers.find(s => s.id === cardSupplierId)?.name || 'غير محدد'} (بمبلغ ${calculations.costCards.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency})
   🔹 مورد كرت الإرسال/المعالج: ${suppliers.find(s => s.id === controllerSupplierId)?.name || 'غير محدد'} (بمبلغ ${calculations.costController.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency})
   🔹 مورد الهيكل والكبائن: ${suppliers.find(s => s.id === cabinetSupplierId)?.name || 'غير محدد'} (بمبلغ ${calculations.costCabinet.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency})
   🔹 منفذ التركيب والبرمجة (الأجور): ${suppliers.find(s => s.id === laborSupplierId)?.name || 'غير محدد'} (بمبلغ ${calculations.costLabor.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency})`}

*تم الحساب بواسطة تطبيق حاسبة الشاشات LED الاحترافي* 🛠️`;
  };

  const copyToClipboard = () => {
    const reportText = generateTextReport();
    navigator.clipboard.writeText(reportText);
    setCopiedNotification(true);
    setTimeout(() => {
      setCopiedNotification(false);
    }, 3000);
  };

  // Helper function to approximate the aspect ratio
  function getAspectRatio(w: number, h: number) {
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(w, h);
    const rW = w / divisor;
    const rH = h / divisor;
    if (rW > 20 || rH > 20) {
      const ratio = (w / h).toFixed(2);
      return `~ ${ratio}:1`;
    }
    return `${rW}:${rH}`;
  }

  return (
    <div id="app-container" className="min-h-screen bg-[#0b0f19] text-[#f1f5f9] flex flex-col antialiased transition-all select-none">
      
      {/* Dynamic Copied Toast Notification */}
      {copiedNotification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-[#22c55e] text-[#ffffff] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-[#4ade80] animate-bounce">
          <Check className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">تم نسخ التقرير الكامل إلى الحافظة بنجاح! جاهز للإرسال على واتساب.</span>
        </div>
      )}

      {/* Modern Android Style Top Toolbar / Header */}
      <header className="sticky top-0 z-40 bg-[#111827]/90 backdrop-blur-md border-b border-[#1f2937] px-4 py-3 md:px-6 flex items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-[#22c55e] to-[#0ea5e9] p-2.5 rounded-xl shadow-md shadow-[#22c55e]/15">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-l from-white to-[#cbd5e1] bg-clip-text text-transparent">
              حاسبة الشاشات الإعلانية <span className="text-[#22c55e]">LED Pro</span>
            </h1>
            <p className="text-[10px] md:text-xs text-[#94a3b8] font-medium">
              حساب فني متقدم ودقيق للمديولات، المحولات، كروت الاستقبال، ومعالجات الإرسال
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] bg-[#1e293b] hover:bg-[#334155] rounded-xl border border-[#334155] transition-all"
            title="إعادة تعيين كافة البيانات"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">إعادة تعيين</span>
          </button>

          <button 
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/30 transition-all cursor-pointer"
            title="مراجعة وعرض التقارير السابقة وعروض الأسعار"
          >
            <History className="w-3.5 h-3.5 animate-pulse" />
            <span>التقارير السابقة ({clientRequests.length})</span>
          </button>
          
          <div className="flex items-center gap-2.5 bg-[#1e293b]/80 text-xs px-3.5 py-1.5 rounded-xl border border-emerald-500/30 shadow-sm">
            <img src={rabatLogo} alt="أضواء الرباط" className="w-6 h-6 rounded-lg object-cover border border-emerald-400/20" referrerPolicy="no-referrer" />
            <div className="text-right flex flex-col justify-center">
              <span className="text-[#f1f5f9] font-bold text-xs leading-none font-sans">أضواء الرباط للكهرباء</span>
              <span className="text-[#94a3b8] text-[9px] mt-0.5 leading-none font-sans">م/ رامي باذيب</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        
        {/* RIGHT COLUMN - INPUT CONTROLS (6 Columns) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          
          {/* STEP 1: Dimensions Input Card */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#1f2937] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#3b82f6]/10 p-1.5 rounded-lg border border-[#3b82f6]/20">
                  <Maximize2 className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <h2 className="font-bold text-sm md:text-base text-white">1. أبعاد الشاشة المرغوبة</h2>
              </div>
              <div className="flex bg-[#1e293b] rounded-lg p-0.5 border border-[#334155]">
                <button
                  onClick={() => {
                    if (dimensionUnit === 'cm') {
                      setDimensionUnit('m');
                      setReqWidth(prev => +(prev / 100).toFixed(2));
                      setReqHeight(prev => +(prev / 100).toFixed(2));
                    }
                  }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${dimensionUnit === 'm' ? 'bg-[#3b82f6] text-white shadow' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  متر (m)
                </button>
                <button
                  onClick={() => {
                    if (dimensionUnit === 'm') {
                      setDimensionUnit('cm');
                      setReqWidth(prev => Math.round(prev * 100));
                      setReqHeight(prev => Math.round(prev * 100));
                    }
                  }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${dimensionUnit === 'cm' ? 'bg-[#3b82f6] text-white shadow' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  سم (cm)
                </button>
              </div>
            </div>

            {/* Client Name Input */}
            <div className="mb-4">
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">اسم العميل (يظهر في التقارير والمطبوعات):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="أدخل اسم العميل أو الجهة الطالبة هنا..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl px-3.5 py-2.5 text-right font-medium text-white text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={handleSaveClientRequest}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 text-xs flex items-center gap-1.5 rounded-xl transition-all shadow-md shadow-blue-900/20 hover:shadow-blue-500/10 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="حفظ هذا العرض في سجل العروض والطلبات"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الطلب</span>
                </button>
              </div>

              {/* Quick access trigger */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                >
                  <History className="w-3 h-3" />
                  <span>📂 عرض ومراجعة التقارير والطلبات السابقة ({clientRequests.length})</span>
                </button>
                {clientRequests.length > 0 && (
                  <span className="text-[10px] text-[#94a3b8]">
                    آخر طلب: <span className="font-semibold text-slate-300">{clientRequests[0].clientName}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">العرض المطلوب:</label>
                <div className="relative">
                  <input
                    type="number"
                    step={dimensionUnit === 'm' ? '0.1' : '10'}
                    min="0.1"
                    value={reqWidth}
                    onChange={(e) => setReqWidth(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2.5 text-center font-bold text-white text-base focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/30 transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b]">
                    {dimensionUnit === 'm' ? 'م' : 'سم'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">الارتفاع المطلوب:</label>
                <div className="relative">
                  <input
                    type="number"
                    step={dimensionUnit === 'm' ? '0.1' : '10'}
                    min="0.1"
                    value={reqHeight}
                    onChange={(e) => setReqHeight(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2.5 text-center font-bold text-white text-base focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/30 transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b]">
                    {dimensionUnit === 'm' ? 'م' : 'سم'}
                  </span>
                </div>
              </div>
            </div>

            {/* Screen Sides Config (Single or Double Sided) */}
            <div className="mt-4">
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">نوع وهيكل الشاشة (أوجه العرض):</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsDoubleSided(false)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${!isDoubleSided ? 'bg-gradient-to-r from-[#22c55e]/15 to-[#22c55e]/5 border-[#22c55e] text-[#22c55e]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${!isDoubleSided ? 'bg-[#22c55e] animate-pulse' : 'bg-slate-500'}`} />
                  <span>وجه واحد (Single)</span>
                </button>
                <button
                  onClick={() => setIsDoubleSided(true)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${isDoubleSided ? 'bg-gradient-to-r from-[#0ea5e9]/15 to-[#0ea5e9]/5 border-[#0ea5e9] text-[#0ea5e9]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${isDoubleSided ? 'bg-[#0ea5e9] animate-pulse' : 'bg-slate-500'}`} />
                  <span>وجهين (Double)</span>
                </button>
              </div>
            </div>

            {/* Strategy Select */}
            <div className="mt-4">
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">استراتيجية احتساب مديولات التركيب:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFittingStrategy('up')}
                  className={`px-2 py-2 text-[11px] font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${fittingStrategy === 'up' ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                >
                  <span className="font-extrabold text-xs">تغطية كبرى</span>
                  <span className="text-[9px] opacity-80">أكبر من المطلوب</span>
                </button>
                <button
                  onClick={() => setFittingStrategy('down')}
                  className={`px-2 py-2 text-[11px] font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${fittingStrategy === 'down' ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                >
                  <span className="font-extrabold text-xs">أبعاد دقيقة</span>
                  <span className="text-[9px] opacity-80">لا يتخطى المطلوب</span>
                </button>
                <button
                  onClick={() => setFittingStrategy('nearest')}
                  className={`px-2 py-2 text-[11px] font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${fittingStrategy === 'nearest' ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                >
                  <span className="font-extrabold text-xs">الأقرب رياضياً</span>
                  <span className="text-[9px] opacity-80">أقرب تقريب هندسي</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: Module Choice Card */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#1f2937] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#22c55e]/10 p-1.5 rounded-lg border border-[#22c55e]/20">
                  <Cpu className="w-4 h-4 text-[#22c55e]" />
                </div>
                <h2 className="font-bold text-sm md:text-base text-white">2. تحديد مواصفات المديول (LED Module)</h2>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">اختر موديل المديول المستهدف:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {PREDEFINED_MODULES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModuleId(m.id)}
                    className={`p-2.5 text-xs font-semibold rounded-xl border text-right transition-all flex flex-col gap-1 ${selectedModuleId === m.id ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                  >
                    <div className="font-bold text-white text-[13px]">{m.name}</div>
                    <div className="text-[10px] opacity-85">{m.widthMm}×{m.heightMm} مم</div>
                    <div className="text-[10px] text-[#0ea5e9]">{m.pixelWidth}×{m.pixelHeight} بكسل</div>
                  </button>
                ))}
                
                <button
                  onClick={() => setSelectedModuleId('custom')}
                  className={`p-2.5 text-xs font-semibold rounded-xl border text-right transition-all flex flex-col justify-center gap-1 ${selectedModuleId === 'custom' ? 'bg-[#ea580c]/20 border-[#ea580c] text-[#ea580c]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                >
                  <div className="font-bold text-white text-[13px]">⚙️ مخصص...</div>
                  <div className="text-[10px] opacity-85">أدخل مقاساً خاصاً بك</div>
                </button>
              </div>

              {/* Custom Module Form Fields */}
              {selectedModuleId === 'custom' && (
                <div className="p-4 bg-[#1e293b]/60 rounded-xl border border-[#334155] grid grid-cols-2 gap-3 mt-2 animate-fade-in">
                  <div className="col-span-2 text-[11px] font-bold text-[#ea580c] mb-1">
                    قم بإدخال تفاصيل المديول الخاص بك يدوياً:
                  </div>
                  
                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">اسم الموديل المخصص:</label>
                    <input
                      type="text"
                      value={customModule.name}
                      onChange={(e) => setCustomModule(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">مسافة البكسل (Pitch):</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={customModule.pitch}
                        onChange={(e) => updateCustomModulePitch(Math.max(0.5, parseFloat(e.target.value) || 1))}
                        className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <span className="absolute left-2 top-1.5 text-[9px] text-gray-400">مم</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">العرض المادي (مم):</label>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      value={customModule.widthMm}
                      onChange={(e) => updateCustomModuleMm('widthMm', Math.max(10, parseInt(e.target.value) || 160))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">الارتفاع المادي (مم):</label>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      value={customModule.heightMm}
                      onChange={(e) => updateCustomModuleMm('heightMm', Math.max(10, parseInt(e.target.value) || 160))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">بكسلات العرض (تلقائي):</label>
                    <input
                      type="number"
                      value={customModule.pixelWidth}
                      onChange={(e) => setCustomModule(prev => ({ ...prev, pixelWidth: Math.max(1, parseInt(e.target.value) || 16) }))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">بكسلات الارتفاع (تلقائي):</label>
                    <input
                      type="number"
                      value={customModule.pixelHeight}
                      onChange={(e) => setCustomModule(prev => ({ ...prev, pixelHeight: Math.max(1, parseInt(e.target.value) || 16) }))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-[#94a3b8] mb-1">أقصى استهلاك طاقة للمديول الواحدة (واط):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={customModule.maxPowerW}
                        onChange={(e) => setCustomModule(prev => ({ ...prev, maxPowerW: Math.max(1, parseInt(e.target.value) || 20) }))}
                        className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <span className="absolute left-2 top-1.5 text-[9px] text-gray-400">واط</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Power & Card Details */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl flex flex-col gap-4">
            
            {/* Receiving Card Selection */}
            <div>
              <div className="flex items-center gap-2 border-b border-[#1f2937] pb-2 mb-3">
                <div className="bg-[#0ea5e9]/10 p-1 rounded-md">
                  <Layers className="w-4 h-4 text-[#0ea5e9]" />
                </div>
                <h3 className="font-bold text-xs md:text-sm text-white">3. إعدادات كارت الاستقبال (Receiver Card)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {RECEIVING_CARDS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCardId(c.id)}
                    className={`p-2 text-xs font-semibold rounded-xl border text-right transition-all flex flex-col gap-0.5 ${selectedCardId === c.id ? 'bg-[#0ea5e9]/20 border-[#0ea5e9] text-[#0ea5e9]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                  >
                    <span className="font-bold text-white text-[12px]">{c.id === 'std' ? 'HD-R508T (قياسي)' : c.id === 'high' ? 'HD-R512T (كبير)' : 'مخصص'}</span>
                    <span className="text-[9px] opacity-80">أقصى دقة: {c.maxW}×{c.maxH} بكسل</span>
                  </button>
                ))}
              </div>

              {selectedCardId === 'custom' && (
                <div className="p-3 bg-[#1e293b]/60 rounded-xl border border-[#334155] grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="block text-[9px] text-[#94a3b8] mb-0.5">أقصى عرض بكسل:</label>
                    <input
                      type="number"
                      value={customCard.maxW}
                      onChange={(e) => setCustomCard(prev => ({ ...prev, maxW: Math.max(1, parseInt(e.target.value) || 256) }))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#94a3b8] mb-0.5">أقصى ارتفاع بكسل:</label>
                    <input
                      type="number"
                      value={customCard.maxH}
                      onChange={(e) => setCustomCard(prev => ({ ...prev, maxH: Math.max(1, parseInt(e.target.value) || 256) }))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#94a3b8] mb-0.5">إجمالي البكسلات الكلي:</label>
                    <input
                      type="number"
                      value={customCard.maxPixels}
                      onChange={(e) => setCustomCard(prev => ({ ...prev, maxPixels: Math.max(1, parseInt(e.target.value) || 65536) }))}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Power Supply Selection */}
            <div>
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-[#f59e0b]/10 p-1 rounded-md">
                    <Zap className="w-4 h-4 text-[#f59e0b]" />
                  </div>
                  <h3 className="font-bold text-xs md:text-sm text-white">4. محول ومزود الطاقة (Power Supply)</h3>
                </div>
                <div className="text-[11px] text-[#f59e0b] font-bold">نسبة الأمان: {psSafetyMargin}%</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                {POWER_SUPPLIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPsId(p.id)}
                    className={`p-1.5 text-[10px] font-semibold rounded-xl border text-center transition-all flex flex-col items-center justify-center ${selectedPsId === p.id ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]' : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'}`}
                  >
                    <span className="font-extrabold text-[11px] text-white">{p.id === 'custom' ? 'مخصص' : `${p.amperes}A`}</span>
                    <span className="opacity-80">5V {p.watts}W</span>
                  </button>
                ))}
              </div>

              {selectedPsId === 'custom' && (
                <div className="p-3 bg-[#1e293b]/60 rounded-xl border border-[#334155] grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="block text-[9px] text-[#94a3b8] mb-0.5">الجهد (فولت):</label>
                    <input
                      type="number"
                      value={customPs.voltage}
                      onChange={(e) => setCustomPs(prev => {
                        const v = Math.max(1, parseFloat(e.target.value) || 5);
                        return { ...prev, voltage: v, watts: v * prev.amperes };
                      })}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#94a3b8] mb-0.5">التيار (أمبير):</label>
                    <input
                      type="number"
                      value={customPs.amperes}
                      onChange={(e) => setCustomPs(prev => {
                        const a = Math.max(1, parseFloat(e.target.value) || 40);
                        return { ...prev, amperes: a, watts: prev.voltage * a };
                      })}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#94a3b8] mb-0.5">القدرة بالواط (W):</label>
                    <input
                      type="number"
                      disabled
                      value={customPs.watts}
                      className="w-full bg-[#111827]/40 border border-[#334155] rounded-lg px-2 py-1 text-xs text-gray-400 text-center"
                    />
                  </div>
                </div>
              )}

              {/* Slider safety margin */}
              <div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={psSafetyMargin}
                  onChange={(e) => setPsSafetyMargin(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-[#f59e0b]"
                />
                <div className="flex justify-between text-[10px] text-[#64748b] mt-1 font-bold">
                  <span>أقصى طاقة (100%)</span>
                  <span>أمان عالي (80% الافتراضي)</span>
                  <span>محافظ جداً (60%)</span>
                </div>
              </div>

              {/* Power Supply Block Grouping Section */}
              <div className="bg-[#1e293b]/40 border border-[#334155]/60 p-3 rounded-xl space-y-2 mt-4 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>تجميع المحولات بالمخطط (أبعاد ثنائية/مستطيل):</span>
                  </span>
                  <span className="text-[10px] text-[#f59e0b] font-bold">
                    {psBlockWidth} × {psBlockHeight} ({psBlockWidth * psBlockHeight} مديول)
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal">
                  يتم تقسيم تغذية المديولات في المخطط بشكل زوجي أو مصفوفة مستطيلة متجاورة لسهولة التركيب بدلاً من التوزيع الخطي العشوائي.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">العرض (عدد المديولات):</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={psBlockWidth}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setPsBlockWidth(val);
                      }}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-white text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">الارتفاع (عدد المديولات):</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={psBlockHeight}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setPsBlockHeight(val);
                      }}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-white text-center font-bold"
                    />
                  </div>
                </div>

                {/* Common Presets Buttons */}
                <div className="flex flex-wrap gap-1 mt-1 justify-start">
                  <span className="text-[9px] text-[#64748b] self-center">تجميعات سريعة:</span>
                  {[
                    { w: 2, h: 2, label: '2×2' },
                    { w: 2, h: 3, label: '2×3' },
                    { w: 3, h: 2, label: '3×2' },
                    { w: 2, h: 4, label: '2×4' },
                    { w: 4, h: 2, label: '4×2' },
                  ].map((preset, pIdx) => {
                    const presetCapacity = preset.w * preset.h;
                    const isOver = presetCapacity > calculations.modulesPerPs;
                    return (
                      <button
                        type="button"
                        key={pIdx}
                        onClick={() => {
                          setPsBlockWidth(preset.w);
                          setPsBlockHeight(preset.h);
                        }}
                        disabled={isOver}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                          isOver 
                            ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-600 border-transparent' 
                            : psBlockWidth === preset.w && psBlockHeight === preset.h
                              ? 'bg-[#f59e0b] text-black border-[#f59e0b]'
                              : 'bg-[#111827] text-slate-300 border-[#334155] hover:text-white'
                        }`}
                        title={isOver ? `يتجاوز طاقة المحول (${calculations.modulesPerPs})` : `توزيع ${preset.label}`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {psBlockWidth * psBlockHeight > calculations.modulesPerPs && (
                  <div className="flex items-center gap-1 text-[9px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg animate-pulse text-right">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>⚠️ التجميع المختار ({psBlockWidth * psBlockHeight} مديول) يتجاوز سعة المحول الآمنة ({calculations.modulesPerPs} مديول)!</span>
                  </div>
                )}
              </div>

              {/* Screen Brightness Percent Input */}
              <div className="bg-[#1e293b]/40 border border-[#334155]/60 p-3 rounded-xl space-y-2.5 mt-3 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>الاستهلاك عند سطوع تشغيل مخصص:</span>
                  </span>
                  <span className="text-[10px] text-red-400 font-bold">
                    {brightnessPercent}% سطوع
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal">
                  قم بتحديد النسبة المئوية للسطوع لتقدير استهلاك الشاشة الفعلي الدقيق بالواط والأمبير عند هذا المستوى.
                </p>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={brightnessPercent}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 20));
                        setBrightnessPercent(val);
                      }}
                      className="w-full bg-[#111827] border border-[#334155] rounded-lg pl-6 pr-2.5 py-1 text-xs text-white text-center font-bold font-mono"
                    />
                    <span className="absolute left-2 top-1 text-[10px] text-gray-400">%</span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={brightnessPercent}
                    onChange={(e) => setBrightnessPercent(parseInt(e.target.value))}
                    className="w-28 h-1 bg-red-950 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                {/* Quick percentages buttons */}
                <div className="flex gap-1 justify-end">
                  {[20, 50, 80, 100].map((pct) => (
                    <button
                      type="button"
                      key={pct}
                      onClick={() => setBrightnessPercent(pct)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                        brightnessPercent === pct
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-[#111827] text-slate-300 border-[#334155] hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: Cost Inputs */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-[#1f2937] pb-3 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#a855f7]/10 p-1.5 rounded-lg border border-[#a855f7]/20">
                  <Coins className="w-4 h-4 text-[#a855f7]" />
                </div>
                <h2 className="font-bold text-sm md:text-base text-white font-sans">4. تقدير التكلفة والعملة المعتمدة</h2>
              </div>
              
              {/* Currency Selector (Predefined + Custom option) */}
              <div className="flex items-center gap-2" style={{ direction: 'rtl' }}>
                <span className="text-[10px] text-slate-400 font-bold">العملة:</span>
                <select
                  value={['ر.ي', 'ر.س', 'د.إ', 'د.أ', 'ج.م', '$'].includes(currency) ? currency : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') {
                      setCurrency(val);
                    } else {
                      setCurrency('عملة مخصصة');
                    }
                  }}
                  className="bg-[#1e293b] text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-[#334155] focus:outline-none focus:border-[#a855f7] cursor-pointer"
                >
                  <option value="ر.ي">ريال يمني (ر.ي)</option>
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="د.إ">درهم إماراتي (د.إ)</option>
                  <option value="د.أ">دينار أردني (د.أ)</option>
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="$">دولار أمريكي ($)</option>
                  <option value="custom">عملة أخرى...</option>
                </select>
                {!['ر.ي', 'ر.س', 'د.إ', 'د.أ', 'ج.م', '$'].includes(currency) && (
                  <input
                    type="text"
                    value={currency === 'عملة مخصصة' ? '' : currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="رمز العملة"
                    className="w-16 bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-xs text-white font-bold text-center"
                    title="اكتب رمز أو اسم العملة المخصصة هنا"
                  />
                )}
              </div>
            </div>

            {/* Pricing Mode Toggle */}
            <div className="mb-4 bg-[#1e293b]/40 border border-[#334155]/50 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-right">
              <div>
                <span className="text-xs font-bold text-white block">طريقة حساب الأسعار وتقسيم الشراء:</span>
                <span className="text-[10px] text-slate-400">حساب سعر التكلفة من مورد واحد كامل أو توزيع القطع على موردين مختلفين للحصول على أفضل سعر.</span>
              </div>
              <div className="flex bg-[#111827] rounded-lg p-1 border border-[#334155] self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => setPricingMode('single')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${pricingMode === 'single' ? 'bg-[#a855f7] text-white shadow' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  🏢 مورد موحد ({supplierName})
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('mixed')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${pricingMode === 'mixed' ? 'bg-[#a855f7] text-white shadow' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  🔀 موردين متعددين (مختلط)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-right">
              {/* 1. Module Price & Supplier */}
              <div className="bg-[#1e293b]/20 p-3 rounded-xl border border-[#334155]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-bold">1. سعر المديول الواحد ({activeModule.name}):</label>
                  {pricingMode === 'mixed' ? (
                    <span className="text-[10px] text-purple-400 font-bold">شراء مخصص</span>
                  ) : (
                    <span className="text-[9px] text-[#64748b]">المورد: {supplierName}</span>
                  )}
                </div>
                {pricingMode === 'mixed' && (
                  <select
                    value={moduleSupplierId}
                    onChange={(e) => setModuleSupplierId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-[11px] text-[#a78bfa] font-semibold focus:outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>من: {s.name} ({s.itemPrices[selectedModuleId === 'custom' ? 'custom-module' : selectedModuleId] ?? 0} {currency})</option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  value={computedPricing.modulePrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    if (pricingMode === 'single') {
                      handleModulePriceChange(val);
                    } else {
                      setSuppliers(prev => prev.map(s => s.id === moduleSupplierId ? {
                        ...s,
                        itemPrices: { ...s.itemPrices, [selectedModuleId === 'custom' ? 'custom-module' : selectedModuleId]: val }
                      } : s));
                    }
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-center text-white font-bold font-mono text-sm"
                />
              </div>

              {/* 2. Power Supply Price & Supplier */}
              <div className="bg-[#1e293b]/20 p-3 rounded-xl border border-[#334155]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-bold">2. سعر المحول الواحد ({activePs.name.split(' (')[0]}):</label>
                  {pricingMode === 'mixed' ? (
                    <span className="text-[10px] text-purple-400 font-bold">شراء مخصص</span>
                  ) : (
                    <span className="text-[9px] text-[#64748b]">المورد: {supplierName}</span>
                  )}
                </div>
                {pricingMode === 'mixed' && (
                  <select
                    value={psSupplierId}
                    onChange={(e) => setPsSupplierId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-[11px] text-[#a78bfa] font-semibold focus:outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>من: {s.name} ({s.itemPrices[selectedPsId === 'custom' ? 'custom-ps' : selectedPsId] ?? 0} {currency})</option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  value={computedPricing.psPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    if (pricingMode === 'single') {
                      handlePsPriceChange(val);
                    } else {
                      setSuppliers(prev => prev.map(s => s.id === psSupplierId ? {
                        ...s,
                        itemPrices: { ...s.itemPrices, [selectedPsId === 'custom' ? 'custom-ps' : selectedPsId]: val }
                      } : s));
                    }
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-center text-white font-bold font-mono text-sm"
                />
              </div>

              {/* 3. Receiving Card Price & Supplier */}
              <div className="bg-[#1e293b]/20 p-3 rounded-xl border border-[#334155]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-bold">3. سعر كارت الاستقبال الواحد:</label>
                  {pricingMode === 'mixed' ? (
                    <span className="text-[10px] text-purple-400 font-bold">شراء مخصص</span>
                  ) : (
                    <span className="text-[9px] text-[#64748b]">المورد: {supplierName}</span>
                  )}
                </div>
                {pricingMode === 'mixed' && (
                  <select
                    value={cardSupplierId}
                    onChange={(e) => setCardSupplierId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-[11px] text-[#a78bfa] font-semibold focus:outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>من: {s.name} ({s.itemPrices[selectedCardId === 'custom' ? 'custom-card' : selectedCardId] ?? 0} {currency})</option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  value={computedPricing.cardPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    if (pricingMode === 'single') {
                      handleCardPriceChange(val);
                    } else {
                      setSuppliers(prev => prev.map(s => s.id === cardSupplierId ? {
                        ...s,
                        itemPrices: { ...s.itemPrices, [selectedCardId === 'custom' ? 'custom-card' : selectedCardId]: val }
                      } : s));
                    }
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-center text-white font-bold font-mono text-sm"
                />
              </div>

              {/* 4. Controller Price & Supplier */}
              <div className="bg-[#1e293b]/20 p-3 rounded-xl border border-[#334155]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-bold">4. سعر معالج الإرسال الموصى به:</label>
                  {pricingMode === 'mixed' ? (
                    <span className="text-[10px] text-purple-400 font-bold">شراء مخصص</span>
                  ) : (
                    <span className="text-[9px] text-[#64748b]">المورد: {supplierName}</span>
                  )}
                </div>
                {pricingMode === 'mixed' && (
                  <select
                    value={controllerSupplierId}
                    onChange={(e) => setControllerSupplierId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-[11px] text-[#a78bfa] font-semibold focus:outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>من: {s.name} ({s.controllerPrice ?? 0} {currency})</option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  value={computedPricing.controllerPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    if (pricingMode === 'single') {
                      handleControllerPriceChange(val);
                    } else {
                      setSuppliers(prev => prev.map(s => s.id === controllerSupplierId ? { ...s, controllerPrice: val } : s));
                    }
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-center text-white font-bold font-mono text-sm"
                />
              </div>

              {/* 5. Cabinet Frame Price & Supplier */}
              <div className="bg-[#1e293b]/20 p-3 rounded-xl border border-[#334155]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-bold">5. تجهيز الكابينة والحديد (لكل م²):</label>
                  {pricingMode === 'mixed' ? (
                    <span className="text-[10px] text-purple-400 font-bold">جهة مخصصة</span>
                  ) : (
                    <span className="text-[9px] text-[#64748b]">المورد: {supplierName}</span>
                  )}
                </div>
                {pricingMode === 'mixed' && (
                  <select
                    value={cabinetSupplierId}
                    onChange={(e) => setCabinetSupplierId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-[11px] text-[#a78bfa] font-semibold focus:outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>من: {s.name} ({s.cabinetPrice ?? 0} {currency})</option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  value={computedPricing.cabinetPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    if (pricingMode === 'single') {
                      handleCabinetPriceChange(val);
                    } else {
                      setSuppliers(prev => prev.map(s => s.id === cabinetSupplierId ? { ...s, cabinetPrice: val } : s));
                    }
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-center text-white font-bold font-mono text-sm"
                />
              </div>

              {/* 6. Labor Price & Supplier */}
              <div className="bg-[#1e293b]/20 p-3 rounded-xl border border-[#334155]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-bold">6. أجور التركيب والبرمجة (لكل م²):</label>
                  {pricingMode === 'mixed' ? (
                    <span className="text-[10px] text-purple-400 font-bold">جهة مخصصة</span>
                  ) : (
                    <span className="text-[9px] text-[#64748b]">المورد: {supplierName}</span>
                  )}
                </div>
                {pricingMode === 'mixed' && (
                  <select
                    value={laborSupplierId}
                    onChange={(e) => setLaborSupplierId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-lg px-2 py-1 text-[11px] text-[#a78bfa] font-semibold focus:outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>من: {s.name} ({s.laborPrice ?? 0} {currency})</option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  value={computedPricing.laborPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    if (pricingMode === 'single') {
                      handleLaborPriceChange(val);
                    } else {
                      setSuppliers(prev => prev.map(s => s.id === laborSupplierId ? { ...s, laborPrice: val } : s));
                    }
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-center text-white font-bold font-mono text-sm"
                />
              </div>
            </div>

            {/* Collapsible Default Price List Manager */}
            <div className="mt-4 border-t border-[#1f2937] pt-4">
              <button
                type="button"
                onClick={() => setShowPriceManager(!showPriceManager)}
                className="w-full flex items-center justify-between text-xs text-purple-400 hover:text-purple-300 font-bold focus:outline-none cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>⚙️ تعديل قائمة الأسعار الافتراضية للقطع والأصناف</span>
                </span>
                <span>{showPriceManager ? '▲ إخفاء' : '▼ عرض وتعديل الأسعار'}</span>
              </button>

              {showPriceManager && (
                <div className="mt-3 p-3 bg-[#1e293b]/40 rounded-xl border border-[#334155] space-y-3.5 text-[11px] animate-fade-in">
                  
                  {/* Supplier Selection and Management Section */}
                  <div className="bg-[#111827]/60 p-2.5 rounded-xl border border-[#1f2937] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#334155] pb-1.5">
                      <h4 className="font-bold text-white text-xs text-purple-400 flex items-center gap-1">
                        <span>🏢 المورد والأسعار النشطة:</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddNewSupplier}
                        className="flex items-center gap-1 bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/40 rounded px-2 py-0.5 text-[9px] font-bold cursor-pointer transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>إضافة مورد جديد</span>
                      </button>
                    </div>

                    <div className="flex gap-2 items-center">
                      <select
                        value={activeSupplierId}
                        onChange={(e) => setActiveSupplierId(e.target.value)}
                        className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1.5 text-white text-[11px] font-sans font-semibold focus:outline-none cursor-pointer"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.country})</option>
                        ))}
                      </select>

                      {suppliers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(activeSupplierId)}
                          className="bg-red-900/30 hover:bg-red-900/60 border border-red-500/40 text-red-400 p-1.5 rounded-lg cursor-pointer transition-all"
                          title="حذف هذا المورد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Supplier & Location & Price Date Fields */}
                  <div className="bg-[#111827]/60 p-2.5 rounded-xl border border-[#1f2937] space-y-2.5">
                    <h4 className="font-bold text-white text-xs text-purple-400 border-b border-[#334155] pb-0.5">📋 معلومات المورد وجهة الشراء والأسعار:</h4>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-slate-400 text-[10px] mb-1 block">اسم المورد / الشركة المصنعة:</label>
                        <input
                          type="text"
                          value={supplierName}
                          onChange={(e) => {
                            setSupplierName(e.target.value);
                            syncActiveSupplierMeta({ name: e.target.value });
                          }}
                          placeholder="مثال: شركة شينزين لتوريد شاشات LED"
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1 text-white text-[11px] font-sans"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 text-[10px] mb-1 block">بلد التوريد:</label>
                          <input
                            type="text"
                            value={supplierCountry}
                            onChange={(e) => {
                              setSupplierCountry(e.target.value);
                              syncActiveSupplierMeta({ country: e.target.value });
                            }}
                            placeholder="الصين"
                            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-white text-[11px] font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px] mb-1 block">مدينة التوريد:</label>
                          <input
                            type="text"
                            value={supplierCity}
                            onChange={(e) => {
                              setSupplierCity(e.target.value);
                              syncActiveSupplierMeta({ city: e.target.value });
                            }}
                            placeholder="شينزين"
                            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-white text-[11px] font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] mb-1 block">تاريخ آخر تعديل وتحديث للأسعار:</label>
                        <input
                          type="date"
                          value={lastPriceUpdate}
                          onChange={(e) => {
                            setLastPriceUpdate(e.target.value);
                            syncActiveSupplierMeta({ lastUpdate: e.target.value });
                          }}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1 text-white text-[11px] font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[#94a3b8] leading-relaxed text-[10px]">
                    قم بتخصيص أسعار التكلفة هنا لكل صنف. عند اختيار أي صنف من القوائم العلوية، سيتم تفعيل سعره المخصص هنا تلقائياً في حسابات التكلفة:
                  </p>

                  {/* Modules Price List */}
                  <div>
                    <h4 className="font-bold text-white mb-1.5 text-xs text-emerald-400 border-b border-[#334155] pb-0.5">أسعار مديولات الـ LED (لكل حبة):</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {PREDEFINED_MODULES.map(m => (
                        <div key={m.id} className="flex items-center justify-between bg-[#111827] px-2 py-1 rounded border border-[#1f2937]">
                          <span className="text-[#94a3b8] truncate max-w-[80px]" title={m.name}>{m.name.split(' ')[0]}</span>
                          <input
                            type="number"
                            value={itemPrices[m.id] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setItemPrices(prev => {
                                const updated = { ...prev, [m.id]: val };
                                setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
                                return updated;
                              });
                            }}
                            className="w-16 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-[#111827] px-2 py-1 rounded border border-[#1f2937]">
                        <span className="text-[#94a3b8]">مديول مخصص</span>
                        <input
                          type="number"
                          value={itemPrices['custom-module'] ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setItemPrices(prev => {
                              const updated = { ...prev, 'custom-module': val };
                              setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
                              return updated;
                            });
                          }}
                          className="w-16 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Power Supplies Price List */}
                  <div>
                    <h4 className="font-bold text-white mb-1.5 text-xs text-[#f59e0b] border-b border-[#334155] pb-0.5">أسعار محولات الطاقة (لكل حبة):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {POWER_SUPPLIES.filter(p => p.id !== 'custom').map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-[#111827] px-2.5 py-1.5 rounded border border-[#1f2937]">
                          <div className="flex flex-col text-right leading-tight">
                            <span className="text-white font-bold text-[10px]">{p.name.split(' ')[1]} {p.name.split(' ')[2] || ''}</span>
                            <span className="text-[#94a3b8] text-[9px] font-mono">{p.watts}W / {p.amperes}A</span>
                          </div>
                          <input
                            type="number"
                            value={itemPrices[p.id] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setItemPrices(prev => {
                                const updated = { ...prev, [p.id]: val };
                                setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
                                return updated;
                              });
                            }}
                            className="w-16 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-[#111827] px-2.5 py-1.5 rounded border border-[#1f2937]">
                        <div className="flex flex-col text-right leading-tight">
                          <span className="text-white font-bold text-[10px]">محول مخصص</span>
                          <span className="text-[#94a3b8] text-[9px] font-mono">{customPs.watts}W / {customPs.amperes}A</span>
                        </div>
                        <input
                          type="number"
                          value={itemPrices['custom-ps'] ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setItemPrices(prev => {
                              const updated = { ...prev, 'custom-ps': val };
                              setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
                              return updated;
                            });
                          }}
                          className="w-16 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Receiving Cards Price List */}
                  <div>
                    <h4 className="font-bold text-white mb-1.5 text-xs text-cyan-400 border-b border-[#334155] pb-0.5">أسعار كروت الاستقبال (لكل حبة):</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {RECEIVING_CARDS.filter(c => c.id !== 'custom').map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-[#111827] px-2 py-1 rounded border border-[#1f2937]">
                          <span className="text-[#94a3b8] truncate max-w-[80px]" title={c.name}>{c.id === 'std' ? 'HD-R508T' : 'HD-R512T'}</span>
                          <input
                            type="number"
                            value={itemPrices[c.id] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setItemPrices(prev => {
                                const updated = { ...prev, [c.id]: val };
                                setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
                                return updated;
                              });
                            }}
                            className="w-16 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-[#111827] px-2 py-1 rounded border border-[#1f2937]">
                        <span className="text-[#94a3b8]">كرت مخصص</span>
                        <input
                          type="number"
                          value={itemPrices['custom-card'] ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setItemPrices(prev => {
                              const updated = { ...prev, 'custom-card': val };
                              setSuppliers(sPrev => sPrev.map(s => s.id === activeSupplierId ? { ...s, itemPrices: updated } : s));
                              return updated;
                            });
                          }}
                          className="w-16 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Data Button */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={saveSuppliersData}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-4 rounded-xl border border-[#22c55e]/30 shadow-lg cursor-pointer transition-all text-xs"
                    >
                      <Save className="w-4 h-4" />
                      <span>💾 حفظ قائمة الموردين والأسعار بالكامل (الذاكرة المحلية)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handlePrintSuppliers}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-xl border border-blue-500/30 shadow-lg cursor-pointer transition-all text-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>🖨️ طباعة تقرير مقارنة أسعار الموردين والقطع (PDF)</span>
                    </button>
                    
                    {saveSuccess && (
                      <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-center font-bold text-[11px] animate-pulse">
                        ✅ تم حفظ جميع الموردين والأسعار بنجاح في متصفحك!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CLIENT REQUESTS LOG CARD */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-[#1f2937] pb-2">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="font-bold text-sm md:text-base text-white">5. سجل عروض أسعار وطلبات العملاء</h2>
              </div>
              <span className="bg-[#1e293b] text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
                {clientRequests.length} عروض محفوظة
              </span>
            </div>

            {clientRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <p className="mb-2">لا توجد عروض أسعار محفوظة حالياً.</p>
                <p className="text-[10px] text-slate-600">أدخل اسم العميل في الأعلى واضغط على "حفظ الطلب" لحفظ حسابات المشروع هنا والرجوع إليها لاحقاً.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {clientRequests.map((req) => (
                  <div key={req.id} className="bg-[#1e293b]/40 border border-[#334155]/60 hover:border-blue-500/40 rounded-xl p-3 text-right transition-all text-xs flex flex-col justify-between gap-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadClientRequest(req)}
                          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          استدعاء
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleLoadClientRequest(req);
                            setTimeout(() => {
                              handleOpenQuotationCreator();
                            }, 50);
                          }}
                          className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          عرض سعر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClientRequest(req.id, req.clientName)}
                          className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-500/20 p-1 rounded-lg cursor-pointer transition-all"
                          title="حذف هذا الطلب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white text-sm block">{req.clientName}</span>
                        <span className="text-[9px] text-[#64748b] font-mono">{req.date}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-[#111827]/60 p-2.5 rounded-lg text-[11px] text-[#94a3b8] font-sans">
                      <div>
                        <span className="text-[9px] block text-slate-500">المقاس المطلوب:</span>
                        <span className="font-bold text-slate-300">{req.reqWidth} × {req.reqHeight} {req.dimensionUnit === 'm' ? 'متر' : 'سم'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] block text-slate-500">نوع الشاشة:</span>
                        <span className="font-bold text-slate-300">{req.isDoubleSided ? 'وجهين' : 'وجه واحد'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] block text-slate-500">المقاس الفعلي:</span>
                        <span className="font-bold text-slate-300">{req.actualWidthM.toFixed(2)} × {req.actualHeightM.toFixed(2)} م</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] block text-slate-500">موديل المديول:</span>
                        <span className="font-bold text-slate-300 truncate block max-w-full">{req.moduleName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] block text-slate-500">عدد القطع:</span>
                        <span className="font-bold text-slate-300">{req.totalModules} مديول | {req.powerSuppliesCount} محول</span>
                      </div>
                      <div className="col-span-3 border-t border-[#334155]/40 pt-1.5 flex justify-between items-center">
                        <span className="text-[9px] text-slate-500">إجمالي التكلفة المبدئية:</span>
                        <span className="font-bold text-emerald-400 font-mono text-[13px]">{Math.round(req.totalCost).toLocaleString()} {req.currency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* LEFT COLUMN - INTERACTIVE SIMULATION & DETAILED TECHNICAL REPORTS (7 Columns) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          
          {/* VISUAL REAL-TIME CABINET SCREEN SIMULATOR */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1f2937] pb-3 gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
                </span>
                <h2 className="font-bold text-sm md:text-base text-white">محاكي تمثيل هيكل شاشة الـ LED التفاعلي</h2>
              </div>

              {/* Toggles for showing layout layers */}
              <div className="flex flex-wrap gap-1 bg-[#1e293b] p-1 rounded-xl border border-[#334155] text-xs font-bold">
                <button
                  onClick={() => setVisualizerMode('modules')}
                  className={`px-3 py-1 rounded-lg transition-all ${visualizerMode === 'modules' ? 'bg-[#22c55e] text-black shadow font-bold' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  شبكة المديولات
                </button>
                <button
                  onClick={() => setVisualizerMode('cards')}
                  className={`px-3 py-1 rounded-lg transition-all ${visualizerMode === 'cards' ? 'bg-[#0ea5e9] text-white shadow font-bold' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  كروت الاستقبال
                </button>
                <button
                  onClick={() => setVisualizerMode('power')}
                  className={`px-3 py-1 rounded-lg transition-all ${visualizerMode === 'power' ? 'bg-[#f59e0b] text-black shadow font-bold' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  توصيل الطاقة
                </button>
                <button
                  onClick={() => setVisualizerMode('video')}
                  className={`px-3 py-1 rounded-lg transition-all ${visualizerMode === 'video' ? 'bg-[#a855f7] text-white shadow font-bold' : 'text-[#94a3b8] hover:text-white'}`}
                >
                  صورة حية
                </button>
              </div>
            </div>

            {/* Simulated TV Canvas Box */}
            <div className="bg-[#0b0f19] border border-[#1f2937] rounded-xl p-6 flex items-center justify-center relative overflow-hidden min-h-[280px]">
              
              {/* Outer screen metal frame */}
              <div 
                className="relative bg-black rounded-lg border-4 border-slate-700 shadow-2xl transition-all duration-300 max-w-full flex items-center justify-center p-1"
                style={{
                  aspectRatio: `${calculations.actualWidthM} / ${calculations.actualHeightM}`,
                  width: '90%',
                  maxHeight: '380px',
                  boxShadow: '0 0 25px rgba(0,0,0,0.8), 0 0 15px rgba(34, 197, 94, 0.1)'
                }}
              >
                {/* Visualizer Screens based on toggle */}
                {visualizerMode === 'modules' && (
                  <div className="grid w-full h-full gap-0.5 p-0.5 overflow-hidden"
                       style={{
                         gridTemplateColumns: `repeat(${calculations.cols}, minmax(0, 1fr))`,
                         gridTemplateRows: `repeat(${calculations.rows}, minmax(0, 1fr))`,
                         aspectRatio: `${calculations.actualWidthM} / ${calculations.actualHeightM}`,
                       }}
                  >
                    {Array.from({ length: Math.min(600, calculations.faceModules) }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#1e293b]/90 border border-[#3b82f6]/20 rounded-sm text-[8px] font-mono flex items-center justify-center text-slate-500 hover:bg-[#3b82f6]/20 hover:text-white transition-all duration-150 group"
                        title={`مديول رقم ${idx + 1}`}
                      >
                        <span className="hidden sm:inline scale-75 md:scale-90 group-hover:scale-110 transition-transform">
                          M{idx + 1}
                        </span>
                      </div>
                    ))}
                    {calculations.faceModules > 600 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 text-center text-xs">
                        تم اختصار رسم شبكة المديولات الكبيرة ({calculations.faceModules} مديول) لحماية أداء جهازك.
                      </div>
                    )}
                  </div>
                )}

                {/* Receiver Cards mode */}
                {visualizerMode === 'cards' && (
                  <div className="grid w-full h-full gap-1 p-0.5 overflow-hidden"
                       style={{
                         gridTemplateColumns: `repeat(${calculations.cardsCols}, minmax(0, 1fr))`,
                         gridTemplateRows: `repeat(${calculations.cardsRows}, minmax(0, 1fr))`,
                         aspectRatio: `${calculations.actualWidthM} / ${calculations.actualHeightM}`,
                       }}
                  >
                    {Array.from({ length: calculations.cardsCols * calculations.cardsRows }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#0ea5e9]/10 border-2 border-dashed border-[#0ea5e9] rounded-md text-[9px] font-bold flex flex-col items-center justify-center text-[#0ea5e9] p-1 text-center"
                        title={`منطقة كرت الاستقبال ${idx + 1}`}
                      >
                        <Layers className="w-3.5 h-3.5 mb-1 text-[#0ea5e9]" />
                        <span className="text-[9px]">كرت {idx + 1}</span>
                        <span className="text-[8px] text-gray-400 font-mono">
                          {calculations.colsPerCard}×{calculations.rowsPerCard} مديول
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Power supply coverage overlay */}
                {visualizerMode === 'power' && (
                  <div className="grid w-full h-full gap-1 p-0.5 overflow-hidden"
                       style={{
                         gridTemplateColumns: `repeat(${calculations.cols}, minmax(0, 1fr))`,
                         gridTemplateRows: `repeat(${calculations.rows}, minmax(0, 1fr))`,
                         aspectRatio: `${calculations.actualWidthM} / ${calculations.actualHeightM}`,
                       }}
                  >
                    {Array.from({ length: Math.min(200, calculations.faceModules) }).map((_, idx) => {
                      const psIndex = getPsIndexForModule(idx, calculations.cols, calculations.rows);
                      const hue = (psIndex * 137.5) % 360; // unique color for each power supply group
                      return (
                        <div 
                          key={idx} 
                          className="border rounded-sm text-[8px] font-mono flex flex-col items-center justify-center transition-all"
                          style={{
                            backgroundColor: `hsla(${hue}, 70%, 40%, 0.15)`,
                            borderColor: `hsla(${hue}, 70%, 50%, 0.4)`,
                            color: `hsla(${hue}, 100%, 75%, 1)`
                          }}
                          title={`مديول ${idx + 1} - متصل بمحول رقم ${psIndex}`}
                        >
                          <Zap className="w-2.5 h-2.5 opacity-80" />
                          <span className="text-[7px]">محول {psIndex}</span>
                        </div>
                      );
                    })}
                    {calculations.faceModules > 200 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 text-center text-xs">
                        تم تفعيل رسم مبسط لتوزيع الطاقة لتجنب البطء في العرض.
                      </div>
                    )}
                  </div>
                )}

                {/* Live video mock overlay */}
                {visualizerMode === 'video' && (
                  <div className="absolute inset-0 w-full h-full bg-[#1e1b4b] overflow-hidden rounded-md flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-[#22c55e]/30 to-purple-600/30 animate-pulse" />
                    <div className="z-10 text-center px-4">
                      <div className="text-white font-black tracking-widest text-lg md:text-xl drop-shadow-md flex items-center justify-center gap-2">
                        <span>LED DISPLAY PRO</span>
                      </div>
                      <div className="text-[#22c55e] font-mono text-[10px] md:text-xs mt-1 font-bold">
                        الدقة: {calculations.totalPixelW} × {calculations.totalPixelH} بكسل
                      </div>
                      <div className="text-slate-300 text-[9px] mt-2 bg-black/40 px-3 py-1 rounded-full inline-block">
                        مساحة العرض: {calculations.actualAreaM2.toFixed(1)} م² {isDoubleSided ? 'لكل وجه' : '(أبعاد حقيقية)'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Side physical dimension annotations */}
              <div className="absolute bottom-2 right-4 text-[11px] text-[#64748b] font-bold bg-[#111827] px-2 py-1 rounded border border-[#1f2937]">
                العرض الفعلي: {calculations.actualWidthM.toFixed(2)} متر ({calculations.cols} مديول)
              </div>
              <div className="absolute top-2 left-4 text-[11px] text-[#64748b] font-bold bg-[#111827] px-2 py-1 rounded border border-[#1f2937]">
                الارتفاع الفعلي: {calculations.actualHeightM.toFixed(2)} متر ({calculations.rows} مديول)
              </div>
            </div>

            {/* Quick notice of dimensions deviation */}
            <div className="p-3 bg-[#1e293b]/50 rounded-xl border border-[#334155] text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#3b82f6] shrink-0 mt-0.5" />
              <div className="text-[#94a3b8]">
                <span className="font-bold text-white">ملاحظة التركيب الهامة:</span> الشاشات الإعلانية تركب فقط بأعداد صحيحة من المديولات. 
                المقاس المطلوب كان <span className="text-white font-semibold">{requestedWidthM.toFixed(2)}×{requestedHeightM.toFixed(2)} م</span>، 
                أما المقاس الفعلي المتناسق للشاشة هو <span className="text-[#22c55e] font-bold">{calculations.actualWidthM.toFixed(2)}×{calculations.actualHeightM.toFixed(2)} م</span>.
              </div>
            </div>
          </div>

          {/* QUICK BENTO BOX STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Bento Card 1: Modules */}
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative group overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-[#22c55e]" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] font-bold">إجمالي المديولات</span>
                <Cpu className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div className="my-3">
                <div className="text-2xl md:text-3xl font-black text-white">{calculations.totalModules}</div>
                <div className="text-[10px] text-[#22c55e] font-semibold mt-0.5">
                  {calculations.cols} مديول عرضاً × {calculations.rows} ارتفاعاً {isDoubleSided ? '(للوجه الواحد)' : ''}
                </div>
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                مقاس الواحد: {activeModule.widthMm}×{activeModule.heightMm} مم
              </div>
            </div>

            {/* Bento Card 2: Resolution */}
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-[#0ea5e9]" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] font-bold">دقة الشاشة الكلية</span>
                <Layers className="w-4 h-4 text-[#0ea5e9]" />
              </div>
              <div className="my-3">
                <div className="text-xl md:text-2xl font-black text-white">{calculations.totalPixelW} × {calculations.totalPixelH}</div>
                <div className="text-[10px] text-[#0ea5e9] font-semibold mt-0.5">
                  إجمالي: {calculations.totalPixels.toLocaleString()} بكسل
                </div>
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                كثافة: {Math.round(calculations.totalPixels / calculations.actualAreaM2).toLocaleString()} بكسل/م²
              </div>
            </div>

            {/* Bento Card 3: Power Supplies */}
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-[#f59e0b]" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] font-bold">محولات الطاقة 5V</span>
                <Zap className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <div className="my-3">
                <div className="text-2xl md:text-3xl font-black text-white">{calculations.powerSuppliesCount}</div>
                <div className="text-[10px] text-[#f59e0b] font-semibold mt-0.5">
                  أقصى حد آمن للمحول: {calculations.modulesPerPs} مديولات
                </div>
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                طراز: {activePs.name.split(' (')[0]}
              </div>
            </div>

            {/* Bento Card 4: Receiving Cards */}
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-cyan-400" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] font-bold">كروت الاستقبال</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="my-3">
                <div className="text-2xl md:text-3xl font-black text-white">{calculations.totalReceivingCards}</div>
                <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                  موزعة {calculations.cardsCols} أعمدة × {calculations.cardsRows} صفوف {isDoubleSided ? '(لكل وجه)' : ''}
                </div>
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                الكرت يغطي {calculations.colsPerCard}×{calculations.rowsPerCard} مديول كحد أقصى
              </div>
            </div>

            {/* Bento Card 5: Power Load AC */}
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-red-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] font-bold">استهلاك الكهرباء والقدرة بالساعة</span>
                <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              </div>
              <div className="my-2.5 text-right space-y-1">
                <div className="text-sm md:text-base font-black text-amber-400">
                  عند سطوع {brightnessPercent}%: {calculations.brightnessPowerKW.toFixed(2)} كيلوواط/ساعة (kWh)
                </div>
                <div className="text-xs font-bold text-slate-300">
                  التيار عند سطوع {brightnessPercent}%: {calculations.brightnessAmpsAC220.toFixed(1)} أمبير (220V)
                </div>
                <div className="border-t border-[#1f2937]/80 my-1" />
                <div className="text-[11px] text-gray-400">
                  الاستهلاك المتوسط الافتراضي: {calculations.averagePowerKW.toFixed(2)} كيلوواط/ساعة
                </div>
                <div className="text-[10px] text-red-400 font-semibold">
                  أقصى حمل لحظي متوقع: {(calculations.totalMaxPowerW / 1000).toFixed(2)} كيلوواط (kW)
                </div>
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                التيار الأقصى اللحظي: {calculations.totalAmpsAC220.toFixed(1)} أمبير (220V AC)
              </div>
            </div>

            {/* Bento Card 6: Dimensions Actual */}
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-purple-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] font-bold">المساحة الفعلية والتناسق</span>
                <Tv className="w-4 h-4 text-purple-500" />
              </div>
              <div className="my-3">
                <div className="text-lg md:text-xl font-black text-white">
                  {isDoubleSided ? (
                    <>
                      <span>{calculations.actualAreaM2.toFixed(2)} م² <span className="text-xs text-[#94a3b8] font-normal">(للوجه)</span></span>
                      <span className="block text-sm text-[#0ea5e9] mt-1">الإجمالي: {calculations.totalAreaM2.toFixed(2)} م²</span>
                    </>
                  ) : (
                    <span>{calculations.actualAreaM2.toFixed(2)} م²</span>
                  )}
                </div>
                <div className="text-[10px] text-purple-400 font-semibold mt-0.5">
                  تناسق الأبعاد: {getAspectRatio(calculations.cols, calculations.rows)}
                </div>
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                أبعاد الوجه: {calculations.actualWidthM.toFixed(2)}م × {calculations.actualHeightM.toFixed(2)}م
              </div>
            </div>

          </div>

          {/* CONTROLLER RECOMMENDATION DETAILS */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl">
            <h3 className="text-xs md:text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#22c55e]" />
              معالج الإرسال وكارت التحكم الموصى به للمشروع:
            </h3>
            
            <div className="bg-[#1e293b]/50 border border-[#334155] p-4 rounded-xl flex items-start gap-4">
              <div className="p-3 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20">
                <Cpu className="w-6 h-6 text-[#10b981]" />
              </div>
              <div className="flex-1">
                <div className="text-base font-black text-[#22c55e]">{calculations.recommendedController}</div>
                <div className="text-xs text-slate-300 mt-1">{calculations.controllerReason}</div>
                
                {/* Progress bar of controller capacity */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-[#64748b] mb-1 font-bold">
                    <span>استهلاك سعة المعالج:</span>
                    <span>{((calculations.totalPixels / calculations.controllerCapacity) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#111827] h-2 rounded-full overflow-hidden border border-[#1f2937]">
                    <div 
                      className="bg-[#22c55e] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (calculations.totalPixels / calculations.controllerCapacity) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-mono">
                    <span>دقة الشاشة: {calculations.totalPixels.toLocaleString()} بكسل</span>
                    <span>سعة المعالج الأقصى: {calculations.controllerCapacity.toLocaleString()} بكسل</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BREAKDOWN COST SCHEMATIC */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#a855f7]" />
                تقرير الميزانية المالية والتكاليف التقديرية
              </h3>
              <div className="text-xs text-gray-400">
                العملة المستخدمة: <span className="font-bold text-white">{currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Table items */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between text-xs py-1 border-b border-[#1f2937]">
                  <span className="text-[#94a3b8]">تكلفة مديولات LED ({calculations.totalModules} وحدة):</span>
                  <span className="font-bold text-white">{calculations.costModules.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[#1f2937]">
                  <span className="text-[#94a3b8]">تكلفة محولات الطاقة ({calculations.powerSuppliesCount} وحدة):</span>
                  <span className="font-bold text-white">{calculations.costPS.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[#1f2937]">
                  <span className="text-[#94a3b8]">تكلفة كروت الاستقبال ({calculations.totalReceivingCards} وحدة):</span>
                  <span className="font-bold text-white">{calculations.costCards.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[#1f2937]">
                  <span className="text-[#94a3b8]">تكلفة كرت الإرسال / المعالج:</span>
                  <span className="font-bold text-white">{calculations.costController.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[#1f2937]">
                  <span className="text-[#94a3b8]">تكلفة هياكل الكابينة والحديد:</span>
                  <span className="font-bold text-white">{calculations.costCabinet.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[#1f2937]">
                  <span className="text-[#94a3b8]">تكلفة التركيب وأجور البرمجة والعمالة:</span>
                  <span className="font-bold text-white">{calculations.costLabor.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}</span>
                </div>
              </div>

              {/* Total Summary Circle Card */}
              <div className="bg-[#1e293b]/40 border border-[#334155] rounded-xl p-5 flex flex-col justify-between items-center text-center">
                <div>
                  <div className="text-xs text-[#94a3b8] font-bold uppercase tracking-wider mb-1">
                    التكلفة الإجمالية المقدرة للمشروع
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-[#a855f7] drop-shadow-sm my-1.5">
                    {calculations.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-bold text-white mr-1.5">{currency}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[240px] mx-auto">
                    التكاليف أعلاه تقديرية بناءً على أسعار السوق للمكونات الفردية وتكلفة المصنعية المدخلة.
                  </p>
                </div>
                
                {/* Active Supplier Stats badge */}
                <div className="mt-4 pt-3 border-t border-[#334155]/60 w-full text-right text-[10px] space-y-1 text-[#94a3b8]">
                  <div className="flex justify-between">
                    <span>المورد: <strong className="text-[#e2e8f0] font-sans">{supplierName}</strong></span>
                    <span>آخر تعديل: <strong className="text-[#e2e8f0] font-mono">{lastPriceUpdate}</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>بلد التوريد: <strong className="text-[#e2e8f0] font-sans">{supplierCountry}</strong></span>
                    <span>المدينة: <strong className="text-[#e2e8f0] font-sans">{supplierCity}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COPY REPORT SECTION FOR WHATSAPP & PDF */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#22c55e]" />
                تصدير التقرير الفني ومشاركته
              </h3>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                يمكنك نسخ التقرير النصي لإرساله للواتساب، أو طباعة تقرير رسمي منظم ومنسق بالكامل كملف PDF لتقديمه للعملاء.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={copyToClipboard}
                className="px-5 py-3 bg-[#1e293b] hover:bg-[#2d3748] text-[#22c55e] font-black text-xs rounded-xl transition-all border border-[#22c55e]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>نسخ للواتساب</span>
              </button>

              <button
                onClick={handleOpenQuotationCreator}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-lg hover:shadow-purple-900/20 flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <FileText className="w-4 h-4" />
                <span>إنشاء وتنزيل عرض سعر رسمي 📄</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] hover:from-[#0284c7] hover:to-[#1d4ed8] text-white font-black text-xs rounded-xl transition-all shadow-lg hover:shadow-[#0ea5e9]/15 flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة / تحميل التقرير PDF</span>
              </button>
            </div>
          </div>

          {/* REAR PANEL SCHEMATIC & EDUCATIONAL GUIDE */}
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 shadow-xl">
            <h3 className="text-xs md:text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-[#1f2937] pb-2">
              <BookOpen className="w-4 h-4 text-[#3b82f6]" />
              دليل التوصيل والتركيب الفني السريع
            </h3>
            
            <div className="text-xs text-[#94a3b8] flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1e293b]/40 p-3 rounded-xl border border-[#334155]">
                  <h4 className="font-extrabold text-white text-[12px] mb-1.5 flex items-center gap-1">
                    <span className="bg-[#3b82f6] text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">1</span>
                    توصيل كروت التحكم (شبكة البيانات)
                  </h4>
                  <p className="text-[11px]">
                    يخرج كبل إيثرنت (Cat6) من مخرِج كرت الإرسال (Sending controller) ويدخل إلى كارت الاستقبال الأول في الشاشة، ثم يتم عمل جسر (Daisy Chain) من كرت الاستقبال الأول إلى الثاني وهكذا على شكل سلسلة مستمرة لضمان نقل الصورة.
                  </p>
                </div>

                <div className="bg-[#1e293b]/40 p-3 rounded-xl border border-[#334155]">
                  <h4 className="font-extrabold text-white text-[12px] mb-1.5 flex items-center gap-1">
                    <span className="bg-[#f59e0b] text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">2</span>
                    توصيل خطوط الطاقة والتغذية (5V DC)
                  </h4>
                  <p className="text-[11px]">
                    يقوم محول الطاقة بتحويل تيار 220V AC المتردد إلى تيار مستمر 5V DC منخفض الجهد. تأكد من استخدام كوابل طاقة نحاسية ذات قطر مناسب (مثل 2.5 مم²) وتجنب توصيل مديولات تزيد في استهلاكها عن قدرة المحول الآمنة المتوقعة.
                  </p>
                </div>
              </div>

              {/* Advanced info panel */}
              <div className="p-3 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white text-[12px] block mb-0.5">لماذا نوصي بنسبة أمان (80%)؟</span>
                  تستهلك الشاشات طاقتها القصوى فقط عند عرض صور بيضاء ساطعة بالكامل. لضمان عدم تلف محولات الطاقة وحمايتها من الاحتراق أو السخونة العالية نتيجة العوامل الجوية، يُنصح بقوة بعدم تحميل المحولات بأكثر من 80% من طاقتها المعلنة.
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* Modern Compact Footer */}
      <footer className="bg-[#0b0f19] border-t border-[#1f2937] py-4 text-center text-xs text-[#64748b] mt-auto print:hidden">
        <p className="font-medium">
          حاسبة الشاشات الإعلانية LED الاحترافية • نظام التقدير الرياضي المتكامل
        </p>
        <p className="text-[10px] mt-1 text-[#475569] font-mono">
          تم التصميم والبرمجة بدقة فائقة كمنتج متكامل لمعاملي ومبيعات شاشات الـ LED
        </p>
      </footer>

      {/* PRINT-ONLY OFFICIAL TECHNICAL REPORT VIEW */}
      {!isPrintingHistory && (
        <div className="hidden print:block bg-white text-slate-800 p-8 font-sans" style={{ direction: 'rtl' }}>
        {/* Header Block with official company letterhead */}
        <div className="border-b-4 border-[#1e3a8a] pb-6 mb-6">
          <div className="flex justify-between items-center">
            {/* Right: Company details and Logo */}
            <div className="flex items-center gap-4 text-right">
              <img 
                src={rabatLogo} 
                alt="أضواء الرباط للكهرباء" 
                className="w-16 h-16 rounded-xl object-cover border-2 border-[#1e3a8a]" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-xl font-black text-[#1e3a8a] leading-tight font-sans">أضواء الرباط للكهرباء</h1>
                <p className="text-xs font-bold text-slate-700 mt-0.5 font-sans">م/ رامي باذيب</p>
                <p className="text-[10px] text-slate-500 font-sans">اليمن - صنعاء | هاتف: <span className="font-mono font-bold">777220777</span></p>
                <p className="text-[10px] text-slate-500 font-mono">RAMYBADEEB@GMAIL.COM</p>
              </div>
            </div>

            {/* Left: Document details */}
            <div className="text-left">
              <h2 className="text-lg font-extrabold text-[#1e3a8a] leading-none font-sans">تقرير فني ومواصفات شاشة LED</h2>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">عرض مواصفات هندسي وتقدير مالي معتمد</p>
              <div className="mt-2.5 space-y-0.5 text-left">
                <p className="text-[10px] text-slate-600 font-sans">
                  <span className="font-bold">تاريخ الإصدار:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {clientName && (
                  <p className="text-[10px] text-slate-600 font-sans">
                    <span className="font-bold">اسم العميل:</span> {clientName}
                  </p>
                )}
                <p className="text-[9px] text-slate-400 font-mono">
                  REF: LED-RB-{new Date().getFullYear()}-{Math.floor(Math.random() * 9000 + 1000)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction Summary */}
        <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0] mb-6 text-right">
          <h2 className="text-sm font-bold text-[#1e3a8a] mb-1.5">ملخص المشروع والطلب المبدئي:</h2>
          <p className="text-xs leading-relaxed">
            تم إعداد هذا التقرير الفني وتصميم أبعاد الشاشة بناءً على المقاسات المبدئية المطلوبة {clientName ? `لصالح العميل الكريم (${clientName})` : 'من قِبل العميل'} والتي تبلغ 
            <span className="font-bold text-slate-900 mx-1">{reqWidth} × {reqHeight} {dimensionUnit === 'm' ? 'متر' : 'سم'}</span>. 
            وتمت مواءمة هذه الأبعاد هندسياً مع مقاسات المديولات المحددة لضمان أفضل تغطية تركيبية وأعلى ثبات ممكن للنظام.
          </p>
        </div>

        {/* Section 1: Dimensions & Resolutions */}
        <div className="mb-6 text-right">
          <h2 className="text-sm font-bold text-[#1e3a8a] mb-3 border-r-4 border-[#1e3a8a] pr-2.5">أولاً: الأبعاد الفعلية والدقة الهندسية</h2>
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[#1e3a8a] border-b border-slate-300">
                <th className="p-2 border border-slate-200">البيان الفني</th>
                <th className="p-2 border border-slate-200">القياس المطلوب</th>
                <th className="p-2 border border-slate-200">القياس الفعلي (النهائي للوجه الواحد)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">هيكل ونوع الشاشة</td>
                <td className="p-2 border border-slate-200">وجه واحد أو وجهين</td>
                <td className="p-2 border border-slate-200 font-bold text-[#1e3a8a]">{isDoubleSided ? 'شاشة وجهين (Double-Sided)' : 'شاشة وجه واحد (Single-Sided)'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold">العرض الكلي (للوجه الواحد)</td>
                <td className="p-2 border border-slate-200">{requestedWidthM.toFixed(2)} م</td>
                <td className="p-2 border border-slate-200 font-bold text-emerald-600">{calculations.actualWidthM.toFixed(2)} م ({calculations.cols} مديول)</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">الارتفاع الكلي (للوجه الواحد)</td>
                <td className="p-2 border border-slate-200">{requestedHeightM.toFixed(2)} م</td>
                <td className="p-2 border border-slate-200 font-bold text-emerald-600">{calculations.actualHeightM.toFixed(2)} م ({calculations.rows} مديول)</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold">المساحة الإجمالية للشاشة</td>
                <td className="p-2 border border-slate-200">{(requestedWidthM * requestedHeightM).toFixed(2)} م² {isDoubleSided ? '× 2' : ''}</td>
                <td className="p-2 border border-slate-200 font-bold text-[#1e3a8a]">
                  {isDoubleSided ? `${calculations.totalAreaM2.toFixed(2)} م² (مساحة الوجهين)` : `${calculations.actualAreaM2.toFixed(2)} م²`}
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">دقة العرض للوجه الواحد (Resolution)</td>
                <td className="p-2 border border-slate-200">---</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.totalPixelW} × {calculations.totalPixelH} بكسل</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold">إجمالي نقاط البكسل للوجه الواحد</td>
                <td className="p-2 border border-slate-200">---</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.totalPixels.toLocaleString()} بكسل</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">نسبة التناسق والامتداد (Aspect Ratio)</td>
                <td className="p-2 border border-slate-200">---</td>
                <td className="p-2 border border-slate-200 font-bold">{getAspectRatio(calculations.cols, calculations.rows)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Technical Specifications & Bill of Materials */}
        <div className="mb-6 text-right" style={{ breakInside: 'avoid' }}>
          <h2 className="text-sm font-bold text-[#1e3a8a] mb-3 border-r-4 border-[#1e3a8a] pr-2.5">ثانياً: مواصفات مديولات الـ LED والمعدات المطلوبة</h2>
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[#1e3a8a] border-b border-slate-300">
                <th className="p-2 border border-slate-200">البند والمكون الفني</th>
                <th className="p-2 border border-slate-200 font-bold">المواصفات المختارة والكميات المطلوبة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">نوع المديول المستهدف (LED Module)</td>
                <td className="p-2 border border-slate-200">{activeModule.name} (بيتش {activeModule.pitch} مم، مقاس {activeModule.widthMm}×{activeModule.heightMm} مم)</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold">إجمالي عدد مديولات LED المطلوبة</td>
                <td className="p-2 border border-slate-200 font-bold text-slate-900">
                  {calculations.totalModules} مديول {isDoubleSided ? '(إجمالي للوجهين)' : ''} <span className="text-xs font-normal">({calculations.cols} عرضاً × {calculations.rows} ارتفاعاً للوجه الواحد)</span>
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">محولات الطاقة 5V (Power Supplies)</td>
                <td className="p-2 border border-slate-200 font-bold text-slate-900">{calculations.powerSuppliesCount} محول <span className="text-xs font-normal">(طراز {activePs.name.split(' (')[0]} - مستوى أمان {psSafetyMargin}%)</span></td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold">كروت الاستقبال (Receiving Cards)</td>
                <td className="p-2 border border-slate-200 font-bold text-slate-900">
                  {calculations.totalReceivingCards} كرت استقبال {isDoubleSided ? '(إجمالي للوجهين)' : ''} <span className="text-xs font-normal">({calculations.cardsCols} أعمدة × {calculations.cardsRows} صفوف للوجه الواحد)</span>
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">معالج الإرسال والتحكم (Sending Card)</td>
                <td className="p-2 border border-slate-200 text-slate-700">{calculations.recommendedController} <br/><span className="text-[10px] text-slate-500">{calculations.controllerReason}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Power Usage */}
        <div className="mb-6 text-right">
          <h2 className="text-sm font-bold text-[#1e3a8a] mb-3 border-r-4 border-[#1e3a8a] pr-2.5">ثالثاً: دراسة التغذية الكهربائية واستهلاك الطاقة</h2>
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[#1e3a8a] border-b border-slate-300">
                <th className="p-2 border border-slate-200">البيان الكهربائي والقدرة</th>
                <th className="p-2 border border-slate-200">القيمة الفنية المقدرة</th>
                <th className="p-2 border border-slate-200">ملاحظات السلامة والأمان والإرشادات</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">أقصى استهلاك متوقع (Max Power)</td>
                <td className="p-2 border border-slate-200 font-bold">{(calculations.totalMaxPowerW / 1000).toFixed(2)} كيلوواط</td>
                <td className="p-2 border border-slate-200" rowSpan={6}>
                  * يجب تأمين تيار كهربائي مستقر ومستمر ذو جودة عالية.<br/>
                  * يُنصح باستخدام قواطع كهربائية عالية الجودة وكابلات ذات مقطع مناسب لحمل التيار.<br/>
                  * التوزيع المتوازن للأحمال على الفازات الثلاثة (في حال استخدام نظام 3-Phase) ضروري لحماية محولات الطاقة.
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold">الاستهلاك المتوسط الافتراضي (kWh)</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.averagePowerKW.toFixed(2)} كيلوواط/ساعة</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-bold text-amber-700">الاستهلاك عند سطوع مخصص ({brightnessPercent}%)</td>
                <td className="p-2 border border-slate-200 font-bold text-amber-700">{calculations.brightnessPowerKW.toFixed(2)} كيلوواط/ساعة</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold text-amber-700">التيار الكهربائي عند سطوع مخصص ({brightnessPercent}%)</td>
                <td className="p-2 border border-slate-200 font-bold text-amber-700">{calculations.brightnessAmpsAC220.toFixed(1)} أمبير</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-bold">أقصى تيار مستهلك لحظي (AC Ampere)</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.totalAmpsAC220.toFixed(1)} أمبير</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200 font-bold">القاطع الكهربائي الموصى به</td>
                <td className="p-2 border border-slate-200 font-bold text-[#1e3a8a]">{calculations.recommendedBreaker}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Budget */}
        <div className="mb-8 text-right" style={{ breakInside: 'avoid' }}>
          <h2 className="text-sm font-bold text-[#1e3a8a] mb-3 border-r-4 border-[#1e3a8a] pr-2.5">رابعاً: كشف التكاليف والميزانية المالية التقديرية</h2>
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[#1e3a8a] border-b border-slate-300">
                <th className="p-2 border border-slate-200">البند المالي</th>
                <th className="p-2 border border-slate-200">حساب الوحدة / المساحة</th>
                <th className="p-2 border border-slate-200 font-bold">الإجمالي الفرعي ({currency})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-200">تكلفة مديولات LED</td>
                <td className="p-2 border border-slate-200">{calculations.totalModules} وحدة × {pricing.modulePrice} {currency}</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.costModules.toLocaleString()} {currency}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200">تكلفة محولات الطاقة 5V</td>
                <td className="p-2 border border-slate-200">{calculations.powerSuppliesCount} وحدة × {pricing.psPrice} {currency}</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.costPS.toLocaleString()} {currency}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">تكلفة كروت الاستقبال</td>
                <td className="p-2 border border-slate-200">{calculations.totalReceivingCards} كرت × {pricing.cardPrice} {currency}</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.costCards.toLocaleString()} {currency}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200">معالج الفيديو والتحكم الأساسي</td>
                <td className="p-2 border border-slate-200">جهاز موصى به متكامل</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.costController.toLocaleString()} {currency}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">تجهيز الهياكل المعدنية والكبائن للتركيب</td>
                <td className="p-2 border border-slate-200">{calculations.totalAreaM2.toFixed(2)} م² × {pricing.cabinetPrice} {currency}/م²</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.costCabinet.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-200">أجور التركيب، اللحام، البرمجة والعمالة</td>
                <td className="p-2 border border-slate-200">{calculations.totalAreaM2.toFixed(2)} م² × {pricing.laborPrice} {currency}/م²</td>
                <td className="p-2 border border-slate-200 font-bold">{calculations.costLabor.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}</td>
              </tr>
              <tr className="bg-slate-100 text-[#1e3a8a] font-extrabold text-sm">
                <td className="p-3 border border-slate-300" colSpan={2}>التكلفة الإجمالية التقديرية للمشروع</td>
                <td className="p-3 border border-slate-300 font-black text-base text-right text-purple-700">
                  {calculations.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-slate-500 mt-2 italic text-left">* التكاليف أعلاه تقديرية وعرضة للتغيير بناءً على فروقات أسعار الشحن وأسعار السوق الفورية.</p>
          
          {/* Supplier details box inside the official report */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1" style={{ breakInside: 'avoid' }}>
            <h3 className="font-bold text-[#1e3a8a] text-xs mb-1.5 border-b border-slate-200 pb-1">📋 تفاصيل الجهة الموردة ومصدر تسعير المكونات فئة LED PRO:</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
              <div>
                <span className="text-slate-500">اسم المورد المعتمد:</span> <span className="font-bold text-slate-800">{supplierName}</span>
              </div>
              <div>
                <span className="text-slate-500">تاريخ آخر تعديل للأسعار:</span> <span className="font-mono font-bold text-slate-800">{lastPriceUpdate}</span>
              </div>
              <div>
                <span className="text-slate-500">بلد التوريد والمنشأ:</span> <span className="font-bold text-slate-800">{supplierCountry}</span>
              </div>
              <div>
                <span className="text-slate-500">مدينة التوريد:</span> <span className="font-bold text-slate-800">{supplierCity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Visual Layouts & Schematics (المخططات الفنية والرسومات) */}
        <div className="mb-8 text-right" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
          <h2 className="text-sm font-bold text-[#1e3a8a] mb-3 border-r-4 border-[#1e3a8a] pr-2.5">خامساً: المخططات الهندسية وتوزيع المكونات</h2>
          <div className="grid grid-cols-2 gap-6 mt-4">
            
            {/* Module Layout */}
            <div className="border border-slate-300 rounded-lg p-3 bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2 border-b pb-1 text-center">1. مخطط توزيع المديولات ({calculations.faceModules} مديول للوجه الواحد)</h3>
                <div className="flex items-center justify-center p-2 bg-slate-50 border rounded min-h-[160px]">
                  <div className="grid gap-0.5 w-full max-w-[240px]"
                       style={{
                         gridTemplateColumns: `repeat(${calculations.cols}, minmax(0, 1fr))`,
                         gridTemplateRows: `repeat(${calculations.rows}, minmax(0, 1fr))`,
                         aspectRatio: `${calculations.actualWidthM} / ${calculations.actualHeightM}`,
                       }}
                  >
                    {Array.from({ length: Math.min(120, calculations.faceModules) }).map((_, idx) => (
                      <div key={idx} className="bg-white border border-slate-300 text-[7px] font-mono flex items-center justify-center text-slate-600 font-bold">
                        {idx + 1}
                      </div>
                    ))}
                    {calculations.faceModules > 120 && (
                      <div className="col-span-full text-[9px] text-slate-500 text-center py-4 bg-white/80 border">
                        تم تبسيط المخطط ({calculations.faceModules} مديول) لتلائم صفحة الطباعة
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5 text-center font-bold">توزيع الشبكة: {calculations.cols} مديول عرضاً × {calculations.rows} مديول ارتفاعاً</p>
            </div>

            {/* Receiving Cards Layout */}
            <div className="border border-slate-300 rounded-lg p-3 bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2 border-b pb-1 text-center">2. مخطط توزيع كروت الاستقبال ({calculations.totalReceivingCards} كرت إجمالي)</h3>
                <div className="flex items-center justify-center p-2 bg-slate-50 border rounded min-h-[160px]">
                  <div className="grid gap-1 w-full max-w-[240px]"
                       style={{
                         gridTemplateColumns: `repeat(${calculations.cardsCols}, minmax(0, 1fr))`,
                         gridTemplateRows: `repeat(${calculations.cardsRows}, minmax(0, 1fr))`,
                         aspectRatio: `${calculations.actualWidthM} / ${calculations.actualHeightM}`,
                       }}
                  >
                    {Array.from({ length: calculations.cardsCols * calculations.cardsRows }).map((_, idx) => (
                      <div key={idx} className="bg-sky-50 border border-sky-400 rounded text-[8px] font-bold flex flex-col items-center justify-center text-sky-800 p-1 text-center">
                        <span className="font-bold">كرت {idx + 1}</span>
                        <span className="text-[7px] text-slate-500 font-normal font-mono">{calculations.colsPerCard}×{calculations.rowsPerCard} م</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5 text-center font-bold">تغطية الكروت: {calculations.cardsCols} أعمدة × {calculations.cardsRows} صفوف للوجه الواحد</p>
            </div>

            {/* Power Supply Coverage */}
            <div className="border border-slate-300 rounded-lg p-3 bg-white col-span-2">
              <h3 className="text-xs font-bold text-slate-800 mb-2 border-b pb-1 text-center">3. مخطط توزيع خطوط التغذية وتوزيع محولات الطاقة (5V Power Routing)</h3>
              <div className="flex items-center justify-center p-3 bg-slate-50 border rounded min-h-[180px]">
                <div className="grid gap-1 w-full max-w-[480px]"
                     style={{
                       gridTemplateColumns: `repeat(${calculations.cols}, minmax(0, 1fr))`,
                       gridTemplateRows: `repeat(${calculations.rows}, minmax(0, 1fr))`,
                       aspectRatio: `${calculations.actualWidthM} / ${calculations.actualHeightM}`,
                     }}
                >
                  {Array.from({ length: Math.min(120, calculations.faceModules) }).map((_, idx) => {
                    const psIndex = getPsIndexForModule(idx, calculations.cols, calculations.rows);
                    const hue = (psIndex * 137.5) % 360;
                    return (
                      <div key={idx} 
                           className="border text-[7px] font-mono font-bold flex flex-col items-center justify-center py-0.5"
                           style={{
                             backgroundColor: `hsla(${hue}, 80%, 96%, 1)`,
                             borderColor: `hsla(${hue}, 60%, 45%, 0.8)`,
                             color: `hsla(${hue}, 100%, 25%, 1)`
                           }}
                      >
                        <span>P{psIndex}</span>
                        <span className="text-[5px] opacity-75">M{idx + 1}</span>
                      </div>
                    );
                  })}
                  {calculations.faceModules > 120 && (
                    <div className="col-span-full text-[9px] text-slate-500 text-center py-4 bg-white/80 border">
                      تم تبسيط المخطط التوجيهي لمصادر الطاقة لتسهيل قراءته في صفحة المطبوعات.
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5 text-center font-bold">كل لون يمثل مجموعة تتغذى من محول طاقة مستقل لضمان اتزان الحمل الكهربائي (توزيع مصفوفة مخصصة زوجية {psBlockWidth} × {psBlockHeight} مديول وبحد أقصى {calculations.modulesPerPs} مديول لكل محول)</p>
            </div>

          </div>
        </div>

        {/* Section 6: Signature Blocks */}
        <div className="mt-12 border-t border-slate-200 pt-8" style={{ breakInside: 'avoid' }}>
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700 mb-10">المهندس الفني المسؤول</p>
              <div className="w-40 h-0.5 bg-slate-300 mx-auto" />
              <p className="text-[10px] text-slate-400 mt-2">التوقيع / الختم</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-10">اعتماد وموافقة العميل</p>
              <div className="w-40 h-0.5 bg-slate-300 mx-auto" />
              <p className="text-[10px] text-slate-400 mt-2">التوقيع / التاريخ</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PRINT-ONLY PREVIOUS REQUESTS HISTORY LOG */}
      {isPrintingHistory && (
        <div className="hidden print:block bg-white text-slate-800 p-8 font-sans text-right" style={{ direction: 'rtl' }}>
          <div className="border-b-4 border-[#1e3a8a] pb-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src={rabatLogo} 
                alt="أضواء الرباط للكهرباء" 
                className="w-14 h-14 rounded-xl object-cover border-2 border-[#1e3a8a]" 
                referrerPolicy="no-referrer"
              />
              <div className="text-right">
                <h1 className="text-lg font-black text-[#1e3a8a] leading-tight">أضواء الرباط للكهرباء</h1>
                <p className="text-[10px] text-slate-500 font-bold">اليمن - صنعاء | هاتف: <span className="font-mono">777220777</span></p>
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-base font-extrabold text-[#1e3a8a] leading-none">سجل طلبات وعروض أسعار العملاء</h2>
              <p className="text-[9px] text-slate-500 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-4">
            يحتوي هذا الجدول على قائمة مسجلة بطلبات العملاء وحساباتها الفنية والتقدير المالي المحفوظ في سجل النظام منسقاً كجدول Excel:
          </p>

          <table className="w-full text-right text-[11px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                <th className="p-2 border border-slate-400 text-center w-8 font-bold">#</th>
                <th className="p-2 border border-slate-400 font-bold">اسم العميل الكريم</th>
                <th className="p-2 border border-slate-400 text-center font-bold">تاريخ الحفظ</th>
                <th className="p-2 border border-slate-400 text-center font-bold">المقاس المطلوب</th>
                <th className="p-2 border border-slate-400 text-center font-bold">الأبعاد الفعلية النهائية للشاشة LED</th>
                <th className="p-2 border border-slate-400 font-bold">موديل المديول المستخدم</th>
                <th className="p-2 border border-slate-400 text-left font-bold">التكلفة التقديرية</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, idx) => (
                <tr key={req.id} className="border-b border-slate-300 hover:bg-slate-50 even:bg-slate-50/50">
                  <td className="p-2 border border-slate-400 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 border border-slate-400 font-bold text-slate-900">{req.clientName}</td>
                  <td className="p-2 border border-slate-400 text-center text-[10px] text-slate-500 font-mono">{req.date}</td>
                  <td className="p-2 border border-slate-400 text-center">{req.reqWidth} × {req.reqHeight} {req.dimensionUnit === 'm' ? 'متر' : 'سم'}</td>
                  <td className="p-2 border border-slate-400 text-center font-semibold text-slate-700">{req.actualWidthM.toFixed(2)} × {req.actualHeightM.toFixed(2)} م ({req.isDoubleSided ? 'وجهين' : 'وجه واحد'})</td>
                  <td className="p-2 border border-slate-400 text-slate-600">{req.moduleName}</td>
                  <td className="p-2 border border-slate-400 text-left font-black text-emerald-700 font-mono text-xs">{Math.round(req.totalCost).toLocaleString()} {req.currency || 'USD'}</td>
                </tr>
              ))}
              {/* Summary / Excel Totals Row */}
              <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900">
                <td colSpan={2} className="p-2 border border-slate-400 text-right font-black">الإجمالي الكلي للسجل:</td>
                <td className="p-2 border border-slate-400 text-center font-mono font-bold text-[#1e3a8a]">{filteredRequests.length} عميل</td>
                <td className="p-2 border border-slate-400 text-center">---</td>
                <td className="p-2 border border-slate-400 text-center font-semibold text-[#1e3a8a]">
                  {filteredRequests.reduce((sum, r) => sum + (r.actualWidthM * r.actualHeightM * (r.isDoubleSided ? 2 : 1)), 0).toFixed(2)} م² (مساحة إجمالية)
                </td>
                <td className="p-2 border border-slate-400 text-right font-semibold text-[#1e3a8a]">
                  {filteredRequests.reduce((sum, r) => sum + r.totalModules, 0).toLocaleString()} مديول
                </td>
                <td className="p-2 border border-slate-400 text-left font-mono font-black text-emerald-800 text-xs">
                  {filteredRequests.reduce((sum, r) => sum + r.totalCost, 0).toLocaleString()} {currency}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 flex justify-between items-center text-[10px] text-slate-500 border-t pt-4">
            <span>مؤسسة أضواء الرباط لتقنية شاشات الـ LED • صنعاء - اليمن</span>
            <span className="font-bold">المشرف المسؤول: م/ رامي باذيب</span>
          </div>
        </div>
      )}

      {/* PRINT-ONLY SUPPLIERS COMPARATIVE PRICE REPORT */}
      {isPrintingSuppliers && (
        <div className="hidden print:block bg-white text-slate-800 p-8 font-sans text-right animate-fade-in" style={{ direction: 'rtl' }}>
          {/* Company header */}
          <div className="border-b-4 border-[#1e3a8a] pb-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src={rabatLogo} 
                alt="أضواء الرباط للكهرباء" 
                className="w-14 h-14 rounded-xl object-cover border-2 border-[#1e3a8a]" 
                referrerPolicy="no-referrer"
              />
              <div className="text-right">
                <h1 className="text-lg font-black text-[#1e3a8a] leading-tight">أضواء الرباط للكهرباء</h1>
                <p className="text-[10px] text-slate-500 font-bold">اليمن - صنعاء | م/ رامي باذيب</p>
                <p className="text-[10px] text-slate-500 font-mono">777220777 | RAMYBADEEB@GMAIL.COM</p>
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-base font-extrabold text-[#1e3a8a] leading-none">تقرير مقارنة أسعار الموردين والقطع الفنية</h2>
              <p className="text-[9px] text-slate-500 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-4 font-sans leading-relaxed">
            يحتوي هذا الجدول المقارن على قائمة أسعار المواد والقطع لجميع الموردين المسجلين في النظام، مما يسهل عملية مراجعة وتفاوض الأسعار واختيار المورد الأنسب لشاشات LED:
          </p>

          <table className="w-full text-center text-[11px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                <th className="p-2 border border-slate-400 text-right font-sans">الصنف الفني / القطعة</th>
                {suppliers.map(s => (
                  <th key={s.id} className="p-2 border border-slate-400 font-bold">
                    <span className="block text-[#1e3a8a] text-xs font-bold">{s.name}</span>
                    <span className="block text-[9px] text-slate-500 font-normal">{s.country} ({s.city})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* LED Modules */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={suppliers.length + 1} className="p-1.5 border border-slate-400 text-right text-[12px] text-[#1e3a8a]">1. مديولات شاشات LED الإعلانية (للحبة الواحدة)</td>
              </tr>
              {PREDEFINED_MODULES.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 even:bg-slate-50/50">
                  <td className="p-2 border border-slate-400 text-right font-medium">{m.name}</td>
                  {suppliers.map(s => (
                    <td key={s.id} className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{s.itemPrices[m.id] ?? '-'} {currency}</td>
                  ))}
                </tr>
              ))}
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-400 text-right font-medium">مديول مخصص</td>
                {suppliers.map(s => (
                  <td key={s.id} className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{s.itemPrices['custom-module'] ?? '-'} {currency}</td>
                ))}
              </tr>

              {/* Power Supplies */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={suppliers.length + 1} className="p-1.5 border border-slate-400 text-right text-[12px] text-[#1e3a8a]">2. محولات الطاقة ومزودات الجهد 5V (للحبة الواحدة)</td>
              </tr>
              {POWER_SUPPLIES.map(ps => (
                <tr key={ps.id} className="hover:bg-slate-50 even:bg-slate-50/50">
                  <td className="p-2 border border-slate-400 text-right font-medium">{ps.name}</td>
                  {suppliers.map(s => {
                    const priceKey = ps.id === 'custom' ? 'custom-ps' : ps.id;
                    return (
                      <td key={s.id} className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{s.itemPrices[priceKey] ?? '-'} {currency}</td>
                    );
                  })}
                </tr>
              ))}

              {/* Receiving Cards */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={suppliers.length + 1} className="p-1.5 border border-slate-400 text-right text-[12px] text-[#1e3a8a]">3. كروت الاستقبال للبيانات (للحبة الواحدة)</td>
              </tr>
              {RECEIVING_CARDS.map(card => (
                <tr key={card.id} className="hover:bg-slate-50 even:bg-slate-50/50">
                  <td className="p-2 border border-slate-400 text-right font-medium">{card.name}</td>
                  {suppliers.map(s => {
                    const priceKey = card.id === 'custom' ? 'custom-card' : card.id;
                    return (
                      <td key={s.id} className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{s.itemPrices[priceKey] ?? '-'} {currency}</td>
                    );
                  })}
                </tr>
              ))}

              {/* Additional Services & Systems */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={suppliers.length + 1} className="p-1.5 border border-slate-400 text-right text-[12px] text-[#1e3a8a]">4. الخدمات المضافة، معالجات الإرسال، والتصنيع</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-400 text-right font-medium">سعر كرت الإرسال / معالج الفيديو الافتراضي</td>
                {suppliers.map(s => (
                  <td key={s.id} className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{s.controllerPrice ?? '-'} {currency}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50 even:bg-slate-50/50">
                <td className="p-2 border border-slate-400 text-right font-medium">أجور تجهيز وهيكل كابينة الحديد (لكل متر مربع)</td>
                {suppliers.map(s => (
                  <td key={s.id} className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{s.cabinetPrice ?? '-'} {currency}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border border-slate-400 text-right font-medium">أجور التركيب والبرمجة والتمديد (لكل متر مربع)</td>
                {suppliers.map(s => (
                  <td key={s.id} className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{s.laborPrice ?? '-'} {currency}</td>
                ))}
              </tr>
            </tbody>
          </table>

          <div className="mt-8 flex justify-between items-center text-[10px] text-slate-500 border-t pt-4">
            <span>مؤسسة أضواء الرباط للتوريد المباشر والكهرباء • صنعاء - اليمن</span>
            <span className="font-bold">المشرف المسؤول: م/ رامي باذيب</span>
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL QUOTATION OFFER SHEET */}
      {isPrintingQuotation && (
        <div className="hidden print:block bg-white text-slate-800 p-8 font-sans text-right animate-fade-in" style={{ direction: 'rtl' }}>
          {/* Header Block with official company letterhead */}
          <div className="border-b-4 border-[#1e3a8a] pb-6 mb-6">
            <div className="flex justify-between items-center">
              {/* Right: Company details and Logo */}
              <div className="flex items-center gap-4 text-right">
                <img 
                  src={rabatLogo} 
                  alt="أضواء الرباط للكهرباء" 
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[#1e3a8a]" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h1 className="text-xl font-black text-[#1e3a8a] leading-tight font-sans">أضواء الرباط للكهرباء</h1>
                  <p className="text-xs font-bold text-slate-700 mt-0.5 font-sans">م/ رامي باذيب</p>
                  <p className="text-[10px] text-slate-500 font-sans">اليمن - صنعاء | هاتف: <span className="font-mono font-bold">777220777</span></p>
                  <p className="text-[10px] text-slate-500 font-mono">RAMYBADEEB@GMAIL.COM</p>
                </div>
              </div>

              {/* Left: Document details */}
              <div className="text-left">
                <h2 className="text-lg font-extrabold text-[#1e3a8a] leading-none font-sans">عرض سعر معتمد (Quotation)</h2>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">توريد وتركيب وتشغيل شاشات LED الإعلانية</p>
                <div className="mt-2.5 space-y-0.5 text-left">
                  <p className="text-[10px] text-slate-600 font-sans">
                    <span className="font-bold">رقم العرض:</span> <span className="font-mono font-bold">{quotationId}</span>
                  </p>
                  <p className="text-[10px] text-slate-600 font-sans">
                    <span className="font-bold">التاريخ:</span> {quotationDate}
                  </p>
                  {clientName && (
                    <p className="text-[10px] text-slate-600 font-sans">
                      <span className="font-bold">اسم العميل:</span> {clientName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Intro */}
          <p className="text-xs text-slate-700 mb-4 leading-relaxed font-sans">
            نهديكم أطيب التحايا، وبناءً على طلبكم الكريم وتحديد الأبعاد الهندسية المطلوبة لشاشة LED الإعلانية بمقاس 
            <span className="font-bold mx-1">{reqWidth} × {reqHeight} {dimensionUnit === 'm' ? 'متر' : 'سم'}</span> 
            ({isDoubleSided ? 'شاشة وجهين' : 'شاشة وجه واحد'})، يسعدنا أن نتقدم لكم بعرض السعر والمواصفات الفنية المعتمدة للقطع والتركيب كالتالي:
          </p>

          {/* Quotation Table styled exactly like an Excel Spreadsheet */}
          <table className="w-full text-right text-xs border-collapse border border-slate-400 mb-6">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                <th className="p-2 border border-slate-400 text-center w-8">#</th>
                <th className="p-2 border border-slate-400">بيان الصنف والمواصفات الفنية للقطع</th>
                <th className="p-2 border border-slate-400 text-center w-16">الكمية</th>
                <th className="p-2 border border-slate-400 text-center w-16">الوحدة</th>
                <th className="p-2 border border-slate-400 text-left w-24">سعر الوحدة</th>
                <th className="p-2 border border-slate-400 text-left w-28">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {quotationItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 even:bg-slate-50/50 animate-fade-in">
                  <td className="p-2 border border-slate-400 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 border border-slate-400 font-sans font-semibold text-slate-900">{item.name}</td>
                  <td className="p-2 border border-slate-400 text-center font-mono font-bold">{item.qty}</td>
                  <td className="p-2 border border-slate-400 text-center font-sans">{item.unit}</td>
                  <td className="p-2 border border-slate-400 text-left font-mono font-bold">{Math.round(item.price).toLocaleString()} {currency}</td>
                  <td className="p-2 border border-slate-400 text-left font-mono font-black text-slate-900">{Math.round(item.qty * item.price).toLocaleString()} {currency}</td>
                </tr>
              ))}
              
              {/* Financial Summary rows */}
              <tr>
                <td colSpan={4} className="p-2 border border-slate-400 text-left font-bold bg-slate-50">المجموع الفرعي قبل الخصم:</td>
                <td colSpan={2} className="p-2 border border-slate-400 text-left font-mono font-bold text-slate-800 bg-slate-50">{Math.round(quotationTotals.subtotal).toLocaleString()} {currency}</td>
              </tr>
              {quotationTotals.discountVal > 0 && (
                <tr>
                  <td colSpan={4} className="p-2 border border-slate-400 text-left font-bold text-red-600 bg-red-50/25">قيمة الخصم الممنوح {quotationDiscountType === 'percent' ? `(${quotationDiscount}%)` : ''}:</td>
                  <td colSpan={2} className="p-2 border border-slate-400 text-left font-mono font-bold text-red-600 bg-red-50/25">-{Math.round(quotationTotals.discountVal).toLocaleString()} {currency}</td>
                </tr>
              )}
              {quotationTaxPercent > 0 && (
                <tr>
                  <td colSpan={4} className="p-2 border border-slate-400 text-left font-bold text-slate-600">ضريبة القيمة المضافة ({quotationTaxPercent}%):</td>
                  <td colSpan={2} className="p-2 border border-slate-400 text-left font-mono font-bold text-slate-700">{Math.round(quotationTotals.taxVal).toLocaleString()} {currency}</td>
                </tr>
              )}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colSpan={4} className="p-2 border border-slate-400 text-left font-black text-[#1e3a8a] text-sm">صافي إجمالي القيمة النهائية للعرض:</td>
                <td colSpan={2} className="p-2 border border-slate-400 text-left font-mono font-black text-emerald-700 text-sm">{Math.round(quotationTotals.netTotal).toLocaleString()} {currency}</td>
              </tr>
            </tbody>
          </table>

          {/* Terms and Conditions Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-right" style={{ breakInside: 'avoid' }}>
            {/* Terms */}
            <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-300">
              <h3 className="text-xs font-black text-[#1e3a8a] mb-2 border-b pb-1">📜 شروط وأحكام التعاقد والتوريد:</h3>
              <div className="text-[10px] text-slate-700 leading-relaxed space-y-1 whitespace-pre-line font-sans">
                {quotationTerms}
              </div>
            </div>

            {/* Notes / Technical Specs */}
            <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-300">
              <h3 className="text-xs font-black text-[#1e3a8a] mb-2 border-b pb-1">💡 ملاحظات وتأكيدات فنية إضافية:</h3>
              <p className="text-[10px] text-slate-700 leading-relaxed font-sans mb-3">
                - الأبعاد الفعلية النهائية للشاشة ستكون: <strong className="text-[#1e3a8a]">{calculations.actualWidthM.toFixed(2)} متر عرضاً × {calculations.actualHeightM.toFixed(2)} متر ارتفاعاً</strong>.
                <br />
                - دقة الشاشة الإجمالية: <strong className="text-slate-900">{calculations.totalPixelW} × {calculations.totalPixelH} بكسل</strong>.
                <br />
                - معالج الإرسال المقترح: <strong className="text-[#1e3a8a]">{calculations.recommendedController.split(' (')[0]}</strong>.
              </p>
              {quotationNotes && (
                <div className="text-[10px] text-emerald-800 bg-emerald-50/30 p-2 rounded border border-emerald-200/50 font-sans">
                  <strong className="text-emerald-900">ملاحظة هامة:</strong> {quotationNotes}
                </div>
              )}
            </div>
          </div>

          {/* Official Signatures and Stamp Block */}
          <div className="grid grid-cols-2 text-center text-xs mt-12 border-t pt-8" style={{ breakInside: 'avoid' }}>
            <div>
              <p className="font-bold text-slate-700 mb-12">أضواء الرباط للكهرباء وشاشات LED</p>
              <div className="w-40 h-0.5 bg-slate-300 mx-auto" />
              <p className="text-[10px] text-slate-500 mt-2">المدير المسؤول: م/ رامي باذيب</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-12">اعتماد وموافقة العميل الكريم</p>
              <div className="w-40 h-0.5 bg-slate-300 mx-auto" />
              <p className="text-[10px] text-slate-500 mt-2">التوقيع / الختم الرسمي</p>
            </div>
          </div>

          {/* Footer of quotation */}
          <div className="mt-8 flex justify-between items-center text-[10px] text-slate-400 border-t pt-4">
            <span>مؤسسة أضواء الرباط لتقنية شاشات الـ LED • صنعاء - اليمن</span>
            <span>هاتف: 777220777</span>
          </div>
        </div>
      )}

      {/* 📄 INTERACTIVE OFFICIAL QUOTATION BUILDER & EDITOR MODAL */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 print:hidden" style={{ direction: 'rtl' }}>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-900/15 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0b0f19]">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                  <FileText className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-white">مُنشئ ومحرر عروض الأسعار الرسمية <span className="text-[#22c55e]">LED Pro</span></h3>
                  <p className="text-xs text-slate-400">تعديل بنود الصفقة، إضافة خدمات مخصصة، تخصيص الخصومات، السداد، والطباعة بأسلوب Excel</p>
                </div>
              </div>
              <button 
                onClick={() => setShowQuotationModal(false)}
                className="text-slate-400 hover:text-white bg-[#1e293b] hover:bg-slate-800 p-2 rounded-xl transition-all cursor-pointer border-none"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0b0f19]/30">
              
              {/* Document Specs Block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#111827] p-4 rounded-xl border border-[#1e293b]">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">رقم عرض السعر:</label>
                  <input
                    type="text"
                    value={quotationId}
                    onChange={(e) => setQuotationId(e.target.value)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">تاريخ العرض:</label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white text-center"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1">اسم العميل والجهة المستفيدة:</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="اسم العميل الكريم..."
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                  />
                </div>
              </div>

              {/* Items Grid Editor */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-xs text-[#a78bfa] flex items-center gap-1">
                    <span>📋 بنود ومكونات العرض المالية الفعالة:</span>
                    <span className="text-[10px] text-slate-500 font-normal">(تلقائية من الحسابات الفنية المعتمدة)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCustomQuotationItem}
                    className="bg-purple-600/10 hover:bg-purple-600/20 text-[#a78bfa] border border-purple-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة بند مخصص جديد</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#1e293b] rounded-xl bg-[#111827]">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-[#1e293b] text-[#94a3b8] font-bold border-b border-[#334155]">
                        <th className="p-2.5 text-center w-8">#</th>
                        <th className="p-2.5">بيان بند المكون الفني للتركيب والقطع</th>
                        <th className="p-2.5 text-center w-16">الكمية</th>
                        <th className="p-2.5 text-center w-16">الوحدة</th>
                        <th className="p-2.5 text-center w-24">السعر المفرد ({currency})</th>
                        <th className="p-2.5 text-left w-24">الإجمالي ({currency})</th>
                        <th className="p-2.5 text-center w-10">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {quotationItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-[#1e293b]/30">
                          <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateQuotationItem(item.id, 'name', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-purple-500 focus:outline-none text-white text-xs font-semibold py-0.5"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleUpdateQuotationItem(item.id, 'qty', Math.max(0.01, parseFloat(e.target.value) || 0))}
                              className="w-14 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateQuotationItem(item.id, 'unit', e.target.value)}
                              className="w-12 bg-[#1e293b] border border-[#334155] rounded text-center text-white py-0.5"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleUpdateQuotationItem(item.id, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-20 bg-[#1e293b] border border-[#334155] rounded text-center text-white font-mono font-bold py-0.5"
                            />
                          </td>
                          <td className="p-2.5 text-left font-mono font-bold text-[#22c55e]">
                            {(item.qty * item.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteQuotationItem(item.id)}
                              className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-1 rounded transition-all cursor-pointer border-none"
                              title="حذف البند"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discount, Tax and Summary Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Editors for discounts & taxation */}
                <div className="bg-[#111827] p-4 rounded-xl border border-[#1e293b] space-y-4">
                  <h4 className="font-bold text-xs text-slate-300 border-b border-[#1e293b] pb-2">⚙️ إعدادات الحسم والضريبة:</h4>
                  
                  {/* Discount input */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] text-[#94a3b8] mb-1">قيمة الخصم الممنوح:</label>
                      <input
                        type="number"
                        min="0"
                        value={quotationDiscount}
                        onChange={(e) => setQuotationDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#94a3b8] mb-1">نوع الخصم:</label>
                      <div className="flex bg-[#1e293b] rounded-lg p-0.5 border border-[#334155]">
                        <button
                          type="button"
                          onClick={() => setQuotationDiscountType('flat')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${quotationDiscountType === 'flat' ? 'bg-purple-600 text-white' : 'text-[#94a3b8] hover:text-white'}`}
                        >
                          مبلغ ثابت ({currency})
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuotationDiscountType('percent')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${quotationDiscountType === 'percent' ? 'bg-purple-600 text-white' : 'text-[#94a3b8] hover:text-white'}`}
                        >
                          نسبة (%)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tax input */}
                  <div>
                    <label className="block text-[10px] text-[#94a3b8] mb-1">نسبة ضريبة القيمة المضافة (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={quotationTaxPercent}
                      onChange={(e) => setQuotationTaxPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center"
                    />
                  </div>
                </div>

                {/* Pricing Summary display */}
                <div className="bg-purple-950/10 p-4 rounded-xl border border-purple-500/20 flex flex-col justify-between">
                  <h4 className="font-bold text-xs text-[#a78bfa] border-b border-purple-500/10 pb-2 mb-3">💵 خلاصة الحساب المالي للعرض المعتمد:</h4>
                  
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>إجمالي بنود القطع والمصنعية:</span>
                      <span className="font-mono text-white font-bold">{Math.round(quotationTotals.subtotal).toLocaleString()} {currency}</span>
                    </div>
                    {quotationTotals.discountVal > 0 && (
                      <div className="flex justify-between text-red-400">
                        <span>الخصم الممنوح:</span>
                        <span className="font-mono font-bold">-{Math.round(quotationTotals.discountVal).toLocaleString()} {currency}</span>
                      </div>
                    )}
                    {quotationTaxPercent > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>ضريبة القيمة المضافة ({quotationTaxPercent}%):</span>
                        <span className="font-mono font-bold">+{Math.round(quotationTotals.taxVal).toLocaleString()} {currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-purple-500/20 pt-3 mt-1 items-center">
                      <span className="text-emerald-400 font-extrabold text-sm">القيمة الصافية النهائية للعرض:</span>
                      <span className="font-mono font-black text-emerald-400 text-lg bg-emerald-500/10 px-3 py-1 rounded-lg border border-[#22c55e]/20">{Math.round(quotationTotals.netTotal).toLocaleString()} {currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Notes Editors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] text-[#a78bfa] mb-1 font-bold">📜 شروط التعاقد والتسليم والدفع:</label>
                  <textarea
                    rows={4}
                    value={quotationTerms}
                    onChange={(e) => setQuotationTerms(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white leading-relaxed focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a78bfa] mb-1 font-bold">💡 ملاحظات إضافية هامة للعميل:</label>
                  <textarea
                    rows={4}
                    value={quotationNotes}
                    onChange={(e) => setQuotationNotes(e.target.value)}
                    className="w-full bg-[#111827] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white leading-relaxed focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#1e293b] bg-[#0b0f19] flex justify-between items-center">
              <span className="text-[10px] text-slate-500">تم التوليد التلقائي لجميع القيم بناءً على الأبعاد {reqWidth}×{reqHeight} م</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintQuotation}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-900/30 text-xs border-none"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ طباعة وتحميل عرض السعر (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="bg-[#1e293b] hover:bg-[#334155] text-slate-200 hover:text-white font-bold px-4 py-2.5 rounded-xl border border-[#334155] transition-all cursor-pointer text-xs"
                >
                  إلغاء وإغلاق
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 📂 SAVED CLIENT REPORTS MODAL OVERLAY */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" style={{ direction: 'rtl' }}>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-blue-900/10 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0b0f19]">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                  <History className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-white">سجل تقارير وعروض أسعار العملاء</h3>
                  <p className="text-xs text-slate-400">مراجعة، استدعاء، وإدارة حسابات الشاشات الـ LED المحفوظة للموردين والعملاء</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setSearchRequestQuery('');
                }}
                className="text-slate-400 hover:text-white bg-[#1e293b] hover:bg-slate-800 p-2 rounded-xl transition-all cursor-pointer"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Block */}
            <div className="p-4 border-b border-[#1e293b] bg-[#0f172a] flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pr-3.5 pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="ابحث باسم العميل أو موديل الشاشة المحفوظة..."
                  value={searchRequestQuery}
                  onChange={(e) => setSearchRequestQuery(e.target.value)}
                  className="w-full bg-[#111827] border border-[#334155] rounded-xl pr-10 pl-4 py-2.5 text-right font-medium text-white text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-slate-500"
                />
              </div>
              {searchRequestQuery && (
                <button
                  onClick={() => setSearchRequestQuery('')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer font-bold"
                >
                  مسح البحث
                </button>
              )}
            </div>

            {/* Modal Body / Request List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0b0f19]/30">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="bg-[#1e293b]/50 p-4 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center border border-slate-800">
                    <Search className="w-6 h-6 text-slate-600" />
                  </div>
                  {clientRequests.length === 0 ? (
                    <>
                      <p className="font-bold text-sm text-slate-300">السجل فارغ تماماً</p>
                      <p className="text-xs text-slate-500 mt-1">قم بإدخال اسم العميل ثم اضغط على زر "حفظ الطلب" لحفظ حساباته الفنية هنا.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-sm text-slate-300">لم يتم العثور على نتائج للبحث</p>
                      <p className="text-xs text-slate-500 mt-1">تأكد من كتابة الاسم بشكل صحيح أو امسح فلتر البحث.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="bg-[#1e293b]/40 border border-[#1e293b] hover:border-blue-500/40 rounded-xl p-4 text-right transition-all flex flex-col justify-between gap-3 shadow-sm hover:shadow-md"
                    >
                      <div className="flex justify-between items-start gap-2 border-b border-slate-800/40 pb-2.5">
                        <div className="text-right">
                          <span className="font-bold text-white text-base block">{req.clientName}</span>
                          <span className="text-[10px] text-[#64748b] font-mono block mt-0.5">{req.date}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleLoadClientRequest(req);
                              setShowHistoryModal(false);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-blue-900/20 active:scale-95"
                            title="عرض التقرير الفني واستدعاء كافة القياسات"
                          >
                            <Eye className="w-3 h-3" />
                            <span>عرض واستدعاء</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintSingleRequest(req)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-emerald-900/20 active:scale-95"
                            title="طباعة التقرير الفني وعرض السعر مباشرة"
                          >
                            <Printer className="w-3 h-3" />
                            <span>طباعة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleLoadClientRequest(req);
                              setShowHistoryModal(false);
                              setTimeout(() => {
                                handleOpenQuotationCreator();
                              }, 150);
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-purple-900/20 active:scale-95"
                            title="إنشاء عرض سعر رسمي PDF"
                          >
                            <FileText className="w-3 h-3" />
                            <span>عرض سعر</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClientRequest(req.id, req.clientName)}
                            className="bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-500/10 p-1.5 rounded-lg cursor-pointer transition-all"
                            title="حذف العرض"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#94a3b8] font-sans">
                        <div className="flex justify-between">
                          <span className="text-slate-500">الأبعاد المطلوبة:</span>
                          <span className="font-bold text-slate-300">{req.reqWidth} × {req.reqHeight} {req.dimensionUnit === 'm' ? 'متر' : 'سم'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">نوع الشاشة:</span>
                          <span className="font-bold text-slate-300">{req.isDoubleSided ? 'شاشة وجهين' : 'شاشة وجه واحد'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">موديل المديول:</span>
                          <span className="font-bold text-slate-300 truncate max-w-[180px] block" title={req.moduleName}>{req.moduleName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">المقاس الفعلي النهائي:</span>
                          <span className="font-bold text-slate-300">{req.actualWidthM.toFixed(2)} × {req.actualHeightM.toFixed(2)} متر</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">مكونات الشاشة:</span>
                          <span className="font-bold text-slate-300">{req.totalModules} مديول | {req.powerSuppliesCount} محول</span>
                        </div>
                        <div className="flex justify-between border-t border-[#334155]/20 pt-2 mt-1 items-center">
                          <span className="text-emerald-400 text-xs font-bold">إجمالي التكلفة التقديرية:</span>
                          <span className="font-bold text-emerald-400 font-mono text-[14px] bg-emerald-500/10 px-2 py-0.5 rounded-md">{Math.round(req.totalCost).toLocaleString()} {req.currency}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#1e293b] bg-[#0b0f19] flex justify-between items-center text-xs">
              <span className="text-[#94a3b8]">
                إجمالي العروض في السجل: <span className="font-bold text-white font-mono bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{clientRequests.length} عميل</span>
              </span>
              <div className="flex gap-2">
                {clientRequests.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePrintHistory}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                  >
                    <Printer className="w-4 h-4" />
                    <span>🖨️ طباعة السجل كاملاً ({filteredRequests.length} عرض)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSearchRequestQuery('');
                  }}
                  className="bg-[#1e293b] hover:bg-[#334155] text-slate-200 hover:text-white font-bold px-4 py-2 rounded-xl border border-[#334155] transition-all cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
