const axios = require('axios');

/**
 * Gnani AI Evon - Indic Natural Language Understanding & Structured Intent Extraction
 */
class GnaniEvonService {
  constructor() {
    this.apiKey = process.env.GNANI_API_KEY || '';
    this.endpoint = process.env.GNANI_LLM_ENDPOINT || '';
    this.timeout = parseInt(process.env.GNANI_TIMEOUT_MS || '15000', 10);
  }

  isConfigured() {
    return Boolean(this.apiKey && this.endpoint && !this.apiKey.includes('your_api_key'));
  }

  async interpret({ transcript, products = [], customers = [] }) {
    if (!transcript || !transcript.trim()) {
      throw new Error('Transcript is required for AI interpretation');
    }

    const cleanText = transcript.trim();

    // 1. If configured with live Gnani Evon endpoint, call it
    if (this.isConfigured()) {
      try {
        console.log(`[Gnani Evon] Querying Evon model with transcript: "${cleanText}"`);
        const productCatalogBrief = products.map(p => ({
          name: p.name,
          tamil: p.nameTamil,
          unit: p.unit,
          price: p.sellingPrice,
        }));

        const prompt = `You are KadaiVoice AI assistant for local retail kirana stores in India.
Current Shop Catalog:
${JSON.stringify(productCatalogBrief, null, 2)}

User Spoken Command: "${cleanText}"

Extract the business intent into the following strict JSON schema:
{
  "intent": "CREATE_SALE" | "ADD_STOCK" | "CREATE_CREDIT" | "CHECK_INVENTORY" | "DAILY_REPORT" | "TOP_SELLING_PRODUCTS" | "LOW_STOCK_REPORT" | "WHATSAPP_REMINDER" | "SUPPLIER_ORDER",
  "items": [
    {
      "productName": "canonical product name matched from catalog or user",
      "quantity": number,
      "unit": "kg" | "g" | "liter" | "packet" | "piece" | "box" | "can"
    }
  ],
  "paymentMethod": "CASH" | "UPI" | "CREDIT",
  "customerName": string or null,
  "creditAmount": number or null,
  "requiresConfirmation": boolean,
  "clarificationQuestion": string or null
}
Respond ONLY with the JSON object. Do not include markdown codeblocks or extra text.`;

        const response = await axios.post(
          this.endpoint,
          {
            prompt: prompt,
            model: 'evon-v3.3',
            temperature: 0.1,
            max_tokens: 500,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key-ID': this.apiKey,
              'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: this.timeout,
          }
        );

        let parsed;
        const rawContent = response.data?.choices?.[0]?.text || response.data?.output || response.data?.response || '';
        try {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawContent);
        } catch (jsonErr) {
          console.warn('[Gnani Evon] Failed to parse raw LLM output, falling back to rule-based parser:', jsonErr.message);
          parsed = null;
        }

        if (parsed && parsed.intent) {
          return {
            ...parsed,
            isSimulated: false,
            provider: 'Gnani AI Evon (Live API)',
            confidence: 0.95,
          };
        }
      } catch (err) {
        console.warn(`[Gnani Evon] Live API query failed: ${err.message}. Using built-in Indic NLU Engine.`);
      }
    }

    // 2. High-precision Indic NLU Engine (Tamil, Tanglish & English)
    const result = this._ruleBasedNLU(cleanText, products, customers);
    return {
      ...result,
      isSimulated: true,
      provider: 'KadaiVoice Indic NLU (Local Demo Engine)',
      note: 'Operating in demonstration mode. Set GNANI_API_KEY & GNANI_LLM_ENDPOINT for live Evon integration.',
    };
  }

  _ruleBasedNLU(text, products, customers) {
    const lower = text.toLowerCase();

    // 1. WhatsApp Khata Reminder Intent
    if (
      lower.includes('whatsapp') ||
      lower.includes('வாட்ஸ்அப்') ||
      (lower.includes('send') && lower.includes('bill')) ||
      lower.includes('reminder')
    ) {
      const customerName = this._extractCustomerName(lower, customers);
      const matchedCust = customers.find(c => customerName && c.name.toLowerCase().includes(customerName.toLowerCase()));

      return {
        intent: 'WHATSAPP_REMINDER',
        items: [],
        paymentMethod: 'CREDIT',
        customerName: customerName || (matchedCust ? matchedCust.name : 'Customer'),
        customerId: matchedCust ? matchedCust._id : null,
        creditAmount: matchedCust ? matchedCust.outstandingCredit : null,
        requiresConfirmation: false,
        summary: `Generate WhatsApp payment reminder for ${customerName || 'customer'} with direct UPI link.`,
      };
    }

    // 2. Supplier Wholesale Order Indent Intent
    if (
      (lower.includes('order') && (lower.includes('supplier') || lower.includes('wholesale') || lower.includes('create order'))) ||
      lower.includes('distributor') ||
      lower.includes('சரக்கு ஆர்டர்')
    ) {
      const items = this._extractItems(lower, products);
      return {
        intent: 'SUPPLIER_ORDER',
        items,
        paymentMethod: 'CASH',
        customerName: null,
        requiresConfirmation: false,
        summary: `Create WhatsApp Wholesale Purchase Indent for ${items.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ')}`,
      };
    }

    // 3. Reports / Business questions
    if (
      lower.includes('how much did i sell') ||
      lower.includes('today sales') ||
      lower.includes('innaiku evalo sales') ||
      lower.includes('innaiku sales evalo') ||
      lower.includes('இன்று எவ்வளவு விற்பனை') ||
      lower.includes('விற்பனை விவரம்') ||
      lower.includes('daily report') ||
      lower.includes('report')
    ) {
      return {
        intent: 'DAILY_REPORT',
        items: [],
        paymentMethod: 'CASH',
        customerName: null,
        requiresConfirmation: false,
        summary: 'Shop owner requested today’s daily closing report.',
      };
    }

    if (
      lower.includes('selling the most') ||
      lower.includes('top selling') ||
      lower.includes('edhu nalla pogudhu') ||
      lower.includes('adhiga virpanai') ||
      lower.includes('அதிக விற்பனை')
    ) {
      return {
        intent: 'TOP_SELLING_PRODUCTS',
        items: [],
        paymentMethod: 'CASH',
        customerName: null,
        requiresConfirmation: false,
        summary: 'Shop owner requested the top selling products.',
      };
    }

    if (
      lower.includes('running low') ||
      lower.includes('low stock') ||
      lower.includes('stock kammi') ||
      lower.includes('stock mudiyapogudhu') ||
      lower.includes('குறைந்த இருப்பு') ||
      lower.includes('இருப்பு குறைவாக')
    ) {
      return {
        intent: 'LOW_STOCK_REPORT',
        items: [],
        paymentMethod: 'CASH',
        customerName: null,
        requiresConfirmation: false,
        summary: 'Shop owner requested low stock alerts.',
      };
    }

    if (
      lower.includes('stock check') ||
      lower.includes('evalo iruku') ||
      lower.includes('irupu evalo') ||
      lower.includes('இருப்பு எவ்வளவு')
    ) {
      return {
        intent: 'CHECK_INVENTORY',
        items: this._extractItems(lower, products),
        paymentMethod: 'CASH',
        customerName: null,
        requiresConfirmation: false,
        summary: 'Shop owner inquired about product stock level.',
      };
    }

    // 4. Add Stock / Stock In
    if (
      lower.includes('add') ||
      lower.includes('stock in') ||
      lower.includes('serthu') ||
      lower.includes('vanginen') ||
      lower.includes('சேர்க்க') ||
      lower.includes('இருப்பில் சேர்க்க')
    ) {
      const items = this._extractItems(lower, products);
      return {
        intent: 'ADD_STOCK',
        items,
        paymentMethod: 'CASH',
        customerName: null,
        requiresConfirmation: true,
        summary: `Add stock for ${items.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ')}`,
      };
    }

    // 5. Credit / Kadhan / Udhari
    if (
      lower.includes('credit') ||
      lower.includes('kadan') ||
      lower.includes('udhari') ||
      lower.includes('கடன்') ||
      lower.includes('விற்பனை கடன்')
    ) {
      let customerName = this._extractCustomerName(lower, customers);
      const items = this._extractItems(lower, products);
      
      const amountMatch = lower.match(/(?:rupees|rs\.?|inr|roobai|ரூபாய்)?\s*(\d+(?:\.\d+)?)\s*(?:rupees|rs\.?|inr|roobai|ரூபாய்|on credit|credit|kadan)?/i);
      let creditAmount = null;
      if (amountMatch && (!items.length || lower.includes('worth'))) {
        creditAmount = parseFloat(amountMatch[1]);
      }

      return {
        intent: 'CREATE_CREDIT',
        items,
        paymentMethod: 'CREDIT',
        customerName: customerName || 'Valued Customer',
        creditAmount,
        requiresConfirmation: true,
        summary: `Record credit for customer ${customerName || 'Customer'}${creditAmount ? ` worth ₹${creditAmount}` : ''}`,
      };
    }

    // 6. Default: CREATE_SALE
    const items = this._extractItems(lower, products);
    let paymentMethod = 'CASH';
    if (lower.includes('upi') || lower.includes('gpay') || lower.includes('phonepe') || lower.includes('paytm') || lower.includes('online')) {
      paymentMethod = 'UPI';
    } else if (lower.includes('kadan') || lower.includes('credit') || lower.includes('udhari') || lower.includes('கடன்')) {
      paymentMethod = 'CREDIT';
    }

    const customerName = this._extractCustomerName(lower, customers);

    let clarificationQuestion = null;
    if (items.length === 0) {
      clarificationQuestion = 'Could you specify the product name and quantity? (e.g., "Sold 2 kg Ponni Rice and 1 packet Milk")';
    }

    return {
      intent: 'CREATE_SALE',
      items,
      paymentMethod,
      customerName,
      requiresConfirmation: true,
      clarificationQuestion,
      summary: `Sale of ${items.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ') || 'goods'} via ${paymentMethod}`,
    };
  }

  _extractItems(text, catalog) {
    const items = [];
    const synonyms = [
      { key: 'rice', terms: ['rice', 'arisi', 'arici', 'ponni', 'அரிசி', 'பொன்னி அரிசி'], defaultUnit: 'kg' },
      { key: 'milk', terms: ['milk', 'paal', 'aavin', 'curd', 'பால்', 'தயிர்'], defaultUnit: 'packet' },
      { key: 'sugar', terms: ['sugar', 'sarkarai', 'cheeni', 'சர்க்கரை'], defaultUnit: 'kg' },
      { key: 'oil', terms: ['oil', 'ennai', 'sunflower oil', 'gingelly', 'நல்லெண்ணெய்', 'எண்ணெய்'], defaultUnit: 'liter' },
      { key: 'dal', terms: ['dal', 'paruppu', 'toor dal', 'moong dal', 'பருப்பு', 'துவரம் பருப்பு'], defaultUnit: 'kg' },
      { key: 'egg', terms: ['egg', 'muttai', 'eggs', 'முட்டை'], defaultUnit: 'piece' },
      { key: 'wheat', terms: ['wheat', 'atta', 'aashirvaad', 'godhumai', 'கோதுமை'], defaultUnit: 'kg' },
      { key: 'tea', terms: ['tea', 'tea dust', 'chakra gold', '3 roses', 'தேயிலை'], defaultUnit: 'packet' },
      { key: 'coffee', terms: ['coffee', 'bru', 'narasus', 'காபி'], defaultUnit: 'packet' },
      { key: 'soap', terms: ['soap', 'hamam', 'lifebuoy', 'cinthol', 'சோப்பு'], defaultUnit: 'piece' },
      { key: 'salt', terms: ['salt', 'uppu', 'tata salt', 'உப்பு'], defaultUnit: 'packet' },
      { key: 'biscuit', terms: ['biscuit', 'parle-g', 'marie gold', 'பிஸ்கட்'], defaultUnit: 'packet' },
      { key: 'shampoo', terms: ['shampoo', 'clinic plus', 'meera', 'ஷாம்பு'], defaultUnit: 'packet' },
      { key: 'onion', terms: ['onion', 'vengayam', 'வெங்காயம்'], defaultUnit: 'kg' },
      { key: 'potato', terms: ['potato', 'urulaikizhangu', 'உருளைக்கிழங்கு'], defaultUnit: 'kg' },
      { key: 'tomato', terms: ['tomato', 'thakkali', 'தக்காளி'], defaultUnit: 'kg' },
    ];

    const wordToNumber = {
      'one': 1, 'oru': 1, 'onnu': 1, 'ஒன்று': 1, 'ஒரு': 1,
      'two': 2, 'rendu': 2, 'erandu': 2, 'இரண்டு': 2,
      'three': 3, 'moonu': 3, 'moondru': 3, 'மூன்று': 3,
      'four': 4, 'naalu': 4, 'naangu': 4, 'நான்கு': 4,
      'five': 5, 'anju': 5, 'aindhu': 5, 'ஐந்து': 5,
      'six': 6, 'aaru': 6, 'ஆறு': 6,
      'seven': 7, 'ezhu': 7, 'ஏழு': 7,
      'eight': 8, 'ettu': 8, 'எட்டு': 8,
      'nine': 9, 'onbadhu': 9, 'ஒன்பது': 9,
      'ten': 10, 'pathu': 10, 'பத்து': 10,
      'half': 0.5, 'ara': 0.5, 'arai': 0.5, 'அரை': 0.5,
      'quarter': 0.25, 'kaal': 0.25, 'கால்': 0.25,
      'twenty': 20, 'iruvadhu': 20, 'இருபது': 20,
      'thirty': 30, 'muppadhu': 30, 'முப்பது': 30,
      'fifty': 50, 'aimbadhu': 50, 'ஐம்பது': 50,
    };

    for (const syn of synonyms) {
      for (const term of syn.terms) {
        if (text.includes(term)) {
          let qty = 1;
          let unit = syn.defaultUnit;

          const regexBefore = new RegExp(`(?:(\\d+(?:\\.\\d+)?)|(one|two|three|four|five|six|seven|eight|nine|ten|half|twenty|thirty|fifty|oru|onnu|rendu|moonu|naalu|anju|pathu|arai|kaal|ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து|பத்து|இருபது|முப்பது|ஐம்பது|அரை|கால்))\\s*(?:kilo|kg|packet|pack|pkt|liter|litre|ltr|piece|pc|gram|g|கிலோ|பாக்கெட்|லிட்டர்)?\\s*(?:of\\s*)?${term}`, 'i');
          const regexAfter = new RegExp(`${term}\\s*(?:(\\d+(?:\\.\\d+)?)|(one|two|three|four|five|six|seven|eight|nine|ten|half|twenty|thirty|fifty|oru|onnu|rendu|moonu|naalu|anju|pathu|arai|kaal|ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து|பத்து|இருபது|முப்பது|ஐம்பது|அரை|கால்))?\\s*(kilo|kg|packet|pack|pkt|liter|litre|ltr|piece|pc|gram|g|கிலோ|பாக்கெட்|லிட்டர்)?`, 'i');

          const matchBefore = text.match(regexBefore);
          const matchAfter = text.match(regexAfter);

          if (matchBefore) {
            const rawNum = matchBefore[1];
            const rawWord = matchBefore[2];
            qty = rawNum ? parseFloat(rawNum) : (wordToNumber[rawWord?.toLowerCase()] || 1);
          } else if (matchAfter && (matchAfter[1] || matchAfter[2])) {
            const rawNum = matchAfter[1];
            const rawWord = matchAfter[2];
            qty = rawNum ? parseFloat(rawNum) : (wordToNumber[rawWord?.toLowerCase()] || 1);
          }

          if (text.includes('kg') || text.includes('kilo') || text.includes('கிலோ')) unit = 'kg';
          else if (text.includes('packet') || text.includes('pack') || text.includes('pkt') || text.includes('பாக்கெட்')) unit = 'packet';
          else if (text.includes('liter') || text.includes('litre') || text.includes('ltr') || text.includes('லிட்டர்')) unit = 'liter';
          else if (text.includes('gram') || text.includes('g') || text.includes('கிராம்')) unit = 'g';
          else if (text.includes('piece') || text.includes('pc') || text.includes('எண்ணிக்கை')) unit = 'piece';

          let canonicalName = syn.key.charAt(0).toUpperCase() + syn.key.slice(1);
          if (catalog && catalog.length > 0) {
            const matchedProd = catalog.find(p =>
              p.name.toLowerCase().includes(syn.key) ||
              (p.nameTamil && p.nameTamil.toLowerCase().includes(term)) ||
              syn.terms.some(t => p.name.toLowerCase().includes(t))
            );
            if (matchedProd) {
              canonicalName = matchedProd.name;
              unit = matchedProd.unit || unit;
            }
          }

          if (!items.find(i => i.productName.toLowerCase() === canonicalName.toLowerCase())) {
            items.push({
              productName: canonicalName,
              quantity: qty,
              unit,
            });
          }
          break;
        }
      }
    }

    return items;
  }

  _extractCustomerName(text, customers) {
    if (!customers || customers.length === 0) {
      const commonNames = ['Ramesh', 'Suresh', 'Karthik', 'Murugan', 'Kumar', 'Priya', 'Selvi', 'Anand', 'Mani', 'Vijay'];
      for (const name of commonNames) {
        if (text.toLowerCase().includes(name.toLowerCase())) {
          return name;
        }
      }
      return null;
    }

    for (const cust of customers) {
      if (text.toLowerCase().includes(cust.name.toLowerCase())) {
        return cust.name;
      }
    }
    return null;
  }
}

module.exports = new GnaniEvonService();
